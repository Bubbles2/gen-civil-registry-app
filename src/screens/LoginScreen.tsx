import React, { useRef, useEffect } from "react";
import {
  TouchableOpacity,
  StyleSheet,
  View,
  ToastAndroid,
  Image,
  Linking,
  Alert
} from "react-native";
import Background from "../components/common/Background";
import ButtonDgt from "../components/common/Button";
import TextInput from "../components/common/TextInput";
import { theme } from "../core/theme";
import { Navigation } from "../types";
import { getDBConnection, existLogin, getPhoneCollectionPoint, getUserbyLogin, addUser, updateTokenUser, getCollectionPoints, setPhoneCollectionPoint,getOfficeByCode } from "../core/services/databaseService";
import "react-native-get-random-values";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Appbar, Modal, Portal, Text, Button, Provider,TextInput as RnpInput } from "react-native-paper";
import SdkJs from "../core/SdkJs";
import Logger from "../core/Logger";
import BcryptReactNative from 'bcrypt-react-native';
import jwt_decode from "jwt-decode";
import { useDispatch, useSelector } from "react-redux";
import { userActions } from '../store/user-slice';
import { SelectList } from "react-native-dropdown-select-list";
import { setupActions } from "../store/setup-slice";
import configJson from "../configuration/crsen-config-dev.json";
import { PermissionsAndroid } from "react-native";
import axios, { AxiosError } from "axios";
import Logo from "../components/common/Logo";
import { checkMultiplePermissions } from "../core/permission/Permissions";
import BuildConfig from "react-native-build-config";
import { exportDatabases } from "../core/services/exportService";


type Props = {
  navigation: Navigation;
  login: Function;
};
const LoginScreenLog = Logger.extend("LoginScreen");

// versionCode is 1 in every flavor; the git SHA (build.gradle GIT_SHA) is
// what identifies the build actually installed on a phone.
const BUILD_ID = `${BuildConfig.VERSION_NAME} · ${BuildConfig.FLAVOR} · ${BuildConfig.GIT_SHA}`;

const LoginScreen = ({ navigation, ...props }: Props) => {
  // todo Make sure to clear redux for logout
  const dispatch = useDispatch();
  const data = { login: "", password: "" };
  const { t } = useTranslation();
  const ref1 = useRef();

  const [visible, setVisible] = React.useState(false);
  const [isPermissionGranted,setPermissionGranted] = React.useState(false)
  const [colPointError, setColPointError] = React.useState(false);
  const [collectionPoints, setCollectionPoints] = React.useState([]);
  const [isPwVisible, setPwVisible] = React.useState(false);

  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);


  const phoneCollectionPoint = useSelector((state) => {
    return state.setup.PhoneCollectionPoint;
  });

  let perm = [
    PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
    PermissionsAndroid.PERMISSIONS.SEND_SMS,
    PermissionsAndroid.PERMISSIONS.READ_SMS,
    PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  ];

  

  useEffect(() => {
    if(isPermissionGranted){
      init()
    }
  }, [isPermissionGranted]);

  useEffect(() => {
    const askPermission = async() =>{
      try{
        while(!isPermissionGranted){
          Logger.debug('permission is not granted')
          const result = await requestPermissions()
          if(result === "granted"){
            setPermissionGranted(true)
            return 
          } else if(result === "denied"){
            setPermissionGranted(false) 
          }else if(result === "blocked"){
            setPermissionGranted(false)
            SdkJs.alertPermission()
            return
          }        
        }
      }catch(err){
        LoginScreenLog.error(err)
      }
    }
    askPermission()
    
  }, [isPermissionGranted]);

  const init = () =>{
    LoginScreenLog.info("Request permission");
    LoginScreenLog.debug("json : ", configJson);    
        getDBConnection().then((db: any) => {
          getPhoneCollectionPoint(db).then(cprow => {
            if (cprow !== null) {
              dispatch(setupActions.updatePhone(cprow.code));
              dispatch(setupActions.updatePhoneCollectionPointLabel(cprow.label));
              dispatch(setupActions.updatePhoneCPType(cprow.type));
              getOfficeByCode(db, cprow.code).then(office => {
                if (office !== null) {
                  dispatch(setupActions.updatePhoneCP_Office(office));
                }
              }).catch(err => {
                LoginScreenLog.error(err)
              });          
            } else { 
              showModal() 
            }
            getCollectionPoints(db).then(cps => {
              if (cps !== null) {           
                setCollectionPoints(cps);
              }
            }).catch(err => {
              LoginScreenLog.error(err)
            });
          }).catch(err => {
            LoginScreenLog.error(err)
          });
        }).catch(err => {
          LoginScreenLog.error(err)
        });
  }

  const requestPermissions = async (): Promise<String | null> => {
    //Add permission if needed , WARNING => don't forget to add in manifest too

    try {
      const granted = await checkMultiplePermissions(perm);
      LoginScreenLog.info("Permission granded ", granted);
      return granted

    } catch (err) {
      LoginScreenLog.error("RequestPermissions ", err);
    }
    return null;
  };


  const setCollectionPoint = async (item) => {
    setColPointError(false);
    try {     
      const selectedObject = collectionPoints.find(obj => obj.value === item);
      const db = await getDBConnection();
      const result = await setPhoneCollectionPoint(db, selectedObject.key, 1);
      dispatch(setupActions.updatePhone(selectedObject.key));
      dispatch(setupActions.updatePhoneCPType(selectedObject.type))
    } catch (error) {
      LoginScreenLog.error("SQLite Error:", error);
    }
  };

  const continueBtn = () => {
    
    getDBConnection().then((db: any) => {
      getPhoneCollectionPoint(db).then(cp => {
        if (cp == null) {
          setColPointError(true);
          return;
        }
        hideModal()
        LoginScreenLog.debug("dev ? ", __DEV__)
        checkMultiplePermissions(perm).then(res=>{
          if(res === "granted"){
            SdkJs.init(JSON.stringify(configJson), __DEV__)
          }else{
            SdkJs.alertPermission()
          }
        }).catch(err=>{
           LoginScreenLog.error(err)
        })
        
      }).catch(err => {
        LoginScreenLog.error(err)
      });
    }).catch(err => {
      LoginScreenLog.error(err)
    });

  };

  const { handleSubmit, setValue, control, register, watch, getValues, reset } =
    useForm({
      mode: "onChange",
      data,
    });

  const onSubmit = (props) => {
    checkMultiplePermissions(perm).then(res=>{
      if(res === "granted"){
        Logger.debug("submit login process");
        SdkJs.JsLoader("Connexion en cours")
        onLoginPressed(props)
      }else{
        SdkJs.alertPermission()
      }
    }).catch(err=>{
       LoginScreenLog.error(err)
    })
  };
  const onError = (errors) => {
    //
  };

  // Hidden support action: long-press the build ID to copy the Realm and
  // SQLite databases to app-specific external storage for `adb pull`.
  const onExportDatabases = () => {
    Alert.alert(
      "Export des bases de données",
      "Copier les bases Realm et SQLite dans le stockage externe de l'application ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Exporter",
          onPress: () => {
            exportDatabases()
              .then(dir => Alert.alert("Export terminé", dir))
              .catch(err => {
                LoginScreenLog.error("exportDatabases ", err);
                Alert.alert("Export échoué", err.toString());
              });
          },
        },
      ],
    );
  };

  const fetchLoginUser = async (schema, domain, port, path, username, password) => {
    const userData = JSON.stringify({
      username: username,
      password: password,
    })
    Logger.debug(userData)

    try {
      const regexPath = new RegExp('^/');
      const response = await axios.post(schema + "://" + domain + ":" + port + (regexPath.test(path) ? path : ("/" + path)) + "/login", userData, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    
      return response
    } catch (reason: AxiosError) {
      LoginScreenLog.error("fetchLoginUser ", JSON.stringify(reason))
      return Promise.reject(JSON.stringify(reason))
    }
  };

  const onLoginPressed = (props) => {
    Logger.debug("try to get DB Connection");
    getDBConnection().then((db: any) => {
      Logger.debug("connected to Database, trying to get existing user");
      // Should be namew
      existLogin(db, props.login).then(exist => {
        Logger.debug("exist login in database ? {}", exist);
        // If user exist on db
        if (exist) {
          // Why 2 times getUserbyLogin ?
          getUserbyLogin(db, props.login).then(user => {
            // Again if exists on local db
            if (user != null) {
              // how can this happen ? response when user change his password
              if (user.password === null) {
                SdkJs.getHttpConfig().then(res => {
                  // Name again
                  fetchLoginUser(res.schema, res.domain, res.port, res.path, props.login, props.password).then((res) => {                  
                    onResponseWs(db, res.data.exp, props)
                  }).catch(err => {
                    var jsonParsed = JSON.parse(err)
                    switch (jsonParsed.code) {
                      case "ERR_BAD_REQUEST": SdkJs.changeAlert("error", t("message.error.401"))
                        break
                      case "INTERNAL_SERVER": SdkJs.changeAlert("error", t("message.error.500"))
                      break
                      case "ERR_BAD_RESPONSE": SdkJs.changeAlert("error", t("message.error.500"))
                        break
                      case "ERR_NETWORK": SdkJs.changeAlert("error", jsonParsed.message)
                        break
                      case "ECONNABORTED": SdkJs.changeAlert("error", t("message.error.timeout"))
                        break
                      default: SdkJs.changeAlert("error", jsonParsed.message)
                        break
                    }
                    LoginScreenLog.error("onLoginPressed,fetchLoginUser ", err)
                  })
                })

              } else {
                // if password is not null
                BcryptReactNative.compareSync(props.password, user.password).then(pwDecrypted => {
                  if (pwDecrypted) {
                    // and not expired
                    if (user.expiration_datetime > Date.now()) {
                      if (user.role !== 'MOBILITY_ADM') {
                        getDBConnection().then((db: any) => {
                          if (user.collection_point_code !== phoneCollectionPoint) {
                            const code_dont_match = t('message.error.bad_col_point');
                            SdkJs.changeAlert("error", code_dont_match)
                          } else {
                            dispatch(userActions.login({
                              name: props.login,
                              role: user.role,
                              collection_point_code: phoneCollectionPoint,                            
                              token: user.token,
                              user_code: user.user_code
                            }));
                            SdkJs.changeAlert("success", "connexion réussi")
                            navigation.navigate("Dashboard");
                          }                 
                        })
                      } else {
                        dispatch(userActions.login({
                          name: props.login,
                          role: user.role,
                          collection_point_code: phoneCollectionPoint,
                          token: user.token,
                          user_code: user.user_code
                        }));
                        SdkJs.changeAlert("success", "connexion réussi")
                        navigation.navigate("Dashboard");
                      }
                    } else {
                      // if expired get token from ws
                      SdkJs.getHttpConfig().then(res => {
                        fetchLoginUser(res.schema, res.domain, res.port, res.path, props.login, props.password).then((res) => {                       
                          onResponseWs(db, res.data.token, props)
                        }).catch(err => {
                          var jsonParsed = JSON.parse(err)
                          switch (jsonParsed.code) {
                            case "ERR_BAD_REQUEST": SdkJs.changeAlert("error", t("message.error.401"))
                              break
                            case "INTERNAL_SERVER": SdkJs.changeAlert("error", t("message.error.500"))
                              break
                              case "ERR_BAD_RESPONSE": SdkJs.changeAlert("error", t("message.error.500"))
                            break
                            case "ERR_NETWORK": SdkJs.changeAlert("error", jsonParsed.message)
                              break
                            case "ECONNABORTED": SdkJs.changeAlert("error", t("message.error.timeout"))
                              break
                            default: SdkJs.changeAlert("error", jsonParsed.message)
                              break
                          }
                          LoginScreenLog.error("onLoginPressed,fetchLoginUser, user.expiration_datetime > Date.now() ", err)
                        })
                      })
                    }
                  } else {
                    LoginScreenLog.error("onLoginPressed ", "Probleme interne decrypt pw")
                    SdkJs.changeAlert("error", "Erreur interne")
                  }
                }).catch(err => {
                  SdkJs.changeAlert("error", err.toString())
                  LoginScreenLog.error("onLoginPressed,BcryptReactNative.compareSync ", err)
                })
              }
            } else {
              SdkJs.changeAlert("error", "Le login et/ou le mot de passe sont incorrects")
            }
          }).catch(err => {
            SdkJs.changeAlert("error", err.toString())
            LoginScreenLog.error("onLoginPressed,getUserByLogin ", err)
          })

        } else {
          // User doesn't exist on db get token from ws
          SdkJs.getHttpConfig().then(res => {
            // name
            fetchLoginUser(res.schema, res.domain, res.port, res.path, props.login, props.password).then((res) => {
              onResponseWs(db, res.data.token, props)
            }).catch(err => {
              var jsonParsed = JSON.parse(err)
              switch (jsonParsed.code) {
                case "ERR_BAD_REQUEST": SdkJs.changeAlert("error", t("message.error.401"))
                  break
                case "INTERNAL_SERVER": SdkJs.changeAlert("error", t("message.error.500"))
                  break
                case "ERR_NETWORK": SdkJs.changeAlert("error", jsonParsed.message)
                  break
                case "ERR_BAD_RESPONSE": SdkJs.changeAlert("error", t("message.error.500"))
                  break
                case "ECONNABORTED": SdkJs.changeAlert("error", t("message.error.timeout"))
                  break
                default: SdkJs.changeAlert("error", jsonParsed.message)
                  break
              }
              LoginScreenLog.error("onLoginPressed,fetchLoginUser", err)
            })
          })
        }
      }).catch(err => {
        SdkJs.changeAlert("error", err.toString())
        LoginScreenLog.error("onLoginPressed,existLogin ", err)
      })
    })
  };

  const onResponseWs = (db, token, props) => {

    const decoded = jwt_decode(token);
    LoginScreenLog.debug("token decoded", decoded)
    getUserbyLogin(db, data.login).then(user => {
      if (user) {
        LoginScreenLog.debug("user", user)
        const pwDecrypted = BcryptReactNative.compareSync(props.password, user.password)
        LoginScreenLog.debug("pwdecrypt", pwDecrypted)
        if (pwDecrypted) {
          updateTokenUser(db, user.id, token, decoded.exp * 1000).then(res => {
            if (user.role !== 'MOBILITY_ADM') {
              getDBConnection().then((db: any) => {
                if (user.collection_point_code !== phoneCollectionPoint) {
                  SdkJs.changeAlert("error", t('message.error.bad_col_point'))
                } else {
                  dispatch(userActions.login({
                    name: props.login,
                    role: user.role,
                    collection_point_code: phoneCollectionPoint,
                    token: token,
                    user_code: user.user_code
                  })
                  );
                  SdkJs.changeAlert("success", "Connexion réussi")
                  navigation.navigate("Dashboard");
                }
              })
            } else {
              dispatch(userActions.login({
                name: props.login,
                role: user.role,
                collection_point_code: phoneCollectionPoint,
                token: user.token,
                user_code: user.user_code
              }));
              SdkJs.changeAlert("success", "connexion réussi")
              navigation.navigate("Dashboard");
            }
          }).catch(err => {
            SdkJs.changeAlert("error", err.toString())
            LoginScreenLog.error("onResponseWs,updateTokenUser ", err)
          })
        }
      } else {
        //encrypt pw and add user to db
        BcryptReactNative.getSalt(12).then(res => {
          BcryptReactNative.hash(res, props.password).then(encryptPw => {
            // Get highest role
            let role = ""

            const i = decoded.roles.indexOf('MOBILITY_ADM')
            // if its MOBILITY_ADM , we should also ADMINISTRATOR otherwise the other two roles
            // are the only elements in the array by themselves

            if (i >= 0) {
              role = decoded.roles[i]
              addUser(db, props.login, encryptPw, 'Firstname', 'Lastname', role, token, decoded.exp * 1000, "", phoneCollectionPoint, decoded.code).catch(err => {
                LoginScreenLog.error("onResponseWs,noCollectionPointIdByCode ", err)
              })
              dispatch(userActions.login({
                name: props.login,
                role: role,
                collection_point_code: phoneCollectionPoint,
                token: token,
                user_code: decoded.code
              }))
              SdkJs.changeAlert("success", "Connexion réussi")
              navigation.navigate("Dashboard");
            } else {
              role = decoded.roles[0]
              if (role !== 'MOBILITY_ADM') {
                if (decoded.cpc !== phoneCollectionPoint) {
                  SdkJs.changeAlert("error", t('message.error.bad_col_point'))
                } else {
                    addUser(db, props.login, encryptPw, 'Firstname', 'Lastname', role, token, decoded.exp * 1000, phoneCollectionPoint, decoded.code).then(res => {

                      Logger.debug("token user receive", token)
                      dispatch(userActions.login({
                        name: props.login,
                        role: role,
                        collection_point_code: phoneCollectionPoint,                     
                        token: token,
                        user_code: decoded.code
                      }))
                      SdkJs.changeAlert("success", "Connexion réussi")
                      navigation.navigate("Dashboard");
                    }).catch(err => {
                      SdkJs.changeAlert("error", err.toString())
                      LoginScreenLog.error("onResponseWs,getCollectionPointIdByCode ", err)
                    })
                
                }
              }
            }
          }).catch(err => {
            SdkJs.changeAlert("error", err.toString())
            LoginScreenLog.error("onResponseWs,BcryptReactNative.hash ", err)
          })
        }).catch(err => {
          SdkJs.changeAlert("error", err.toString())
          LoginScreenLog.error("onResponseWs,BcryptReactNative.getSalt ", err)
        })
      }
    }).catch(err => {
      SdkJs.changeAlert("error", err.toString())
      LoginScreenLog.error("onResponseWs,getUserbyLogin ", err)
    })

  }

  return (
    <View style={styles.container}>

      <Background>
        <Portal>
          <Modal visible={visible} onDismiss={hideModal} dismissable={false} contentContainerStyle={{
            backgroundColor: 'white',
            width: '80%',
            alignSelf: 'center', padding: 30
          }}>
            <View style={styles.border}>
              <Text style={styles.modals}>{t("collect.request")}</Text>
              <SelectList setSelected={(val) => setCollectionPoint(val)}
                data={collectionPoints}
                onDismiss={continueBtn}
                placeholder={t("collect.holder")}
                inputStyles={styles.inputCp}
                dropdownTextStyles={styles.dropdownCp}
                dropdownStyles={styles.inputCp}
                boxStyles={styles.boxCp}
                save="value" />
              {colPointError && <Text style={styles.errmsg}>* {t("message.error.blank_col_point")}</Text>}
            </View>
            <Button onPress={continueBtn}>{t("collect.save")}</Button>
          </Modal>
        </Portal>


        <View style={styles.innerview}>
          <Logo />
          <TextInput
            label={t("label-input.identifier")}
            returnKeyType="next"
            onSubmitEditing={() => {
              ref1.current.focus();
            }}
            control={control}
            register={register}
            type="string"
            name="login"
            required
          />
          <TextInput
            myRef={ref1}
            label={t("label-input.password.default")}
            returnKeyType="ok"
            control={control}
            register={register}
            secureTextEntry={!isPwVisible}
            type="string"
            name="password"
            right={<RnpInput.Icon icon="eye" onPress={() => setPwVisible(!isPwVisible)} />}
            keyboardType={"default"}
            required
          />

          <ButtonDgt
            backgroundColor={theme.colors.primary}
            onPress={handleSubmit(onSubmit, onError)}>
            {t("button.signin")}
          </ButtonDgt>
          <Text style={styles.buildId} onLongPress={onExportDatabases}>{BUILD_ID}</Text>
        </View>
      </Background>
    </View>
  );
};

const styles = StyleSheet.create({
  border: {
    borderWidth: 2,
    borderRadius: 10,
    borderColor: "gray",
    padding: 30,
  },
  errmsg: {
    color: "red",
  },
  modals: {
    marginBottom: 20,
    marginTop: 10
  },
  forgotPassword: {
    width: "100%",
    alignItems: "flex-end",
    marginBottom: 24,
  },
  background: {
    justifyContent: "center",
    flexDirection: "row",
    flex: 0.9,
  },
  row: {
    flexDirection: "row",
    marginTop: 4,
    alignSelf: "center",
  },
  label: {
    color: theme.colors.secondary,
    marginEnd: 12,
  },
  link: {
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  container: {
    flex: 1,
  },
  image: {
    width: "50%",
    alignSelf: "flex-end",
    resizeMode: "contain",
    height: 100,
  },
  innerview: {
    flex: 1,
    justifyContent: "center",
  },
  buildId: {
    marginTop: 12,
    alignSelf: "center",
    fontSize: 11,
    color: theme.colors.secondary,
  },
  inputCp: {
    color: "#808080",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  dropdownCp: {
    color: "black",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  boxCp: {
    backgroundColor: "#ffffff",
    color: "#000000",
    minHeight: 60,
    alignItems: "center",
  },
});

export default LoginScreen

