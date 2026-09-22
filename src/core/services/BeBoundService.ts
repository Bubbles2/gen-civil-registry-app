import BackgroundService from "react-native-background-actions";
import {NativeEventEmitter} from "react-native";
import SdkJs from "../SdkJs";
import {getAllValidAct, updateStatusDb} from "../db/declarations";
import Logger from "../Logger";
//================================================================================
// This is a function that will run in the backround service it is NOT the background
// service
//================================================================================
const updateStatus = (id: string, newStatus: string, error: string) => {
  updateStatusDb(id, newStatus, error)
    .catch(err => {
      Logger.error("updateStatusDb ",err);
    });
};
// Set a delay for a specific time
const sleep = (time:number) => new Promise<void>(resolve => setTimeout(() => resolve(), time));

const BeBoundService   = async (taskDataArguments:{config:{delay:number},setAllListener:() =>void}) => {
  // Example of an infinite loop task
  const {config, setAllListener} = taskDataArguments;
  let allActValidToExport : Array<object> = [];

  await new Promise(async (resolve, reject) => {

    while (BackgroundService.isRunning()) {
      const eventEmitter = new NativeEventEmitter(SdkJs);

      let nbError : number = 0;
      let nbSuccess :number = 0;
      let desc : string  = "$1 notification en erreur, $2 notification envoyé ";
      const beboundGesture = () => {
        const beboundResponse = eventEmitter.addListener(
          "onBeboundResponse",
          event => {
            //todo
            beboundResponse.remove();
            nbSuccess = nbSuccess + 1
            updateStatus(
              event.id,
              "ARCHIVE",
              event.receive,
            );
            if (BackgroundService.isRunning()) {
              BackgroundService.updateNotification({
                taskDesc: desc
                  .replace("$1", nbError.toString())
                  .replace("$2", nbSuccess.toString()),
              });
            }
            let temp = allActValidToExport;
            temp.splice(0, 1);

            allActValidToExport = temp;
            if (
              allActValidToExport !== null &&
              allActValidToExport.length > 0
            ) {
              //new send
              beboundGesture();
              SdkJs.sendFalseBeboundRequestForTestError(
                allActValidToExport[0],
              );
            }
          },
        );
        const beboundReponseError = eventEmitter.addListener(
          "onBeboundResponseError",
          event => {
            //todo
            beboundReponseError.remove();
            nbError = nbError + 1;

            updateStatus(
              event.id,
              "ERREUR",
              event.receive,
            );
            if (BackgroundService.isRunning()) {
              BackgroundService.updateNotification({
                taskDesc: desc
                  .replace("$1", nbError.toString())
                  .replace("$2", nbSuccess.toString()),
              });
            }
            let temp = allActValidToExport;
            temp.splice(0, 1);

            allActValidToExport = temp;
            if (
              allActValidToExport !== null &&
              allActValidToExport.length > 0
            ) {
              //new send
              beboundGesture();
              SdkJs.sendFalseBeboundRequestForTestError(
                allActValidToExport[0],
              );
            }
          },
        );
      };
      if (allActValidToExport !== null && allActValidToExport.length > 0) {
        //wait to finish the loop
      } else {
        if (BackgroundService.isRunning()) {
          BackgroundService.updateNotification({
            taskDesc: "Service en cours ...",
          });
          try {
            getAllValidAct()
              .then(data => {
                if (data != null) {
                  let temp = JSON.parse(JSON.stringify(data));
                  for (let i = 0; i < data.length; i++) {
                    temp[i].ID = data[i].ID.toString();
                    temp[i].network = config.network;
                  }

                  allActValidToExport = temp;
                  if (
                    allActValidToExport !== null &&
                    allActValidToExport.length > 0
                  ) {
                    //new send
                    setAllListener();
                    beboundGesture();
                    SdkJs.sendFalseBeboundRequestForTestError(
                      allActValidToExport[0],
                    );
                  }
                }
              })
              .catch(err => {
                Logger.error("Get Acts ",err);
              });
          } catch (err) {
            Logger.error("Get Acts ",err);
          }
        }
      }
      await sleep(config.delay* 1000);
    }
  });

}
export default BeBoundService
