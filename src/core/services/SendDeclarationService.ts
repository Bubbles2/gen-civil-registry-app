import { useSelector } from 'react-redux';
import flatten from "flat";
import { Realm } from "@realm/react";
import { updateStatusDb, getOfficeByCollectionPointCode, getDBConnection } from "./databaseService";
import Logger from "../Logger";
import createApiInstance from './axiosapi'
import logger from "../Logger";

// Local-only fields that must never be sent to the server.
const LOCAL_ONLY_FIELDS = ["ID", "TYPE", "STATUS", "ERROR", "network", "COLPOINT_CODE"];

// Pure: builds the wire payload for a declaration. `externalId` is the
// server-side idempotency key and must equal the local record ID.
export const buildDeclarationPayload = (declaration: any, officeCode: string) => {
  const flatdecl = flatten(declaration);
  if (declaration.TYPE === "NAISSANCE" || declaration.TYPE === "DECES") {
    LOCAL_ONLY_FIELDS.forEach(field => delete flatdecl[field]);
  }
  return {
    "officeCode": officeCode,
    "externalId": declaration.ID,
    "templateCode": declaration.TYPE == "DECES" ? "DECL_DECES" : "DECL_NAISS",
    "metadata": flatdecl,
  };
};

export const sendDeclaration = async (declaration: any, endpoint) => {
  const api = createApiInstance(endpoint)
  Logger.debug("API created, flatten declaration ...");
  let tempColPtsCode = declaration.COLPOINT_CODE

  try {
    Logger.debug("get DB Connection ...");
    const db = await getDBConnection();
    Logger.debug("db connected ... getting officeId ...");
    const office = await getOfficeByCollectionPointCode(db, tempColPtsCode);
    Logger.debug("Office found : "+office.id+" - "+office.code);

    const convertedDecl = buildDeclarationPayload(declaration, office.code);

    Logger.debug("sending declaration to office code "+office.code);
    Logger.debug("notification : "+ JSON.stringify(convertedDecl));

    return api.post(endpoint, convertedDecl, { timeout: 5000 });

    // Continue with your logic here
  } catch (error) {
    Logger.error("sendDeclaration _ Err getting office code for collection point  ", declaration.ACT.POINT_COLLECTE);
  }

};
const updateStatus = (id, newStatus, error) => {
  updateStatusDb(id, newStatus, error)
    .catch(err => {
      Logger.error("Update DB - sendDeclaration ",err);
    });
};

//todo verify its still working
export const sendBatch = (acts, updateNotifications, endpoint) => {
  Logger.debug("send batch ",acts)
  acts.forEach(act => {
    Logger.debug("one act  ",act)
    sendDeclaration(act, endpoint).then(response => {
      Logger.debug("response send ",response)
        updateStatus(new Realm.BSON.ObjectId(act.ID.toString()), "ARCHIVE", "");
        updateNotifications(0, 1);
      }, err => {
        updateStatus(
          new Realm.BSON.ObjectId(act.ID.toString()), "ERREUR", err.toString());
        updateNotifications(1, 0);
        Logger.error("Update DB - sendDeclaration ",err);
      Logger.error("Update DB - endpoint ",endpoint);
      },
    ).catch(error => {
      Logger.error("Update DB - catch all batch ",endpoint);
    });
  });
};

