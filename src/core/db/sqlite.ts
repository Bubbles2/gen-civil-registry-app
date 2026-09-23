/**
 * The one encrypted SQLite connection, opened once per app run.
 *
 * The key is the same value Realm used: SdkJs.getRealmConfig() writes it to
 * AsyncStorage under "keyDb" (see RealmConfig.saveKeyRealm), and SQLCipher takes
 * it as a passphrase. Deliberately no new key management — Appendix D's finding
 * that the key is a committed literal is a separate project, and changing it
 * here would mean two risky changes at once. Rotating it later on SQLCipher is a
 * `PRAGMA rekey`, which is exactly why this is the easier place to fix it.
 */

import { open, isSQLCipher, type DB } from "@op-engineering/op-sqlite";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Logger from "../Logger";
import { DB_NAME, DDL, SCHEMA_VERSION, SCHEMA_VERSION_KEY } from "./schema";

let db: DB | null = null;
let opening: Promise<DB> | null = null;

export class MissingKeyError extends Error {
  constructor() {
    super("openDb: no encryption key stored (keyDb is null)");
    this.name = "MissingKeyError";
  }
}

async function readKey(): Promise<string> {
  const key = await AsyncStorage.getItem("keyDb");
  if (key === null) {
    // The same failure getRealm() used to hang on. Rejecting is what makes it
    // visible instead of a silent forever-pending promise.
    throw new MissingKeyError();
  }
  return key;
}

/**
 * Open (once) and apply the DDL. Concurrent callers share one in-flight open:
 * the migrator and the first Dashboard render both want the database
 * immediately, and opening the same SQLCipher file twice is worth avoiding.
 */
export function getDb(): Promise<DB> {
  if (db) {
    return Promise.resolve(db);
  }
  if (opening) {
    return opening;
  }
  opening = (async () => {
    const encryptionKey = await readKey();
    const handle = open({ name: DB_NAME, encryptionKey });
    try {
      for (const statement of DDL) {
        await handle.execute(statement);
      }
      await handle.execute(
        "INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        [SCHEMA_VERSION_KEY, String(SCHEMA_VERSION)],
      );
    } catch (err) {
      // A wrong key surfaces here, as "file is not a database": leave nothing
      // half-open behind so the next attempt starts clean.
      handle.close();
      opening = null;
      throw err;
    }
    db = handle;
    opening = null;
    Logger.info(`openDb: ${DB_NAME} ready (SQLCipher: ${isSQLCipher()})`);
    return handle;
  })();
  return opening;
}

/** Closes the connection. Only the export path and tests need this. */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export async function getMeta(key: string): Promise<string | null> {
  const handle = await getDb();
  const { rows } = await handle.execute("SELECT value FROM meta WHERE key = ?", [key]);
  return rows.length > 0 ? String(rows[0].value) : null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  const handle = await getDb();
  await handle.execute(
    "INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [key, value],
  );
}
