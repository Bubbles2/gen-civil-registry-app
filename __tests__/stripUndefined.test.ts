import { applySchemaDefaults, stripUndefined, toRealmInput, Schema } from "../src/core/services/realmInput";

const schema: Schema = [
  { name: "FORMS", properties: { ID: { type: "objectId" }, TYPE: { type: "string", default: "" }, MOTHER: { type: "object", objectType: "MOTHER" }, TAGS: "TAG[]", NOTES: "string[]", EXTRA: "EXTRA?" } },
  { name: "EXTRA", properties: { X: { type: "string", default: "x" } } },
  { name: "MOTHER", properties: { INFO_DOM: "INFO_DOM_MOTHER" } }, // Realm shorthand, as the app declares it
  { name: "INFO_DOM_MOTHER", properties: { CITY: { type: "string", default: "" }, FORWARDING_ADDRESS: { type: "string", default: "" }, SAME_ADR: { type: "string", default: "" }, NOTE: { type: "string", optional: true } } },
  { name: "TAG", properties: { LABEL: { type: "string", default: "none" } } },
];

test("removes undefined leaves at any depth", () => {
  expect(stripUndefined({ a: { b: undefined, c: "" }, d: [{ e: undefined, f: 1 }, "x"] })).toEqual({ a: { c: "" }, d: [{ f: 1 }, "x"] });
});

test("keeps null and empty strings, and does not walk class instances", () => {
  class Id { toString() { return "id"; } }
  const id = new Id();
  const out = stripUndefined({ ID: id, ERROR: null, NAME: "" });
  expect(out.ID).toBe(id);
  expect(out).toEqual({ ID: id, ERROR: null, NAME: "" });
});

test("fills absent non-optional defaults, recursing through shorthand links and lists", () => {
  const out = applySchemaDefaults(schema, "FORMS", { ID: "x", MOTHER: { INFO_DOM: { SAME_ADR: "Oui" } }, TAGS: [{}], NOTES: ["n"] });
  expect(out).toEqual({
    ID: "x",
    TYPE: "",
    MOTHER: { INFO_DOM: { SAME_ADR: "Oui", CITY: "", FORWARDING_ADDRESS: "" } },
    TAGS: [{ LABEL: "none" }],
    NOTES: ["n"],
  });
  expect("EXTRA" in out).toBe(false); // optional link: not invented
});

test("does not invent optional properties or overwrite provided values", () => {
  const out = applySchemaDefaults(schema, "INFO_DOM_MOTHER", { CITY: "Dakar", FORWARDING_ADDRESS: "rue 1" });
  expect(out).toEqual({ CITY: "Dakar", FORWARDING_ADDRESS: "rue 1", SAME_ADR: "" });
  expect("NOTE" in out).toBe(false);
});

test("toRealmInput: the form's undefined field ends up as the schema default", () => {
  const form = { ID: "x", TYPE: "NAISSANCE", MOTHER: { INFO_DOM: { SAME_ADR: "Oui", FORWARDING_ADDRESS: undefined } } };
  expect(toRealmInput(schema, "FORMS", form).MOTHER.INFO_DOM).toEqual({ SAME_ADR: "Oui", CITY: "", FORWARDING_ADDRESS: "" });
});
