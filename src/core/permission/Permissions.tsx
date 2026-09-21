import {
    check,
    request,
    RESULTS,
    requestMultiple,
  } from 'react-native-permissions';
  
  // This function can be used anywhere as it supports multiple permissions. 
  // It checks for permissions and then requests for it.
  export async function checkMultiplePermissions(permissions) {
    let isPermissionGranted = "denied";
    const statuses = await requestMultiple(permissions);
    for (var index in permissions) {
      if (statuses[permissions[index]] === RESULTS.GRANTED) {
        isPermissionGranted = "granted";
      }else if (statuses[permissions[index]] === RESULTS.BLOCKED) {
        isPermissionGranted = "blocked";
        break
      } else {
        isPermissionGranted = "denied";
        break;
      }
    }
    return isPermissionGranted;
  }
  
  