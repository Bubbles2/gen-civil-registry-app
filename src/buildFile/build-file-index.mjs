import fs from 'fs';
import Papa from 'papaparse';
import log4js from 'log4js';

const logger = log4js.getLogger();
logger.level = 'info';

let tempJson = {
    offices:[],
    lists:[]
}


const writeJson = (path) =>{
    fs.writeFileSync(path, JSON.stringify(tempJson, null, 2), 'utf8');
}
const parseHopitaux = (csvContent,jsonFilePath) =>{
    Papa.parse(csvContent, {
        header: true,
        delimiter: ';',
        complete: (results) => {
            
          tempJson["lists"].push({
              code: 'LISTE_HOPITAUX',
              label: 'Liste des hôpitaux',
              values: results.data.map(item => ({
                code: item.code,
                label: item.label,
                value: item.value,
                value_order: item.value_order
              }))
          })

          logger.info("Parsing hopitaux success")
          writeJson(jsonFilePath)
        },
        error: (error) => {
          logger.error("Error parsing CSV file hopitaux:", error)
        }
      });
}
const parseCities = (csvContent) =>{
    Papa.parse(csvContent, {
        header: true,
        delimiter: ';',
        complete: (results) => {
          tempJson["lists"].push( {
              code: 'VILLE',
              label: 'Ville',
              values: results.data.map(item => ({
                code: item.code,
                label: item.label,
                value: item.value,
                value_order: item.value_order
              }))
          })
          logger.info("Parsing cities success")
        },
        error: (error) => {
          logger.error('Error parsing CSV file cities:', error);
        }
      });
}

 const parseActeNaiBirthDeclTpml = (csvContent) =>{
  Papa.parse(csvContent, {
      header: true,
      delimiter: ';',
      complete: (results) => {
        tempJson["lists"].push( {
            code: 'ACT_NAI.BIRTH_DECL_TPML',
            label: 'Accompagnant',
            values: results.data.map(item =>({
              code: item.code,
              label: item.label,
              value: item.value,
              value_order: item.value_order
            }))
        })
        logger.info("Parsing act_nai_birth_decl_tpml success")
      },
      error: (error) => {
        logger.error('Error parsing CSV file act_nai_birth_decl_tpml:', error);
      }
    });
}

 const parseIseeLieuAccouchement = (csvContent) =>{
  Papa.parse(csvContent, {
      header: true,
      delimiter: ';',
      complete: (results) => {
        tempJson["lists"].push( {
            code: 'ISEE.LIEU_ACCOUCHEMENT',
            label: 'Type de lieu d\'accouchement',
            values: results.data.map(item => ({
              code: item.code,
              label: item.label,
              value: item.value,
              value_order: item.value_order
            }))
        })
        logger.info("Parsing isee_lieu_accouchement success")
      },
      error: (error) => {
        logger.error('Error parsing CSV file isee_lieu_accouchement:', error);
      }
    });
}

 const parseIseeNaiMultipleBirth = (csvContent) =>{
  Papa.parse(csvContent, {
      header: true,
      delimiter: ';',
      complete: (results) => {
        tempJson["lists"].push( {
            code: 'ISEE.NAI_MULTIPLE_BIRTH',
            label: 'Naissance multiple de',
            values: results.data.map(item => ({
              code: item.code,
              label: item.label,
              value: item.value,
              value_order: item.value_order
            }))
        })
        logger.info("Parsing isee_nai_multiple_birth success")   
      },
      error: (error) => {
        logger.error('Error parsing CSV file isee_nai_multiple_birth:', error);
      }
    });
}

 const parseLstSexe = (csvContent) =>{
  Papa.parse(csvContent, {
      header: true,
      delimiter: ';',
      complete: (results) => {
        tempJson["lists"].push( {
            code: 'LST_SEX',
            label: 'Liste sex',
            values: results.data.map(item => ({
              code: item.code,
              label: item.label,
              value: item.value,
              value_order: item.value_order
            }))
        })
        logger.info("Parsing lst_sexe success")
      },
      error: (error) => {
        logger.error('Error parsing CSV file lst_sexe:', error);
      }
    });
}

 const parseProfession = (csvContent) =>{
  Papa.parse(csvContent, {
      header: true,
      delimiter: ';',
      complete: (results) => {
        tempJson["lists"].push( {
            code: 'PROFESSION',
            label: 'Liste des professions',
            values: results.data.map(item => ({
              code: item.code,
              label: item.label,
              value: item.value,
              value_order: item.value_order
            }))
        })
        logger.info("Parsing profession success")
      },
      error: (error) => {
        logger.error('Error parsing CSV file profession:', error);
      }
    });
}

 const parseYesNo = (csvContent) =>{
  Papa.parse(csvContent, {
      header: true,
      delimiter: ';',
      complete: (results) => {
        tempJson["lists"].push( {
            code: 'YES_NO',
            label: 'Liste Oui / Non',
            values: results.data.map(item => ({
              code: item.code,
              label: item.label,
              value: item.value,
              value_order: item.value_order
            }))
        })
        logger.info("Parsing yes_no success")  
      },
      error: (error) => {
        logger.error('Error parsing CSV file yes_no:', error);
      }
    });
}

 const parseColpoint = (csvContentCollpoint,csvContentOffice) =>{
    Papa.parse(csvContentCollpoint, {
        header: true,
        delimiter: ';',
        complete: (results) => {
          //colpoint
          let mapColpoint = {}
          results.data.forEach(item => {
            
            if(!Array.isArray(mapColpoint[item.office_code])){
                mapColpoint[item.office_code] = []
            }
            item.office_code !== '' && mapColpoint[item.office_code].push({
                code: item.code,
                label: item.label,
                type: item.type,
            })       
          })
         
          logger.info("Parsing colpoint success")
          parseOffice(mapColpoint,csvContentOffice)  
 
        },
        error: (error) => {
          logger.error('Error parsing CSV file colpoint :', error);
        }
      });
}

 const parseOffice = (mapColpoint,csvContent) =>{
    Papa.parse(csvContent, {
        header: true,
        delimiter: ';',
        complete: (results) => {
            let offices = [];
            results.data.forEach(office => {                               
                offices.push({
                      code: office.code,
                      label: office.label,
                      col_point: mapColpoint[office.code] ? mapColpoint[office.code] : [] , 
                      annex_office: []
                });
                  
              });
        tempJson["offices"] = offices
        logger.info("Parsing office success")
        },
        error: (error) => {
          logger.error('Error parsing CSV file colpoint :', error);
        }
      });
}

export {
  parseActeNaiBirthDeclTpml,
  parseCities,
  parseColpoint,
  parseHopitaux,
  parseIseeLieuAccouchement,
  parseIseeNaiMultipleBirth,
  parseLstSexe,
  parseOffice,
  parseProfession,
  parseYesNo,
  fs

}
