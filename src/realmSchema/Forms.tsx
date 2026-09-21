import {createRealmContext} from "@realm/react";
import Realm from "realm";
import ACT from "./Act";
import ACT_NAI from "./ActNai";
import CHILD from "./Child";
import DEFUNCT from "./Defunct";
import EVT_ADDRESS_NAI_CHILD from "./EvtAddressNaiChild";
import EVT_ADDRESS_DEC_FATHER from "./EvtAddressDecFather";
import EVT_ADDRESS_DEC_MOTHER from "./EvtAddressDecMother";
import EVT_ADDRESS_NAI_FATHER from "./EvtAddressNaiFather";
import EVT_ADDRESS_NAI_MOTHER from "./EvtAddressNaiMother";
import FATHER from "./Father";
import INFO_DEC_DEFUNCT from "./InfoDecDefunct";
import INFO_DEC_FATHER from "./InfoDecFather";
import INFO_DOM_FATHER from "./InfoDomFather";
import INFO_DOM_MOTHER from "./InfoDomMother";
import INFO_NAI_CHILD from "./InfoNaiChild";
import INFO_NAI_FATHER from "./InfoNaiFather";
import INFO_NAI_MOTHER from "./InfoNaiMother";
import ISEE from "./Isee";
import MOTHER from "./Mother";
import INFO_NAI_ISEE from "./InfoNaiIsee";
import INFO_NAI_DEFUNCT from "./InfoNaiDefunct";
import DECL from "./Declarant";
import FATHER_DECEASED from "./FATHER_DECEASED";
import EVT_ADDRESSA from "./InfoNaiAddress";
import MOTHER_DECEASED from "./MOTHER_DECEASED";
import DECES from "./Deces";
import  DEATH_DATA  from "./DeathData";
import INFO_NAI from "./InfoNai";

export class FORMS extends Realm.Object {
  ID!: Realm.BSON.ObjectId;
  ACT_NAI?: ACT_NAI;
  CHILD?: CHILD;
  ISEE?: ISEE;
  ACT?: ACT;
  FATHER?: FATHER;
  MOTHER?: MOTHER;
  DEFUNCT?: DEFUNCT;
  DECL?:DECL;
  DECES?:DECES;
  TYPE?: string;
  STATUS?: string;
  ERROR?: string;
  MOTHER_DECEASE?: MOTHER_DECEASED;
  FATHER_DECEASE?:FATHER_DECEASED;



  static schema = {
    name: "FORMS",
    properties: {
      ID: {type: "objectId", default: () => new Realm.BSON.ObjectId()},
      ACT_NAI: "ACT_NAI",
      CHILD: "CHILD",
      ISEE: "ISEE",
      ACT: "ACT",
      FATHER: "FATHER",
      MOTHER: "MOTHER",
      MOTHER_DECEASED: "MOTHER_DECEASED",
      FATHER_DECEASED: "FATHER_DECEASED",
      DEFUNCT: "DEFUNCT",
      DECL:"DECL",
      DECES:"DECES",
      TYPE: "string",
      STATUS: "string",
      COLPOINT_CODE:"string",

      ERROR: {type: "string", default: () => ""},
    },
    primaryKey: "ID",
  };
}

export const config = {
  schema: [
    INFO_DEC_FATHER,
    ACT,
    ACT_NAI,
    CHILD,
    EVT_ADDRESS_DEC_FATHER,
    EVT_ADDRESS_DEC_MOTHER,
    EVT_ADDRESS_NAI_FATHER,
    EVT_ADDRESS_NAI_MOTHER,
    EVT_ADDRESS_NAI_CHILD,
    FATHER,
    INFO_DOM_FATHER,
    INFO_DOM_MOTHER,
    INFO_NAI_CHILD,
    INFO_NAI_FATHER,
    INFO_NAI_MOTHER,
    INFO_NAI_ISEE,
    INFO_NAI,
    EVT_ADDRESSA,
    ISEE,
    MOTHER,
    DEFUNCT,
    INFO_DEC_DEFUNCT,
    DECL,
    FATHER_DECEASED,
    MOTHER_DECEASED,
    DECES,
    FORMS,
    DEATH_DATA
  ],
  schemaVersion:1
};
export default createRealmContext(config);
