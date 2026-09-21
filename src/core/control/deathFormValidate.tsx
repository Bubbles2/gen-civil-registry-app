import Logger from "../Logger";


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

const validateFormDeath = (data:Data) =>{

    let temp = data

    //check data here and format if needed


    return temp

}

const formatDataForBackDeath = (data) =>{

    let temp = data

    if (data.DEFUNCT.NNI_NATIONAL === "Oui") {
        delete temp.DEFUNCT.NUM_IDENT
    }else if (data.DEFUNCT.NNI_NATIONAL === "Non") {
        delete temp.DEFUNCT.NATIONAL_ID
    }
    
    if (data.DEFUNCT.INFO_DEC.EVT_DATE === "Oui") {
        delete temp.DEFUNCT.DECES.DEATH_DATA.BODY_FOUND_DATE
    }else if(data.DEFUNCT.INFO_DEC.EVT_DATE === "Non"){
        delete temp.DEFUNCT.INFO_DEC.EVT_DATE
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

export {validateFormDeath,formatDataForBackDeath}
