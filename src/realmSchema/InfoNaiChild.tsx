import EVT_ADDRESS_NAI_CHILD from "./EvtAddressNaiChild";
import Realm from "realm";

export class INFO_NAI_CHILD extends Realm.Object {
  EVT_DATE?: string;
  EVT_HOUR?: string;
  EVT_ADDRESS?:EVT_ADDRESS_NAI_CHILD
  static schema = {
    name: "INFO_NAI_CHILD",
    properties: {
      EVT_DATE: {type: "string", default: ""},
      EVT_HOUR: {type: "string", default: ""},
      EVT_ADDRESS:"EVT_ADDRESS_NAI_CHILD"

    },
  };
}


export default INFO_NAI_CHILD;
