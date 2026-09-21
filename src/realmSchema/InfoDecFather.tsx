import EVT_ADDRESS_DEC_FATHER from "./EvtAddressDecFather";
import Realm from "realm";

export class INFO_DEC_FATHER extends Realm.Object {
  EVT_DATE?: string;
  EVT_ADDRESS?: EVT_ADDRESS_DEC_FATHER;
  EVT_KNOWN_DATE?:string;

  static schema = {
    name: "INFO_DEC_FATHER",
    properties: {
      EVT_DATE: {type: "string", default: ""},
      EVT_ADDRESS: "EVT_ADDRESS_DEC_FATHER",
      EVT_KNOWN_DATE: {type: "string", default: ""},
    },
  };
}

export default INFO_DEC_FATHER;
