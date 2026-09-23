/**
 * Phase 12 — the Dashboard's filters, run as SQL against a real SQLite engine.
 *
 * These replace Realm queries like
 *   "TYPE in {'NAISSANCE'} and STATUS in {$0,$1,$2,$3} AND COLPOINT_CODE == $4"
 * and have to keep two quirks of that behaviour:
 *   - the Dashboard passes one argument per status checkbox, null when unticked,
 *     and Realm matched none of the nulls;
 *   - with every checkbox unticked, the list is empty rather than unfiltered.
 */
import { buildQuery } from "../src/core/db/declarations";
import { toRow } from "../src/core/db/declarationShape";
import { FORMS_SCHEMA } from "../src/core/db/formsSchema";
import { createTestDb, TestDb } from "./support/sqljsDb";

jest.mock("../src/core/Logger", () => ({
  __esModule: true,
  default: { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

jest.mock("../src/core/db/sqlite", () => ({
  getDb: () => Promise.reject(new Error("the real connection must not be used in tests")),
  getMeta: () => Promise.resolve(null),
  setMeta: () => Promise.resolve(),
}));

const decl = (over: Record<string, any>) => ({
  TYPE: "NAISSANCE",
  STATUS: "BROUILLON",
  COLPOINT_CODE: "PCS_140",
  ERROR: "",
  CHILD: { FIRSTNAME: "Phase", NAME: "Onze", INFO_NAI: { EVT_DATE: "20/09/2026" } },
  ...over,
});

const CORPUS = [
  decl({ ID: "a1", STATUS: "BROUILLON" }),
  decl({ ID: "a2", STATUS: "VALIDE" }),
  decl({ ID: "a3", STATUS: "ARCHIVE" }),
  decl({ ID: "a4", STATUS: "ERREUR" }),
  decl({ ID: "b1", TYPE: "DECES", STATUS: "VALIDE", CHILD: undefined, DEFUNCT: { FIRSTNAME: "John", NAME: "Doe", INFO_DEC: { EVT_DATE: "15/09/2026" } } }),
  decl({ ID: "c1", STATUS: "BROUILLON", COLPOINT_CODE: "PCS_999" }),
];

async function seed(db: TestDb) {
  for (const d of CORPUS) {
    const row = toRow(FORMS_SCHEMA, d);
    await db.execute(
      "INSERT INTO declarations (id,type,status,colpoint_code,error,evt_date,name,firstname,body) VALUES (?,?,?,?,?,?,?,?,?)",
      [row.id, row.type, row.status, row.colpoint_code, row.error, row.evt_date, row.name, row.firstname, row.body],
    );
  }
}

async function ids(db: TestDb, filter: Parameters<typeof buildQuery>[0]) {
  const query = buildQuery(filter);
  if (!query) {
    return [];
  }
  const { rows } = await db.execute(query.sql, query.params);
  return rows.map(r => String(r.id));
}

describe("the Dashboard's filters as SQL", () => {
  let db: TestDb;
  beforeEach(async () => {
    db = await createTestDb();
    await seed(db);
  });

  it("returns both types when no type is selected", async () => {
    expect(await ids(db, { type: "TOUS", statuses: ["BROUILLON", "VALIDE", "ARCHIVE", "ERREUR"] }))
      .toEqual(["a1", "a2", "a3", "a4", "b1", "c1"]);
  });

  it("filters to births", async () => {
    expect(await ids(db, { type: "NAISSANCE", statuses: ["VALIDE"] })).toEqual(["a2"]);
  });

  it("filters to deaths", async () => {
    expect(await ids(db, { type: "DECES", statuses: ["VALIDE"] })).toEqual(["b1"]);
  });

  it("ignores the nulls the unticked checkboxes pass, as Realm did", async () => {
    expect(await ids(db, { type: "TOUS", statuses: [null, "VALIDE", null, null] }))
      .toEqual(["a2", "b1"]);
  });

  it("returns nothing when every status checkbox is unticked", async () => {
    expect(buildQuery({ type: "TOUS", statuses: [null, null, null, null] })).toBeNull();
    expect(await ids(db, { type: "TOUS", statuses: [null, null, null, null] })).toEqual([]);
  });

  it("limits a non-admin user to their own collection point", async () => {
    expect(await ids(db, { type: "TOUS", statuses: ["BROUILLON"], colpointCode: "PCS_140" }))
      .toEqual(["a1"]);
  });

  it("shows every collection point when none is given (admin)", async () => {
    expect(await ids(db, { type: "TOUS", statuses: ["BROUILLON"], colpointCode: null }))
      .toEqual(["a1", "c1"]);
  });

  it("returns rows in insertion order, which is what the Dashboard then sorts", async () => {
    expect(await ids(db, { type: "TOUS", statuses: ["BROUILLON", "VALIDE", "ARCHIVE", "ERREUR"] }))
      .toEqual(["a1", "a2", "a3", "a4", "b1", "c1"]);
  });

  it("binds values instead of interpolating them", async () => {
    const query = buildQuery({ type: "NAISSANCE", statuses: ["VALIDE"], colpointCode: "'; DROP TABLE declarations; --" })!;
    expect(query.sql).not.toContain("DROP TABLE");
    const { rows } = await db.execute(query.sql, query.params);
    expect(rows).toEqual([]);
    // The table is still there.
    expect((await db.execute("SELECT COUNT(*) AS n FROM declarations")).rows[0].n).toBe(6);
  });
});

describe("the schema's indexes", () => {
  it("indexes what the filters actually use", async () => {
    const db = await createTestDb();
    const { rows } = await db.execute(
      "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'declarations' ORDER BY name",
    );
    const names = rows.map(r => String(r.name));
    // Plus sqlite_autoindex_declarations_1, which SQLite creates for the
    // TEXT PRIMARY KEY and which getFormById/getAllFormByIds rely on.
    expect(names.filter(n => !n.startsWith("sqlite_"))).toEqual([
      "idx_declarations_colpoint",
      "idx_declarations_type_status",
    ]);
    expect(names).toContain("sqlite_autoindex_declarations_1");
  });

  it("uses the type/status index rather than scanning", async () => {
    const db = await createTestDb();
    await seed(db);
    const query = buildQuery({ type: "NAISSANCE", statuses: ["VALIDE"] })!;
    const { rows } = await db.execute(`EXPLAIN QUERY PLAN ${query.sql}`, query.params);
    expect(JSON.stringify(rows)).toContain("idx_declarations_type_status");
  });

  it("rejects a second declaration with the same id", async () => {
    const db = await createTestDb();
    await seed(db);
    await expect(
      db.execute(
        "INSERT INTO declarations (id,type,status,colpoint_code,error,evt_date,name,firstname,body) VALUES ('a1','NAISSANCE','VALIDE','','','','','','{}')",
      ),
    ).rejects.toThrow(/UNIQUE constraint failed/);
  });
});
