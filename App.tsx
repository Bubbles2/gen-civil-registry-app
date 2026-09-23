import React, {useEffect, useCallback, useState, JSXElementConstructor} from "react";
import {initDb, getDBConnection, addUser, existLogin} from "./src/core/services/databaseService";
import {Provider as PaperProvider} from "react-native-paper";
import {NavigationContainer} from "@react-navigation/native";
import Router from "./src";
import {theme} from "./src/core/theme";
import "./src/core/i18n";
import {saveKeyRealm} from "./src/core/RealmConfig";
import {initDeclarationStore} from "./src/core/db/bootstrap";
import Logger from "./src/core/Logger";
import { SQLiteDatabase} from "react-native-sqlite-storage";
import SdkJs from "./src/core/SdkJs";
import {useTranslation} from "react-i18next";
import { useDispatch } from 'react-redux';
import { setupActions } from './src/store/setup-slice';
import BcryptReactNative from 'bcrypt-react-native';
import BuildConfig from 'react-native-build-config';


const App = () : React.JSX.Element  => {
  const {t} = useTranslation();
  const [key, setKey] = useState(null);

  const dispatch = useDispatch()

  const init = useCallback(async () => {
    try {
      const loadingStart = t('loading.start');
      const loadingEnd = t('loading.end');
      SdkJs.JsLoader(loadingStart)
      const db : SQLiteDatabase = await getDBConnection();
      // TODO if there were changes get collection points from DBif phone collection point not set  
      const cpObjects =  await initDb(db);
      if (__DEV__ && BuildConfig.FLAVOR === 'dev' && !(await existLogin(db, 'testuser'))) {
        const salt = await BcryptReactNative.getSalt(12);
        const password = await BcryptReactNative.hash(salt, 'test1234');
        await addUser(
          db,
          'testuser',
          password,
          'Test',
          'User',
          'MOBILITY_ADM',
          '',
          '4102444800000',
          '',
          'TESTUSER',
        );
      }
      dispatch(setupActions.addCollectionPoints(cpObjects))
      SdkJs.changeAlert("success",loadingEnd)
    } catch (error) {
      const loadingError = t('loading.problem');
      Logger.error("App init ",error)
      SdkJs.changeAlert("error",loadingError)
    }
  }, []);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const tempKey = await saveKeyRealm();
        // The encryption key has to be in AsyncStorage before the store opens:
        // SQLCipher takes the same value Realm used. The Realm -> SQLite copy
        // runs here, before the navigator mounts, so no screen can read the
        // store while it is half-filled. On every later launch this is a single
        // "already-done" lookup.
        const migration = await initDeclarationStore();
        if (migration.outcome === "migrated") {
          Logger.info(`App: migrated ${migration.copied} declarations from Realm`);
        }
        setKey(tempKey);
      } catch (error) {
        Logger.error("App fetchData: failed to prepare the declaration store", error);
        SdkJs.changeAlert("error", t('loading.problem'));
      }
    }
    fetchData();
  }, []);





  return (

      <PaperProvider theme={theme}>
        {/* `key` is still the gate, but it now also means "the declaration
            store is open and any Realm migration has finished". RealmProvider
            is gone: nothing in the app reads Realm any more except the
            migrator, which opens it read-only and only once. */}
        {key &&  (
          <NavigationContainer>
            <Router />
          </NavigationContainer>
        )}

      </PaperProvider>
  );
};

export default App;
