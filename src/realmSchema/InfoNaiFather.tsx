import  EVT_ADDRESS_NAI_FATHER from "./EvtAddressNaiFather";
import Realm from "realm";

export class INFO_NAI_FATHER extends Realm.Object {
  EVT_DATE?: string;
  EVT_ADDRESS?: EVT_ADDRESS_NAI_FATHER;

  static schema = {
    name: "INFO_NAI_FATHER",
    properties: {
      EVT_DATE: {type: "string", default: ""},
      EVT_ADDRESS: "EVT_ADDRESS_NAI_FATHER",
    },
  };
}

export default INFO_NAI_FATHER;
