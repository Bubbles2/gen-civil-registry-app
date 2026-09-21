import Realm from "realm";
export class EVT_ADDRESS_DEC_MOTHER extends Realm.Object {
  CITY?: string;

  static schema = {
    name: "EVT_ADDRESS_DEC_MOTHER",
    properties: {
      CITY: {type: "string", default: ""},
    },
  };
}

export default EVT_ADDRESS_DEC_MOTHER;
