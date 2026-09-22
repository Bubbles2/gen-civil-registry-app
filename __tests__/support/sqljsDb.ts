/**
 * A real SQLite engine for the Phase 12 tests.
 *
 * op-sqlite cannot load in Jest (it is a JSI native module), but the thing worth
 * testing about a data migration is the SQL itself: the DDL, the filters, the
 * upsert, the transaction rollback. sql.js is the same SQLite compiled to WASM,
 * wrapped here in op-sqlite's `execute` / `transaction` shape so the production
 * code under test is the production code, not a paraphrase of it.
 *
 * SQLCipher is the one thing this cannot exercise — encryption is verified on
 * the device instead.
 */
import initSqlJs from "sql.js";
import { DDL } from "../../src/core/db/schema";

export type TestDb = {
  execute: (sql: string, params?: any[]) => Promise<{ rows: Array<Record<string, any>> }>;
  transaction: (fn: (tx: any) => Promise<void>) => Promise<void>;
  /** Test-only: what is actually in the table, for assertions. */
  raw: any;
};

export async function createTestDb(): Promise<TestDb> {
  const SQL = await initSqlJs();
  const raw = new SQL.Database();

  const run = async (sql: string, params: any[] = []) => {
    const statement = raw.prepare(sql);
    try {
      statement.bind(params);
      const rows: Array<Record<string, any>> = [];
      while (statement.step()) {
        rows.push(statement.getAsObject());
      }
      return { rows };
    } finally {
      statement.free();
    }
  };

  const db: TestDb = {
    execute: run,
    async transaction(fn) {
      await run("BEGIN");
      let committed = false;
      const tx = {
        execute: run,
        commit: async () => {
          await run("COMMIT");
          committed = true;
          return { rows: [] };
        },
        rollback: async () => {
          await run("ROLLBACK");
          committed = true;
          return { rows: [] };
        },
      };
      try {
        await fn(tx);
        if (!committed) {
          await run("COMMIT");
        }
      } catch (err) {
        if (!committed) {
          await run("ROLLBACK");
        }
        throw err;
      }
    },
    raw,
  };

  for (const statement of DDL) {
    await db.execute(statement);
  }
  return db;
}
