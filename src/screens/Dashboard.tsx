import React, { useEffect } from "react";
import { View, Linking, NativeEventEmitter, ToastAndroid, StyleSheet } from "react-native";
import Button from "../components/common/Button";
import DataTableHandler from "../components/common/DataTableHandler";
import { Navigation } from "../types";
import { theme } from "../core/theme";
import Background from "../components/common/Background";
import { connect, useStore } from "react-redux";
import Fab from "../components/common/Fab";
import { useTranslation } from "react-i18next";
import {
  Appbar,
  RadioButton,
  Text,
  Checkbox,
  Divider,
  Portal,
  Dialog as RDialog,
} from "react-native-paper";
import SdkJs from "../core/SdkJs";
import { Menu } from "react-native-paper";
import { getListValuesByCode } from "../core/services/databaseService";
import {
  updateStatusDb,
  getAllValidAct,
  getAllFormByIds,
  deleteNotification,
} from "../core/db/declarations";
import { useDeclarations } from "../core/db/useDeclarations";
import BackgroundService from "react-native-background-actions";
import { useSelector, useDispatch } from 'react-redux';
import MenuStatus from '../components/MenuStatus'
import MenuType from '../components/MenuType'
import MenuAdmin from '../components/MenuAdmin'
import Logger from "../core/Logger";
import BuildConfig from "react-native-build-config";
import { userActions } from '../store/user-slice';
import { getDBConnection } from "../core/services/databaseService"
import { listActions } from "../store/listSlice"
import Searchbar from "../components/common/Searchbar";
import { Dialog as GenericDialog } from "../components/common/Dialog";
import { formatDataForBackBirth } from "../core/control/birthFormValidate";
import { formatDataForBackDeath } from "../core/control/deathFormValidate";

import { sendDeclaration } from "../core/services/SendDeclarationService";
import moment from "moment";

type Props = {
  navigation: Navigation;
  route?: { params?: { resetFilter?: boolean } };
};

const Dashboard = ({ navigation, route, ...props }: Props) => {
  const useBebound = BuildConfig.useBebound
  const dispatch = useDispatch()
  const { t } = useTranslation();
  const [visibleMenu, setVisibleMenu] = React.useState(false);
  const [valuesFormClick, setValuesFormClick] = React.useState({});
  const [visibleChoiceDialog, setVisibleChoiceDialog] = React.useState(false);
  const [isServiceRunning, setServiceRunning] = React.useState(null);
  const [config, setConfig] = React.useState(null);
  const [valueType, setValueType] = React.useState("TOUS");
  const [valueCb1, setValueCb1] = React.useState(true);
  const [valueCb2, setValueCb2] = React.useState(false);
  const [valueCb3, setValueCb3] = React.useState(false);
  const [valueCb4, setValueCb4] = React.useState(true);
  const [valuesFilteredSearch, setValuesFilteredSearch] = React.useState([]);
  const [valueSearch, setValueSearch] = React.useState("")
  const [checkedCheckBoxData, setCheckedCheckBoxData] = React.useState([]);
  const [countResponseDataManualSend, setCountResponseDataManualSend] = React.useState(0);
  const [checkedCheckBoxDataLength, setCheckedCheckBoxDataLength] = React.useState(0);
  const [visibleCheckBoxManualSend, setVisibleCheckBoxManualSend] = React.useState(false);

  const [responseDataManualSend, setResponseDataManualSend] = React.useState([]);
  const [visibleDialogResponseDataManualSend, setVisibleDialogResponseDataManualSend] = React.useState(false);

  const [endpoint, setEndpoint] = React.useState(null)



  /** Gestion de l'état de la barre de recherche */
  const handleChangeSearch = (value) => {
    setValueSearch(value)
  }
  Linking.addEventListener("url", handleOpenURL);

  const userState = useSelector((state) => {
    return state.user
  });

  const userIsAdmin = userState.role === 'MOBILITY_ADM' ? true : false

  const listState = useSelector((state: ListState) => {
    return state.stateList
  });


  const [visibleDialogConfirmDuplicate, setVisibleDialogConfirmDuplicate] = React.useState(false);
  const hideDialogConfirmDuplicate = () => setVisibleDialogConfirmDuplicate(false);
  const [visibleDialogConfirmDelete, setVisibleDialogConfirmDelete] = React.useState(false);
  const hideDialogConfirmDelete = () => setVisibleDialogConfirmDelete(false);

  const handleClickOkDialogConfirmDuplicate = () => {
    hideDialogConfirmDuplicate()
    navigation.navigate("Forms", {
      id: valuesFormClick.id,
      type: valuesFormClick.type,
      duplicate: true
    });

  }

  const handleClickOkDialogConfirmDelete = () => {
    hideDialogConfirmDelete()
    deleteNotification(valuesFormClick.id).then(res => {
      //res === true , success
    }).catch(err => {
      Logger.error("err", err);
    })
  }

  useEffect(() => {
    if (route?.params?.resetFilter === true) {
      setValueType("TOUS")
      setValueCb1(true)
      setValueCb2(false)
      setValueCb3(false)
      setValueCb4(true)
    }
  }, [route?.params])

  useEffect(() => {
    SdkJs.getHttpConfig().then((res: { schema: string, domain: string, port: number, path: string }) => {
      const regexPath = new RegExp('^/');
      setEndpoint(res.schema + "://" + res.domain + ":" + res.port + (regexPath.test(res.path) ? res.path : ("/" + res.path)) + "/v1/notification")
    }).catch(err => {
      Logger.error(err)
    })
  }, [])


  //refresh data with search + filter
  useEffect(() => {
    setValuesFilteredSearch(filterDataSearch(valueSearch))
  }, [valueSearch, valueType, valueCb1, valueCb2, valueCb3, valueCb4]);

  const manageTypeChange = (newValue) => {
    setValueType(newValue)
    closeMenu()
  }

  const status1 = valueCb1 ? "BROUILLON" : null;
  const status2 = valueCb2 ? "VALIDE" : null;
  const status3 = valueCb3 ? "ARCHIVE" : null;
  const status4 = valueCb4 ? "ERREUR" : null;


  const initList = () => {
    const allCode = ["LISTE_HOPITAUX", "PROFESSION", "YES_NO", "LST_SEX", "ISEE.LIEU_ACCOUCHEMENT", "ISEE.NAI_MULTIPLE_BIRTH", "ACT_NAI.BIRTH_DECL_TPML", "VILLE"]
    allCode.forEach(element => {
      if (listState.list[element] === undefined || listState.list[element].length === 0) {
        getDBConnection().then(db => {
          getListValuesByCode(db, element).then(res => {
            let temp = {
              type: element,
              value: res
            }
            dispatch(listActions.addList(temp))
          }).catch(err => {
            Logger.error(err)
          })
        }).catch(err => {
          Logger.error(err)
        })
      }
    });


  }

  useEffect(() => {
    initList()
  }, [])

  const sortFormData = (data) => {
    const map = data.map((element) => {
      if (element.TYPE === "NAISSANCE") {
        if (element.STATUS === "BROUILLON") {
          element["SORT_WEIGTH"] = 1
        } else if (element.STATUS === "ERREUR") {
          element["SORT_WEIGTH"] = 3
        } else if (element.STATUS === "VALIDE") {
          element["SORT_WEIGTH"] = 5
        } else if (element.STATUS === "ARCHIVE") {
          element["SORT_WEIGTH"] = 7
        }
      } else if (element.TYPE === "DECES") {
        if (element.STATUS === "BROUILLON") {
          element["SORT_WEIGTH"] = 2
        } else if (element.STATUS === "ERREUR") {
          element["SORT_WEIGTH"] = 4
        } else if (element.STATUS === "VALIDE") {
          element["SORT_WEIGTH"] = 6
        } else if (element.STATUS === "ARCHIVE") {
          element["SORT_WEIGTH"] = 8
        }
      }
      return element
    }).sort((a, b) => {
      let tempA, tempB
      if (a.TYPE === "NAISSANCE") {
        tempA = a?.CHILD?.INFO_NAI?.EVT_DATE !== "" ? a.CHILD.INFO_NAI.EVT_DATE : a.ACT_NAI.ACCOUCHEMENT_DATE
      } else if (a.TYPE === "DECES") {
        tempA = a.DEFUNCT.INFO_DEC.EVT_DATE
      }
      if (b.TYPE === "NAISSANCE") {
        tempB = b?.CHILD?.INFO_NAI?.EVT_DATE !== "" ? b.CHILD.INFO_NAI.EVT_DATE : b.ACT_NAI.ACCOUCHEMENT_DATE
      } else if (b.TYPE === "DECES") {
        tempB = b.DEFUNCT.INFO_DEC.EVT_DATE
      }
      if (a["SORT_WEIGTH"] !== b["SORT_WEIGTH"]) {
        return a["SORT_WEIGTH"] - b["SORT_WEIGTH"]
      } else {
        if (moment(moment(tempA, "DD/MM/YYYY")).isAfter(moment(tempB, "DD/MM/YYYY"))) {
          return -1
        } else {
          return 1
        }
      }

    })
    return map
  }

  // Was Realm's live useQuery("FORMS").filtered(...). useDeclarations runs the
  // same filter against SQLite and re-runs it after every write, so the list
  // still refreshes on save, validate, send and delete.
  const formData = useDeclarations({
    type: valueType,
    statuses: [status1, status2, status3, status4],
    colpointCode: userIsAdmin ? null : userState.collection_point_code,
  })


  const showToast = (msgKey: String) => {
    const message = t(msgKey);
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }

  function handleOpenURL(evt: { url: any; }) {
    // Will be called when the notification is pressed
    Logger.debug(evt.url);
    // do something
  }

  const log_out = () => {
    userActions.logout();
    navigation.navigate("LoginScreen");
  };

  //execute 2nd
  useEffect(() => {
    if (config === null) {
      SdkJs.getServiceConfig()
        .then((res: { [x: string]: any; delay: any; network: any; }) => {
          setConfig(() => ({
            delay: res.delay,
            network: res.network,
            "auto-send": res["auto-send"],
          }));
        })
        .catch((err: string) => {
          Logger.error("getServiceConfig ", err);
        });
    }
  }, []);

  const startService = async () => {
    const options = {
      taskName: "Service",
      taskTitle: "Envoi automatique",
      taskDesc: "Service en cours ...",
      linkingURI: "dashboard://chat/jane",
      parameters: {
        config
      },
      taskIcon: {
        name: "ic_launcher",
        type: "mipmap",
      },
      color: "#ff00ff",
    };

    if (!BackgroundService.isRunning()) {
      const backserv = await import('../core/services/RestApiService')
      await BackgroundService.start(backserv.default, options);
      setServiceRunning(true);
    }
  };

  const stopService = async () => {
    await BackgroundService.stop();
    setServiceRunning(false);
  };

  //execute 3rd
  useEffect(() => {
    if (config !== null) {
      if (config["auto-send"]) {
        startService();
      }
    }
  }, [config]);

  const showChoiceDialog = (status: string, id: any, type: any, error: any, name: string, firstname: string, date: string, hour: string) => {
    setValuesFormClick(prev => ({
      ...prev,
      status: status,
      id: id,
      type: type,
      error: error,
      name: name,
      firstname: firstname,
      date: date,
      hour: hour
    }));
    if (status === "BROUILLON" || status === "ERREUR") {
      setVisibleChoiceDialog(true);
    }
  };
  const hideChoiceDialog = () => setVisibleChoiceDialog(false);
  const openMenu = () => setVisibleMenu(true);
  const closeMenu = () => setVisibleMenu(false);

  useEffect(() => {
    if (
      valuesFormClick.status &&
      (valuesFormClick.status === "ARCHIVE" ||
        valuesFormClick.status === "VALIDE")
    ) {
      navigation.navigate("Forms", {
        id: valuesFormClick.id,
        type: valuesFormClick.type,
      });
    }
  }, [valuesFormClick]);

  useEffect(() => {
    if (countResponseDataManualSend > 0 && countResponseDataManualSend === checkedCheckBoxDataLength) {
      SdkJs.dismissLoader()
      setVisibleDialogResponseDataManualSend(true)
      setCheckedCheckBoxDataLength(0)
      setCountResponseDataManualSend(0)
    }
  }, [countResponseDataManualSend])

  const resetCheckBox = (id) => {
    let tempCheckedCheckBoxData = checkedCheckBoxData
    for (let i = 0; i < checkedCheckBoxData.length; i++) {
      if (checkedCheckBoxData[i].ID == id.toString()) {
        if (checkedCheckBoxData[i].status === "checked") {
          tempCheckedCheckBoxData[i].status = "unchecked"
        }
      }
    }
    setCheckedCheckBoxData(tempCheckedCheckBoxData)
  }

  const getNameResponseDataSend = (data) => {
    if (data.CHILD.NAME !== undefined && data.CHILD.NAME !== "") {
      return data.CHILD.NAME
    } else if (data.ACT_NAI.INDICATE_FATHER_y8n === "Oui" && data.FATHER.DECEASED === "Non") {
      return data.FATHER.NAME
    } else {
      return data.MOTHER.NAME
    }
  }


  const sendDataManually = () => {

    //convert checkedRowArray to arrayOfId for db query
    let arrayOfIds = []
    checkedCheckBoxData.forEach((element) => {
      if (element.status == "checked") {
        arrayOfIds.push(element.ID)
      }
    });
    setCheckedCheckBoxDataLength(arrayOfIds.length)
    arrayOfIds.forEach((element => {
      resetCheckBox(element)
    }))

    if (arrayOfIds.length > 0) {
      SdkJs.JsLoader("Envoi en cours ...")
      getAllFormByIds(arrayOfIds).then(res => {
        if (res != null && res.length > 0) {
          let temp = JSON.parse(JSON.stringify(res));

          //format data
          for (let j = 0; j < temp.length; j++) {
            let tempFormatData = formatData(temp[j].TYPE, temp[j])
            temp[j] = tempFormatData
          }

          Logger.debug("temp", temp)

          //sending
          temp.forEach(act => {

            Logger.debug("one act  ", act)
            if (act !== null && act !== undefined) {
              sendDeclaration(act, endpoint).then(response => {

                if (act.TYPE === "NAISSANCE") {
                  let formSummary = {
                    id: act.ID,
                    type: act.TYPE,
                    name: getNameResponseDataSend(act),
                    firstname: act.CHILD.FIRSTNAME,
                    date: act.CHILD?.INFO_NAI?.EVT_DATE !== undefined ? act.CHILD.INFO_NAI.EVT_DATE : act.ACT_NAI.ACCOUCHEMENT_DATE,
                    hour: act.CHILD?.INFO_NAI?.EVT_HOUR !== undefined ? act.CHILD.INFO_NAI.EVT_HOUR : act.ACT_NAI.ACCOUCHEMENT_HOUR,
                    success: true,
                    errorMessage: ""
                  }
                  setResponseDataManualSend(prevState => [...prevState, formSummary]);

                } else if (act.TYPE === "DECES") {
                  let formSummary = {
                    id: act.ID,
                    type: act.TYPE,
                    name: act.DEFUNCT.NAME,
                    firstname: act.DEFUNCT.FIRSTNAME,
                    date: act.DEFUNCT.INFO_DEC.EVT_DATE !== undefined ? act.DEFUNCT.INFO_DEC.EVT_DATE : act.DECES.DEATH_DATA.BODY_FOUND_DATE,
                    hour: act.DEFUNCT.INFO_DEC.EVT_HOUR,
                    success: true,
                    errorMessage: ""
                  }

                  setResponseDataManualSend(prevState => [...prevState, formSummary]);
                }
                setCountResponseDataManualSend((prevValue) => prevValue + 1)
                updateStatus(act.ID, "ARCHIVE", "");

              }, err => {
                if (act.TYPE === "NAISSANCE") {
                  let formSummary = {
                    id: act.ID,
                    type: act.TYPE,
                    name: getNameResponseDataSend(act),
                    firstname: act.CHILD.FIRSTNAME,
                    date: act.CHILD?.INFO_NAI?.EVT_DATE !== undefined ? act.CHILD.INFO_NAI.EVT_DATE : act.ACT_NAI.ACCOUCHEMENT_DATE,
                    hour: act.CHILD?.INFO_NAI?.EVT_HOUR !== undefined ? act.CHILD.INFO_NAI.EVT_HOUR : act.ACT_NAI.ACCOUCHEMENT_HOUR,
                    success: false,
                    errorMessage: ""
                  }
                  setResponseDataManualSend(prevState => [...prevState, formSummary]);

                } else if (act.TYPE === "DECES") {
                  let formSummary = {
                    id: act.ID,
                    type: act.TYPE,
                    name: act.DEFUNCT.NAME,
                    firstname: act.DEFUNCT.FIRSTNAME,
                    date: act.DEFUNCT.INFO_DEC.EVT_DATE !== undefined ? act.DEFUNCT.INFO_DEC.EVT_DATE : act.DEFUNCT.DECES.DEATH_DATA.BODY_FOUND_DATE,
                    hour: act.DEFUNCT.INFO_DEC.EVT_HOUR,
                    success: false,
                    errorMessage: ""
                  }

                  setResponseDataManualSend(prevState => [...prevState, formSummary]);
                }

                setCountResponseDataManualSend((prevValue) => prevValue + 1)
                updateStatus(act.ID, "ERREUR", err.toString());

                Logger.error("Update DB - sendNotification ", err);
                Logger.error("Update DB - endpoint ", endpoint);
              },
              ).catch(error => {
                Logger.error("Update DB - catch all send ", endpoint, error);
              });
            }
          });
        }
      }).catch(err => {
        Logger.error(err)
      })
    }
  }

  const formatData = (typeAct, data) => {
    if (typeAct === "NAISSANCE") {
      return formatDataForBackBirth(data)
    }
    if (typeAct === "DECES") {
      return formatDataForBackDeath(data)
    }
  }

  const updateStatus = (id: any, newStatus: string, error: null) => {
    hideChoiceDialog();
    showToast("forms.processing")
    updateStatusDb(id, newStatus, error)
      .then(data => {
        if (!isServiceRunning) {
          hideChoiceDialog();
        }
        setValuesFormClick({});
      })
      .catch(err => {
        Logger.error("updateStatusDb ", err);
        stopService();
      });
  };

  const DialogButton = (props) => {
    return (
      <View style={{
        flex: 1,
        flexDirection: 'row',

      }}>
        <View style={{
          flex: 1,
          flexDirection: 'column',
        }}>
          <View style={{
            flexDirection: 'row'
          }}>
            <View style={{ flex: 1 }}><Button
              backgroundColor={theme.colors.primary}
              onPress={() => {
                hideChoiceDialog();
                navigation.navigate("Forms", {
                  id: valuesFormClick.id,
                  type: valuesFormClick.type,
                });
              }}>
              {t("button.change")}
            </Button></View>
            <View style={{ flex: 1 }}>
              {props.values.status === "BROUILLON" ? (
                <Button
                  backgroundColor={theme.colors.secondary}
                  onPress={() =>
                    updateStatus(props.values.id, "VALIDE", null)
                  }>
                  {t("button.validate.validate_2")}
                </Button>
              ) : null}
            </View>
          </View>
          <View style={{
            flexDirection: 'row',

          }}>

            <View style={{ flex: 1 }}>
              {props.values.status === "BROUILLON" ? <Button
                backgroundColor={theme.colors.secondary}
                onPress={() => {
                  hideChoiceDialog()
                  setVisibleDialogConfirmDuplicate(true)
                }}>
                {t("button.duplicate")}
              </Button> : null}</View>

            <View style={{ flex: 1 }}>
              {props.values.status === "BROUILLON" ? <Button
                backgroundColor={theme.colors.secondary}
                onPress={() => {
                  hideChoiceDialog()
                  setVisibleDialogConfirmDelete(true)
                }}>
                {t("button.delete")}
              </Button> : null}</View>
          </View>
        </View>
      </View>

    )
  }

  const ChoiceDialog = props => {
    return (
      <Portal>
        <RDialog visible={visibleChoiceDialog} onDismiss={hideChoiceDialog}>
          {props.error ? (
            <RDialog.Content>
              <Text variant="bodyMedium">{props.error}</Text>
            </RDialog.Content>
          ) : null}
          <RDialog.Actions >
            <DialogButton values={props.values} />

          </RDialog.Actions>
        </RDialog>
      </Portal>
    );
  };

  const getDuplicateConfirmationText = () => {
    let message = "Souhaitez-vous dupliquer la notification de "
    if (valuesFormClick.type === "NAISSANCE") {
      message += "naissance qui concerne "
      if (valuesFormClick.firstname.length > 0) {
        message += valuesFormClick.firstname + " ? "
      } else {
        message += "l'enfant né le " + valuesFormClick.date + " à " + valuesFormClick.hour + " ? "
      }

    } else if (valuesFormClick.type === "DECES") {
      message += "décès qui concerne "
      if (valuesFormClick.firstname.length > 0) {
        message += valuesFormClick.firstname + " ? "
      } else {
        message += "la personne décédée le " + valuesFormClick.date + " à " + valuesFormClick.hour + " ? "
      }
    }
    return message
  }

  const formatResponseDataManualSendForDialog = () => {
    let arrOfMessage = []
    for (let i = 0; i < responseDataManualSend.length; i++) {

      let message = "La notification de "
      if (responseDataManualSend[i].type === "NAISSANCE") {
        message += "naissance de "
      } else if (responseDataManualSend[i].type === "DECES") {
        message += "décès de "
      }
      let firstname = responseDataManualSend[i].firstname === undefined ? "" : responseDataManualSend[i].firstname

      message += responseDataManualSend[i].name + " " + firstname + " du "
        + responseDataManualSend[i].date + " à " + responseDataManualSend[i].hour


      if (responseDataManualSend[i].success) {
        message += " à été envoyer avec succès"
      } else {
        message += " n'à pas pu être envoyer : " + responseDataManualSend[i].errorMessage
      }
      arrOfMessage.push(message)
    }

    return arrOfMessage
  }

  /** Filtre le tableau en fonction de la recherche */
  const filterDataSearch = (search) => {
    return sortFormData(formData).filter(row => {
      if (row.TYPE === "NAISSANCE") {
        if (valueType === "TOUS" || valueType === "NAISSANCE") {
          return row?.CHILD?.FIRSTNAME.includes(search) || row?.CHILD?.NAME.includes(search) || row?.CHILD?.INFO_NAI?.EVT_DATE.includes(search)
        }
      } else if (row.TYPE === "DECES") {
        if (valueType === "TOUS" || valueType === "DECES") {
          return row?.DEFUNCT?.FIRSTNAME.includes(search) || row?.DEFUNCT?.NAME.includes(search) || row?.DEFUNCT.INFO_DEC?.EVT_DATE.includes(search)
        }
      }
    })
  }

  return (
    <React.Fragment>

      <Appbar.Header>

        <Appbar.Content title="" />
        <Searchbar value={valueSearch} handleChangeSearch={(value) => handleChangeSearch(value)} handleSearch={(search) => {
          setValuesFilteredSearch(filterDataSearch(search))
        }} />
        <Menu
          contentStyle={{
            minWidth: 150,
            flex: 1,
            paddingStart: 8,
            paddingEnd: 8,
          }}
          visible={visibleMenu}
          onDismiss={closeMenu}
          anchor={
            <Appbar.Action
              icon={"dots-vertical"}
              color="white"
              onPress={() => openMenu()}
            />
          }>
          <MenuType navigation={navigation} valueType={valueType} manageTypeChange={manageTypeChange} />
          <Divider />
          <MenuStatus valueCb1={valueCb1} setValueCb1={setValueCb1} valueCb2={valueCb2} setValueCb2={setValueCb2} valueCb3={valueCb3} setValueCb3={setValueCb3} valueCb4={valueCb4} setValueCb4={setValueCb4} />
          {userIsAdmin && <View>
            <Divider />
            <MenuAdmin navigation={navigation} manageTypeChange={manageTypeChange} />
          </View>}
          {!config?.["auto-send"] && <View>
            <Divider />
            <Button
              backgroundColor={theme.colors.primary}
              onPress={() => {
                closeMenu()
                sendDataManually()
              }}>
              {t("button.send")}
            </Button>
          </View>
          }
        </Menu>
      </Appbar.Header>

      <View style={{ flex: 1 }}>
        <Portal.Host>
          <View style={{ flex: 11 }}>
            <DataTableHandler
              setVisibleCheckBox={setVisibleCheckBoxManualSend}
              visibleCheckBox={visibleCheckBoxManualSend}
              setCheckedCheckBoxData={setCheckedCheckBoxData}
              checkedCheckBoxData={checkedCheckBoxData}
              allForm={valueSearch.length > 0 ? valuesFilteredSearch : sortFormData(formData)}
              showDialog={(status: string, id: any, type: any, error: any, name: string, firstname: string, date: string, hour: string) =>
                showChoiceDialog(status, id, type, error, name, firstname, date, hour)
              }
            />
          </View>

          <View style={{ flex: 3, flexDirection: "column", justifyContent: "flex-end" }}>
            <Button
              backgroundColor={theme.colors.primary}
              onPress={() => log_out()}>
              {t("button.signout")}
            </Button>
          </View>
        </Portal.Host>

        <ChoiceDialog values={valuesFormClick} error={valuesFormClick.error} />

      </View>
      <Fab
        goForm={(type: any) =>
          navigation.navigate("Forms", { id: null, type: type })
        } />

      <GenericDialog title={t("message.title.warning")} content={getDuplicateConfirmationText()}
        ok={t("button.yes")} cancel={t("button.no")} visible={visibleDialogConfirmDuplicate} hideDialog={hideDialogConfirmDuplicate} handleClickOk={handleClickOkDialogConfirmDuplicate}
        handleClickCancel={() => hideDialogConfirmDuplicate()} />

      <GenericDialog title={t("message.title.warning")} content={"Etes vous sûr de vouloir supprimer la notification ?"}
        ok={t("button.yes")} cancel={t("button.no")} visible={visibleDialogConfirmDelete} hideDialog={hideDialogConfirmDelete} handleClickOk={handleClickOkDialogConfirmDelete}
        handleClickCancel={() => hideDialogConfirmDelete()} />

      <GenericDialog styles={styles.sendDataManualResponseDialog} title={t("message.title.result")} content={formatResponseDataManualSendForDialog().join("\n")}
        ok={t("button.ok")} cancel={null} visible={visibleDialogResponseDataManualSend} hideDialog={() => { }}
        F handleClickOk={() => {
          setResponseDataManualSend([])
          setVisibleDialogResponseDataManualSend(false)
        }}
        handleClickCancel={() => { }} />

    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  sendDataManualResponseDialog: {
    maxHeight: "50%"
  }
})

export default Dashboard


