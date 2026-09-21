import Realm from "realm";
export class ACT_NAI extends Realm.Object {
  DECL_NAISS?: string;
  INDICATE_FATHER_y8n?: string;
  TYPE_OF_BIRTH?: string;
  BIRTH_ADDRESS?: string;
  ACCOUCHEMENT_DATE?:string;
  ACCOUCHEMENT_HOUR?:string;


  static schema = {
    name: "ACT_NAI",
    properties: {
      DECL_NAISS: {type: "string", default: ""},
      INDICATE_FATHER_y8n: {type: "string", default: ""},
      TYPE_OF_BIRTH: {type: "string", default: ""},
      BIRTH_ADDRESS: {type: "string", default: ""},
      ACCOUCHEMENT_DATE: {type: "string", default: ""},
      ACCOUCHEMENT_HOUR: {type: "string", default: ""}
    },
  };
}

export default ACT_NAI;
