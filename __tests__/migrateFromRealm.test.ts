/**
 * Phase 12 — the Realm -> SQLite migration, against a real SQLite engine.
 *
 * What has to hold on a field device holding live civil-registry data:
 *   - every row arrives, with its fields intact;
 *   - it runs once and is a no-op afterwards;
 *   - a fresh install (no Realm file) is fine;
 *   - a crash or a miscount leaves NOTHING half-written and the flag unset, so
 *     the next launch retries from the untouched Realm file;
 *   - the Realm file is only ever read.
 */
import {
  countsMatch,
  migrateFromRealm,
  realmObjectToDeclaration,
  tally,
} from "../src/core/db/migrateFromRealm";
import { MIGRATION_DONE_KEY, MIGRATED_COUNT_KEY } from "../src/core/db/schema";
import { createTestDb, TestDb } from "./support/sqljsDb";

jest.mock("../src/core/Logger", () => ({
  __esModule: true,
  default: { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

// The app's connection is never reached: every test injects its own.
jest.mock("../src/core/db/sqlite", () => ({
  getDb: () => Promise.reject(new Error("the real connection must not be used in tests")),
  getMeta: () => Promise.reject(new Error("the real meta table must not be used in tests")),
  setMeta: () => Promise.reject(new Error("the real meta table must not be used in tests")),
}));

const declaration = (over: Record<string, any> = {}) => ({
  ID: "6ab252da9a0d7a548d0385dd",
  TYPE: "NAISSANCE",
  STATUS: "BROUILLON",
  COLPOINT_CODE: "PCS_140",
  ERROR: "",
  CHILD: { CHILD_ALIVE: "Oui", FIRSTNAME: "Phase", NAME: "Onze", SEXE: "Masculin", INFO_NAI: { EVT_DATE: "20/09/2026", EVT_HOUR: "08:30" } },
  ...over,
});

/** Stands in for a Realm instance; `objects("FORMS")` is all the migrator uses. */
const fakeRealm = (declarations: any[]) => {
  const calls: string[] = [];
  return {
    realm: {
      objects: (type: string) => {
        calls.push(type);
        return declarations;
      },
    },
    calls,
  };
};

function harness(db: TestDb) {
  const meta = new Map<string, string>();
  return {
    meta,
    openDb: () => Promise.resolve(db as any),
    readMeta: async (key: string) => meta.get(key) ?? null,
    writeMeta: async (key: string, value: string) => {
      meta.set(key, value);
    },
  };
}

const countRows = async (db: TestDb) =>
  Number((await db.execute("SELECT COUNT(*) AS n FROM declarations")).rows[0].n);

describe("tally / countsMatch", () => {
  it("counts per type and status", () => {
    expect(tally([
      declaration(),
      declaration({ ID: "b", STATUS: "VALIDE" }),
      declaration({ ID: "c", TYPE: "DECES", STATUS: "VALIDE" }),
    ])).toEqual({ "NAISSANCE|BROUILLON": 1, "NAISSANCE|VALIDE": 1, "DECES|VALIDE": 1 });
  });

  it("treats a missing bucket on either side as a mismatch", () => {
    expect(countsMatch({ a: 1 }, { a: 1 })).toBe(true);
    expect(countsMatch({ a: 1 }, { a: 1, b: 1 })).toBe(false);
    expect(countsMatch({ a: 1, b: 1 }, { a: 1 })).toBe(false);
    expect(countsMatch({ a: 2 }, { a: 1 })).toBe(false);
  });
});

describe("realmObjectToDeclaration", () => {
  it("turns a live Realm object into plain data, as the send path already does", () => {
    const live = { ID: "x", TYPE: "NAISSANCE", toJSON: () => ({ ID: "x", TYPE: "NAISSANCE" }) };
    expect(realmObjectToDeclaration(live)).toEqual({ ID: "x", TYPE: "NAISSANCE" });
  });
});

describe("migrateFromRealm", () => {
  let db: TestDb;
  beforeEach(async () => {
    db = await createTestDb();
  });

  it("copies every declaration and records the count", async () => {
    const h = harness(db);
    const { realm } = fakeRealm([
      declaration(),
      declaration({ ID: "6aabd875419e4d5801cc2073", TYPE: "DECES", STATUS: "VALIDE", CHILD: undefined, DEFUNCT: { FIRSTNAME: "John", NAME: "Doe", INFO_DEC: { EVT_DATE: "15/09/2026" } } }),
    ]);

    const result = await migrateFromRealm({ openRealm: async () => realm, ...h });

    expect(result.outcome).toBe("migrated");
    expect(result.copied).toBe(2);
    expect(await countRows(db)).toBe(2);
    expect(h.meta.get(MIGRATION_DONE_KEY)).toBe("1");
    expect(h.meta.get(MIGRATED_COUNT_KEY)).toBe("2");
  });

  it("keeps the fields the Dashboard needs, in the right columns", async () => {
    const h = harness(db);
    const { realm } = fakeRealm([declaration()]);
    await migrateFromRealm({ openRealm: async () => realm, ...h });

    const { rows } = await db.execute("SELECT * FROM declarations");
    expect(rows[0]).toMatchObject({
      id: "6ab252da9a0d7a548d0385dd",
      type: "NAISSANCE",
      status: "BROUILLON",
      colpoint_code: "PCS_140",
      evt_date: "20/09/2026",
      name: "Onze",
      firstname: "Phase",
    });
    expect(JSON.parse(String(rows[0].body)).CHILD.INFO_NAI.EVT_HOUR).toBe("08:30");
  });

  it("is a no-op once the flag is set, and does not touch Realm again", async () => {
    const h = harness(db);
    const { realm, calls } = fakeRealm([declaration()]);
    await migrateFromRealm({ openRealm: async () => realm, ...h });
    const openAgain = jest.fn(async () => realm);

    const second = await migrateFromRealm({ openRealm: openAgain, ...h });

    expect(second.outcome).toBe("already-done");
    expect(openAgain).not.toHaveBeenCalled();
    expect(calls).toEqual(["FORMS"]);
    expect(await countRows(db)).toBe(1);
  });

  it("handles a fresh install with no Realm file", async () => {
    const h = harness(db);
    const result = await migrateFromRealm({ openRealm: async () => null, ...h });

    expect(result.outcome).toBe("no-realm-file");
    expect(await countRows(db)).toBe(0);
    expect(h.meta.get(MIGRATION_DONE_KEY)).toBe("1");
  });

  it("rolls back and leaves the flag unset when the counts do not match", async () => {
    const h = harness(db);
    const realm = { objects: () => [declaration()] };
    // A row the Realm tally knows nothing about. The migration normally clears
    // the table first; skipping that DELETE below is what makes the counts
    // disagree, which is exactly the situation the check exists for.
    await db.execute(
      "INSERT INTO declarations (id,type,status,colpoint_code,error,evt_date,name,firstname,body)" +
      " VALUES ('ghost','NAISSANCE','VALIDE','','','','','','{}')",
    );

    const failing = migrateFromRealm({
      openRealm: async () => realm as any,
      ...h,
      openDb: async () => ({
        execute: db.execute,
        transaction: (fn: any) =>
          db.transaction(tx =>
            fn({
              ...tx,
              execute: (sql: string, params?: any[]) =>
                sql.trim().startsWith("DELETE")
                  ? Promise.resolve({ rows: [] })
                  : tx.execute(sql, params),
            })),
      }) as any,
    });

    await expect(failing).rejects.toThrow(/count mismatch/);
    expect(h.meta.get(MIGRATION_DONE_KEY)).toBeUndefined();
    // Rolled back: the copied declaration is gone, the pre-existing row remains.
    expect(await countRows(db)).toBe(1);
    const { rows } = await db.execute("SELECT id FROM declarations");
    expect(rows[0].id).toBe("ghost");
  });

  it("leaves nothing behind when the copy throws halfway", async () => {
    const h = harness(db);
    const realm = {
      objects: () => [declaration(), declaration({ ID: "second" })],
    };
    const failing = migrateFromRealm({
      openRealm: async () => realm as any,
      ...h,
      openDb: async () => ({
        execute: db.execute,
        transaction: async (fn: any) => {
          await db.transaction(async tx => {
            let inserts = 0;
            await fn({
              ...tx,
              execute: (sql: string, params?: any[]) => {
                if (sql.trim().startsWith("INSERT")) {
                  inserts += 1;
                  if (inserts === 2) {
                    throw new Error("device storage full");
                  }
                }
                return tx.execute(sql, params);
              },
            });
          });
        },
      }) as any,
    });

    await expect(failing).rejects.toThrow("device storage full");
    expect(await countRows(db)).toBe(0);
    expect(h.meta.get(MIGRATION_DONE_KEY)).toBeUndefined();
  });

  it("retries cleanly on the next launch after a failure", async () => {
    const h = harness(db);
    // First attempt fails, second succeeds against the same (untouched) data.
    const declarations = [declaration(), declaration({ ID: "second" })];
    const realm = { objects: () => declarations };

    await expect(migrateFromRealm({
      openRealm: async () => realm as any,
      ...h,
      openDb: async () => ({
        execute: db.execute,
        transaction: async () => {
          throw new Error("interrupted");
        },
      }) as any,
    })).rejects.toThrow("interrupted");

    const result = await migrateFromRealm({ openRealm: async () => realm as any, ...h });
    expect(result.outcome).toBe("migrated");
    expect(result.copied).toBe(2);
    expect(await countRows(db)).toBe(2);
  });

  it("only reads the Realm: no write, delete or close is available to it", async () => {
    const h = harness(db);
    const realm = { objects: () => [declaration()] };
    await migrateFromRealm({ openRealm: async () => realm as any, ...h });
    // The fake exposes nothing but objects(); if the migrator had called write()
    // or delete() this test would have thrown.
    expect(Object.keys(realm)).toEqual(["objects"]);
  });
});
