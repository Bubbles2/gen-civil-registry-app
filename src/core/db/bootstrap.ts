/**
 * What App.tsx runs before the navigator mounts.
 *
 * Opens the encrypted declaration store. Phase 12's Realm -> SQLite migration
 * has been removed along with Realm itself (Phase 13): this build must only be
 * installed on devices that have already migrated, which is what the
 * `realm_migration_done` flag reported at login proves. A device that somehow
 * reaches this build without having migrated keeps its Realm file — nothing
 * here touches it — but will show an empty Dashboard until it is put back on a
 * bridge build, so the flag is recorded here for support to read.
 */

import Logger from "../Logger";
import { getDb, getMeta, setMeta } from "./sqlite";
import { MIGRATED_AT_KEY, MIGRATION_DONE_KEY } from "./schema";

export type BootstrapResult = {
  /** "already-migrated" for a device that came through the bridge build,
   *  "fresh" for one that never had Realm data. */
  outcome: "already-migrated" | "fresh";
  durationMs: number;
};

export async function initDeclarationStore(): Promise<BootstrapResult> {
  const started = Date.now();
  await getDb();

  const migrated = (await getMeta(MIGRATION_DONE_KEY)) === "1";
  if (!migrated) {
    // A fresh install: no Realm data ever existed, so the store starts empty
    // and the flag goes down so support can tell the two cases apart.
    await setMeta(MIGRATION_DONE_KEY, "1");
    await setMeta(MIGRATED_AT_KEY, new Date().toISOString());
  }

  const durationMs = Date.now() - started;
  Logger.info(
    `initDeclarationStore: ${migrated ? "already-migrated" : "fresh"} (${durationMs} ms)`,
  );
  return { outcome: migrated ? "already-migrated" : "fresh", durationMs };
}
