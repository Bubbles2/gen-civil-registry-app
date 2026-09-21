import Realm from "realm";
export class EVT_ADDRESS_NAI_CHILD extends Realm.Object {
  FORWARDING_ADDRESS?: string;

  static schema = {
    name: "EVT_ADDRESS_NAI_CHILD",
    properties: {
      FORWARDING_ADDRESS: {type: "string", default: ""},
    },
  };
}

export default EVT_ADDRESS_NAI_CHILD;
