import Realm from "realm";
export class EVT_ADDRESS extends Realm.Object {
  CITY?: string;

  static schema = {
    name: "EVT_ADDRESS_DEC_FATHER",
    properties: {
      CITY: {type: "string", default: ""},
    },
  };
}

export default EVT_ADDRESS;
