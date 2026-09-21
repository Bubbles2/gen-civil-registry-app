import AsyncStorage from "@react-native-async-storage/async-storage";
import { Realm } from "@realm/react";
import SdkJs from "../SdkJs";
import { Encodeuint8arr } from "../RealmConfig";
import { getRealm } from "./databaseService";
import Logger from "../Logger";

export const REALM_EXPORT_FILENAME = "declarations.realm";

/**
 * Phase 0 data export (migration corpus).
 *
 * The native side (SdkJs.exportDatabases) creates
 * <externalFilesDir>/export/<timestamp>/, copies the SQLite database and a
 * manifest into it and returns the directory. This adds the Realm file via
 * realm.writeCopyTo() — never a raw copy of an open Realm — encrypted with the
 * same key so the corpus is protected at rest and opens with the known key.
 *
 * Pull with:  adb pull /sdcard/Android/data/<applicationId>/files/export/
 */
export const exportDatabases = async (): Promise<string> => {
  const dir: string = await SdkJs.exportDatabases();
  const keyString = await AsyncStorage.getItem("keyDb");
  if (keyString === null) {
    throw new Error("exportDatabases: no encryption key stored (keyDb is null)");
  }
  // Realm 12 returns the same cached instance for a given path, so this is the
  // RealmProvider's Realm: never close it here (that emptied the Dashboard).
  const realm = (await getRealm()) as Realm;
  realm.writeCopyTo({
    path: `${dir}/${REALM_EXPORT_FILENAME}`,
    encryptionKey: Encodeuint8arr(keyString),
  });
  Logger.info("exportDatabases: wrote " + dir);
  return dir;
};
