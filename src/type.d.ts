interface INFO_NAI {
    EVT_DATE?: string;
    EVT_ADDRESS?: EVT_ADDRESS;
}
interface EVT_ADDRESS {
    CITY?: string;
}
interface DECES {
    DEATH_DATA?: DEATH_DATA;
}
interface DEATH_DATA {
    KNOWN_DEATH_DATE?: string;
    BODY_FOUND_DATE?: string;
}
interface IACT {
    ACT_DECL_DATE: string;
    ACT_DECL_HOUR: string;
    POINT_COLLECTE: string;
}
interface IACT_NAI {
    ACT_DECL_DATE: string;
    ACT_DECL_HOUR: string;
    POINT_COLLECTE: string;
}

interface ICHILD {
    CHILD_ALIVE?: string;
    FIRSTNAME?: string;
    NAME?: string;
    SEXE?: string;
    INFO_NAI?: INFO_NAI_CHILD;
}
interface INFO_DEC_DEFUNCT {
    EVT_DATE?: string;
    EVT_HOUR?: string;
}
interface IADDRESS {
    CITY?: string;

}
interface INFO_NAI_DEFUNCT {
    EVT_DATE?: string;
    EVT_ADDRESS?: IADDRESS;
}
interface INFO_CONTACT_DEFUNCT {
    TELEPHONE?: string;
    NAMES?: string;
    RELATIONSHIP?: string;
}
interface IDEFUNCT {
    FIRSTNAME?: string;
    NAME?: string;
    INFO_DEC?: INFO_DEC_DEFUNCT;
    INFO_CONTACT?: INFO_CONTACT_DEFUNCT;
}
interface INFO_NAI_FATHER {
    EVT_DATE?: string;
    EVT_ADDRESS?: EVT_ADDRESS_NAI_FATHER;
}
interface INFO_DOM_FATHER {
    CITY?: string;
}
interface INFO_DEC_FATHER {
    EVT_DATE?: string;
    EVT_ADDRESS?: EVT_ADDRESS_DEC_FATHER;
}

interface IFATHER {  DECEASED?: string;
    NATIONAL_ID?: string;
    FIRSTNAME?: string;
    NAME?: string;
    INFO_NAI?: INFO_NAI_FATHER;
    NATIONALITY?: string;
    OCCUPATION?: string;
    TEL_PARENT?: string;
    INFO_DOM?: INFO_DOM_FATHER;
    INFO_DEC?: INFO_DEC_FATHER;
}

interface IISEE {
    LIEU_ACCOUCHEMENT?: string;
    ISEE_POIDS?: string;
}
interface IMOTHER {
    DECEASED?: string;
    NATIONAL_ID?: string;
    FIRSTNAME?: string;
    NAME?: string;
    INFO_NAI?: INFO_NAI_MOTHER;
    NATIONALITY?: string;
    OCCUPATION?: string;
    TEL_PARENT?: string;
    INFO_DOM?: INFO_DOM_MOTHER;
}
interface INFO_NAI_MOTHER {
    EVT_DATE?: string;
    EVT_ADDRESS?: EVT_ADDRESS_NAI_MOTHER;
}
interface INFO_DOM_MOTHER {
    CITY?: string;
    FORWARDING_ADDRESS?: string;
    SAME_ADR?: string;
}
interface IFORM_DECES {
    ACT: IACT;
    ACT_NAI?:string;
    CHILD?: string;
    DEFUNCT?: IDEFUNCT;
    ERROR?: string;
    FATHER?: string;
    ID?: string;
    ISEE?: string;
    MOTHER?: string;
    STATUS: string;
    TYPE: string;
}
interface IFORM {
    ACT: IACT;
    ACT_NAI:IACT_NAI;
    CHILD?: ICHILD;
    DEFUNCT?: IDEFUNCT;
    ERROR?: string;
    FATHER?: IFATHER;
    ID?: string;
    ISEE?: IISEE;
    MOTHER?: null;
    STATUS: string;
    TYPE: string;
}




interface IAct {
    _id?: string,
    name: string,
}
type FormState = {
    forms: IForm[];
};

type ListState = {
    officeList: IForm[];
    annexOfficeList: IForm[]
    list: IForm[]
};

type FormStateGlobal = {
    stateForms: FormState;
};
type DispatchType = (args:  any) => any

type IMetaData =  {
    actNaiDeclNaiss ?: string,
    actNaiNumDelivery ?: string,
    childChildAlive ?: string,
    childFirstName ?: string,
}

type IDeclaration  =  {
    colPointCode ?: string,
    templateCode ?: string,
    externalId ?: string,
    metadata?: IMetaData,
}





