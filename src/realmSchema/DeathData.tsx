import Realm from "realm";
export class DEATH_DATA extends Realm.Object {
  KNOWN_DEATH_DATE?: string;
  BODY_FOUND_DATE?: string;

  static schema = {
    name: "DEATH_DATA",
    properties: {
      KNOWN_DEATH_DATE: {type: "string", default: ""},
      BODY_FOUND_DATE: {type: "string", default: ""},
    }
  };
}

export default DEATH_DATA;
