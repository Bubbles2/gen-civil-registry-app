/**
 * Phase 13 — the export after Realm's removal.
 *
 * Both SQLite databases are copied by the native side now, so this layer has
 * one job left: call it and hand back the directory it created. The Realm copy
 * that used to happen here is gone with Realm; what the test still pins down is
 * that a native failure is not swallowed, because a support export that
 * silently produced nothing would be worse than one that errored.
 */
jest.mock("../src/core/Logger", () => ({
  __esModule: true,
  default: { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

const mockNativeExport = jest.fn();
jest.mock("../src/core/SdkJs", () => ({
  __esModule: true,
  default: { exportDatabases: (...a: any[]) => mockNativeExport(...a) },
}));

import { exportDatabases } from "../src/core/services/exportService";

const DIR = "/storage/emulated/0/Android/data/com.crseneagalmobile.dev/files/export/2026-09-22T10-00-00Z";

beforeEach(() => {
  jest.clearAllMocks();
  mockNativeExport.mockResolvedValue(DIR);
});

test("returns the directory the native side created", async () => {
  await expect(exportDatabases()).resolves.toBe(DIR);
  expect(mockNativeExport).toHaveBeenCalledTimes(1);
});

test("propagates a native export failure instead of returning an empty result", async () => {
  mockNativeExport.mockRejectedValue(new Error("MKDIR_FAILED"));

  await expect(exportDatabases()).rejects.toThrow("MKDIR_FAILED");
});
