import Realm from "realm";
export class ACT extends Realm.Object {
  POINT_COLLECTE?: string;
  ACT_DECL_DATE?: string;
  ACT_DECL_HOUR?: string;

  static schema = {
    name: "ACT",
    properties: {
      POINT_COLLECTE: {type: "string", default: ""},
      DECL_NUMBER: {type: "string", default: ""},
      ACT_DECL_DATE: {type: "string", default: ""},
      ACT_DECL_HOUR: {type: "string", default: ""},
    },
  };
}

export default ACT;
