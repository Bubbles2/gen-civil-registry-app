/**
 * Phase 12 — the encrypted SQLite store that replaces Realm for declarations.
 *
 * One row per declaration: the whole form body lives in a JSON column, with the
 * fields the Dashboard filters, sorts and searches on lifted into indexed
 * columns. That mirrors what the wire payload already is (a flattened form) and
 * keeps the Realm -> SQLite migration a near-identity copy, which is the point:
 * the less reshaping a migration does to live civil-registry data, the less it
 * can silently lose.
 *
 * Reference data and users still live in dbSenegal.db (react-native-sqlite-storage)
 * during the bridge release; moving them onto this database is the follow-up
 * step, after every office has migrated its declarations.
 */

export const DB_NAME = "crsen.db";

/** Bumped only when the DDL below changes; `meta.schema_version` records it. */
export const SCHEMA_VERSION = 1;

/** Set to "1" once the Realm -> SQLite copy has completed and been verified. */
export const MIGRATION_DONE_KEY = "realm_migration_done";
export const MIGRATED_AT_KEY = "realm_migration_at";
export const MIGRATED_COUNT_KEY = "realm_migration_count";
export const SCHEMA_VERSION_KEY = "schema_version";

/**
 * Applied in order, every launch. Every statement is IF NOT EXISTS so this is
 * idempotent and safe to run before knowing whether the database is new.
 */
export const DDL: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS declarations (
     id            TEXT PRIMARY KEY NOT NULL,
     type          TEXT NOT NULL,
     status        TEXT NOT NULL,
     colpoint_code TEXT NOT NULL DEFAULT '',
     error         TEXT NOT NULL DEFAULT '',
     evt_date      TEXT NOT NULL DEFAULT '',
     name          TEXT NOT NULL DEFAULT '',
     firstname     TEXT NOT NULL DEFAULT '',
     body          TEXT NOT NULL
   )`,
  // The Dashboard's only two filters: type + status, and collection point for
  // non-admin users.
  `CREATE INDEX IF NOT EXISTS idx_declarations_type_status
     ON declarations (type, status)`,
  `CREATE INDEX IF NOT EXISTS idx_declarations_colpoint
     ON declarations (colpoint_code)`,
  `CREATE TABLE IF NOT EXISTS meta (
     key   TEXT PRIMARY KEY NOT NULL,
     value TEXT NOT NULL
   )`,
];
