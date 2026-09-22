/**
 * Regenerates src/core/db/formsSchema.ts from the Realm class definitions in
 * src/realmSchema/.
 *
 * The SQLite store needs the declaration schema (property names, order and
 * defaults) but must not import `realm` to get it: that would pull the native
 * binding into Jest, and would keep a dependency the follow-up release is meant
 * to delete. So the schema is transcribed once, here, by parsing the source.
 *
 * Run:  node scripts/generate-forms-schema.js
 * `__tests__/formsSchema.test.ts` re-derives the same thing and fails if the
 * generated file has drifted from src/realmSchema/.
 */
const { existsSync, readFileSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");

const SCHEMA_DIR = "src/realmSchema";
const OUT = "src/core/db/formsSchema.ts";

/** Parses one file's `static schema = { name, properties }` block. */
function parseSchemaFile(source) {
  const name = source.match(/name:\s*"([A-Z_0-9]+)"/)?.[1];
  if (!name) {
    return null;
  }
  const block = source.match(/properties:\s*\{([\s\S]*?)\n\s*\},?\s*\n\s*(?:primaryKey|\})/)?.[1];
  if (block === undefined) {
    return null;
  }
  const properties = {};
  // Either  FOO: {type: "string", default: ""}  or  FOO: "OTHER_TYPE"
  const re = /(\w+):\s*(?:\{\s*type:\s*"(\w+)"\s*(?:,\s*default:\s*([^}]*?))?\s*\}|"(\w+)")/g;
  for (const m of block.matchAll(re)) {
    const [, prop, objType, rawDefault, plainType] = m;
    if (plainType !== undefined) {
      properties[prop] = plainType;
      continue;
    }
    const spec = { type: objType };
    if (rawDefault !== undefined) {
      let trimmed = rawDefault.trim().replace(/,$/, "");
      // Two properties declare a function default: ERROR is `() => ""`, which
      // is just an empty string, and ID is `() => new Realm.BSON.ObjectId()`,
      // which the store replaces with its own generator. So a thunk returning a
      // literal is unwrapped and anything else is dropped.
      const thunk = trimmed.match(/^\(\s*\)\s*=>\s*(.+)$/);
      if (thunk) {
        trimmed = thunk[1].trim();
        if (!/^("[^"]*"|'[^']*'|-?\d+(\.\d+)?|true|false|null)$/.test(trimmed)) {
          properties[prop] = spec;
          continue;
        }
      }
      if (trimmed === '""' || trimmed === "''") {
        spec.default = "";
      } else {
        spec.default = JSON.parse(trimmed.replace(/^'(.*)'$/, '"$1"'));
      }
    }
    properties[prop] = spec;
  }
  return { name, properties };
}

/**
 * Follows Forms.tsx's `config.schema` list rather than the directory, and in the
 * same order: src/realmSchema holds two files that are not in the config
 * (INFO_NAI_DEFUNCT, INFO_CONTACT_DEFUNCT) and one stale duplicate
 * (EvtAddress.tsx, which declares the name EVT_ADDRESS_DEC_FATHER a second
 * time). Realm never saw those, so neither should the store.
 */
function buildSchema(dir = SCHEMA_DIR) {
  const formsSource = readFileSync(join(dir, "Forms.tsx"), "utf8");

  // identifier -> file, from `import X from "./File";`
  const fileFor = new Map();
  for (const m of formsSource.matchAll(/import\s+\{?\s*([A-Za-z_0-9]+)\s*\}?\s+from\s+"\.\/([A-Za-z_0-9]+)"/g)) {
    fileFor.set(m[1], m[2]);
  }

  const listed = formsSource
    .match(/schema:\s*\[([\s\S]*?)\]/)?.[1]
    ?.split(",")
    .map(s => s.trim())
    .filter(Boolean) ?? [];

  const out = [];
  const seen = new Set();
  for (const identifier of listed) {
    // FORMS is declared in Forms.tsx itself; everything else is imported.
    const file = identifier === "FORMS" ? "Forms" : fileFor.get(identifier);
    if (!file) {
      throw new Error(`generate-forms-schema: no import for ${identifier}`);
    }
    // Most schema files are .tsx; FATHER_DECEASED.ts is the exception.
    const path = [".tsx", ".ts"]
      .map(ext => join(dir, file + ext))
      .find(existsSync);
    if (!path) {
      throw new Error(`generate-forms-schema: no file for ${identifier}`);
    }
    const source = readFileSync(path, "utf8");
    const parsed = parseSchemaFile(source);
    if (!parsed) {
      throw new Error(`generate-forms-schema: no schema in ${file}`);
    }
    if (seen.has(parsed.name)) {
      continue;
    }
    seen.add(parsed.name);
    out.push(parsed);
  }
  return out;
}

if (require.main === module) {
  const schema = buildSchema();
  const header = `/**
 * The declaration object graph, transcribed from src/realmSchema/ by
 * scripts/generate-forms-schema.js. Do not edit by hand.
 *
 * The SQLite store needs the property names, their order and their defaults so
 * a declaration read back out of the database serialises exactly as the Realm
 * object did — but it must not import \`realm\` to get them. \`__tests__/formsSchema.test.ts\`
 * re-derives this from the same sources and fails if the two have drifted.
 */

import type { Schema } from "../services/realmInput";

export const FORMS_SCHEMA = ${JSON.stringify(schema, null, 2)} as unknown as Schema;

export default FORMS_SCHEMA;
`;
  writeFileSync(OUT, header);
  console.log(`wrote ${OUT}: ${schema.length} object types`);
}

module.exports = { parseSchemaFile, buildSchema };
