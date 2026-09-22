/**
 * The one-time Realm -> SQLite copy, run on first launch of the bridge build.
 *
 * Shape of the guarantee, in order:
 *   1. nothing happens at all once `realm_migration_done` is set;
 *   2. the Realm file is opened read-only and is never written or deleted;
 *   3. every object is copied inside a single SQLite transaction, so a crash
 *      halfway leaves an empty table and the flag unset — the next launch
 *      simply starts again from the untouched Realm file;
 *   4. counts are verified per type and status *before* the flag is set; a
 *      mismatch rolls the transaction back and leaves the app on Realm.
 *
 * Rolling back to the Part 1 build therefore restores the old path exactly:
 * the Realm file is still there, byte for byte. That is the whole point of the
 * bridge release, and it is why this code renames nothing.
 */

import { getDb, setMeta, getMeta } from "./sqlite";
import {
  MIGRATED_AT_KEY,
  MIGRATED_COUNT_KEY,
  MIGRATION_DONE_KEY,
} from "./schema";
import { FORMS_SCHEMA } from "./formsSchema";
import { Declaration, toRow } from "./declarationShape";
import Logger from "../Logger";

export type MigrationResult = {
  /** "already-done" | "no-realm-file" | "migrated" */
  outcome: "already-done" | "no-realm-file" | "migrated";
  copied: number;
  countsByTypeAndStatus: Record<string, number>;
};

/** Minimal shape of what we need from a Realm instance, so tests can fake it. */
export type RealmLike = {
  objects: (type: string) => ArrayLike<any> & Iterable<any>;
  close?: () => void;
};

/** The slice of op-sqlite's DB that the migration uses. */
export type DbLike = {
  execute: (sql: string, params?: any[]) => Promise<{ rows: Array<Record<string, any>> }>;
  transaction: (fn: (tx: TxLike) => Promise<void>) => Promise<void>;
};

export type TxLike = {
  execute: (sql: string, params?: any[]) => Promise<{ rows: Array<Record<string, any>> }>;
  commit: () => Promise<unknown>;
};

export type MigrateOptions = {
  /** Opens the existing Realm read-only, or resolves null when there is none. */
  openRealm: () => Promise<RealmLike | null>;
  /** The store to copy into. Defaults to the app's connection; injected in tests. */
  openDb?: () => Promise<DbLike>;
  /** Reads/writes the meta table. Default goes through the app's connection. */
  readMeta?: (key: string) => Promise<string | null>;
  writeMeta?: (key: string, value: string) => Promise<void>;
  /** Injected in tests. */
  now?: () => number;
};

/**
 * Realm objects are live proxies: `JSON.parse(JSON.stringify(obj))` is what the
 * send path already does to turn one into plain data, and it yields the schema's
 * property order. Doing the same here keeps the copy an identity transform.
 */
export function realmObjectToDeclaration(obj: any): Declaration {
  return JSON.parse(JSON.stringify(obj));
}

export function countKey(decl: Declaration): string {
  return `${decl?.TYPE ?? ""}|${decl?.STATUS ?? ""}`;
}

export function tally(declarations: Declaration[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const decl of declarations) {
    const key = countKey(decl);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function countsMatch(
  expected: Record<string, number>,
  actual: Record<string, number>,
): boolean {
  const keys = new Set([...Object.keys(expected), ...Object.keys(actual)]);
  for (const key of keys) {
    if ((expected[key] ?? 0) !== (actual[key] ?? 0)) {
      return false;
    }
  }
  return true;
}

export async function hasMigrated(
  readMeta: (key: string) => Promise<string | null> = getMeta,
): Promise<boolean> {
  return (await readMeta(MIGRATION_DONE_KEY)) === "1";
}

export async function migrateFromRealm(options: MigrateOptions): Promise<MigrationResult> {
  const now = options.now ?? Date.now;
  const openDb = options.openDb ?? (getDb as unknown as () => Promise<DbLike>);
  const readMeta = options.readMeta ?? getMeta;
  const writeMeta = options.writeMeta ?? setMeta;

  if (await hasMigrated(readMeta)) {
    return { outcome: "already-done", copied: 0, countsByTypeAndStatus: {} };
  }

  const realm = await options.openRealm();
  if (!realm) {
    // Fresh install: nothing to copy, but the flag still goes down so no later
    // launch goes looking for a Realm file that never existed.
    await writeMeta(MIGRATION_DONE_KEY, "1");
    await writeMeta(MIGRATED_AT_KEY, new Date(now()).toISOString());
    await writeMeta(MIGRATED_COUNT_KEY, "0");
    Logger.info("migrateFromRealm: no Realm file, nothing to migrate");
    return { outcome: "no-realm-file", copied: 0, countsByTypeAndStatus: {} };
  }

  // The Realm instance belongs to whoever opened it (Realm 12 caches by path),
  // so it is deliberately not closed here: closing the cached instance is what
  // emptied the Dashboard once before.
  {
    const declarations = Array.from(realm.objects("FORMS")).map(realmObjectToDeclaration);
    const expected = tally(declarations);
    Logger.info(`migrateFromRealm: copying ${declarations.length} declarations`);

    const db = await openDb();
    await db.transaction(async tx => {
      // Re-entrancy: a previous crashed attempt may have left rows behind.
      await tx.execute("DELETE FROM declarations");
      for (const decl of declarations) {
        const row = toRow(FORMS_SCHEMA, decl);
        await tx.execute(
          `INSERT INTO declarations
             (id, type, status, colpoint_code, error, evt_date, name, firstname, body)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [row.id, row.type, row.status, row.colpoint_code, row.error,
            row.evt_date, row.name, row.firstname, row.body],
        );
      }
      const { rows } = await tx.execute(
        "SELECT type, status, COUNT(*) AS n FROM declarations GROUP BY type, status",
      );
      const actual: Record<string, number> = {};
      for (const row of rows) {
        actual[`${row.type}|${row.status}`] = Number(row.n);
      }
      if (!countsMatch(expected, actual)) {
        // Throwing inside the transaction rolls it back; the flag is never set,
        // so the app stays on Realm and the next launch tries again.
        throw new Error(
          `migrateFromRealm: count mismatch. realm=${JSON.stringify(expected)} sqlite=${JSON.stringify(actual)}`,
        );
      }
      await tx.commit();
    });

    await writeMeta(MIGRATED_COUNT_KEY, String(declarations.length));
    await writeMeta(MIGRATED_AT_KEY, new Date(now()).toISOString());
    // Last, and only after the counts matched: from here the app reads SQLite.
    await writeMeta(MIGRATION_DONE_KEY, "1");
    Logger.info(
      `migrateFromRealm: migrated ${declarations.length} declarations ${JSON.stringify(expected)}`,
    );
    return {
      outcome: "migrated",
      copied: declarations.length,
      countsByTypeAndStatus: expected,
    };
  }
}
