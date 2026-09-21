import Logger from "../Logger";

type Data = {
    ISEE:{
        ISEE_POIDS?:string,
        NRANG?:string
    }
}

function checkNestedProperty(obj, path) {
    const properties = path.split('.');
    let current = obj;

    for (const property of properties) {
        if (current && (property in current)) {
            current = current[property];
        } else {
            return false;
        }
    }

    return true;
}

const validateFormBirth = (data:Data) =>{

    let temp = data

    //convert int value to string for dbRealm
    if (checkNestedProperty(data, 'ISEE.ISEE_POIDS')) {
        temp.ISEE.ISEE_POIDS = data.ISEE.ISEE_POIDS.toString()
    }
    if (checkNestedProperty(data, 'ISEE.NRANG')) {
        temp.ISEE.NRANG = data.ISEE.NRANG.toString()
    }

    return temp

}

const formatDataForBackBirth = (data:Data) =>{

    let temp = data

    if (data.ISEE.NAI_MULTIPLE === "Non") {
        delete temp.ACT_NAI.TYPE_OF_BIRTH
        delete temp.ISEE.NRANG
    }
    if (data.CHILD.CHILD_ALIVE === "Non") {
        delete temp.CHILD.INFO_NAI
        delete temp.ISEE.LIEU_ACCOUCHEMENT
    }
    if (data.CHILD.CHILD_ALIVE === "Non" || data.ISEE.LIEU_ACCOUCHEMENT !== "Structure sanitaire") {
        delete temp.ACT_NAI.BIRTH_ADDRESS
    }
    if (data.ACT_NAI.INDICATE_FATHER_y8n === "Non") {
        delete temp.FATHER   
    }else if (data.ACT_NAI.INDICATE_FATHER_y8n === "Oui"){
        if (data.FATHER.NNI_NATIONAL === "Oui") {
            delete temp.FATHER.NUM_IDENT
        }else if (data.FATHER.NNI_NATIONAL === "Non") {
            delete temp.FATHER.NATIONAL_ID
        }
        if(data.FATHER.DECEASED === "Non"){
            delete temp.FATHER.INFO_DEC.EVT_KNOWN_DATE
            delete temp.FATHER.INFO_DEC.EVT_ADDRESS.CITY
        }else if(data.FATHER.DECEASED === "Oui"){
            delete temp.FATHER.INFO_DOM.CITY
            delete temp.FATHER.INFO_DOM.FORWARDING_ADDRESS
            delete temp.FATHER.TEL_PARENT
            if(data.FATHER.INFO_DEC.EVT_KNOWN_DATE === "Non"){
                delete temp.FATHER.INFO_DEC.EVT_DATE
            }
        }
    }

    if (data.MOTHER.NNI_NATIONAL === "Oui") {
        delete temp.MOTHER.NUM_IDENT
    }else if (data.MOTHER.NNI_NATIONAL === "Non") {
        delete temp.MOTHER.NATIONAL_ID
    }

    if(data.MOTHER.DECEASED === "Oui"){
        delete temp.MOTHER.INFO_DOM.SAME_ADR
        delete temp.MOTHER.INFO_DOM.CITY
        delete temp.MOTHER.INFO_DOM.FORWARDING_ADDRESS
        delete temp.MOTHER.TEL_PARENT
    }else if(data.MOTHER.DECEASED === "Non"){
        if(data.FATHER && data.FATHER.DECEASED === "Oui"){
            delete temp.MOTHER.INFO_DOM.SAME_ADR

        }else if(data.FATHER && data.FATHER.DECEASED === "Non"){
            if(data.MOTHER.INFO_DOM.SAME_ADR === "Non"){
                delete temp.MOTHER.INFO_DOM.CITY
                delete temp.MOTHER.INFO_DOM.FORWARDING_ADDRESS
            }
        }
    }
    delete temp.DEFUNCT

    if(data.ISEE.ISEE_POIDS === "0"){
        delete temp.ISEE.ISEE_POIDS
    }

   
    //remove empty field
    removeEmpty(temp)
    return temp
}

const removeEmpty = (obj) => {
    Object.entries(obj).forEach(([key, val])  =>{
        if(val && typeof val === 'object'){
            if( Object.keys(val).length === 0 ){
                delete obj[key];
                return;
            }
            removeEmpty(val);
            if( Object.keys(val).length === 0 ){
                delete obj[key];
            }
        }else if(val === null || val === ""){
            delete obj[key]
        }
    });
    return obj;
  };

export {validateFormBirth,formatDataForBackBirth}
