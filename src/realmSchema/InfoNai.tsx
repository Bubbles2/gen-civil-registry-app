import EVT_ADDRESSA  from "./InfoNaiAddress"
import Realm from "realm";
export class INFO_NAI extends Realm.Object {
  EVT_DATE?: string;
  EVT_ADDRESS?: EVT_ADDRESSA;
  static schema = {
    name: "INFO_NAI",
    properties: {
      EVT_DATE: {type: "string", default: ""},
      EVT_ADDRESS: "EVT_ADDRESSA",
    }
  };
}

export default INFO_NAI;
