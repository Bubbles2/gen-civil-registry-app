/**
 * Phase 0 — pure tests for the wire-payload formatters in src/core/control/.
 *
 * `formatDataForBackBirth` / `formatDataForBackDeath` decide which fields
 * leave the device. A regression here writes records with fields quietly
 * missing, so these tests pin the *current* behaviour field by field. They
 * are a ratchet, not a spec: if a rule below looks wrong, change it in its
 * own commit with a matching test change, never as a drive-by.
 *
 * No Realm, SQLite or native module is touched.
 */
jest.mock("../src/core/Logger", () => ({
  __esModule: true,
  default: { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

import { formatDataForBackBirth as formatBirth } from "../src/core/control/birthFormValidate";
import { formatDataForBackDeath as formatDeath } from "../src/core/control/deathFormValidate";

// The formatters are typed against a partial `Data` shape; the tests
// deliberately drive them with the full form object, so keep them `any` here
// rather than adding to the tsc ratchet.
const formatDataForBackBirth = (data: any): any => formatBirth(data);
const formatDataForBackDeath = (data: any): any => formatDeath(data);

// ---------------------------------------------------------------------------
// Fixtures. Every nested object the formatters dereference is present, as the
// form always provides them; the values are the "keep everything" case unless
// a test overrides them.
// ---------------------------------------------------------------------------

const parent = (overrides: any = {}) => ({
  FIRSTNAME: "Fatou",
  NAME: "Sow",
  NNI_NATIONAL: "Oui",
  NATIONAL_ID: "1234567890123",
  NUM_IDENT: "PASS-1",
  DECEASED: "Non",
  TEL_PARENT: "770000000",
  INFO_DOM: { SAME_ADR: "Oui", CITY: "Dakar", FORWARDING_ADDRESS: "Rue 1" },
  INFO_DEC: {
    EVT_KNOWN_DATE: "Oui",
    EVT_DATE: "2020-01-01",
    EVT_ADDRESS: { CITY: "Thies", COUNTRY: "SN" },
  },
  ...overrides,
});

const birth = (overrides: any = {}) => {
  const base: any = {
    CHILD: {
      FIRSTNAME: "Awa",
      NAME: "Diop",
      CHILD_ALIVE: "Oui",
      INFO_NAI: { EVT_DATE: "2024-01-02", EVT_HOUR: "10:00", EVT_ADDRESS: { CITY: "Dakar" } },
    },
    ACT_NAI: {
      INDICATE_FATHER_y8n: "Oui",
      TYPE_OF_BIRTH: "Jumeaux",
      BIRTH_ADDRESS: { CITY: "Dakar", STRUCTURE: "Hopital" },
    },
    ISEE: {
      NAI_MULTIPLE: "Oui",
      NRANG: "1",
      LIEU_ACCOUCHEMENT: "Structure sanitaire",
      ISEE_POIDS: "3200",
    },
    FATHER: parent({ FIRSTNAME: "Moussa" }),
    MOTHER: parent(),
    DEFUNCT: { FIRSTNAME: "should", NAME: "go" },
  };
  return deepMerge(base, overrides);
};

const death = (overrides: any = {}) => {
  const base: any = {
    DEFUNCT: {
      FIRSTNAME: "Moussa",
      NAME: "Ndiaye",
      NNI_NATIONAL: "Oui",
      NATIONAL_ID: "1234567890123",
      NUM_IDENT: "PASS-1",
      INFO_DEC: { EVT_DATE: "2024-03-04", EVT_HOUR: "08:30" },
      DECES: { DEATH_DATA: { BODY_FOUND_DATE: "2024-03-05", CAUSE: "Naturelle" } },
    },
  };
  return deepMerge(base, overrides);
};

// Minimal recursive merge for fixture overrides; `undefined` deletes a key.
function deepMerge(target: any, source: any) {
  for (const [k, v] of Object.entries(source)) {
    if (v === undefined) {
      delete target[k];
    } else if (v && typeof v === "object" && !Array.isArray(v) && target[k] && typeof target[k] === "object") {
      deepMerge(target[k], v);
    } else {
      target[k] = v;
    }
  }
  return target;
}

// ---------------------------------------------------------------------------
// formatDataForBackBirth
// ---------------------------------------------------------------------------

describe("formatDataForBackBirth", () => {
  test("baseline case (living parents, NNI known, multiple birth in a health structure)", () => {
    const expected = birth();
    delete expected.DEFUNCT;
    delete expected.FATHER.NUM_IDENT; // NNI_NATIONAL=Oui
    delete expected.MOTHER.NUM_IDENT; // NNI_NATIONAL=Oui
    delete expected.FATHER.INFO_DEC.EVT_KNOWN_DATE; // FATHER.DECEASED=Non
    delete expected.FATHER.INFO_DEC.EVT_ADDRESS.CITY; // FATHER.DECEASED=Non

    const out = formatDataForBackBirth(birth());

    expect(out).toEqual(expected);
  });

  test("mutates and returns the same object (callers rely on this)", () => {
    const input = birth();
    expect(formatDataForBackBirth(input)).toBe(input);
  });

  test("NAI_MULTIPLE=Non drops ACT_NAI.TYPE_OF_BIRTH and ISEE.NRANG", () => {
    const out = formatDataForBackBirth(birth({ ISEE: { NAI_MULTIPLE: "Non" } }));
    expect(out.ACT_NAI).not.toHaveProperty("TYPE_OF_BIRTH");
    expect(out.ISEE).not.toHaveProperty("NRANG");
    expect(out.ISEE.LIEU_ACCOUCHEMENT).toBe("Structure sanitaire");
  });

  test("CHILD_ALIVE=Non drops CHILD.INFO_NAI, ISEE.LIEU_ACCOUCHEMENT and ACT_NAI.BIRTH_ADDRESS", () => {
    const out = formatDataForBackBirth(birth({ CHILD: { CHILD_ALIVE: "Non" } }));
    expect(out.CHILD).not.toHaveProperty("INFO_NAI");
    expect(out.ISEE).not.toHaveProperty("LIEU_ACCOUCHEMENT");
    expect(out.ACT_NAI).not.toHaveProperty("BIRTH_ADDRESS");
    expect(out.CHILD.FIRSTNAME).toBe("Awa");
  });

  test("birth outside a health structure drops ACT_NAI.BIRTH_ADDRESS only", () => {
    const out = formatDataForBackBirth(birth({ ISEE: { LIEU_ACCOUCHEMENT: "Domicile" } }));
    expect(out.ACT_NAI).not.toHaveProperty("BIRTH_ADDRESS");
    expect(out.CHILD.INFO_NAI).toBeDefined();
    expect(out.ISEE.LIEU_ACCOUCHEMENT).toBe("Domicile");
  });

  test("INDICATE_FATHER_y8n=Non drops FATHER entirely", () => {
    const out = formatDataForBackBirth(birth({ ACT_NAI: { INDICATE_FATHER_y8n: "Non" } }));
    expect(out).not.toHaveProperty("FATHER");
    expect(out.MOTHER).toBeDefined();
  });

  describe("FATHER (INDICATE_FATHER_y8n=Oui)", () => {
    test("NNI_NATIONAL=Oui keeps NATIONAL_ID, drops NUM_IDENT", () => {
      const out = formatDataForBackBirth(birth());
      expect(out.FATHER.NATIONAL_ID).toBe("1234567890123");
      expect(out.FATHER).not.toHaveProperty("NUM_IDENT");
    });

    test("NNI_NATIONAL=Non keeps NUM_IDENT, drops NATIONAL_ID", () => {
      const out = formatDataForBackBirth(birth({ FATHER: { NNI_NATIONAL: "Non" } }));
      expect(out.FATHER.NUM_IDENT).toBe("PASS-1");
      expect(out.FATHER).not.toHaveProperty("NATIONAL_ID");
    });

    test("DECEASED=Non drops INFO_DEC.EVT_KNOWN_DATE and INFO_DEC.EVT_ADDRESS.CITY, keeps domicile", () => {
      const out = formatDataForBackBirth(birth());
      expect(out.FATHER.INFO_DEC).not.toHaveProperty("EVT_KNOWN_DATE");
      expect(out.FATHER.INFO_DEC.EVT_ADDRESS).not.toHaveProperty("CITY");
      expect(out.FATHER.INFO_DEC.EVT_ADDRESS.COUNTRY).toBe("SN");
      expect(out.FATHER.INFO_DOM.CITY).toBe("Dakar");
      expect(out.FATHER.TEL_PARENT).toBe("770000000");
    });

    test("DECEASED=Oui drops INFO_DOM.CITY, INFO_DOM.FORWARDING_ADDRESS and TEL_PARENT", () => {
      const out = formatDataForBackBirth(birth({ FATHER: { DECEASED: "Oui" } }));
      expect(out.FATHER.INFO_DOM).not.toHaveProperty("CITY");
      expect(out.FATHER.INFO_DOM).not.toHaveProperty("FORWARDING_ADDRESS");
      expect(out.FATHER).not.toHaveProperty("TEL_PARENT");
      expect(out.FATHER.INFO_DEC.EVT_DATE).toBe("2020-01-01");
      expect(out.FATHER.INFO_DEC.EVT_ADDRESS.CITY).toBe("Thies");
    });

    test("DECEASED=Oui + EVT_KNOWN_DATE=Non also drops INFO_DEC.EVT_DATE", () => {
      const out = formatDataForBackBirth(
        birth({ FATHER: { DECEASED: "Oui", INFO_DEC: { EVT_KNOWN_DATE: "Non" } } }),
      );
      expect(out.FATHER.INFO_DEC).not.toHaveProperty("EVT_DATE");
      expect(out.FATHER.INFO_DEC.EVT_KNOWN_DATE).toBe("Non");
    });
  });

  describe("MOTHER", () => {
    test("NNI_NATIONAL=Oui keeps NATIONAL_ID, drops NUM_IDENT", () => {
      const out = formatDataForBackBirth(birth());
      expect(out.MOTHER.NATIONAL_ID).toBe("1234567890123");
      expect(out.MOTHER).not.toHaveProperty("NUM_IDENT");
    });

    test("NNI_NATIONAL=Non keeps NUM_IDENT, drops NATIONAL_ID", () => {
      const out = formatDataForBackBirth(birth({ MOTHER: { NNI_NATIONAL: "Non" } }));
      expect(out.MOTHER.NUM_IDENT).toBe("PASS-1");
      expect(out.MOTHER).not.toHaveProperty("NATIONAL_ID");
    });

    test("DECEASED=Oui drops SAME_ADR, CITY, FORWARDING_ADDRESS and TEL_PARENT", () => {
      const out = formatDataForBackBirth(birth({ MOTHER: { DECEASED: "Oui" } }));
      // INFO_DOM becomes empty and is then pruned by removeEmpty.
      expect(out.MOTHER).not.toHaveProperty("INFO_DOM");
      expect(out.MOTHER).not.toHaveProperty("TEL_PARENT");
      expect(out.MOTHER.INFO_DEC.EVT_DATE).toBe("2020-01-01");
    });

    test("DECEASED=Non with a deceased father drops only SAME_ADR", () => {
      const out = formatDataForBackBirth(birth({ FATHER: { DECEASED: "Oui" } }));
      expect(out.MOTHER.INFO_DOM).not.toHaveProperty("SAME_ADR");
      expect(out.MOTHER.INFO_DOM.CITY).toBe("Dakar");
      expect(out.MOTHER.INFO_DOM.FORWARDING_ADDRESS).toBe("Rue 1");
    });

    test("DECEASED=Non, living father, SAME_ADR=Non drops CITY and FORWARDING_ADDRESS", () => {
      const out = formatDataForBackBirth(birth({ MOTHER: { INFO_DOM: { SAME_ADR: "Non" } } }));
      expect(out.MOTHER.INFO_DOM).toEqual({ SAME_ADR: "Non" });
    });

    test("DECEASED=Non, living father, SAME_ADR=Oui keeps the domicile", () => {
      const out = formatDataForBackBirth(birth());
      expect(out.MOTHER.INFO_DOM).toEqual({ SAME_ADR: "Oui", CITY: "Dakar", FORWARDING_ADDRESS: "Rue 1" });
    });

    test("DECEASED=Non with no FATHER block keeps the domicile untouched", () => {
      const out = formatDataForBackBirth(
        birth({ ACT_NAI: { INDICATE_FATHER_y8n: "Non" }, MOTHER: { INFO_DOM: { SAME_ADR: "Non" } } }),
      );
      expect(out.MOTHER.INFO_DOM).toEqual({ SAME_ADR: "Non", CITY: "Dakar", FORWARDING_ADDRESS: "Rue 1" });
    });
  });

  test('ISEE_POIDS="0" is dropped, any other value is kept', () => {
    expect(formatDataForBackBirth(birth({ ISEE: { ISEE_POIDS: "0" } })).ISEE).not.toHaveProperty("ISEE_POIDS");
    expect(formatDataForBackBirth(birth({ ISEE: { ISEE_POIDS: "2500" } })).ISEE.ISEE_POIDS).toBe("2500");
  });

  test("removeEmpty prunes null, empty string and empty objects recursively; keeps 0/false", () => {
    const out = formatDataForBackBirth(
      birth({
        CHILD: { MIDDLENAME: "", NICKNAME: null, EXTRA: { DEEP: { EMPTY: "" } } },
        ACT_NAI: { COUNT: 0, FLAG: false },
      }),
    );
    expect(out.CHILD).not.toHaveProperty("MIDDLENAME");
    expect(out.CHILD).not.toHaveProperty("NICKNAME");
    expect(out.CHILD).not.toHaveProperty("EXTRA");
    expect(out.ACT_NAI.COUNT).toBe(0);
    expect(out.ACT_NAI.FLAG).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// formatDataForBackDeath
// ---------------------------------------------------------------------------

describe("formatDataForBackDeath", () => {
  test("keep-everything case: NNI_NATIONAL=Oui only drops NUM_IDENT", () => {
    const expected = death();
    delete expected.DEFUNCT.NUM_IDENT;

    const out = formatDataForBackDeath(death());

    expect(out).toEqual(expected);
  });

  test("mutates and returns the same object (callers rely on this)", () => {
    const input = death();
    expect(formatDataForBackDeath(input)).toBe(input);
  });

  test("NNI_NATIONAL=Non keeps NUM_IDENT, drops NATIONAL_ID", () => {
    const out = formatDataForBackDeath(death({ DEFUNCT: { NNI_NATIONAL: "Non" } }));
    expect(out.DEFUNCT.NUM_IDENT).toBe("PASS-1");
    expect(out.DEFUNCT).not.toHaveProperty("NATIONAL_ID");
  });

  // Pinned as-is: the code compares INFO_DEC.EVT_DATE (a date) against
  // "Oui"/"Non", so with a real date neither branch fires. Do not "fix" this
  // here — see rule 5 of the upgrade plan.
  test("a real INFO_DEC.EVT_DATE keeps both EVT_DATE and BODY_FOUND_DATE", () => {
    const out = formatDataForBackDeath(death());
    expect(out.DEFUNCT.INFO_DEC.EVT_DATE).toBe("2024-03-04");
    expect(out.DEFUNCT.DECES.DEATH_DATA.BODY_FOUND_DATE).toBe("2024-03-05");
  });

  test('INFO_DEC.EVT_DATE="Oui" drops DECES.DEATH_DATA.BODY_FOUND_DATE', () => {
    const out = formatDataForBackDeath(death({ DEFUNCT: { INFO_DEC: { EVT_DATE: "Oui" } } }));
    expect(out.DEFUNCT.DECES.DEATH_DATA).not.toHaveProperty("BODY_FOUND_DATE");
    expect(out.DEFUNCT.INFO_DEC.EVT_DATE).toBe("Oui");
  });

  test('INFO_DEC.EVT_DATE="Non" drops INFO_DEC.EVT_DATE', () => {
    const out = formatDataForBackDeath(death({ DEFUNCT: { INFO_DEC: { EVT_DATE: "Non" } } }));
    expect(out.DEFUNCT.INFO_DEC).not.toHaveProperty("EVT_DATE");
    expect(out.DEFUNCT.DECES.DEATH_DATA.BODY_FOUND_DATE).toBe("2024-03-05");
  });

  test("removeEmpty prunes null, empty string and empty objects recursively", () => {
    const out = formatDataForBackDeath(
      death({ DEFUNCT: { MIDDLENAME: "", NICKNAME: null, EXTRA: { DEEP: {} } } }),
    );
    expect(out.DEFUNCT).not.toHaveProperty("MIDDLENAME");
    expect(out.DEFUNCT).not.toHaveProperty("NICKNAME");
    expect(out.DEFUNCT).not.toHaveProperty("EXTRA");
  });
});
