/**
 * Phase 12 — the row/declaration conversion, which is what protects the wire
 * payload across the move off Realm.
 *
 * The property that matters: a declaration written to SQLite and read back must
 * serialise identically to the Realm object it replaces, because
 * SendDeclarationService flattens it straight onto the wire. Key *order* counts:
 * `flatten()` walks Object.keys, and V7 diffs the result byte for byte against
 * the Phase 0 captures.
 */
import {
  fromRow,
  hexId,
  nameOf,
  newId,
  orderBySchema,
  sortDateOf,
  toRow,
  toStored,
} from "../src/core/db/declarationShape";
import { FORMS_SCHEMA } from "../src/core/db/formsSchema";

const birth = () => ({
  ID: "6ab252da9a0d7a548d0385dd",
  TYPE: "NAISSANCE",
  STATUS: "BROUILLON",
  COLPOINT_CODE: "PCS_140",
  ERROR: "",
  ACT: { POINT_COLLECTE: "PCS_140", DECL_NUMBER: "PCS_140-TESTUSER-P11A", ACT_DECL_DATE: "22/09/2026", ACT_DECL_HOUR: "11:44" },
  CHILD: { CHILD_ALIVE: "Oui", FIRSTNAME: "Phase", NAME: "Onze", SEXE: "Masculin", INFO_NAI: { EVT_DATE: "20/09/2026", EVT_HOUR: "08:30", EVT_ADDRESS: { FORWARDING_ADDRESS: "" } } },
  FATHER: { DECEASED: "Non", NNI_NATIONAL: "Oui", NATIONAL_ID: "1234567890123", NUM_IDENT: "", FIRSTNAME: "Papa", NAME: "Onze", OCCUPATION: "", TEL_PARENT: "" },
});

const death = () => ({
  ID: "6aabd875419e4d5801cc2073",
  TYPE: "DECES",
  STATUS: "VALIDE",
  COLPOINT_CODE: "PCS_140",
  ERROR: "",
  DEFUNCT: { FIRSTNAME: "John", NAME: "Doe", NNI_NATIONAL: "Non", NATIONAL_ID: "", NUM_IDENT: "A1", SEXE: "Masculin", INFO_DEC: { EVT_DATE: "15/09/2026", EVT_HOUR: "10:00" } },
});

describe("hexId", () => {
  it("passes strings through", () => {
    expect(hexId("6ab252da9a0d7a548d0385dd")).toBe("6ab252da9a0d7a548d0385dd");
  });

  it("accepts a BSON-style ObjectId via toHexString", () => {
    const objectId = { toHexString: () => "6ab252da9a0d7a548d0385dd", toString: () => "nope" };
    expect(hexId(objectId)).toBe("6ab252da9a0d7a548d0385dd");
  });

  it("falls back to toString, as the old call sites did", () => {
    expect(hexId({ toString: () => "6aabd875419e4d5801cc2073" })).toBe("6aabd875419e4d5801cc2073");
  });

  it("maps null and undefined to an empty id rather than the string 'null'", () => {
    expect(hexId(null)).toBe("");
    expect(hexId(undefined)).toBe("");
  });
});

describe("newId", () => {
  it("has ObjectId's shape: 24 lowercase hex characters", () => {
    expect(newId()).toMatch(/^[0-9a-f]{24}$/);
  });

  it("encodes the timestamp in the first 4 bytes, like ObjectId", () => {
    const id = newId(1758537600000);
    expect(id.slice(0, 8)).toBe(Math.floor(1758537600000 / 1000).toString(16));
  });

  it("does not repeat within a burst", () => {
    const ids = new Set(Array.from({ length: 500 }, () => newId()));
    expect(ids.size).toBe(500);
  });
});

describe("orderBySchema", () => {
  it("puts top-level keys in schema order regardless of input order", () => {
    const scrambled = { STATUS: "BROUILLON", CHILD: {}, ID: "x", TYPE: "NAISSANCE" };
    expect(Object.keys(orderBySchema(FORMS_SCHEMA, "FORMS", scrambled)))
      .toEqual(["ID", "CHILD", "TYPE", "STATUS"]);
  });

  it("orders nested linked objects too", () => {
    const decl = { CHILD: { NAME: "Onze", CHILD_ALIVE: "Oui", FIRSTNAME: "Phase" } };
    const ordered = orderBySchema(FORMS_SCHEMA, "FORMS", decl);
    expect(Object.keys(ordered.CHILD)).toEqual(["CHILD_ALIVE", "FIRSTNAME", "NAME"]);
  });

  it("keeps keys the schema does not declare instead of dropping them", () => {
    const decl = { TYPE: "NAISSANCE", SORT_WEIGTH: 1, MYSTERY: { a: 1 } };
    const ordered = orderBySchema(FORMS_SCHEMA, "FORMS", decl);
    expect(ordered.SORT_WEIGTH).toBe(1);
    expect(ordered.MYSTERY).toEqual({ a: 1 });
    expect(Object.keys(ordered)).toEqual(["TYPE", "SORT_WEIGTH", "MYSTERY"]);
  });
});

describe("toStored", () => {
  it("fills schema defaults for fields the form left out, as Realm did", () => {
    const stored = toStored(FORMS_SCHEMA, birth());
    // ACT_DECL_* were given; CHILD.INFO_NAI.EVT_ADDRESS.FORWARDING_ADDRESS was "".
    expect(stored.FATHER.INFO_DOM).toBeUndefined();
    expect(stored.ERROR).toBe("");
    expect(stored.CHILD.SEXE).toBe("Masculin");
  });

  it("gives a declaration with no ID a fresh one rather than an empty key", () => {
    const { ID, ...withoutId } = birth();
    expect(toStored(FORMS_SCHEMA, withoutId).ID).toMatch(/^[0-9a-f]{24}$/);
  });

  it("normalises an ObjectId-shaped ID to hex", () => {
    const decl = { ...birth(), ID: { toHexString: () => "6ab252da9a0d7a548d0385dd" } };
    expect(toStored(FORMS_SCHEMA, decl).ID).toBe("6ab252da9a0d7a548d0385dd");
  });

  it("is idempotent: storing an already-stored declaration changes nothing", () => {
    const once = toStored(FORMS_SCHEMA, birth());
    const twice = toStored(FORMS_SCHEMA, once);
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once));
  });
});

describe("toRow / fromRow", () => {
  it("round-trips a birth declaration byte for byte", () => {
    const stored = toStored(FORMS_SCHEMA, birth());
    const row = toRow(FORMS_SCHEMA, birth());
    expect(JSON.stringify(fromRow(row))).toBe(JSON.stringify(stored));
  });

  it("round-trips a death declaration byte for byte", () => {
    const stored = toStored(FORMS_SCHEMA, death());
    expect(JSON.stringify(fromRow(toRow(FORMS_SCHEMA, death())))).toBe(JSON.stringify(stored));
  });

  it("lifts the columns the Dashboard filters and sorts on", () => {
    const row = toRow(FORMS_SCHEMA, birth());
    expect(row).toMatchObject({
      id: "6ab252da9a0d7a548d0385dd",
      type: "NAISSANCE",
      status: "BROUILLON",
      colpoint_code: "PCS_140",
      error: "",
      evt_date: "20/09/2026",
      name: "Onze",
      firstname: "Phase",
    });
  });

  it("returns a fresh object each time, so a mutated row cannot leak into the next payload", () => {
    const row = toRow(FORMS_SCHEMA, birth());
    const first = fromRow(row);
    (first as any).SORT_WEIGTH = 1;
    expect((fromRow(row) as any).SORT_WEIGTH).toBeUndefined();
  });
});

describe("sortDateOf / nameOf", () => {
  it("uses the child's birth date for a birth", () => {
    expect(sortDateOf(birth())).toBe("20/09/2026");
  });

  it("falls back to ACCOUCHEMENT_DATE when the child's date is empty", () => {
    const decl: any = birth();
    decl.CHILD.INFO_NAI.EVT_DATE = "";
    decl.ACT_NAI = { ACCOUCHEMENT_DATE: "19/09/2026" };
    expect(sortDateOf(decl)).toBe("19/09/2026");
  });

  it("uses the defunct's death date for a death", () => {
    expect(sortDateOf(death())).toBe("15/09/2026");
  });

  it("takes the name from CHILD for births and DEFUNCT for deaths", () => {
    expect(nameOf(birth())).toEqual({ name: "Onze", firstname: "Phase" });
    expect(nameOf(death())).toEqual({ name: "Doe", firstname: "John" });
  });

  it("does not throw on a half-filled draft", () => {
    expect(sortDateOf({ TYPE: "NAISSANCE" })).toBe("");
    expect(nameOf({ TYPE: "DECES" })).toEqual({ name: "", firstname: "" });
  });
});
