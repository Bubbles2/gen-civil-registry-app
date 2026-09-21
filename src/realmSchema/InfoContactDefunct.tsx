import Realm from "realm";
export class INFO_CONTACT_DEFUNCT extends Realm.Object {
  TELEPHONE?: string;
  NAMES?: string;
  RELATIONSHIP?: string;

  static schema = {
    name: "INFO_CONTACT_DEFUNCT",
    properties: {
      TELEPHONE: {type: "string", default: ""},
      NAMES: {type: "string", default: ""},
      RELATIONSHIP: {type: "string", default: ""},
    }
  };
}

export default INFO_CONTACT_DEFUNCT;


