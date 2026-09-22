import React, {useEffect, useCallback, useState, JSXElementConstructor} from "react";
import {initDb, getDBConnection, addUser, existLogin} from "./src/core/services/databaseService";
import {Provider as PaperProvider} from "react-native-paper";
import {NavigationContainer} from "@react-navigation/native";
import Router from "./src";
import {theme} from "./src/core/theme";
import "./src/core/i18n";
import {saveKeyRealm} from "./src/core/RealmConfig";
import FormsContext from "./src/realmSchema/Forms";
const {RealmProvider} = FormsContext;
import Logger from "./src/core/Logger";
import { SQLiteDatabase} from "react-native-sqlite-storage";
import SdkJs from "./src/core/SdkJs";
import {useTranslation} from "react-i18next";
import { useDispatch } from 'react-redux';
import { setupActions } from './src/store/setup-slice';
import BcryptReactNative from 'bcrypt-react-native';
import BuildConfig from 'react-native-build-config';


const App = () : JSX.Element  => {
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
        setKey(tempKey);
      } catch (error) {
        Logger.error("App fetchData: failed to get Realm key", error);
        SdkJs.changeAlert("error", t('loading.problem'));
      }
    }
    fetchData();
  }, []);





  return (

      <PaperProvider theme={theme}>
        {key &&  (
          <RealmProvider encryptionKey={key}>
            <NavigationContainer>
              <Router />
            </NavigationContainer>
          </RealmProvider>
        )}

      </PaperProvider>
  );
};

export default App;
