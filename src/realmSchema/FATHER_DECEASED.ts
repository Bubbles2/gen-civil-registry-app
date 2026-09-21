import Realm from "realm";
export class FATHER_DECEASED extends Realm.Object {
  FIRSTNAME?: string;
  NAME?: string;

  static schema = {
    name: "FATHER_DECEASED",
    properties: {
      FIRSTNAME: {type: "string", default: ""},
      NAME: {type: "string", default: ""},
    }
  };
}

export default FATHER_DECEASED;
