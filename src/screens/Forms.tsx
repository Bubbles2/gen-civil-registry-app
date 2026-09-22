import React, { useEffect, useState } from "react";
import { Appbar, Portal, Dialog, Text } from "react-native-paper";
import { View, StyleSheet, ScrollView } from "react-native";
import NavigationBar from "../components/common/NavigationBar";
import Child from "../components/forms/birth/Child";
import Mother from "../components/forms/birth/Mother";
import Father from "../components/forms/birth/Father";
import { ProgressSteps, ProgressStep } from "../components/ProgressSteps";
import { useForm, useFormState } from "react-hook-form";
import getDataBirth from "../components/forms/birth/DataBirth";
import getDataDeath from "../components/forms/death/DataDeath";
import {
  getDBConnection,
  getCollectionPointByCode,
  getCPTypeByCode
} from "../core/services/databaseService";
import { addOrUpdateForm, getFormById, newId } from "../core/db/declarations";
import { useTranslation } from "react-i18next";
import { Button as ButtonRn } from "react-native";
import Defunct from "../components/forms/death/Defunct";
import Death from "../components/forms/death/Death";
import { theme } from "../core/theme";
import Logger from "../core/Logger";
import NotificationInformation from "../components/forms/birth/NotificationInformation";
import BirthInformation from "../components/forms/birth/BirthInformation";
import { useSelector } from "react-redux";
import {validateFormBirth} from "../core/control/birthFormValidate";
import { validateFormDeath } from "../core/control/deathFormValidate";
import moment from "moment"
import { retrieveKeyAsyncStorage, saveKeyAsyncStorage } from "../core/services/AsyncStorageService";
import Contact from "../components/forms/death/Contact";
import Parents from "../components/forms/death/Parents";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

const customDateValidator = (date1, date2) => {
  if(date1.trim().length > 0 && date2.trim().length > 0) {
    const d1 = moment(date1, 'DD/MM/YYYY');
    const d2 = moment(date2, 'DD/MM/YYYY');
    const comp = d1.isSameOrAfter(d2);
    return comp;
  }
    return true
  }


const FormsLog = Logger.extend("Forms");

const Forms = props => {
  const { t } = useTranslation();
  let type = props.route.params.type;
  let stepperArray = type === "NAISSANCE"
    ? [t("stepper.notificationInformation"), t("stepper.child"), t("stepper.birthInformation"), t("stepper.father"),t("stepper.mother")]
    : [t("stepper.defunct"), t("stepper.parents"), t("stepper.death"),  "Contact"];
  const maxPage = type === "NAISSANCE" ? 4 : 3;
  const [currentPage, setCurrentPage] = useState(0);
  const [readOnly, setReadOnly] = useState(false);
  const [visibleDialogError, setVisibleDialogError] = React.useState(false);
  const [visibleDialogBack, setVisibleDialogBack] = React.useState(false);
  const hideDialogBack = () => setVisibleDialogBack(false);
  const [colPointType, setColPointType] = React.useState();
  const [colpoint, setColPoint] = React.useState();
  const userState = useSelector((state) =>{
    return state.user
  } );

  useEffect(() => {
    getDBConnection().then((db: any) => {
      getCollectionPointByCode(db, userState.collection_point_code).then(cp => {
        setColPoint(cp)
      }).catch(err => {
        Logger.error(err)
      })
    })
  }, []);

  
  useEffect(() => {
      getDBConnection().then((db: any) => {
        getCPTypeByCode(db, userState.collection_point_code).then(cpType => {
          setColPointType(cpType)
        }).catch(err => {
          Logger.error(err)
        })
      })
    }

, []);

  const handleClickOkDialogBack = () => {
    hideDialogBack()
    props.onClick("home")
  }

  const scrollref = React.useRef()

  const listState = useSelector((state: ListState) => {
    return state.stateList
  });

  const getDefaultData = () => {
    let type = props.route.params.type;
    switch (type) {
      case "NAISSANCE":
        return getDataBirth();
      case "DECES":
        return getDataDeath();
    }
  };

  const {
    handleSubmit,
    setValue,
    control,
    register,
    watch,
    getValues,
    reset,
    formState: { errors },
  } = useForm({
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: getDefaultData(),
  });

  const onSubmit = (data, e) => {
    handleClick(e, data, null);
  };

  const onError = (errors, e) => {
    if (e === "prev" || e === "home") {
      handleClick(e, null, errors);
    }else{
      if (Object.values(errors).length > 0 ) {
        setVisibleDialogError(true);
      }
    }
  };

  const Form = () => {
    const renderCurrentPage = currentPage => {
      let type = props.route.params.type;
      switch (type) {
        case "NAISSANCE":
          switch (currentPage) {
            case 0:
              return (
                <NotificationInformation
                  control={control}
                  register={register}
                  setValue={setValue}
                  getValues={getValues}
                  disabled={readOnly}
                  list={listState}
                  watch={watch}
                  refScroll={scrollref}
                

                />
              );
            case 1:
              return (
                <Child
                  control={control}
                  register={register}
                  setValue={setValue}
                  getValues={getValues}
                  disabled={readOnly}
                  list={listState}
                  watch={watch}
                  refScroll={scrollref}
                 
                />
              );
            case 2:
              return (
                <BirthInformation
                  control={control}
                  register={register}
                  setValue={setValue}
                  getValues={getValues}
                  disabled={readOnly}
                  list={listState}
                  watch={watch}
                  reset={reset}
                  refScroll={scrollref}
                  colPointType={colPointType}
                  customDateValidator={customDateValidator}
                 
                />
              );
            case 3:
              return (
                <Father
                  control={control}
                  register={register}
                  setValue={setValue}
                  getValues={getValues}
                  disabled={readOnly}
                  list={listState}
                  watch={watch}
                  refScroll={scrollref}
                 
                />
              );
            case 4:
              return (
                <Mother
                  control={control}
                  register={register}
                  setValue={setValue}
                  getValues={getValues}
                  disabled={readOnly}
                  list={listState}
                  watch={watch}
                  refScroll={scrollref}
                 
                />
              );
          }
          break;
        case "DECES":
          switch (currentPage) {
            case 0:
              return (
                <Defunct
                  control={control}
                  register={register}
                  setValue={setValue}
                  getValues={getValues}
                  list={listState}
                  watch={watch}
                  disabled={readOnly}
                  refScroll={scrollref}
                  colPoint={colpoint}
                />
              );
            case 1:
              return (
                <Parents
                  control={control}
                  register={register}
                  setValue={setValue}
                  getValues={getValues}
                  disabled={readOnly}
                  list={listState}
                  refScroll={scrollref}
                />
              );
            case 2:
              return (
                <Death
                  control={control}
                  register={register}
                  setValue={setValue}
                  getValues={getValues}
                  disabled={readOnly}
                  watch={watch}
                  list={listState}
                  refScroll={scrollref}
                />
              );
            case 3:
              return (
                <Contact
                  control={control}
                  register={register}
                  setValue={setValue}
                  getValues={getValues}
                  disabled={readOnly}
                  refScroll={scrollref}
                />
              );
          }
          break;
      }
    };

    return renderCurrentPage(currentPage);
  };

  const ErrorDialog = () => {
    return (
      <Portal>
        <Dialog
          visible={visibleDialogError}
          onDismiss={() => setVisibleDialogError(false)}>
          <Dialog.Content>
            <Text variant="bodyMedium">{t("message.error.forms")}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <ButtonRn
              onPress={() => setVisibleDialogError(false)}
              title="ok"
              color={theme.colors.primary}
            />
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
  };

  const handleClick = (buttonType, data, errors) => {
    if (buttonType === "next") {
      if (currentPage !== maxPage) {
        setCurrentPage(currentPage + 1);    
      } else {
        if(data.TYPE === "NAISSANCE"){
          data.ACT.POINT_COLLECTE = colpoint.code;       
          Logger.debug("POINT_COLLECTE id = "+data.ACT.POINT_COLLECTE);
        }
        data.COLPOINT_CODE = colpoint.code;
        let temp = {}
        if(data.TYPE === "NAISSANCE"){
           temp = validateFormBirth(data)   
        }else if(data.TYPE === "DECES"){
           temp = validateFormDeath(data)  
           Logger.debug("temp deces ",data) 
        }         
         addOrUpdateForm(temp)
          .then(res => {
            props.navigation.navigate("Dashboard",{resetFilter:true});
          })
          .catch(err => FormsLog.error("error de la promise", err));
      }
    } else if (buttonType === "prev") {
      if (currentPage > 0) {
        setCurrentPage(currentPage - 1);
      }
    } else if (buttonType === "home") {
      props.navigation.navigate("Dashboard",{resetFilter:true});
    }
  };
 
  const Stepper = (props) => {
    return (
        <ProgressSteps activeStep={currentPage} onPress={setCurrentPage}   >
          {stepperArray.map((label, index) => {
            return (<ProgressStep label={label} index={index} removeBtnRow>
         </ProgressStep>)
          })}
        </ProgressSteps>
    
    );
  };

  useEffect(() => {
    if (props.route.params.id === null) {
      setValue("STATUS", "BROUILLON");
      setValue("TYPE", props.route.params.type);
    }
  }, []);

  const resetForm = data => {
    let type = props.route.params.type;
    switch (type) {
      case "NAISSANCE":
        let tempNai = {
          ID: props.route.params.id,
          TYPE: data.TYPE,
          STATUS: data.STATUS,
          ERROR: "",
          ACT_NAI: {
            DECL_NAISS: data.ACT_NAI.DECL_NAISS,
            BIRTH_ADDRESS: data.ACT_NAI.BIRTH_ADDRESS,
            INDICATE_FATHER_y8n: data.ACT_NAI.INDICATE_FATHER_y8n,
            ACCOUCHEMENT_DATE:data.ACT_NAI.ACCOUCHEMENT_DATE,
            ACCOUCHEMENT_HOUR:data.ACT_NAI.ACCOUCHEMENT_HOUR,
            TYPE_OF_BIRTH:data.ACT_NAI.TYPE_OF_BIRTH
          },
          CHILD: {
            CHILD_ALIVE: data.CHILD.CHILD_ALIVE,
            FIRSTNAME: data.CHILD.FIRSTNAME,
            NAME: data.CHILD.NAME,
            SEXE: data.CHILD.SEXE,
            INFO_NAI: {
              EVT_DATE: data.CHILD.INFO_NAI.EVT_DATE,
              EVT_HOUR: data.CHILD.INFO_NAI.EVT_HOUR,
              EVT_ADDRESS: {
                FORWARDING_ADDRESS:data.CHILD.INFO_NAI.FORWARDING_ADDRESS
              }
            },
          },
          ISEE: {
            LIEU_ACCOUCHEMENT: data.ISEE.LIEU_ACCOUCHEMENT,
            ISEE_POIDS: parseInt(data.ISEE.ISEE_POIDS),
            NAI_MULTIPLE: data.ISEE.NAI_MULTIPLE,
            NRANG: parseInt(data.ISEE.NRANG)
          },
          ACT: {
            POINT_COLLECTE: data.ACT.POINT_COLLECTE,
            ACT_DECL_DATE: data.ACT.ACT_DECL_DATE,
            ACT_DECL_HOUR: data.ACT.ACT_DECL_HOUR,
          },
          FATHER: {
            DECEASED: data.FATHER.DECEASED,
            NNI_NATIONAL: data.FATHER.NNI_NATIONAL,
            NATIONAL_ID: data.FATHER.NATIONAL_ID,
            NUM_IDENT: data.FATHER.NUM_IDENT,
            FIRSTNAME: data.FATHER.FIRSTNAME,
            NAME: data.FATHER.NAME,
            INFO_NAI: {
              EVT_DATE: data.FATHER.INFO_NAI.EVT_DATE,
              EVT_ADDRESS: {
                CITY: data.FATHER.INFO_NAI.EVT_ADDRESS.CITY
              },
            },
            OCCUPATION: data.FATHER.OCCUPATION,
            TEL_PARENT: data.FATHER.TEL_PARENT,
            INFO_DOM: {
              CITY: data.FATHER.INFO_DOM.CITY,
              FORWARDING_ADDRESS: data.FATHER.INFO_DOM.FORWARDING_ADDRESS
            },
            INFO_DEC: {
              EVT_DATE: data.FATHER.INFO_DEC.EVT_DATE,
              EVT_ADDRESS: {
                CITY: data.FATHER.INFO_DEC.EVT_ADDRESS.CITY,
              },
              EVT_KNOWN_DATE: data.FATHER.INFO_DEC.EVT_KNOWN_DATE,
            },
          },
          MOTHER: {
            DECEASED: data.MOTHER.DECEASED,
            NNI_NATIONAL: data.MOTHER.NNI_NATIONAL,
            NATIONAL_ID: data.MOTHER.NATIONAL_ID,
            NUM_IDENT: data.MOTHER.NUM_IDENT,
            FIRSTNAME: data.MOTHER.FIRSTNAME,
            NAME: data.MOTHER.NAME,
            INFO_NAI: {
              EVT_DATE: data.MOTHER.INFO_NAI.EVT_DATE,
              EVT_ADDRESS: {
                CITY: data.MOTHER.INFO_NAI.EVT_ADDRESS.CITY,
              },
            },
            OCCUPATION: data.MOTHER.OCCUPATION,
            INFO_DOM: {
              CITY: data.MOTHER.INFO_DOM.CITY,
              FORWARDING_ADDRESS: data.MOTHER.INFO_DOM.FORWARDING_ADDRESS,
              SAME_ADR: data.MOTHER.INFO_DOM.SAME_ADR,
            },
            TEL_PARENT: data.MOTHER.TEL_PARENT,
          },
        };
        if(props.route.params.duplicate){
          tempNai.ID = newId()
          reset(tempNai)
        }else {
          reset(tempNai)
          Logger.debug("tempnai",tempNai)
        }
        break;
      case "DECES":
        let tempDec = {
          ID: props.route.params.id,
          TYPE: data.TYPE,
          STATUS: data.STATUS,
          ERROR: "",
          DEFUNCT: {
            FIRSTNAME: data.DEFUNCT.FIRSTNAME,
            NAME: data.DEFUNCT.NAME,
            SEXE: data.DEFUNCT.SEXE,
            NNI_NATIONAL: data.DEFUNCT.NNI_NATIONAL,
            NATIONAL_ID: data.DEFUNCT.NATIONAL_ID,
            NUM_IDENT: data.DEFUNCT.NUM_IDENT,
            INFO_NAI: {
              EVT_DATE: data.DEFUNCT.INFO_NAI.EVT_DATE,
              EVT_ADDRESS: {
                CITY: data.DEFUNCT.INFO_NAI.EVT_ADDRESS.CITY,
              }
            },
            ACT:{
              ACT_DECL_DATE: data.DEFUNCT.ACT.ACT_DECL_DATE,
              ACT_DECL_HOUR: data.DEFUNCT.ACT.ACT_DECL_HOUR,
            },
            INFO_DEC: {
              EVT_DATE: data.DEFUNCT.INFO_DEC.EVT_DATE,
              EVT_HOUR: data.DEFUNCT.INFO_DEC.EVT_HOUR,
            },           
          },
          DECL: {
            DECL_TEL:  data.DECL.DECL_TEL,
            DECL_FIRSTNAME: data.DECL.DECL_FIRSTNAME,
            DECL_NAME:  data.DECL.DECL_NAME,
          },
          DECES:{
            DEATH_DATA: {
              KNOWN_DEATH_DATE: data.DECES.DEATH_DATA.KNOWN_DEATH_DATE,
              BODY_FOUND_DATE: data.DECES.DEATH_DATA.BODY_FOUND_DATE,
            },
          },
          FATHER_DECEASED: {
            FIRSTNAME: data.FATHER_DECEASED.FIRSTNAME,
            NAME: data.FATHER_DECEASED.NAME,
          },
          MOTHER_DECEASED: {
            FIRSTNAME: data.MOTHER_DECEASED.FIRSTNAME,
            NAME: data.MOTHER_DECEASED.NAME,
          },
          ACT: {
            ACT_DECL_DATE: data.ACT.ACT_DECL_DATE,
            ACT_DECL_HOUR: data.ACT.ACT_DECL_HOUR,
            DECL_NUMBER:data.ACT.DECL_NUMBER,
            POINT_COLLECTE:data.ACT.POINT_COLLECTE,
          },
        }     
        if(props.route.params.duplicate){
          tempDec.ID = newId()
          reset(tempDec)
        }else {
          reset(tempDec)
        }

        break;
    }
  };

  useEffect(() => {
    if (props.route.params.id) {
      //todo get forms values from db
      getFormById(props.route.params.id)
        .then(data => {
          if (data.STATUS === "VALIDE" || data.STATUS === "ARCHIVE") {
            setReadOnly(true);
            resetForm(data);
          }
          if (data.STATUS === "ERREUR") {
            let temp = JSON.parse(JSON.stringify(data));
            temp.STATUS = "BROUILLON";
            resetForm(temp);
          } else {
            resetForm(data);
          }
        })
        .catch(err => {
          FormsLog.error(err);
        });
    }
  }, [props.route.params.id]);

  
  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content />
      </Appbar.Header>
      <View style={styles.stepper} >
        <ScrollView ref={scrollref} horizontal={true} style={{ marginStart: 24, marginEnd: 24 }} keyboardShouldPersistTaps="always" >
          <Stepper/>
        </ScrollView>
      </View>
      <View style={{flex:1}}>
      <KeyboardAwareScrollView
       style={{flex:1}}>
           <Form/>
        </KeyboardAwareScrollView>
      </View>
      <ErrorDialog />
      <Dialog title={t("message.title.warning")} content={t("message.confirmLeaveMessage")}
              ok="Oui" cancel="Non" visible={visibleDialogBack} hideDialog={hideDialogBack} handleClickOk={handleClickOkDialogBack}
              handleClickCancel = {() => hideDialogBack()} />
      <View style={styles.bottom}>
        <NavigationBar
          onClick={handleSubmit(onSubmit, onError)}
          prevLabel={t("button.prev")}
          prevLabelVisible={currentPage !== 0}
          nextLabel={
            currentPage < maxPage ? t("button.next") : t("button.validate.validate_1")
          }
          nextLabelVisible={currentPage === maxPage && readOnly ? false : true}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bottom: {
    flex: 0.09,
  },
  stepper: {
    flex: 0.25,
  },
});

export default Forms;


