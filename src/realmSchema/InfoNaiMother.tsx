import EVT_ADDRESS_NAI_MOTHER from "./EvtAddressNaiMother";
import Realm from "realm";

export class INFO_NAI_MOTHER extends Realm.Object {
  EVT_DATE?: string;
  EVT_ADDRESS?: EVT_ADDRESS_NAI_MOTHER;

  static schema = {
    name: "INFO_NAI_MOTHER",
    properties: {
      EVT_DATE: {type: "string", default: ""},
      EVT_ADDRESS: "EVT_ADDRESS_NAI_MOTHER",
    },
  };
}

export default INFO_NAI_MOTHER;
