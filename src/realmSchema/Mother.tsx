import INFO_DOM_MOTHER from "./InfoDomMother";
import INFO_NAI_MOTHER from "./InfoNaiMother";
import Realm from "realm";

export class MOTHER extends Realm.Object {
  DECEASED?: string;
  NNI_NATIONAL?:string;
  NATIONAL_ID?: string;
  NUM_IDENT?:string;
  FIRSTNAME?: string;
  NAME?: string;
  INFO_NAI?: INFO_NAI_MOTHER;
  OCCUPATION?: string;
  INFO_DOM?: INFO_DOM_MOTHER;
  TEL_PARENT?:string

  static schema = {
    name: "MOTHER",
    properties: {
      DECEASED: {type: "string", default: ""},
      NNI_NATIONAL: {type: "string", default: ""},
      NATIONAL_ID: {type: "string", default: ""},
      NUM_IDENT: {type: "string", default: ""},
      FIRSTNAME: {type: "string", default: ""},
      NAME: {type: "string", default: ""},
      INFO_NAI: "INFO_NAI_MOTHER",
      OCCUPATION: {type: "string", default: ""},
      INFO_DOM: "INFO_DOM_MOTHER",
    },
  };
}

export default MOTHER;
