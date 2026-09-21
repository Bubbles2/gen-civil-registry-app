import SdkJs from "./SdkJs";
import { logger ,consoleTransport, fileAsyncTransport,transportFunctionType } from "react-native-logs";

type fileTransportProp =  {
  msg: any;
  rawMsg: any;
  level: {
      severity: number;
      text: string;
  };
  extension?: string | null | undefined;
  options?: any;
}
const filesTransport : transportFunctionType<any> = (props : fileTransportProp) =>{
    SdkJs.writeLog(props.level.text + ":" + props.msg,"log.txt")
}

const config = {
    levels: {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    },
    severity: __DEV__ ? "debug" : "error",
    transport: __DEV__ ? consoleTransport : filesTransport,
    enabledExtensions: ["HomeScreen", "LoginScreen","Forms","Dashboard"],
    transportOptions: {
      colors: {
        info: "blueBright",
        warn: "yellowBright",
        error: "redBright",
      },
    },
 
  };

// react-native-logs 5.1+: first type parameter is the transport type, second the level union.
export default logger.createLogger<transportFunctionType<any>, "debug" | "info" | "warn" | "error">(config);