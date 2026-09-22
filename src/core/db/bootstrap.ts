/**
 * What App.tsx runs before the navigator mounts.
 *
 * Opens the encrypted store and, on the first launch of the bridge build, copies
 * the declarations out of Realm. Realm is opened **read-only** here and nowhere
 * else in the app any more: after this runs, every read and write goes to
 * SQLite. Keeping the Realm file untouched is what makes a rollback to the
 * Part 1 build a non-event.
 */

import { Realm } from "@realm/react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { config } from "../../realmSchema/Forms";
import { Encodeuint8arr } from "../RealmConfig";
import Logger from "../Logger";
import { getDb } from "./sqlite";
import { migrateFromRealm, MigrationResult, RealmLike } from "./migrateFromRealm";

/**
 * Opens the existing Realm read-only, or resolves null when the device has none
 * (a fresh install, or a device that already migrated and no longer needs it).
 *
 * `Realm.exists` is the only safe way to ask: `Realm.open` would *create* an
 * empty file, and an empty file would then migrate zero rows and set the
 * done-flag — losing nothing, but also proving nothing.
 */
export async function openRealmReadOnly(): Promise<RealmLike | null> {
  const keyString = await AsyncStorage.getItem("keyDb");
  if (keyString === null) {
    throw new Error("migration: no encryption key stored (keyDb is null)");
  }
  const encryptionKey = Encodeuint8arr(keyString);
  const realmConfig = { ...config, encryptionKey, readOnly: true } as any;
  if (!Realm.exists(realmConfig)) {
    return null;
  }
  const realm = await Realm.open(realmConfig);
  return realm as unknown as RealmLike;
}

export type BootstrapResult = MigrationResult & { durationMs: number };

export async function initDeclarationStore(): Promise<BootstrapResult> {
  const started = Date.now();
  await getDb();
  const result = await migrateFromRealm({ openRealm: openRealmReadOnly });
  const durationMs = Date.now() - started;
  Logger.info(
    `initDeclarationStore: ${result.outcome} (${result.copied} declarations, ${durationMs} ms)`,
  );
  return { ...result, durationMs };
}
