import INFO_NAI_CHILD from "./InfoNaiChild";
import Realm from "realm";


export class CHILD extends Realm.Object {
  CHILD_ALIVE?: string;
  FIRSTNAME?: string;
  NAME?: string;
  SEXE?: string;
  INFO_NAI?: INFO_NAI_CHILD;

  static schema = {
    name: "CHILD",
    properties: {
      CHILD_ALIVE: {type: "string", default: ""},
      FIRSTNAME: {type: "string", default: ""},
      NAME: {type: "string", default: ""},
      SEXE: {type: "string", default: ""},
      INFO_NAI: "INFO_NAI_CHILD",
    },
  };
}


export default CHILD;
