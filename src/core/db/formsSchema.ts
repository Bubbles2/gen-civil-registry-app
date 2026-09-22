/**
 * The declaration object graph, transcribed from src/realmSchema/ by
 * scripts/generate-forms-schema.js. Do not edit by hand.
 *
 * The SQLite store needs the property names, their order and their defaults so
 * a declaration read back out of the database serialises exactly as the Realm
 * object did — but it must not import `realm` to get them. `__tests__/formsSchema.test.ts`
 * re-derives this from the same sources and fails if the two have drifted.
 */

import type { Schema } from "../services/realmInput";

export const FORMS_SCHEMA = [
  {
    "name": "INFO_DEC_FATHER",
    "properties": {
      "EVT_DATE": {
        "type": "string",
        "default": ""
      },
      "EVT_ADDRESS": "EVT_ADDRESS_DEC_FATHER",
      "EVT_KNOWN_DATE": {
        "type": "string",
        "default": ""
      }
    }
  },
  {
    "name": "ACT",
    "properties": {
      "POINT_COLLECTE": {
        "type": "string",
        "default": ""
      },
      "DECL_NUMBER": {
        "type": "string",
        "default": ""
      },
      "ACT_DECL_DATE": {
        "type": "string",
        "default": ""
      },
      "ACT_DECL_HOUR": {
        "type": "string",
        "default": ""
      }
    }
  },
  {
    "name": "ACT_NAI",
    "properties": {
      "DECL_NAISS": {
        "type": "string",
        "default": ""
      },
      "INDICATE_FATHER_y8n": {
        "type": "string",
        "default": ""
      },
      "TYPE_OF_BIRTH": {
        "type": "string",
        "default": ""
      },
      "BIRTH_ADDRESS": {
        "type": "string",
        "default": ""
      },
      "ACCOUCHEMENT_DATE": {
        "type": "string",
        "default": ""
      },
      "ACCOUCHEMENT_HOUR": {
        "type": "string",
        "default": ""
      }
    }
  },
  {
    "name": "CHILD",
    "properties": {
      "CHILD_ALIVE": {
        "type": "string",
        "default": ""
      },
      "FIRSTNAME": {
        "type": "string",
        "default": ""
      },
      "NAME": {
        "type": "string",
        "default": ""
      },
      "SEXE": {
        "type": "string",
        "default": ""
      },
      "INFO_NAI": "INFO_NAI_CHILD"
    }
  },
  {
    "name": "EVT_ADDRESS_DEC_FATHER",
    "properties": {
      "CITY": {
        "type": "string",
        "default": ""
      }
    }
  },
  {
    "name": "EVT_ADDRESS_DEC_MOTHER",
    "properties": {
      "CITY": {
        "type": "string",
        "default": ""
      }
    }
  },
  {
    "name": "EVT_ADDRESS_NAI_FATHER",
    "properties": {
      "CITY": {
        "type": "string",
        "default": ""
      }
    }
  },
  {
    "name": "EVT_ADDRESS_NAI_MOTHER",
    "properties": {
      "CITY": {
        "type": "string",
        "default": ""
      }
    }
  },
  {
    "name": "EVT_ADDRESS_NAI_CHILD",
    "properties": {
      "FORWARDING_ADDRESS": {
        "type": "string",
        "default": ""
      }
    }
  },
  {
    "name": "FATHER",
    "properties": {
      "DECEASED": {
        "type": "string",
        "default": ""
      },
      "NNI_NATIONAL": {
        "type": "string",
        "default": ""
      },
      "NATIONAL_ID": {
        "type": "string",
        "default": ""
      },
      "NUM_IDENT": {
        "type": "string",
        "default": ""
      },
      "FIRSTNAME": {
        "type": "string",
        "default": ""
      },
      "NAME": {
        "type": "string",
        "default": ""
      },
      "INFO_NAI": "INFO_NAI_FATHER",
      "OCCUPATION": {
        "type": "string",
        "default": ""
      },
      "TEL_PARENT": {
        "type": "string",
        "default": ""
      },
      "INFO_DOM": "INFO_DOM_FATHER",
      "INFO_DEC": "INFO_DEC_FATHER"
    }
  },
  {
    "name": "INFO_DOM_FATHER",
    "properties": {
      "CITY": {
        "type": "string",
        "default": ""
      },
      "FORWARDING_ADDRESS": {
        "type": "string",
        "default": ""
      }
    }
  },
  {
    "name": "INFO_DOM_MOTHER",
    "properties": {
      "CITY": {
        "type": "string",
        "default": ""
      },
      "FORWARDING_ADDRESS": {
        "type": "string",
        "default": ""
      },
      "SAME_ADR": {
        "type": "string",
        "default": ""
      }
    }
  },
  {
    "name": "INFO_NAI_CHILD",
    "properties": {
      "EVT_DATE": {
        "type": "string",
        "default": ""
      },
      "EVT_HOUR": {
        "type": "string",
        "default": ""
      },
      "EVT_ADDRESS": "EVT_ADDRESS_NAI_CHILD"
    }
  },
  {
    "name": "INFO_NAI_FATHER",
    "properties": {
      "EVT_DATE": {
        "type": "string",
        "default": ""
      },
      "EVT_ADDRESS": "EVT_ADDRESS_NAI_FATHER"
    }
  },
  {
    "name": "INFO_NAI_MOTHER",
    "properties": {
      "EVT_DATE": {
        "type": "string",
        "default": ""
      },
      "EVT_ADDRESS": "EVT_ADDRESS_NAI_MOTHER"
    }
  },
  {
    "name": "INFO_NAI_ISEE",
    "properties": {
      "EVT_DATE": {
        "type": "string",
        "default": ""
      },
      "EVT_HOUR": {
        "type": "string",
        "default": ""
      }
    }
  },
  {
    "name": "INFO_NAI",
    "properties": {
      "EVT_DATE": {
        "type": "string",
        "default": ""
      },
      "EVT_ADDRESS": "EVT_ADDRESSA"
    }
  },
  {
    "name": "EVT_ADDRESSA",
    "properties": {
      "CITY": {
        "type": "string",
        "default": ""
      }
    }
  },
  {
    "name": "ISEE",
    "properties": {
      "LIEU_ACCOUCHEMENT": {
        "type": "string",
        "default": ""
      },
      "ISEE_POIDS": {
        "type": "string",
        "default": ""
      },
      "NAI_MULTIPLE": {
        "type": "string",
        "default": ""
      },
      "NAI_MULTIPLE_BIRTH": {
        "type": "string",
        "default": ""
      },
      "NRANG": {
        "type": "string",
        "default": ""
      },
      "INFO_NAI": "INFO_NAI_ISEE"
    }
  },
  {
    "name": "MOTHER",
    "properties": {
      "DECEASED": {
        "type": "string",
        "default": ""
      },
      "NNI_NATIONAL": {
        "type": "string",
        "default": ""
      },
      "NATIONAL_ID": {
        "type": "string",
        "default": ""
      },
      "NUM_IDENT": {
        "type": "string",
        "default": ""
      },
      "FIRSTNAME": {
        "type": "string",
        "default": ""
      },
      "NAME": {
        "type": "string",
        "default": ""
      },
      "INFO_NAI": "INFO_NAI_MOTHER",
      "OCCUPATION": {
        "type": "string",
        "default": ""
      },
      "INFO_DOM": "INFO_DOM_MOTHER"
    }
  },
  {
    "name": "DEFUNCT",
    "properties": {
      "FIRSTNAME": {
        "type": "string",
        "default": ""
      },
      "NAME": {
        "type": "string",
        "default": ""
      },
      "ACT": "ACT",
      "INFO_DEC": "INFO_DEC_DEFUNCT",
      "NNI_NATIONAL": {
        "type": "string",
        "default": ""
      },
      "NATIONAL_ID": {
        "type": "string",
        "default": ""
      },
      "NUM_IDENT": {
        "type": "string",
        "default": ""
      },
      "SEXE": {
        "type": "string",
        "default": ""
      },
      "INFO_NAI": "INFO_NAI"
    }
  },
  {
    "name": "INFO_DEC_DEFUNCT",
    "properties": {
      "EVT_DATE": {
        "type": "string",
        "default": ""
      },
      "EVT_HOUR": {
        "type": "string",
        "default": ""
      }
    }
  },
  {
    "name": "DECL",
    "properties": {
      "DECL_TEL": {
        "type": "string",
        "default": ""
      },
      "DECL_FIRSTNAME": {
        "type": "string",
        "default": ""
      },
      "DECL_NAME": {
        "type": "string",
        "default": ""
      }
    }
  },
  {
    "name": "FATHER_DECEASED",
    "properties": {
      "FIRSTNAME": {
        "type": "string",
        "default": ""
      },
      "NAME": {
        "type": "string",
        "default": ""
      }
    }
  },
  {
    "name": "MOTHER_DECEASED",
    "properties": {
      "FIRSTNAME": {
        "type": "string",
        "default": ""
      },
      "NAME": {
        "type": "string",
        "default": ""
      }
    }
  },
  {
    "name": "DECES",
    "properties": {
      "DEATH_DATA": "DEATH_DATA"
    }
  },
  {
    "name": "FORMS",
    "properties": {
      "ID": {
        "type": "objectId"
      },
      "ACT_NAI": "ACT_NAI",
      "CHILD": "CHILD",
      "ISEE": "ISEE",
      "ACT": "ACT",
      "FATHER": "FATHER",
      "MOTHER": "MOTHER",
      "MOTHER_DECEASED": "MOTHER_DECEASED",
      "FATHER_DECEASED": "FATHER_DECEASED",
      "DEFUNCT": "DEFUNCT",
      "DECL": "DECL",
      "DECES": "DECES",
      "TYPE": "string",
      "STATUS": "string",
      "COLPOINT_CODE": "string",
      "ERROR": {
        "type": "string",
        "default": ""
      }
    }
  },
  {
    "name": "DEATH_DATA",
    "properties": {
      "KNOWN_DEATH_DATE": {
        "type": "string",
        "default": ""
      },
      "BODY_FOUND_DATE": {
        "type": "string",
        "default": ""
      }
    }
  }
] as unknown as Schema;

export default FORMS_SCHEMA;
