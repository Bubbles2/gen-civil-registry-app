import  DEATH_DATA  from "./DeathData";
import Realm from "realm";

export class DECES extends Realm.Object {
  DEATH_DATA?: DEATH_DATA;

  static schema = {
    name: "DECES",
    properties: {
      DEATH_DATA: "DEATH_DATA",
    }
  };
}

export default DECES;
