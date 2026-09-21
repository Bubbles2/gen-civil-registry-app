import EVT_ADDRESS from "./EvtAddress";
import Realm from "realm";
export class INFO_NAI_DEFUNCT extends Realm.Object {
  EVT_DATE?: string;
  EVT_ADDRESS?: EVT_ADDRESS
  static schema = {
    name: "INFO_NAI_DEFUNCT",
    properties: {
      EVT_DATE: {type: "string", default: ""},
      EVT_ADDRESS: "EVT_ADDRESS",
    }
  };
}
export default INFO_NAI_DEFUNCT;


