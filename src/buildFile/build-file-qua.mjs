import {
  parseActeNaiBirthDeclTpml,
  parseCities,
  parseIseeNaiMultipleBirth,
  parseIseeLieuAccouchement,
  parseLstSexe,
  parseProfession,
  parseYesNo,parseColpoint,
  parseHopitaux,
  fs
} from "./build-file-index.mjs"

//path to generated config
const jsonFilePath = 'src/configuration/ParamValuesQua.json';
//cities
const csvFilePathCities = 'citiweb-input-files/dev/cities.csv'; 
const csvFileContentCities = fs.readFileSync(csvFilePathCities, 'utf8');
//offices
const csvFilePathOffices = 'citiweb-input-files/dev/offices.csv'; 
const csvFileContentOffices = fs.readFileSync(csvFilePathOffices, 'utf8');
//colpoint
const csvFilePathColpoint = 'citiweb-input-files/dev/colpoints.csv'; 
const csvFileContentColpoint = fs.readFileSync(csvFilePathColpoint, 'utf8');
//hopitaux
const csvFilePathHopitaux = 'citiweb-input-files/dev/hopitaux.csv'; 
const csvFileContentHopitaux = fs.readFileSync(csvFilePathHopitaux, 'utf8');
//act_nai.birth_decl_tmpl
const csvFilePathActNaiBirthDeclTpml = 'citiweb-input-files/dev/act_nai_birth_decl_tpml.csv'; 
const csvFileContentActNaiBirthDeclTpml = fs.readFileSync(csvFilePathActNaiBirthDeclTpml, 'utf8');
//isee.lieu_accouchement
const csvFilePathIseeLieuAccouchement = 'citiweb-input-files/dev/isee_lieu_accouchement.csv'; 
const csvFileContentIseeLieuAccouchement = fs.readFileSync(csvFilePathIseeLieuAccouchement, 'utf8');
//isee.nai_multiple_birth
const csvFilePathIseeNaiMultipleBirth = 'citiweb-input-files/dev/isee_nai_multiple_birth.csv'; 
const csvFileContentIseeNaiMultipleBirth = fs.readFileSync(csvFilePathIseeNaiMultipleBirth, 'utf8');
//lst_sexe
const csvFilePathLstSexe = 'citiweb-input-files/dev/lst_sexe.csv'; 
const csvFileContentLstSexe = fs.readFileSync(csvFilePathLstSexe, 'utf8');
//profession
const csvFilePathProfession = 'citiweb-input-files/dev/profession.csv'; 
const csvFileContentProfession = fs.readFileSync(csvFilePathProfession, 'utf8');
//yes_no
const csvFilePathYesNo = 'citiweb-input-files/dev/yes_no.csv'; 
const csvFileContentYesNo = fs.readFileSync(csvFilePathYesNo, 'utf8');


const init = () =>{
    parseActeNaiBirthDeclTpml(csvFileContentActNaiBirthDeclTpml)
    parseCities(csvFileContentCities)
    parseIseeLieuAccouchement(csvFileContentIseeLieuAccouchement)
    parseIseeNaiMultipleBirth(csvFileContentIseeNaiMultipleBirth)
    parseLstSexe(csvFileContentLstSexe)
    parseProfession(csvFileContentProfession)
    parseYesNo(csvFileContentYesNo)

    parseColpoint(csvFileContentColpoint,csvFileContentOffices) // < ====  parseOffice in this function
    parseHopitaux(csvFileContentHopitaux,jsonFilePath)
      
          
}

//start process
init()




