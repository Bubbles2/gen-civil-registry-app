import Realm from "realm";
export class INFO_NAI_ISEE extends Realm.Object {
  EVT_DATE?: string;
  EVT_HOUR?: string;
 
  static schema = {
    name: "INFO_NAI_ISEE",
    properties: {
      EVT_DATE: {type: "string", default: ""},
      EVT_HOUR: {type: "string", default: ""},
    },
  };
}


export default INFO_NAI_ISEE;
