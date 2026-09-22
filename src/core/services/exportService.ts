import SdkJs from "../SdkJs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Encodeuint8arr } from "../RealmConfig";
import { openRealmReadOnly } from "../db/bootstrap";
import Logger from "../Logger";

export const REALM_EXPORT_FILENAME = "declarations.realm";

/**
 * Phase 0 data export (migration corpus), now covering both stores.
 *
 * The native side (SdkJs.exportDatabases) creates
 * <externalFilesDir>/export/<timestamp>/, copies the SQLite databases —
 * dbSenegal.db (reference data, users) and crsen.db (declarations, Phase 12) —
 * and a manifest into it, and returns the directory.
 *
 * The Realm file is added here while it still exists: from Phase 12 the app
 * opens it read-only and only to migrate, so this uses the same read-only
 * handle (Realm 12 caches by path — asking for read-write as well would throw)
 * and simply skips the copy once a device no longer has a Realm file.
 *
 * Pull with:  adb pull /sdcard/Android/data/<applicationId>/files/export/
 */
export const exportDatabases = async (): Promise<string> => {
  const dir: string = await SdkJs.exportDatabases();
  const keyString = await AsyncStorage.getItem("keyDb");
  if (keyString === null) {
    throw new Error("exportDatabases: no encryption key stored (keyDb is null)");
  }
  const realm = await openRealmReadOnly();
  if (realm === null) {
    Logger.info("exportDatabases: no Realm file to copy; wrote " + dir);
    return dir;
  }
  // Never a raw copy of an open Realm.
  (realm as any).writeCopyTo({
    path: `${dir}/${REALM_EXPORT_FILENAME}`,
    encryptionKey: Encodeuint8arr(keyString),
  });
  Logger.info("exportDatabases: wrote " + dir);
  return dir;
};
