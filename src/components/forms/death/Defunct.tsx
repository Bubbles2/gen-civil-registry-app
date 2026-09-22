import React, { useEffect, useRef, useState } from "react";
import { Text, Surface } from "react-native-paper";
import TextInput from "../../common/TextInput";
import NotificationNumberInput from "../../common/NotificationNumberInput";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  TextInput as Input,
} from "react-native";
import { useTranslation } from "react-i18next";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import DateInput from "../../common/DateInput";
import TimeInput from "../../common/TimeInput";
import RadioButtons from "../../common/RadioButtons";
import Autocomplete from "../../common/Autocomplete";
import AutocompletePcsInput from "../../common/AutocompletePcs";

import { useSelector } from "react-redux";
import { getCollectionPointByCode, getCollectionPoints, getDBConnection } from "../../../core/services/databaseService";
import Logger from "../../../core/Logger";



type Props = React.ComponentProps<typeof Object>
const Defunct = (props: Props) => {
  const { t } = useTranslation();

  const ref1 = useRef(undefined);
  const ref2 = useRef(undefined);
  const ref3 = useRef(undefined);
  const ref4 = useRef(undefined);
 

  const userState = useSelector((state) => {
    return state.user
  });


  const [btnPushed, setBtnPushed] = useState(false);
  const [allCp,setAllCp] = useState(null)
  const [currentNIN, setCurrentNIN] = useState("Oui");
  const watchIdNum = props.getValues("DEFUNCT.NNI_NATIONAL");
  const watchPointCollecte = props.getValues("ACT.POINT_COLLECTE");

  useEffect(() => {
   setCurrentNIN(watchIdNum)
  }, []);


  useEffect(() => {
    if(watchPointCollecte === ""){
      getDBConnection().then((db: any) => {
      getCollectionPointByCode(db, userState.collection_point_code).then(cp => {       
        props.setValue("ACT.POINT_COLLECTE",cp.label)
      }).catch(err => {
        Logger.error(err)
      })
    })
    }
    
  }, [watchPointCollecte]);

  useEffect(()=>{
    if(allCp === null){
       getDBConnection().then((db: any) => {
      getCollectionPoints(db).then(cps => {
        if (cps !== null) {
         setAllCp(cps)
        }
      }).catch(err => {
        Logger.error(err)
      });
    }).catch(err => {
      Logger.error(err)
    });
    }
   
  },[allCp])

  const buttonChange = (value) => {
    if (value === "Oui") {
      props.setValue("DEFUNCT.NUM_IDENT","")
    } else if(value === "Non") {
      props.setValue("DEFUNCT.NATIONAL_ID", "");
    }
    setCurrentNIN(value)
  };


  return (
  
        <Surface style={styles.surface}>
          <Text style={styles.title}>{t("forms.title.defunct")}</Text>
          <View  style={styles.roundedRowContainer}>
               <Text style={styles.titleContainer}>{t("label-input.notification.number")}</Text>
               <Text>{userState.collection_point_code}-</Text>
              <Text>{userState.user_code}-</Text>
               <NotificationNumberInput
                 required
                 returnKeyType="next"
                 onSubmitEditing={() => {
                  ref1.current.focus();
                }}
                 control={props.control}
                 register={props.register}
                 type="string"
                 name="ACT.DECL_NUMBER"         
                 disabled={props.disabled}
                 autoCapitalize="none" />
            </View>
            <DateInput
              visible={false}
              required
              returnKeyType="next"
              control={props.control}
              register={props.register}
              name="ACT.ACT_DECL_DATE"
              setValue={props.setValue}
              keyboardType={"default"}
              disabled={props.disabled}
            />

            <TimeInput
              visible={false}
              required             
              returnKeyType="ok"       
              control={props.control}
              type="string"
              register={props.register}
              name="ACT.ACT_DECL_HOUR"
              keyboardType={"numeric"}
              disabled={props.disabled}
            />
            <AutocompletePcsInput
            myRef={ref1}
            label={t("label-input.notificationCivilCenter")}
            returnKeyType="next"
            name="ACT.POINT_COLLECTE"
            disabled={props.disabled}
            control={props.control}
            register={props.register}
            required
            list={allCp}
          />
        
          <RadioButtons
            required
            label={t("label-input.numIdentFourni")}
            options={props.list.list.YES_NO}
            orientation={"row"}
            onPress={(value) => {
              buttonChange(value);
            }}
            control={props.control}
            register={props.register}
            name="DEFUNCT.NNI_NATIONAL"
            disabled={props.disabled}
          />
          {currentNIN === "Oui" &&
            <TextInput        
              label={t("label-input.numIdent")}
              returnKeyType="next"
              control={props.control}
              register={props.register}
              onSubmitEditing={() => {
                ref2.current.focus();
              }}
              type="string"
              name="DEFUNCT.NATIONAL_ID"
              autoCapitalize="none"
              disabled={props.disabled}
              required
            />         
          }
          {currentNIN === "Non" && 
            <TextInput   
            onSubmitEditing={() => {
              ref2.current.focus();
            }}     
            label={t("label-input.numAutre")}
            returnKeyType="Ok"
            control={props.control}
            register={props.register}
            type="string"
            name="DEFUNCT.NUM_IDENT"
            autoCapitalize="none"
            disabled={props.disabled}
          />
          }
          <TextInput
            myRef={ref2}
            label={t("label-input.firstname.default")}
            returnKeyType="next"
            control={props.control}
            register={props.register}
            type="string"
            onSubmitEditing={() => {
              ref3.current.focus();
            }}
            name="DEFUNCT.FIRSTNAME"
            autoCapitalize="none"
            disabled={props.disabled}
            
          />
          <TextInput
            myRef={ref3}
            label={t("label-input.lastname.default")}
            returnKeyType="ok"
            control={props.control}
            register={props.register}
            type="string"
            name="DEFUNCT.NAME"
            autoCapitalize="none"
            disabled={props.disabled}
            required
          />
          <RadioButtons
            required
            label={t("label-input.gender.default")}
            options={props.list.list.LST_SEX}
            orientation={"row"}
            control={props.control}
            register={props.register}
            name="DEFUNCT.SEXE"
            disabled={props.disabled}
          />

          <Autocomplete      
            onSubmitEditing={() => {
              ref4.current.focus();
            }}
            label={t("label-input.bplace")}
            returnKeyType="next"
            name="DEFUNCT.INFO_NAI.EVT_ADDRESS.CITY"
            disabled={props.disabled}
            control={props.control}
            register={props.register}
            list={props.list.list.VILLE}
          />

          <DateInput
            myRef={ref4}
            label={t("label-input.bdate")}
            visible={true}
            returnKeyType="Ok"
            control={props.control}
            register={props.register}
            name="DEFUNCT.INFO_NAI.EVT_DATE"
            setValue={props.setValue}
            keyboardType={"default"}
            disabled={props.disabled}
          />

        </Surface>
      
  );
};

const styles = StyleSheet.create({
  ScrollView: {
    flex: 1,
    width: "100%",
  },
  container: {
    flex: 1,
  },
  title: {
    flex: 1,
    marginTop: 24,
    marginBottom: 12,
    alignSelf: "center",
    fontSize: 22,
  },
  bottom: {
    flex: 0.1,
  },
  surface: {
    flex: 1,
    margin: 12,
    borderRadius: 6,
    elevation: 12,
  },
  titleContainer: {
    position: 'absolute',
    top: -10,
    left: 10,
    backgroundColor: 'white',
    paddingHorizontal: 5,
  },
  roundedRowContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'grey',
    borderRadius: 5,
    padding: 10,
    marginHorizontal: 10,
  },
});

export default Defunct;
