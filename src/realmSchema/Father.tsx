import INFO_DEC_FATHER from "./InfoDecFather";
import INFO_DOM_FATHER from "./InfoDomFather";
import INFO_NAI_FATHER from "./InfoNaiFather";
import Realm from "realm";


export class FATHER extends Realm.Object {
  DECEASED?: string;
  NNI_NATIONAL?:string;
  NATIONAL_ID?: string;
  NUM_IDENT?:string;
  FIRSTNAME?: string;
  NAME?: string;
  INFO_NAI?: INFO_NAI_FATHER;
  OCCUPATION?: string;
  TEL_PARENT?: string;
  INFO_DOM?: INFO_DOM_FATHER;
  INFO_DEC?: INFO_DEC_FATHER;

  static schema = {
    name: "FATHER",
    properties: {
      DECEASED: {type: "string", default: ""},
      NNI_NATIONAL: {type: "string", default: ""},
      NATIONAL_ID: {type: "string", default: ""},
      NUM_IDENT: {type: "string", default: ""},
      FIRSTNAME: {type: "string", default: ""},
      NAME: {type: "string", default: ""},
      INFO_NAI: "INFO_NAI_FATHER",
      OCCUPATION: {type: "string", default: ""},
      TEL_PARENT: {type: "string", default: ""},
      INFO_DOM: "INFO_DOM_FATHER",
      INFO_DEC: "INFO_DEC_FATHER",
    },
  };
}

export default FATHER;
