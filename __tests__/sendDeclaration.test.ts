/**
 * Phase 0 — pure tests for the declaration send path.
 *
 * Covers:
 *  - wire payload shape for birth (NAISSANCE) and death (DECES) declarations
 *  - `externalId` as the stable idempotency key
 *  - status transitions: success -> ARCHIVE, failure -> ERREUR
 *  - exactly one HTTP request per act in both outcomes
 *  - the `Realm.BSON.ObjectId(act.ID.toString())` conversion sites in
 *    SendDeclarationService, and the equivalence that lets them be
 *    migrated to `new Realm.BSON.ObjectId(...)`.
 *
 * No Realm native binding, SQLite, or network is touched.
 */
import { ObjectId } from "bson";

// Realm 11's `Realm.BSON` is the `bson` package; using it directly gives the
// real ObjectId semantics without the native Realm binding.
jest.mock("@realm/react", () => ({ Realm: { BSON: require("bson") } }));

jest.mock("../src/core/Logger", () => ({
  __esModule: true,
  default: { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

const mockPost = jest.fn();
jest.mock("../src/core/services/axiosapi", () => ({
  __esModule: true,
  default: jest.fn(() => ({ post: mockPost })),
}));

const mockUpdateStatusDb = jest.fn();
const mockGetOffice = jest.fn();
jest.mock("../src/core/services/databaseService", () => ({
  getDBConnection: jest.fn(() => Promise.resolve({})),
  getOfficeByCollectionPointCode: (...args: any[]) => mockGetOffice(...args),
}));
// Phase 12: statuses are written to the SQLite store, not Realm.
jest.mock("../src/core/db/declarations", () => ({
  updateStatusDb: (...args: any[]) => mockUpdateStatusDb(...args),
}));

import {
  buildDeclarationPayload,
  sendDeclaration,
  sendBatch,
} from "../src/core/services/SendDeclarationService";

const ENDPOINT = "https://example.invalid/api/declarations";
const OFFICE = { id: 7, code: "OFF-007" };

const birthAct = (id: ObjectId) => ({
  ID: id,
  TYPE: "NAISSANCE",
  STATUS: "VALIDE",
  ERROR: "",
  network: "wifi",
  COLPOINT_CODE: "CP-01",
  CHILD: { FIRSTNAME: "Awa", NAME: "Diop", INFO_NAI: { EVT_DATE: "2024-01-02", EVT_HOUR: "10:00" } },
  ACT_NAI: { ACCOUCHEMENT_DATE: "2024-01-02", ACCOUCHEMENT_HOUR: "10:00" },
});

const deathAct = (id: ObjectId) => ({
  ID: id,
  TYPE: "DECES",
  STATUS: "VALIDE",
  ERROR: "",
  network: "wifi",
  COLPOINT_CODE: "CP-01",
  DEFUNCT: { FIRSTNAME: "Moussa", NAME: "Ndiaye", INFO_DEC: { EVT_DATE: "2024-03-04", EVT_HOUR: "08:30" } },
});

// Simulates an act loaded from Realm then round-tripped through JSON, as
// Dashboard/BeBound do: ID becomes a 24-char hex string.
const asLoaded = (act: any) => ({ ...act, ID: act.ID.toString() });

const flushPromises = () => new Promise<void>(resolve => setImmediate(() => resolve()));

beforeEach(() => {
  jest.clearAllMocks();
  mockGetOffice.mockResolvedValue(OFFICE);
  mockUpdateStatusDb.mockResolvedValue({});
});

describe("buildDeclarationPayload", () => {
  it("builds a birth payload with DECL_NAISS and strips local-only fields", () => {
    const id = new ObjectId();
    const payload = buildDeclarationPayload(birthAct(id), OFFICE.code);

    expect(payload).toEqual({
      officeCode: "OFF-007",
      externalId: id,
      templateCode: "DECL_NAISS",
      metadata: {
        "CHILD.FIRSTNAME": "Awa",
        "CHILD.NAME": "Diop",
        "CHILD.INFO_NAI.EVT_DATE": "2024-01-02",
        "CHILD.INFO_NAI.EVT_HOUR": "10:00",
        "ACT_NAI.ACCOUCHEMENT_DATE": "2024-01-02",
        "ACT_NAI.ACCOUCHEMENT_HOUR": "10:00",
      },
    });
  });

  it("builds a death payload with DECL_DECES and strips local-only fields", () => {
    const id = new ObjectId();
    const payload = buildDeclarationPayload(deathAct(id), OFFICE.code);

    expect(payload.templateCode).toBe("DECL_DECES");
    expect(payload.externalId).toBe(id);
    expect(payload.metadata).toEqual({
      "DEFUNCT.FIRSTNAME": "Moussa",
      "DEFUNCT.NAME": "Ndiaye",
      "DEFUNCT.INFO_DEC.EVT_DATE": "2024-03-04",
      "DEFUNCT.INFO_DEC.EVT_HOUR": "08:30",
    });
  });

  it("never leaks ID, TYPE, STATUS, ERROR, network or COLPOINT_CODE into metadata", () => {
    for (const act of [birthAct(new ObjectId()), deathAct(new ObjectId())]) {
      const keys = Object.keys(buildDeclarationPayload(act, OFFICE.code).metadata);
      for (const local of ["ID", "TYPE", "STATUS", "ERROR", "network", "COLPOINT_CODE"]) {
        expect(keys).not.toContain(local);
      }
    }
  });

  it("uses the local record ID as a stable idempotency key across retries", () => {
    const id = new ObjectId();
    const act = asLoaded(birthAct(id));
    const first = buildDeclarationPayload(act, OFFICE.code);
    const retry = buildDeclarationPayload({ ...act, STATUS: "ERREUR", ERROR: "timeout" }, OFFICE.code);

    expect(first.externalId).toBe(id.toHexString());
    expect(retry.externalId).toBe(first.externalId);
    expect(retry.metadata).toEqual(first.metadata);
  });

  it("does not mutate the input declaration", () => {
    const act = birthAct(new ObjectId());
    const snapshot = JSON.parse(JSON.stringify(act));
    buildDeclarationPayload(act, OFFICE.code);
    expect(JSON.parse(JSON.stringify(act))).toEqual(snapshot);
  });
});

describe("sendDeclaration", () => {
  it("posts exactly one request to the endpoint with the built payload", async () => {
    mockPost.mockResolvedValue({ status: 200 });
    const act = asLoaded(birthAct(new ObjectId()));

    await sendDeclaration(act, ENDPOINT);

    expect(mockGetOffice).toHaveBeenCalledWith({}, "CP-01");
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledWith(
      ENDPOINT,
      buildDeclarationPayload(act, OFFICE.code),
      { timeout: 5000 },
    );
  });

  it("sends nothing and rejects when the office lookup fails", async () => {
    // A declaration whose office cannot be resolved must never resolve
    // successfully, otherwise sendBatch/Dashboard would mark it ARCHIVE
    // without anything having been sent.
    // NOTE: today the rejection is accidental — the catch block dereferences
    // `declaration.ACT.POINT_COLLECTE`, which does not exist, and throws a
    // TypeError. A deliberate rejection with the real cause is a separate fix.
    mockGetOffice.mockRejectedValue(new Error("no office"));
    const act = asLoaded(birthAct(new ObjectId()));

    await expect(sendDeclaration(act, ENDPOINT)).rejects.toBeTruthy();

    expect(mockPost).not.toHaveBeenCalled();
  });

  it("marks the act ERREUR, not ARCHIVE, when the office lookup fails in a batch", async () => {
    mockGetOffice.mockRejectedValue(new Error("no office"));
    const id = new ObjectId();
    const updateNotifications = jest.fn();

    sendBatch([asLoaded(birthAct(id))], updateNotifications, ENDPOINT);
    await flushPromises();

    expect(mockPost).not.toHaveBeenCalled();
    expect(mockUpdateStatusDb).toHaveBeenCalledTimes(1);
    const [passedId, status] = mockUpdateStatusDb.mock.calls[0];
    // Phase 12: the act's ID is passed through as it is stored (24-hex), not
    // rewrapped in an ObjectId on the way to the store.
    expect(passedId).toBe(id.toHexString());
    expect(status).toBe("ERREUR");
    expect(updateNotifications).toHaveBeenCalledWith(1, 0);
  });
});

describe("sendBatch status transitions", () => {
  it("marks a successful birth submission ARCHIVE with a single request", async () => {
    mockPost.mockResolvedValue({ status: 200 });
    const id = new ObjectId();
    const updateNotifications = jest.fn();

    sendBatch([asLoaded(birthAct(id))], updateNotifications, ENDPOINT);
    await flushPromises();

    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockUpdateStatusDb).toHaveBeenCalledTimes(1);
    const [passedId, status, error] = mockUpdateStatusDb.mock.calls[0];
    expect(passedId).toBe(id.toHexString());
    expect(status).toBe("ARCHIVE");
    expect(error).toBe("");
    expect(updateNotifications).toHaveBeenCalledWith(0, 1);
  });

  it("marks a failed death submission ERREUR without a second request", async () => {
    mockPost.mockRejectedValue(new Error("Network Error"));
    const id = new ObjectId();
    const updateNotifications = jest.fn();

    sendBatch([asLoaded(deathAct(id))], updateNotifications, ENDPOINT);
    await flushPromises();

    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockUpdateStatusDb).toHaveBeenCalledTimes(1);
    const [passedId, status, error] = mockUpdateStatusDb.mock.calls[0];
    expect(passedId).toBe(id.toHexString());
    expect(status).toBe("ERREUR");
    expect(error).toBe("Error: Network Error");
    expect(updateNotifications).toHaveBeenCalledWith(1, 0);
  });

  it("sends one request per act and updates each act's own status", async () => {
    const ok = new ObjectId();
    const ko = new ObjectId();
    mockPost
      .mockResolvedValueOnce({ status: 200 })
      .mockRejectedValueOnce(new Error("timeout"));
    const updateNotifications = jest.fn();

    sendBatch([asLoaded(birthAct(ok)), asLoaded(deathAct(ko))], updateNotifications, ENDPOINT);
    await flushPromises();

    expect(mockPost).toHaveBeenCalledTimes(2);
    expect(mockUpdateStatusDb).toHaveBeenCalledTimes(2);
    const byId = new Map(mockUpdateStatusDb.mock.calls.map(([i, s]) => [String(i), s]));
    expect(byId.get(ok.toHexString())).toBe("ARCHIVE");
    expect(byId.get(ko.toHexString())).toBe("ERREUR");
  });

  it("does not throw or retry when the status update itself fails", async () => {
    mockPost.mockResolvedValue({ status: 200 });
    mockUpdateStatusDb.mockRejectedValue(new Error("realm closed"));

    expect(() => sendBatch([asLoaded(birthAct(new ObjectId()))], jest.fn(), ENDPOINT)).not.toThrow();
    await flushPromises();

    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockUpdateStatusDb).toHaveBeenCalledTimes(1);
  });
});

describe("Realm.BSON.ObjectId conversion (six call sites)", () => {
  // Dashboard.tsx:439/471 and SendDeclarationService use act.ID.toString();
  // BeBoundService.ts:41/76 uses event.id, already a hex string. Both forms
  // must produce an ObjectId equal to the stored primary key, with or
  // without `new`, so the swap to `new` is behaviour-preserving.
  const { Realm } = require("@realm/react");

  it("callable and constructed forms yield equal ObjectIds from a hex string", () => {
    const stored = new ObjectId();
    const hex = stored.toString();
    const callable = Realm.BSON.ObjectId(hex);
    const constructed = new Realm.BSON.ObjectId(hex);

    expect(callable).toBeInstanceOf(ObjectId);
    expect(constructed).toBeInstanceOf(ObjectId);
    expect(callable.equals(stored)).toBe(true);
    expect(constructed.equals(stored)).toBe(true);
    expect(callable.toHexString()).toBe(constructed.toHexString());
  });

  it("round-trips an ObjectId through toString() without loss", () => {
    const stored = new ObjectId();
    expect(new Realm.BSON.ObjectId(stored.toString()).equals(stored)).toBe(true);
  });

  it("rejects an ID that is not a valid ObjectId hex", () => {
    expect(() => new Realm.BSON.ObjectId("not-an-id")).toThrow();
    expect(() => Realm.BSON.ObjectId("not-an-id")).toThrow();
  });
});
