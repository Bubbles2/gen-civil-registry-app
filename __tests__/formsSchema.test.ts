/**
 * Phase 13 — formsSchema.ts is now the schema, not a copy of one.
 *
 * Up to Phase 12 this file was generated from src/realmSchema/ and the test
 * compared the two. Realm is gone, so there is nothing left to drift from and
 * the generator went with it. What still matters is that nobody quietly edits
 * the property order: `SendDeclarationService` flattens a declaration onto the
 * wire with `Object.keys`, so this order *is* the payload's field order, and
 * the national registry has been receiving it since Phase 0.
 */
import { FORMS_SCHEMA } from "../src/core/db/formsSchema";

const byName = (name: string) => (FORMS_SCHEMA as any[]).find(o => o.name === name);

describe("formsSchema", () => {
  it("keeps FORMS' property order — this is the wire payload's field order", () => {
    expect(Object.keys(byName("FORMS").properties)).toEqual([
      "ID", "ACT_NAI", "CHILD", "ISEE", "ACT", "FATHER", "MOTHER",
      "MOTHER_DECEASED", "FATHER_DECEASED", "DEFUNCT", "DECL", "DECES",
      "TYPE", "STATUS", "COLPOINT_CODE", "ERROR",
    ]);
  });

  it("still describes all 28 object types Realm held", () => {
    expect((FORMS_SCHEMA as any[]).length).toBe(28);
  });

  it("resolves every linked object type", () => {
    const names = new Set((FORMS_SCHEMA as any[]).map(o => o.name));
    const unresolved: string[] = [];
    for (const object of FORMS_SCHEMA as any[]) {
      for (const [property, spec] of Object.entries<any>(object.properties)) {
        const type = typeof spec === "string" ? spec : spec.objectType ?? spec.type;
        if (!["string", "objectId"].includes(type) && !names.has(type)) {
          unresolved.push(`${object.name}.${property} -> ${type}`);
        }
      }
    }
    expect(unresolved).toEqual([]);
  });

  it("keeps the empty-string defaults that made absent fields '' rather than missing", () => {
    expect(byName("CHILD").properties.FIRSTNAME).toEqual({ type: "string", default: "" });
    expect(byName("FORMS").properties.ERROR).toEqual({ type: "string", default: "" });
    // TYPE/STATUS/COLPOINT_CODE never had a default: the form always supplies them.
    expect(byName("FORMS").properties.TYPE).toBe("string");
  });

  it("keeps the nested shape the forms write into", () => {
    expect(byName("CHILD").properties.INFO_NAI).toBe("INFO_NAI_CHILD");
    expect(byName("INFO_NAI_CHILD").properties.EVT_ADDRESS).toBe("EVT_ADDRESS_NAI_CHILD");
    expect(byName("DEFUNCT").properties.INFO_DEC).toBe("INFO_DEC_DEFUNCT");
  });
});
