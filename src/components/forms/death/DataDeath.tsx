import moment from "moment";

const getDataDeath = () => {
  return {
    COLPOINT_CODE:"",
    TYPE: "",
    STATUS: "",
    DEFUNCT: {
      FIRSTNAME: "",
      NAME: "",
      NNI_NATIONAL: "Oui",
      NATIONAL_ID: "",
      NUM_IDENT: "",
      SEXE: "",
      ACT: {
        ACT_DECL_DATE: "",
        ACT_DECL_HOUR: "",
      },
      INFO_NAI: {
        EVT_DATE: "",
        EVT_ADDRESS: {
          CITY: "",
        },
      },
      INFO_DEC: {
        EVT_DATE: "",
        EVT_HOUR: "",
      }
    },
    DECL: {
      DECL_TEL:  "",
      DECL_FIRSTNAME: "",
      DECL_NAME:  "",
    },
    DECES:{
      DEATH_DATA: {
        KNOWN_DEATH_DATE: "Oui",
        BODY_FOUND_DATE: "",
      },
    },
    FATHER_DECEASED: {
      FIRSTNAME: "",
      NAME: "",
    },
    MOTHER_DECEASED: {
      FIRSTNAME: "",
      NAME: "",
    },
    ACT: {
      ACT_DECL_DATE: moment().format("DD/MM/YYYY"),
      ACT_DECL_HOUR: moment().format("HH:mm"),
      DECL_NUMBER:"",
      POINT_COLLECTE:"",
    },
  };
};

export default getDataDeath;
