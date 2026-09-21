import Realm from "realm";
export class INFO_DEC_DEFUNCT extends Realm.Object {
  EVT_DATE?: string;
  EVT_HOUR?: string;

  static schema = {
    name: "INFO_DEC_DEFUNCT",
    properties: {
      EVT_DATE: {type: "string", default: ""},
      EVT_HOUR: {type: "string", default: ""},
    },
  };
}

export default INFO_DEC_DEFUNCT;
