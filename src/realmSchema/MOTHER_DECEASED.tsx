import Realm from "realm";
export class MOTHER_DECEASED extends Realm.Object {
  FIRSTNAME?: string;
  NAME?: string;

  static schema = {
    name: "MOTHER_DECEASED",
    properties: {
      FIRSTNAME: {type: "string", default: ""},
      NAME: {type: "string", default: ""},
    }
  };
}

export default MOTHER_DECEASED;
