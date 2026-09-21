import INFO_DEC_DEFUNCT from "./InfoDecDefunct";
import DECL from "./Declarant";
import FATHER_DECEASED from "./FATHER_DECEASED";
import MOTHER_DECEASED from "./MOTHER_DECEASED";
import ACT from "./Act";
import DECES from "./Deces";
import INFO_NAI from "./InfoNai";
import Realm from "realm";



export class DEFUNCT extends Realm.Object {
  FIRSTNAME?: string;
  NAME?: string;
  INFO_DEC?: INFO_DEC_DEFUNCT;
  ACT?: ACT;
  NNI_NATIONAL?: string;
  NATIONAL_NO_ID?: string;
  NUM_IDENT?: string;
  SEXE?: string;
  INFO_NAI?: INFO_NAI;

  static schema = {
    name: "DEFUNCT",
    properties: {
      FIRSTNAME: {type: "string", default: ""},
      NAME: {type: "string", default: ""},
      ACT: "ACT",
      INFO_DEC: "INFO_DEC_DEFUNCT",
      NNI_NATIONAL: {type: "string", default: ""},
      NATIONAL_ID: {type: "string", default: ""},
      NUM_IDENT: {type: "string", default: ""},
      SEXE: {type: "string", default: ""},
      INFO_NAI: "INFO_NAI",
    },
  };
}

export default DEFUNCT;
