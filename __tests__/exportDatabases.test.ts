/**
 * Phase 0 — tests for the data-export (migration corpus) path.
 *
 * The native half is exercised on a device; this pins the JS half: the Realm
 * copy goes through writeCopyTo into the directory the native side returned,
 * encrypted with the stored key, and the shared Realm handle is never closed
 * (Realm 12 hands back RealmProvider's instance; closing it broke the Dashboard).
 */
jest.mock("../src/core/Logger", () => ({
  __esModule: true,
  default: { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));
jest.mock("@realm/react", () => ({ Realm: {} }));

const toBytes = (s: string) => Uint8Array.from(s, c => c.charCodeAt(0));
jest.mock("../src/core/RealmConfig", () => ({
  Encodeuint8arr: (s: string) => toBytes(s),
}));

const mockGetItem = jest.fn();
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: { getItem: (...a: any[]) => mockGetItem(...a) },
}));

const mockNativeExport = jest.fn();
jest.mock("../src/core/SdkJs", () => ({
  __esModule: true,
  default: { exportDatabases: (...a: any[]) => mockNativeExport(...a) },
}));

// Phase 12: the Realm copy now goes through the migrator's read-only opener,
// which resolves null once a device no longer has a Realm file.
const mockOpenRealm = jest.fn();
jest.mock("../src/core/db/bootstrap", () => ({
  openRealmReadOnly: (...a: any[]) => mockOpenRealm(...a),
}));

import { exportDatabases, REALM_EXPORT_FILENAME } from "../src/core/services/exportService";

const DIR = "/storage/emulated/0/Android/data/com.crseneagalmobile.dev/files/export/2026-09-11T10-00-00Z";
const KEY = "abcdefghabcdefghabcdefghabcdefghabcdefghabcdefghabcdefghabcdefgh";

let realm: { writeCopyTo: jest.Mock; close: jest.Mock };

beforeEach(() => {
  jest.clearAllMocks();
  realm = { writeCopyTo: jest.fn(), close: jest.fn() };
  mockNativeExport.mockResolvedValue(DIR);
  mockGetItem.mockResolvedValue(KEY);
  mockOpenRealm.mockResolvedValue(realm);
});

test("writes an encrypted Realm copy into the native export directory and returns it", async () => {
  await expect(exportDatabases()).resolves.toBe(DIR);

  expect(mockNativeExport).toHaveBeenCalledTimes(1);
  expect(realm.writeCopyTo).toHaveBeenCalledTimes(1);
  const config = realm.writeCopyTo.mock.calls[0][0];
  expect(config.path).toBe(`${DIR}/${REALM_EXPORT_FILENAME}`);
  expect(config.encryptionKey).toBeInstanceOf(Uint8Array);
  expect(config.encryptionKey).toHaveLength(64);
  expect(String.fromCharCode(...config.encryptionKey)).toBe(KEY);
});

test("leaves the shared Realm handle open after a successful copy", async () => {
  await exportDatabases();
  expect(realm.close).not.toHaveBeenCalled();
});

test("rethrows when writeCopyTo fails, still without closing the Realm", async () => {
  realm.writeCopyTo.mockImplementation(() => {
    throw new Error("destination exists");
  });
  await expect(exportDatabases()).rejects.toThrow("destination exists");
  expect(realm.close).not.toHaveBeenCalled();
});

test("rejects without opening Realm when no key is stored", async () => {
  mockGetItem.mockResolvedValue(null);
  await expect(exportDatabases()).rejects.toThrow(/no encryption key/);
  expect(mockOpenRealm).not.toHaveBeenCalled();
});

test("propagates a native export failure without touching Realm", async () => {
  mockNativeExport.mockRejectedValue(new Error("NO_EXTERNAL_STORAGE"));
  await expect(exportDatabases()).rejects.toThrow("NO_EXTERNAL_STORAGE");
  expect(mockOpenRealm).not.toHaveBeenCalled();
});

test("skips the Realm copy on a device that has no Realm file", async () => {
  mockOpenRealm.mockResolvedValue(null);

  await expect(exportDatabases()).resolves.toBe(DIR);

  // The native side still exported both SQLite databases; there was simply no
  // Realm left to copy.
  expect(mockNativeExport).toHaveBeenCalledTimes(1);
  expect(realm.writeCopyTo).not.toHaveBeenCalled();
});
