import Realm from "realm";
export class EVT_ADDRESSA   extends Realm.Object {
  CITY?: string;

  static schema = {
    name: "EVT_ADDRESSA",
    properties: {
      CITY: {type: "string", default: ""},
    },
  };
}
export default EVT_ADDRESSA;
