import SdkJs from "../SdkJs";
import Logger from "../Logger";

/**
 * Data export (support / migration corpus).
 *
 * The native side (SdkJs.exportDatabases) creates
 * <externalFilesDir>/export/<timestamp>/, copies both SQLite databases —
 * dbSenegal.db (reference data, users) and crsen.db (declarations) — and a
 * manifest into it, and returns the directory.
 *
 * Realm is gone as of Phase 13, so there is no longer a declarations.realm to
 * add here. A device that still holds one has not migrated and must be put back
 * on the bridge build; its Realm file is untouched either way.
 *
 * Pull with:  adb pull /sdcard/Android/data/<applicationId>/files/export/
 */
export const exportDatabases = async (): Promise<string> => {
  const dir: string = await SdkJs.exportDatabases();
  Logger.info("exportDatabases: wrote " + dir);
  return dir;
};
