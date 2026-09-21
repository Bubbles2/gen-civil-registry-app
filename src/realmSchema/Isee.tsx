import INFO_NAI_ISEE from "./InfoNaiIsee";
import Realm from "realm";

export class ISEE extends Realm.Object {
  LIEU_ACCOUCHEMENT?: string;
  ISEE_POIDS?: string;
  NAI_MULTIPLE?: string;
  NAI_MULTIPLE_BIRTH?: string;
  NRANG?:string;
  INFO_NAI?:INFO_NAI_ISEE;

  static schema = {
    name: "ISEE",
    properties: {
      LIEU_ACCOUCHEMENT: {type: "string", default: ""},
      ISEE_POIDS: {type: "string", default: ""},
      NAI_MULTIPLE: {type: "string", default: ""},
      NAI_MULTIPLE_BIRTH: {type: "string", default: ""},
      NRANG:{type: "string", default: ""},
      INFO_NAI:"INFO_NAI_ISEE"
    },
  };
}
export default ISEE;
