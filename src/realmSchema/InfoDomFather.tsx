import Realm from "realm";
export class INFO_DOM_FATHER extends Realm.Object {
  CITY?: string;
  FORWARDING_ADDRESS?: string

  static schema = {
    name: "INFO_DOM_FATHER",
    properties: {
      CITY: {type: "string", default: ""},
      FORWARDING_ADDRESS: {type: "string", default: ""}
    },
  };
}

export default INFO_DOM_FATHER;
