import {
  openDatabase,
  enablePromise,
  SQLiteDatabase,
} from "react-native-sqlite-storage";
import "react-native-get-random-values";
import { Realm } from "@realm/react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Encodeuint8arr } from "../RealmConfig";
import { config } from "../../realmSchema/Forms";
import { toRealmInput } from "./realmInput";

// The app's own object schemas, with their `default`s (realm.schema strips them).
const appSchema = config.schema.map((c: any) => c.schema ?? c);
import Logger from "../Logger";
import { Double } from "react-native/Libraries/Types/CodegenTypes";
import { forEach } from "lodash";
import BuildConfig from "react-native-build-config";

const ParamValuesDev = require("../../configuration/ParamValuesDev.json");
const ParamValuesProd = require("../../configuration/ParamValuesProd.json");
const ParamValuesPreprod = require("../../configuration/ParamValuesPreprod.json");
const ParamValuesQua = require("../../configuration/ParamValuesQua.json");


var colPointsObjs = [];
var colPoints = [];
var colPointsIds = [];
var last_office_id = 0;
var last_list_id = 0;

const getCurrentParamValuesUsed = () =>{
  switch(BuildConfig.FLAVOR){
    
    case "dev":return ParamValuesDev
    case "prod":return ParamValuesProd
    case "preprod":return ParamValuesPreprod
    case "qua":return ParamValuesQua

  }
}



// fetch the data back asyncronously
const retrieveKeyDb = () => {
  return new Promise((resolve, reject) => {
    AsyncStorage.getItem("keyDb")
      .then(res => {
        if (res !== null) {
          const temp = Encodeuint8arr(res);
          resolve(temp);
        } else {
          resolve(null);
        }
      })
      .catch(err => {
        reject(err);
      });
  });
};

const addOrUpdateForm = allData =>
  new Promise((resolve, reject) => {
    getRealm()
      .then(realm => {
        try {
          realm.write(() => {

            let data = realm.create("FORMS", toRealmInput(appSchema, "FORMS", allData), "modified");
            Logger.debug("data db",data)
            //todo voir si on fait qqchose de la data
            resolve(data);
          });
        } catch (err) {
          reject(err);
        }
      })
      .catch(err => {
        reject(err);
      });
  });

const updateStatusDb = (id, newStatus, error) =>
  new Promise((resolve, reject) => {
    getRealm()
      .then(realm => {
        try {
          realm.write(() => {
            const document = realm.objectForPrimaryKey("FORMS", id);
            document.STATUS = newStatus;
            if (error != null) {
              document.ERROR = error;
            }
            //todo voir si on fait qqchose de la data
            resolve(document);
          });
        } catch (err) {
          reject(err);
        }
      })
      .catch(err => {
        reject(err);
      });
  });

  const deleteNotification = (id) =>
    new Promise((resolve, reject) => {
    getRealm()
      .then(realm => {
        try {
          realm.write(() => {
            const document = realm.objectForPrimaryKey("FORMS", id);
            realm.delete(document)
            resolve(true)
          });       
        } catch (err) {
          reject(err);
        }
      })
      .catch(err => {
        reject(err);
      });
  });

const getFormById = id =>
  new Promise((resolve, reject) => {
    getRealm()
      .then(realm => {
        try {
          realm.write(() => {
            const document = realm.objectForPrimaryKey("FORMS", id);
            resolve(document);
          });
        } catch (err) {
          reject(err);
        }
      })
      .catch(err => {
        reject(err);
      });
  });

const getAllFormValue = (
  useQuery,
  type,
  status1,
  status2,
  status3,
  status4,
) => {
  switch (type) {
    case "NAISSANCE":
      return useQuery("FORMS").filtered(
        "TYPE in {'NAISSANCE'} and STATUS in {$0,$1,$2,$3}",
        status1,
        status2,
        status3,
        status4
      );
    case "DECES":
      return useQuery("FORMS").filtered(
        "TYPE in {'DECES'} and STATUS in {$0,$1,$2,$3}",
        status1,
        status2,
        status3,
        status4
      );
    default:
      return useQuery("FORMS").filtered(
        "TYPE in {'NAISSANCE','DECES'} and STATUS in {$0,$1,$2,$3}",
        status1,
        status2,
        status3,
        status4,
      );
  }
};

const getAllFormValueByCP = (
  useQuery,
  type,
  status1,
  status2,
  status3,
  status4,
  collection_point,
) => {
  switch (type) {
    case "NAISSANCE":
      return useQuery("FORMS").filtered(
        "TYPE in {'NAISSANCE'} and STATUS in {$0,$1,$2,$3} AND ACT.POINT_COLLECTE LIKE   $4",
        status1,
        status2,
        status3,
        status4,
        collection_point,
      );
    case "DECES":
      return useQuery("FORMS").filtered(
        "TYPE in {'DECES'} and STATUS in {$0,$1,$2,$3} AND ACT.POINT_COLLECTE LIKE   $4",
        status1,
        status2,
        status3,
        status4,
        collection_point,
      );
    default:
      return useQuery("FORMS").filtered(
        "TYPE in {'NAISSANCE','DECES'} and STATUS in {$0,$1,$2,$3} AND ACT.POINT_COLLECTE LIKE   $4",
        status1,
        status2,
        status3,
        status4,
        collection_point,
      );
  }
};

const getAllFormByIds = (arrayOfIds) => new Promise((resolve, reject) => {
  getRealm()
    .then(realm => {
      try {
        let data = realm
          .objects("FORMS")
          .filtered(
            "ID in $0",
            arrayOfIds,
          );
        if (data.length > 0) {
          resolve(data);
        } else {
          reject("No act found");
        }
      } catch (err) {
        reject(err);
      }
    })
    .catch(err => {
      reject(err);
    });
});

const getAllValidAct = () =>
  new Promise((resolve, reject) => {
    getRealm()
      .then(realm => {
        try {
          let data = realm
            .objects("FORMS")
            .filtered("TYPE in {'NAISSANCE','DECES'} and STATUS = 'VALIDE'");
          if (data.length > 0) {
            resolve(data);
          } else {
            reject("No valid act");
          }
        } catch (err) {
          reject(err);
        }
      })
      .catch(err => {
        reject(err);
      });
  });

//test

const getRealm = () => {
  return new Promise((resolve, reject) => {
    retrieveKeyDb()
      .then(res1 => {
        if (res1 !== null) {
          Realm.open({
            config,
            encryptionKey: res1,
          })
            .then(res => {
              resolve(res);
            })
            .catch(err => {
              reject(err);
            });
        } else {
          // Without this branch the promise never settles and every caller
          // (updateStatusDb, addOrUpdateForm, ...) hangs silently.
          reject(new Error("getRealm: no encryption key stored (keyDb is null)"));
        }
      })
      .catch(err => {
        reject(err);
      });
  });
};

//////SQLITE////////
enablePromise(true);
const initDb = async (db: SQLiteDatabase) => {
  const LAST_UPDATE = BuildConfig.LAST_UPDATE
  try {   
    const dbV1Created = await AsyncStorage.getItem("createTablesAsync");    
    const dbV2Migrated = await AsyncStorage.getItem("migrate1to2Async");    
    let respcrt
    let respMigrate
    if(dbV1Created == null){
       respcrt = await createTablesAsync(db); 
       if(respcrt == "OK"){
        await AsyncStorage.setItem("createTablesAsync", "OK");
       }else{
        Logger.error("createTablesAsync didn't return OK");
       }
    }else{
      respcrt = "OK"
    }
    if(dbV2Migrated == null){
       respMigrate = await migrate1to2Async(db)
       if(respMigrate == "OK"){
        await AsyncStorage.setItem("migrate1to2Async", "OK");
        var currentParam = getCurrentParamValuesUsed()        
        const cpObjects = await loadParams(currentParam, db);
        await AsyncStorage.setItem("last_update_ts", LAST_UPDATE.toString());
        return cpObjects;
       }else{
        Logger.error("migrate1to2Async didn't return OK");
       }
    }else{
       respMigrate = "OK"
    }
  
    if (respcrt == "OK" && respMigrate == "OK") {
      // Check for Change  
      const previous = await AsyncStorage.getItem("last_update_ts");    
      let previousTimeStamp = previous == null ? 0 : Number(previous);   
      if (LAST_UPDATE > previousTimeStamp) {
        Logger.debug("je met la base a jour")
        var currentParam = getCurrentParamValuesUsed()        
        const cpObjects = await loadParams(currentParam, db);
        await AsyncStorage.setItem("last_update_ts", LAST_UPDATE.toString());
        return cpObjects;
      } else { return {colPointsObjs : []} }
    }
  } catch (e) {
    Logger.error("In InitDB 2", e);
    throw (e);
  }

};

const createTablesAsync = (db) => {
  return new Promise((resolve, reject) => {
    const crtOffice = `CREATE TABLE IF NOT EXISTS office
    (
        id
        INTEGER
        PRIMARY
        KEY
        AUTOINCREMENT,
        code
        VARCHAR
                       (
        255
                       ) NOT NULL UNIQUE,label VARCHAR
                       (
                           255
                       ));`;

    const crtAnnex = `CREATE TABLE IF NOT EXISTS annex_office
    (
        id
        INTEGER
        PRIMARY
        KEY
        AUTOINCREMENT,
        code
        VARCHAR
                      (
        255
                      ) NOT NULL UNIQUE,label VARCHAR
                      (
                          255
                      ),office_id INTEGER, FOREIGN KEY
                      (
                          office_id
                      ) REFERENCES office
                      (
                          id
                      ));`;

    const crtCollectionPoint = `CREATE TABLE IF NOT EXISTS collection_point
    (
        id
        INTEGER
        PRIMARY
        KEY
        AUTOINCREMENT,
        code
        VARCHAR
                                (
        255
                                ) NOT NULL UNIQUE, type VARCHAR
                                (
                                    255
                                ),label VARCHAR
                                (
                                    255
                                ),
                                phoneCollectionPoint BOOLEAN DEFAULT 0
                                ,office_id INTEGER, FOREIGN KEY
                                (
                                    office_id
                                ) REFERENCES office
                                (
                                    id
                                ));`;

    const crtUserTable = "CREATE TABLE IF NOT EXISTS user (id INTEGER PRIMARY KEY , login VARCHAR(255), password VARCHAR(50), firstname VARCHAR(100), lastname VARCHAR(100),role VARCHAR(255),token TEXT,expiration_datetime INTEGER,collection_point_id INTEGER,collection_point_code VARCHAR(30),  user_code VARCHAR(30), FOREIGN KEY (collection_point_id) REFERENCES collection_point (id),UNIQUE(login,password));";

    const crtList = `CREATE TABLE IF NOT EXISTS list
    (
        id
        INTEGER
        PRIMARY
        KEY
        AUTOINCREMENT,
        code
        VARCHAR
                     (
        255
                     ) NOT NULL UNIQUE,label VARCHAR
                     (
                         255
                     ));`;

    const crtValues = `CREATE TABLE IF NOT EXISTS list_values
    (
        id
        INTEGER
        PRIMARY
        KEY
        AUTOINCREMENT,
        code
        VARCHAR
                       (
        100
                       ) NOT NULL UNIQUE,label VARCHAR
                       (
                           100
                       ), value VARCHAR
                       (
                           100
                       ), value_order INTEGER, collectionPointCode VARCHAR
                       (
                           100
                       ),list_id INTEGER, FOREIGN KEY
                       (
                           list_id
                       ) REFERENCES list
                       (
                           id
                       ));`;

    const crtListValueCollection = `CREATE TABLE IF NOT EXISTS list_value_collection_point
    (
        id
        INTEGER
        PRIMARY
        KEY
        AUTOINCREMENT,
        id_collection_point
        INTEGER,
        id_list_values
        INTEGER,
        FOREIGN
        KEY
                                    (
        id_list_values
                                    ) REFERENCES list_values
                                    (
                                        id
                                    ), FOREIGN KEY
                                    (
                                        id_collection_point
                                    ) REFERENCES collection_point
                                    (
                                        id
                                    ));`;


    const tables = [crtOffice, crtAnnex, crtCollectionPoint, crtUserTable, crtList, crtValues, crtListValueCollection]
    try {
      db.transaction(tx => {
        forEach(tables, (table) => {
          tx.executeSql(table, [], (_, result) => {
          });
        });
        resolve("OK");
      });
    } catch (error) {
      Logger.error("There was a problem creating  tables  ", error);
      reject(error);
    }
  });
};

const migrate1to2Async = (db) => {
  return new Promise((resolve, reject) => {
  
     
      const deleteOffice=`DROP TABLE IF EXISTS office;`
      const createOffice = `CREATE TABLE IF NOT EXISTS office (code VARCHAR(255) PRIMARY KEY,label VARCHAR(255));`
    
      const deleteAnnex = `DROP TABLE IF EXISTS annex_office;`
      const createAnnex = `CREATE TABLE IF NOT EXISTS annex_office (code VARCHAR(255) PRIMARY KEY,label VARCHAR(255),office_id VARCHAR, FOREIGN KEY(office_id) REFERENCES office(code))`;
      
      const deleteCollectionPoint = `DROP TABLE IF EXISTS collection_point;`
      const createCollectionPoint = `CREATE TABLE IF NOT EXISTS collection_point (code VARCHAR(255) PRIMARY KEY, type VARCHAR(255),label VARCHAR(255),phoneCollectionPoint BOOLEAN DEFAULT 0,office_id VARCHAR, FOREIGN KEY(office_id) REFERENCES office(code));`
      
      const deleteList = `DROP TABLE IF EXISTS list;`
      const createList = `CREATE TABLE IF NOT EXISTS list (code VARCHAR(255) PRIMARY KEY,label VARCHAR( 255));`
      
      const deleteListValue = `DROP TABLE IF EXISTS list_values;`
      const createListValue = `CREATE TABLE IF NOT EXISTS list_values (code VARCHAR(255) PRIMARY KEY,label VARCHAR(255),value VARCHAR(255), value_order INTEGER, collectionPointCode VARCHAR(255),list_id VARCHAR(255), FOREIGN KEY(list_id) REFERENCES list(code));`
      
      const deleteUser = `DROP TABLE IF EXISTS user;`
      const createUser = `CREATE TABLE IF NOT EXISTS user (id INTEGER PRIMARY KEY , login VARCHAR(255), password VARCHAR(50), firstname VARCHAR(100), lastname VARCHAR(100),role VARCHAR(255),token TEXT,expiration_datetime INTEGER,collection_point_code VARCHAR(30),  user_code VARCHAR(30), FOREIGN KEY (collection_point_code) REFERENCES collection_point (code),UNIQUE(login,password));`
      
     
      const queries = [deleteOffice,createOffice,
                       deleteAnnex,createAnnex,
                       deleteCollectionPoint,createCollectionPoint,
                       deleteList,createList,
                       deleteListValue,createListValue,
                       deleteUser,createUser]


      try {
        db.transaction(tx => {
          forEach(queries, (table) => {        
            tx.executeSql(table, [], (_, result) => {
            });
          });
          resolve("OK");
        });
      } catch (error) {
        Logger.error("There was a problem during migration  ", error);
        reject(error);
      }
               
  })                          
}
   


let allOfficeToAdd = []
let allCollectionPointToAdd = []
let allAnnexOfficeToAdd = []
let allListToAdd = []
let allListValueToAdd = []


const loadCollectionPoint = async (data,db) => {
  for (const office of data.offices) {
    for (const colPoint of office.col_point) {  
      allCollectionPointToAdd.push({code:colPoint.code, type:colPoint.type, label:colPoint.label, office_id:office.code})
      const colPointObj = {  key: colPoint.code,value: colPoint.label};
      colPoints.push(colPoint.code);
      colPointsIds.push(colPoint.code);
      colPointsObjs.push(colPointObj);
    }
  }

  
  try{
    return await addAllCollectionPoint(db,allCollectionPointToAdd)
  } catch (e) {
    throw (e);
  }
 
}

const loadAnnexOffice = async(data,db) =>{
  for (const office of data.offices) {
    for (const annexOffice of office.annex_office) {
      allAnnexOfficeToAdd.push({code:annexOffice.code, label:annexOffice.label, office_id:office.code})
    }
  }
  try {
      return await addAllAnnexOffice(db,allAnnexOfficeToAdd)
  } catch (e) {
    throw (e);
  }
}

const loadOffice = async(data,db) =>{
  for (const office of data.offices) {
    allOfficeToAdd.push({code:office.code, label:office.label})
  }
  try {
    return await addAllOffice(db, allOfficeToAdd);
 } catch (e) {
   throw (e);
 }

}

const loadList = async(data,db) =>{
  for (const list of data.lists) {
   allListToAdd.push({code:list.code,label:list.label})
  }
  try {
   return await addAllListItem(db,allListToAdd)
  } catch (e) {
    throw (e);
  }
}
const loadListValue = async(data,db) =>{
  for (const list of data.lists) {
    for (const value of list.values) {
        let collectionPointCode = "";
        if (value.hasOwnProperty("collectionpointcode")) {
          collectionPointCode = value.collectionpointcode;
        }
        allListValueToAdd.push({code:value.code, label:value.label, value:value.value, order:value.value_order, collectionPointCode :collectionPointCode, list_id:list.code})
    }
  }
  try {       
    return await addAllListValueItem(db, allListValueToAdd);
  } catch (e) {
    throw (e);
  }
}

const loadParams = async (data, db) => {
  try{
    return loadOffice(data,db).then(res=>{
      return loadAnnexOffice(data,db).then(res=>{
        return loadCollectionPoint(data,db).then(res=>{
          return loadList(data,db).then(res=>{
            return loadListValue(data,db).then(res=>{
              return {colPointsObjs};
            }).catch(err=>{
              Logger.error(err)
              throw(err)
            })
          }).catch(err=>{         
            Logger.error(err)
            throw(err)
          })
        }).catch(err=>{
          Logger.error(err)
          throw(err)
        })
      }).catch(err=>{
        Logger.error(err)
        throw(err)
      })
    }).catch(err=>{
      Logger.error(err)
      throw(err)
    })
  }catch(err){
    Logger.error(err)
    throw(err)
  }
};
const getDBConnection = (): SQLiteDatabase => {
  return openDatabase({ name: "dbSenegal.db", location: "default" });
};
const addUser = (
  db: SQLiteDatabase,
  login: string,
  password: string,
  firstname: string,
  lastname: string,
  role: string,
  token: string,
  expiration_datetime: string,
  collection_point_code: string,
  user_code: string
) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: SQLiteDatabase) => {
      tx.executeSql(
        "INSERT INTO user VALUES (null,?,?,?,?,?,?,?,?,?);",
        [ login, password,firstname,lastname, role,token, expiration_datetime,collection_point_code,user_code],
        (tx: any, results: any) => {

          resolve(results.lastID);
        },
        (error: any) => {
          reject(error.message);
        },
      );
    });
  });
};
const existParameter = (db: SQLiteDatabase, code: string, table: string) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: SQLiteDatabase) => {
      tx.executeSql(
        `SELECT *
         FROM ${table}
         where code = ?
         limit 1`,
        [code],
        (tx: any, results: any) => {
          if (results.rows.length == 1) {
            resolve(results.rows.item(0));
          } else {
            resolve(null);
          }
        },
        (error: any) => {
          reject(error.message);
        },
      );
    });

  });
};

const getListByCode = (db: SQLiteDatabase, code: string) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: SQLiteDatabase) => {
      tx.executeSql(
        `SELECT *
         FROM list
         where code = ?
         limit 1`,
        [code],
        (tx: any, results: any) => {
          if (results.rows.length == 1) {
            resolve(results.rows.item(0));
          } else {
            resolve(null);
          }
        },
        (error: any) => {
          reject(error.message);
        },
      );
    });

  });
};
const updateParamater = (
  db: SQLiteDatabase,
  id: number,
  table: string,
  label: string,
) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: SQLiteDatabase) => {
      tx.executeSql(
        `UPDATE ${table}
         SET label = ?
         WHERE id = ?;`,
        [label, id],
        (tx: any, results: any) => {
          resolve(results);
        },
        (error: any) => {
          reject(error.message);
        },
      );
    });
  });
};

const updateListValue = (
  db: SQLiteDatabase,
  id: number,
  table: string,
  label: string,
  value: string,
  value_order: number,
  collectionPointCode: string,
) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: SQLiteDatabase) => {
      tx.executeSql(
        `UPDATE ${table}
         SET label = ?,
             value = ?,
             value_order = ?,
             collectionPointCode = ?
         WHERE id = ?;`,
        [label, value, value_order, collectionPointCode, id],
        (tx: any, results: any) => {
          resolve(results);
        },
        (error: any) => {
          reject(error.message);
        },
      );
    });
  });
};

const updateCollectionPoint = (
  db: SQLiteDatabase,
  id: number,
  table: string,
  type: string,
  label: string,
) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: SQLiteDatabase) => {
      tx.executeSql(
        `UPDATE ${table}
         SET label = ?,
             type = ?
         WHERE id = ?;`,
        [label, type, id],
        (tx: any, results: any) => {
          resolve(results);
        },
        (error: any) => {
          reject(error.message);
        },
      );
    });
  });
};

const addListItem = (
  db: SQLiteDatabase,
  code: string,
  label: string,
) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: SQLiteDatabase) => {
      tx.executeSql(
        "INSERT INTO list (code , label) VALUES (?,?);",
        [code, label],
        (tx: any, results: any) => {
          resolve(results.insertId);
        },
        (error: any) => {
          reject(error.message);
        },
      );
    });
  });
};

const addAllListItem = (
  db: SQLiteDatabase,
  listItem: Object
) => {
  let query = "INSERT OR REPLACE INTO list (code , label) VALUES "
  for(let i=0;i<listItem.length;i++){
    query = query + "( \"" + listItem[i].code + "\",\"" + listItem[i].label + "\")" 
    if(i=== listItem.length -1){
      query = query + ";"
    }else{
      query = query + ","
    }
  }
  
    return new Promise((resolve, reject) => {
      if(listItem.length > 0){
        db.transaction((tx: SQLiteDatabase) => {
          tx.executeSql(query,[],
            (tx: any, results: any) => {
              resolve(true);
            },
            (error: any) => {
              reject(error.message);
            },
          );
        });
      }else{
        resolve(true);        
       }
    }); 
};

const addAllListValueItem = (
  db: SQLiteDatabase,
  listValueItem: Object
) => {
  let query = "INSERT OR REPLACE INTO list_values (code , label , value, value_order, collectionPointCode, list_id) VALUES "
  for(let i=0;i<listValueItem.length;i++){
    query = query + "( \"" + listValueItem[i].code + "\",\"" + listValueItem[i].label + "\",\"" + listValueItem[i].value + "\",\"" + listValueItem[i].order + "\",\"" + listValueItem[i].collectionPointCode + "\",\"" + listValueItem[i].list_id  + "\")" 
    if(i=== listValueItem.length -1){
      query = query + ";"
    }else{
      query = query + ","
    }
  }
  
    return new Promise((resolve, reject) => {
      if(listValueItem.length > 0){
        db.transaction((tx: SQLiteDatabase) => {
          tx.executeSql(query,[],
            (tx: any, results: any) => {
              resolve(true);
            },
            (error: any) => {
              reject(error.message);
            },
          );
        });
      }else{     
          resolve(true); 
      }     
    });
 
};

const addListValueItem = (
  db: SQLiteDatabase,
  code: string,
  label: string,
  value: string,
  value_order: number,
  collectionPointCode: string,
  list_id: number,
) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: SQLiteDatabase) => {
      tx.executeSql(
        "INSERT INTO list_values (code , label , value, value_order, collectionPointCode, list_id) VALUES (?,?,?,?,?,?);",
        [code, label, value, value_order, collectionPointCode, list_id],
        (tx: any, results: any) => {
          resolve(results.insertId);
        },
        (error: any) => {
          reject(error.message);
        },
      );
    });
  });
};

const addOffice = (
  db: SQLiteDatabase,
  code: string,
  label: string,
) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: SQLiteDatabase) => {
      tx.executeSql(
        "INSERT OR REPLACE INTO office (code , label) VALUES (?,?);",
        [code, label],
        (tx: any, results: any) => {
          resolve(results.insertId);
        },
        (error: any) => {
          reject(error.message);
        },
      );
    });
  });
};

const addAllOffice = (
  db: SQLiteDatabase,
  office: Object,
) => {
  let query = "INSERT OR REPLACE INTO office (code , label) VALUES "
  for(let i=0;i<office.length;i++){
    query = query + "( \"" + office[i].code +  "\",\"" + office[i].label  + "\")" 
    if(i=== office.length -1){
      query = query + ";"
    }else{
      query = query + ","
    }
  }
  
    return new Promise((resolve, reject) => {
      if(office.length > 0){
        db.transaction((tx: SQLiteDatabase) => {
          tx.executeSql(query,[],
            (tx: any, results: any) => {        
              resolve(true);
            },
            (error: any) => {
              reject(error);
            },
          );
        });
      }else{
        resolve(true);       
      }     
    });
  
  
};

const addAnnexOffice = (
  db: SQLiteDatabase,
  code: string,
  label: string,
  office_id: number,
) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: SQLiteDatabase) => {
      tx.executeSql(
        "INSERT INTO annex_office (code , label, office_id) VALUES (?,?, ?);",
        [code, label, office_id],
        (tx: any, results: any) => {
          resolve(results.insertId);
        },
        (error: any) => {
          reject(error.message);
        },
      );
    });
  });
};

const addAllAnnexOffice = (
  db: SQLiteDatabase,
  annexOffice: Object,
) => {
  let query = "INSERT OR REPLACE INTO annex_office (code , label, office_id) VALUES "
  for(let i=0;i<annexOffice.length;i++){
    query = query + "( \"" + annexOffice[i].code + "\",\"" + annexOffice[i].office_id +  "\",\"" + annexOffice[i].label  + "\")" 
    if(i=== annexOffice.length -1){
      query = query + ";"
    }else{
      query = query + ","
    }
  }
  
    return new Promise((resolve, reject) => {
      if(annexOffice.length >0){
        db.transaction((tx: SQLiteDatabase) => {
          tx.executeSql(query,[],
            (tx: any, results: any) => {
              resolve(true);
            },
            (error: any) => {
              reject(error.message);
            },
          );
      })
    }else{      
      resolve(true);          
    }
  });  
};

const addCollectionPoint = (
  db: SQLiteDatabase,
  code: string,
  type: string,
  label: string,
  office_id: number,
) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: SQLiteDatabase) => {
      tx.executeSql(
        "INSERT INTO collection_point (code , type, label, office_id) VALUES (?,?,?, ?);",
        [code, type, label, office_id],
        (tx: any, results: any) => {
          resolve(results.insertId);
        },
        (error: any) => {
          reject(error.message);
        },
      );
    });
  });
};

const addAllCollectionPoint = (
  db: SQLiteDatabase,
  collectionPoint:Object,
) => {
  let query = "INSERT OR REPLACE INTO collection_point (code , type,label,office_id) VALUES "
  for(let i=0;i<collectionPoint.length;i++){
    query = query + "( \"" + collectionPoint[i].code + "\",\"" + collectionPoint[i].type + "\",\"" + collectionPoint[i].label + "\",\""  + collectionPoint[i].office_id  + "\")" 
    if(i=== collectionPoint.length -1){
      query = query + ";"
    }else{
      query = query + ","
    }
  }
 
    return new Promise((resolve, reject) => {
      if(collectionPoint.length > 0){
        db.transaction((tx: SQLiteDatabase) => {
          tx.executeSql(query,[],
            (tx: any, results: any) => {
              resolve(true);
            },
            (error: any) => {
              reject(error.message);
            },
          );
        });
      }else{
        resolve(true);      
      }  
    });
};

const updateTokenUser = (
  db: SQLiteDatabase,
  id: Double,
  token: string,
  expiration: string
) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: SQLiteDatabase) => {
      tx.executeSql(
        "UPDATE user SET  token = ? , expiration_datetime = ? where id = ?;",
        [token,expiration, id],
        (tx: any, results: any) => {
          resolve(results);
        },
        (error: any) => {
          reject(error.message);
        },
      );
    });
  });
};

const testLogin = (db: SQLiteDatabase, login: string, pw: string) =>
  new Promise((resolve, reject) => {
    db.transaction((tx: SQLiteDatabase) => {
      tx.executeSql(
        "SELECT * from user where login =? and password =?;",
        [login, pw],
        (tx: any, results: any) => {
          if (results.rows.length == 1) {
            resolve(results.rows.item(0).name);
          } else {
            reject("Incorrect login or password");
          }
        },
        (error: any) => {
          reject(error.message);
        },
      );
    });
  });
const existXrefListColPoint = (db: SQLiteDatabase, table: string, listId: number) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: SQLiteDatabase) => {
      tx.executeSql(
        `SELECT *
         FROM ${table}
         where id_list_values = ?
         limit 1`,
        [listId],
        (tx: any, results: any) => {
          if (results.rows.length == 1) {
            resolve(results.rows.item(0));
          } else {
            resolve(null);
          }
        },
        (error: any) => {
          reject(error.message);
        },
      );
    });

  });
};
const updatelist_value_collection_point = (
  db: SQLiteDatabase,
  id: number,
  table: string,
  collectionPointId: number,
) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: SQLiteDatabase) => {
      tx.executeSql(
        `UPDATE ${table}
         SET id_collection_point = ?
         WHERE id_list_values = ?;`,
        [collectionPointId, id],
        (tx: any, results: any) => {
          resolve(results);
        },
        (error: any) => {
          reject(error.message);
        },
      );
    });
  });
};
const existLogin = (db: SQLiteDatabase, login: string) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: SQLiteDatabase) => {
      tx.executeSql(
        "SELECT * FROM user where login=? limit 1",
        [login],
        (tx: any, results: any) => {
          if (results.rows.length == 1) {
            resolve(true);
          } else {
            resolve(false);
          }
        },
        (error: any) => {
          reject(error.message);
        },
      );
    });

  });
};

const getUserbyLogin = (db: SQLiteDatabase, login: string) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: SQLiteDatabase) => {
      tx.executeSql(
        "select * from user where login=?",
        [login],
        (tx: any, results: any) => {
          resolve(results.rows.item(0));
        },
        (error: any) => {
          reject(error.message);
        },
      );
    });

  });
};

const getCollectionPointIdByCode = (db: SQLiteDatabase, code: string) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: SQLiteDatabase) => {
      tx.executeSql(
        "select * from collection_point where code=?",
        [code],
        (tx: any, results: any) => {
          if (results.rows.length === 0) {
            reject(new Error("Not found"));
          } else {
            const firstRow = results.rows.item(0);
            const cpcid = firstRow.id;
            resolve(cpcid);
          }
        },
        (error) => {
          reject(error);
        },
      );
    });
  });
};

const getCollectionPointByCode = (db: SQLiteDatabase, code: string) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: SQLiteDatabase) => {
      tx.executeSql(
        "select * from collection_point where code=?",
        [code],
        (tx: any, results: any) => {
          if (results.rows.length === 0) {
            reject(new Error("Not found"));
          } else {
            const firstRow = results.rows.item(0);
            resolve(firstRow);
          }
        },
        (error) => {
          reject(error);
        },
      );
    });
  });
};

const getUserOfficesByCollectionPointId = (db: SQLiteDatabase, cpId: number) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: SQLiteDatabase) => {
      tx.executeSql(
        "select office.id,office.code,office.label from office ,user ,collection_point WHERE user.collection_point_id = ? and collection_point.office_id = office.id and user.collection_point_id = collection_point.id",
        [cpId],
        (tx: any, results: any) => {
          let temp = []
          for (let i = 0; i < results.rows.length; ++i) {
            temp.push(results.rows.item(i))
          }

          resolve(temp)
        },
        (error: any) => {
          reject(error.message);
        },
      );
    });

  })
}

const getUserAnnexOfficesByOfficeId = (db: SQLiteDatabase, officeId: number) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: SQLiteDatabase) => {
      tx.executeSql(
        "select annex_office.id,annex_office.code,annex_office.label from annex_office,office where annex_office.office_id = ? and office.id = annex_office.office_id",
        [officeId],
        (tx: any, results: any) => {
          let temp = []
          for (let i = 0; i < results.rows.length; ++i) {
            temp.push(results.rows.item(i))
          }
          resolve(temp)
        },
        (error: any) => {
          reject(error.message);
        },
      );
    });
  })
}

const getListValuesByCode = (db: SQLiteDatabase, codeList: string) => {
  return new Promise((resolve, reject) => {
      db.transaction((tx: SQLiteDatabase) => {
        tx.executeSql(
          "select * from list_values where list_values.list_id = ?",
          [codeList],
          (tx: any, results: any) => {
            let temp = []
            for (let i = 0; i < results.rows.length; ++i) {
              temp.push(results.rows.item(i))
            }

            resolve(temp)
          },
          (error: any) => {
            reject(error.message);
          },
        );
      });
  })
}

const getOfficeByCode = (db: SQLiteDatabase, code: number) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: SQLiteDatabase) => {
        tx.executeSql(
          "select * from office where code = ?",
          [code],
          (tx: any, results: any) => {         
            resolve(results.rows.item(0));
          },
          (error: any) => {
            reject(error.message);
          },
        );
    });

  })
}

const getOfficeByCollectionPointCode = (db: SQLiteDatabase, code: string) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: SQLiteDatabase) => {
      tx.executeSql(
        "select o.* from office o INNER JOIN collection_point cp on cp.office_id = o.code where cp.code=?",
        [code],
        (tx: any, results: any) => {
          const firstRow = results.rows.item(0);
          resolve(firstRow);
        }
      );
    });
  });
};

const getCollectionPoints = (db) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM collection_point",
        [],
        (tx, results) => {
          const collectionPoints = [];
          for (let i = 0; i < results.rows.length; i++) {
            let colPointObj = { key: results.rows.item(i).code, value: results.rows.item(i).label,type: results.rows.item(i).type,label: results.rows.item(i).label };
            collectionPoints.push(colPointObj);
          }
          resolve(collectionPoints);
        },
        (tx, error) => {
          reject(error);
        }
      );
    });
  });

};
const getCPCode = (db: SQLiteDatabase, id: number) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: SQLiteDatabase) => {
      tx.executeSql(
        "select * from collection_point where code=?",
        [id],
        (tx: any, results: any) => {
          const firstRow = results.rows.item(0);
          const cpCode = firstRow.code;
          resolve(cpCode);
        }
      );
    });
  });
};

const getCPTypeByCode = (db: SQLiteDatabase, id: number) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: SQLiteDatabase) => {
      tx.executeSql(
        "select * from collection_point where code=?",
        [id],
        (tx: any, results: any) => {
          const firstRow = results.rows.item(0);
          const cpType = firstRow.type;
          resolve(cpType);
        }
      );
    });
  });
};

const setPhoneCollectionPoint = (db: SQLiteDatabase, code: string, value: number) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: SQLiteDatabase) => {
      tx.executeSql(
        "UPDATE collection_point SET phoneCollectionPoint = ? WHERE code = ?",
        [value, code],
        (tx: any, results: any) => {
          resolve(results.rowsAffected);
        },
        (error: any) => {
          reject(error.message);
        }
      );
    });
  });
};



const getPhoneCollectionPoint = (db) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM collection_point WHERE phoneCollectionPoint = 1',
        [],
        (tx, results) => {
          const rows = results.rows;
          if (rows.length === 0) {
            resolve(null);
          } else {
            const firstRow = rows.item(0);
            resolve(firstRow);
          }
        },
        (error) => {
          reject(error);
        },
      );
    });
  });
};





export {
  getDBConnection,
  initDb,
  testLogin,
  addUser,
  addListItem,
  getRealm,
  addOrUpdateForm,
  getAllFormValue,
  updateStatusDb,
  getFormById,
  getAllValidAct,
  existLogin,
  getUserbyLogin,
  getCollectionPointIdByCode,
  getOfficeByCollectionPointCode,
  updateTokenUser,
  getUserAnnexOfficesByOfficeId,
  getUserOfficesByCollectionPointId,
  getPhoneCollectionPoint,
  setPhoneCollectionPoint,
  getCollectionPointByCode,
  getCollectionPoints,
  getListValuesByCode,
  getAllFormByIds,
  getAllFormValueByCP,
  deleteNotification,
  getOfficeByCode,
  getCPTypeByCode
};
