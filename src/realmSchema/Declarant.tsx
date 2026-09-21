import Realm from "realm";
export class DECL extends Realm.Object {
  DECL_TEL?: string;
  DECL_FIRSTNAME?: string;
  DECL_NAME?: string;

  static schema = {
    name: "DECL",
    properties: {
      DECL_TEL: {type: "string", default: ""},
      DECL_FIRSTNAME: {type: "string", default: ""},
      DECL_NAME: {type: "string", default: ""}, // Used for relationship
    }
  };
}

export default DECL;
