/**
 * Phase 0 — regression test for getRealm().
 *
 * Before the fix, a missing "keyDb" entry left the getRealm() promise
 * pending forever, so every Realm-backed operation (updateStatusDb,
 * addOrUpdateForm, ...) hung silently. It must now reject.
 */
jest.mock("react-native-sqlite-storage", () => ({
  openDatabase: jest.fn(),
  enablePromise: jest.fn(),
}));
jest.mock("react-native-get-random-values", () => ({}));
jest.mock("react-native-build-config", () => ({ FLAVOR: "dev" }));
jest.mock("../src/core/Logger", () => ({
  __esModule: true,
  default: { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));
jest.mock("../src/realmSchema/Forms", () => ({ config: { schema: [] } }));

const toBytes = (s: string) => Uint8Array.from(s, c => c.charCodeAt(0));
const mockEncode = jest.fn(toBytes);
jest.mock("../src/core/RealmConfig", () => ({
  Encodeuint8arr: (s: string) => mockEncode(s),
}));

const mockGetItem = jest.fn();
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: { getItem: (...a: any[]) => mockGetItem(...a), setItem: jest.fn() },
}));

const mockRealmOpen = jest.fn();
jest.mock("@realm/react", () => ({
  Realm: { open: (...a: any[]) => mockRealmOpen(...a), BSON: require("bson") },
}));

import { getRealm, updateStatusDb } from "../src/core/services/databaseService";

const withTimeout = <T>(p: Promise<T>, ms = 200) =>
  Promise.race<T>([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("promise never settled")), ms)),
  ]);

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getRealm", () => {
  it("rejects (does not hang) when no encryption key is stored", async () => {
    mockGetItem.mockResolvedValue(null);

    await expect(withTimeout(getRealm())).rejects.toThrow(/no encryption key/);

    expect(mockGetItem).toHaveBeenCalledWith("keyDb");
    expect(mockRealmOpen).not.toHaveBeenCalled();
  });

  it("opens Realm with the stored key when one exists", async () => {
    const realm = { write: jest.fn(), objectForPrimaryKey: jest.fn() };
    mockGetItem.mockResolvedValue("stored-key");
    mockRealmOpen.mockResolvedValue(realm);

    await expect(withTimeout(getRealm())).resolves.toBe(realm);

    expect(mockEncode).toHaveBeenCalledWith("stored-key");
    expect(mockRealmOpen).toHaveBeenCalledTimes(1);
    expect(mockRealmOpen.mock.calls[0][0]).toMatchObject({
      encryptionKey: toBytes("stored-key"),
    });
  });

  it("propagates a key-storage read failure", async () => {
    mockGetItem.mockRejectedValue(new Error("storage unavailable"));

    await expect(withTimeout(getRealm())).rejects.toThrow("storage unavailable");
    expect(mockRealmOpen).not.toHaveBeenCalled();
  });

  it("propagates a Realm.open failure (e.g. wrong key)", async () => {
    mockGetItem.mockResolvedValue("stored-key");
    mockRealmOpen.mockRejectedValue(new Error("decryption failed"));

    await expect(withTimeout(getRealm())).rejects.toThrow("decryption failed");
  });
});

describe("updateStatusDb via getRealm", () => {
  it("rejects instead of hanging when the key is missing", async () => {
    mockGetItem.mockResolvedValue(null);
    const { ObjectId } = require("bson");

    await expect(
      withTimeout(updateStatusDb(new ObjectId(), "ARCHIVE", "")),
    ).rejects.toThrow(/no encryption key/);
  });
});
