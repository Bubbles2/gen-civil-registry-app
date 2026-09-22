/**
 * Turning a declaration into a row and back, without a database in sight.
 *
 * Everything here is pure so it can be tested in Jest, where neither Realm nor
 * op-sqlite can load. The one rule that matters: a declaration read back out of
 * SQLite must serialise exactly like the Realm object it replaces, because
 * `SendDeclarationService` flattens it straight onto the wire (V7 compares the
 * result byte for byte against the Phase 0 captures). Realm's `toJSON` emits
 * properties in schema declaration order, so `orderBySchema` rebuilds objects in
 * that same order rather than in whatever order the form happened to fill them.
 */

import { Schema, toRealmInput } from "../services/realmInput";

export type Declaration = Record<string, any>;

/** Columns lifted out of the body so the Dashboard can filter/sort/search in SQL. */
export type DeclarationRow = {
  id: string;
  type: string;
  status: string;
  colpoint_code: string;
  error: string;
  evt_date: string;
  name: string;
  firstname: string;
  body: string;
};

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype;

/**
 * Realm's ID is a BSON ObjectId; SQLite stores its 24-char hex form. Accepts an
 * ObjectId, a string, or anything with toHexString/toString, so call sites can
 * keep passing whatever they hold today.
 */
export function hexId(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  const withHex = value as { toHexString?: () => string };
  if (typeof withHex.toHexString === "function") {
    return withHex.toHexString();
  }
  return String(value);
}

/**
 * A new ObjectId-shaped id: 4-byte seconds, 5 random bytes, 3-byte counter.
 * Same 24-hex format Realm produced, so ids stay comparable across the
 * migration and `externalId` on the wire does not change shape.
 *
 * `react-native-get-random-values` polyfills crypto.getRandomValues at app
 * start (index.js); Math.random is the fallback so tests and any environment
 * without the polyfill still produce a well-formed id.
 */
let counter = Math.floor(Math.random() * 0xffffff);
export function newId(now: number = Date.now()): string {
  const bytes = new Uint8Array(5);
  const g = (globalThis as any).crypto;
  if (g && typeof g.getRandomValues === "function") {
    g.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  counter = (counter + 1) % 0x1000000;
  const hex = (n: number, width: number) => n.toString(16).padStart(width, "0");
  const random = Array.from(bytes, b => hex(b, 2)).join("");
  return hex(Math.floor(now / 1000) % 0x100000000, 8) + random + hex(counter, 6);
}

/**
 * Rebuild `value` with its keys in the order `objectType`'s schema declares
 * them, recursing into linked objects. Keys that are not in the schema are kept
 * and appended last: dropping them would silently lose data, which is the one
 * thing a migration must never do.
 */
export function orderBySchema(schema: Schema, objectType: string, value: any): any {
  if (!isPlainObject(value)) {
    return value;
  }
  const objectSchema = schema.find(s => s.name === objectType);
  if (!objectSchema) {
    return value;
  }
  const out: Record<string, unknown> = {};
  const seen = new Set<string>();
  for (const [name, spec] of Object.entries(objectSchema.properties)) {
    seen.add(name);
    if (!(name in value)) {
      continue;
    }
    const linked = linkedType(spec, schema);
    out[name] = linked ? orderBySchema(schema, linked, value[name]) : value[name];
  }
  for (const [name, v] of Object.entries(value)) {
    if (!seen.has(name)) {
      out[name] = v;
    }
  }
  return out;
}

/** The object type a property links to, or null for a plain value/list. */
function linkedType(spec: unknown, schema: Schema): string | null {
  let type: string | undefined;
  if (typeof spec === "string") {
    type = spec;
  } else if (spec && typeof spec === "object") {
    const s = spec as { type?: string; objectType?: string };
    type = s.objectType ?? s.type;
  }
  if (!type) {
    return null;
  }
  const bare = type.replace(/\?$/, "").replace(/\[\]$/, "");
  return schema.some(s => s.name === bare) ? bare : null;
}

/**
 * The canonical stored form of a declaration: schema defaults applied (so a
 * field the form skipped is "" rather than absent, exactly as Realm stored it),
 * keys in schema order, ID as hex.
 */
export function toStored(schema: Schema, input: Declaration): Declaration {
  const withDefaults = toRealmInput(schema, "FORMS", input) as Declaration;
  const ordered = orderBySchema(schema, "FORMS", withDefaults) as Declaration;
  return { ...ordered, ID: hexId(ordered.ID) || newId() };
}

/** Birth and death keep their event date in different places; so does the name. */
export function sortDateOf(decl: Declaration): string {
  if (decl?.TYPE === "DECES") {
    return decl?.DEFUNCT?.INFO_DEC?.EVT_DATE ?? "";
  }
  const childDate = decl?.CHILD?.INFO_NAI?.EVT_DATE;
  if (childDate) {
    return childDate;
  }
  return decl?.ACT_NAI?.ACCOUCHEMENT_DATE ?? "";
}

export function nameOf(decl: Declaration): { name: string; firstname: string } {
  const holder = decl?.TYPE === "DECES" ? decl?.DEFUNCT : decl?.CHILD;
  return { name: holder?.NAME ?? "", firstname: holder?.FIRSTNAME ?? "" };
}

/** Declaration -> row. The body column is the whole declaration, schema-ordered. */
export function toRow(schema: Schema, input: Declaration): DeclarationRow {
  const decl = toStored(schema, input);
  const { name, firstname } = nameOf(decl);
  return {
    id: decl.ID,
    type: decl.TYPE ?? "",
    status: decl.STATUS ?? "",
    colpoint_code: decl.COLPOINT_CODE ?? "",
    error: decl.ERROR ?? "",
    evt_date: sortDateOf(decl),
    name,
    firstname,
    body: JSON.stringify(decl),
  };
}

/**
 * Row -> declaration. Always a fresh object: the Dashboard writes a SORT_WEIGTH
 * property onto the rows it sorts, and a shared instance would carry that key
 * into the next wire payload.
 */
export function fromRow(row: { body: string }): Declaration {
  return JSON.parse(row.body);
}
