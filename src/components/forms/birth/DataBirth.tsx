import moment from "moment";

const getDataBirth = () =>{
  return  {
    COLPOINT_CODE:"",
    TYPE: "",
    STATUS: "",
    ACT_NAI: {
      DECL_NAISS: "",
      BIRTH_ADDRESS: "",
      INDICATE_FATHER_y8n: "Oui",  
      TYPE_OF_BIRTH:"",
      ACCOUCHEMENT_DATE:moment().format("DD/MM/YYYY"),
      ACCOUCHEMENT_HOUR:moment().format("HH:mm")
    },
    CHILD: {
      CHILD_ALIVE: "Oui",
      FIRSTNAME: "",
      NAME: "",
      SEXE: "",
      INFO_NAI: {
        EVT_DATE: "",
        EVT_HOUR: "",
        EVT_ADDRESS:{
          FORWARDING_ADDRESS:""
        }
      },
    },
    ISEE: {
      LIEU_ACCOUCHEMENT: "",
      ISEE_POIDS: 1000,
      NAI_MULTIPLE:"",
      NRANG:1
    },
    ACT: {
      POINT_COLLECTE: "",
      ACT_DECL_DATE:moment().format("DD/MM/YYYY"),
      ACT_DECL_HOUR:moment().format("HH:mm"),
    },
    FATHER: {
      DECEASED:"Non",
      NNI_NATIONAL:"Non",
      NATIONAL_ID: "",
      NUM_IDENT:"",
      FIRSTNAME: "",
      NAME: "",
      INFO_NAI: {
        EVT_DATE: "",
        EVT_ADDRESS: {
          CITY: "",
        },
      },
      OCCUPATION: "",
      TEL_PARENT: "",
      INFO_DOM: {
        CITY: "",
        FORWARDING_ADDRESS:""
      },
      INFO_DEC: {
        EVT_DATE: "",
        EVT_ADDRESS: {
          CITY: "",
        },
        EVT_KNOWN_DATE:"Oui"
      },
    },
    MOTHER: {
      DECEASED: "",
      NNI_NATIONAL:"Non",
      NATIONAL_ID: "",
      NUM_IDENT:"",
      FIRSTNAME: "",
      NAME: "",
      INFO_NAI: {
        EVT_DATE: "",
        EVT_ADDRESS: {
          CITY: "",
        },
      },
      OCCUPATION: "",
      INFO_DOM: {
        CITY: "",
        FORWARDING_ADDRESS: "",
        SAME_ADR: "",
      },
      TEL_PARENT:""
    },
  };
  
}

export default getDataBirth;
