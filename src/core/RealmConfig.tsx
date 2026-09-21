import "react-native-get-random-values";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {TextEncoder, TextDecoder} from "text-decoding";
import SdkJs from "./SdkJs";
import Logger from "./Logger";


const saveKeyRealm = () => {

  return SdkJs.getRealmConfig()
    .then((res :string)=> {
      const temp = Encodeuint8arr(res);
      const key = Decodeuint8arr(temp);
      return AsyncStorage.setItem("keyDb", key)
        .then(() => {
          return temp;
        })
        .catch((err:string) => {
          Logger.error("saveKeyRealm ",err)
        });
    })
    .catch((err :string) => {
      Logger.error("saveKeyRealm,getRealmConfig ",err)
    });
};

const byteToHex = byte => {
  const key = "0123456789abcdef";
  let bytes = new Uint8Array(byte);
  let newHex = "";
  let currentChar = 0;
  for (let i = 0; i < bytes.length; i++) {Object
    // Go over each 8-bit byte
    currentChar = bytes[i] >> 4; // First 4-bits for first hex char
    newHex += key[currentChar]; // Add first hex char to string
    currentChar = bytes[i] & 15; // Erase first 4-bits, get last 4-bits for second hex char
    newHex += key[currentChar]; // Add second hex char to string
  }
  return newHex;
};

/**
 * Convert an Uint8Array into a string.
 *
 * @returns {String}
 */
function Decodeuint8arr(uint8array) {
  return new TextDecoder("utf-8").decode(uint8array);
}

/**
 * Convert a string into a Uint8Array.
 *
 * @returns {Uint8Array}
 */
function Encodeuint8arr(myString) {
  return new TextEncoder().encode(myString);
}

export {saveKeyRealm, Decodeuint8arr, Encodeuint8arr, byteToHex};
