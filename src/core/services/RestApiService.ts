import BackgroundService from "react-native-background-actions";
import { NativeEventEmitter } from "react-native";
import { getAllValidAct, updateStatusDb } from "./databaseService";
import { sendBatch, sendDeclaration } from "./SendDeclarationService";
import { Realm } from "@realm/react";
import Logger from "../Logger";
import SdkJs from "../SdkJs";
import validateForm, { formatDataForBack } from "../control/birthFormValidate";
//================================================================================
// This is a function that will run in the backround service it is NOT the background
// service
//================================================================================
const updateStatus = (id: Realm.BSON.ObjectId, newStatus: string, error: string) => {
  updateStatusDb(id, newStatus, error)
    .catch(err => {
      Logger.error("updateStatusDb ", err);
    });
};
// Set a delay for a specific time
const sleep = (time: number) => new Promise<void>(resolve => setTimeout(() => resolve(), time));

const RestAPIService = async (taskDataArguments: { config: { delay: number }, setAllListener: () => void }) => {
  // Example of an infinite loop task
  const { config, setAllListener } = taskDataArguments;
  let allActValidToExport: Array<object> = [];
  let endpoint: string;
  SdkJs.getHttpConfig().then((res: { schema: string, domain: string, port: number, path: string }) => {
    endpoint = res.schema + "://" + res.domain + ":" + res.port + "/" + res.path + "/v1/notification"
  })

  await new Promise(async (resolve, reject) => {

    while (BackgroundService.isRunning()) {

      Logger.debug("is running")
      let nbError: number = 0;
      let nbSuccess: number = 0;
      let desc = "$1 notification en erreur, $2 notification envoyé ";

      const updateNotifications = (error, success) => {
        nbError = nbError + error
        nbSuccess = nbSuccess + success
        Logger.debug("nb error ",nbError)
        Logger.debug("nb succes ",nbSuccess)
        if (BackgroundService.isRunning()) {
          BackgroundService.updateNotification({
            taskDesc: desc
              .replace("$1", nbError.toString())
              .replace("$2", nbSuccess.toString()),
          });
        }
      }
      if (BackgroundService.isRunning()) {
        BackgroundService.updateNotification({
          taskDesc: "Service en cours ...",
        });

        try {
          getAllValidAct()
            .then(data => {
              if (data != null) {
                let temp = JSON.parse(JSON.stringify(data));
                for (let j = 0; j < temp.length; j++) {
                  let tempFormatData = formatData(temp[j].TYPE, temp[j])
                  temp[j] = tempFormatData
                }
                
                allActValidToExport = temp;
                if (
                  allActValidToExport !== null &&
                  allActValidToExport.length > 0
                ) {
                  sendBatch(allActValidToExport, updateNotifications, endpoint)
                  allActValidToExport = []
                }
              }
            })
            .catch(err => {
              Logger.error("Send Batch  catch all", err);
            });
        } catch (err) {
          Logger.error("Get valid acts  catch all", err);
        }
      }
      await sleep(config.delay * 1000);
    }
  });

}

const formatData = (typeAct, data) => {
  if (typeAct === "NAISSANCE") {
    return formatDataForBack(data)
  }
}
export default RestAPIService
