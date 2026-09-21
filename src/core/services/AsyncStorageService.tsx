import AsyncStorage from "@react-native-async-storage/async-storage";
import Logger from "../Logger";


const saveKeyAsyncStorage = (key,value) => {

    return new Promise((resolve, reject) => {
        AsyncStorage.setItem(key, value)
          .then(() => {
            resolve(true)
          })
          .catch(err => {
            Logger.error("saveKeyAsyncStorage ",err)
            reject(err);
          });
      });
  };

const retrieveKeyAsyncStorage = (key) => {
    return new Promise((resolve, reject) => {
      AsyncStorage.getItem(key)
        .then(res => {
          if (res !== null) {          
            resolve(res);
          } else {
            resolve(null);
          }
        })
        .catch(err => {
         Logger.error("retrieveKeyAsyncStorage ",err)
          reject(err);
        });
    });
  };

export {saveKeyAsyncStorage,retrieveKeyAsyncStorage}