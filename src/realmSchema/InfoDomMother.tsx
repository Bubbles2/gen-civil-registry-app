import Realm from "realm";
export class INFO_DOM_MOTHER extends Realm.Object {
  CITY?: string;
  FORWARDING_ADDRESS?: string;
  SAME_ADR?: string;

  static schema = {
    name: "INFO_DOM_MOTHER",
    properties: {
      CITY: {type: "string", default: ""},
      FORWARDING_ADDRESS: {type: "string", default: ""},
      SAME_ADR: {type: "string", default: ""},
    },
  };
}

export default INFO_DOM_MOTHER;
