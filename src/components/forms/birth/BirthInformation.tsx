import React, { useEffect, useRef, useState } from "react";
import RadioButtons from "../../common/RadioButtons";
import TextInput from "../../common/TextInput";
import DateInput from "../../common/DateInput";
import TimeInput from "../../common/TimeInput";
import { Text, Surface } from "react-native-paper";
import {
  View,
  StyleSheet,
  TextInput as Input,
} from "react-native";
import { useTranslation } from "react-i18next";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import NumericsInput from "../../common/NumericsInput";
import Logger from "../../../core/Logger";
import { useSelector } from "react-redux";

type Props = React.ComponentProps<typeof Object>
const BirthInformation = (props:Props) => {
  const { t } = useTranslation();
  const ref1 = useRef(undefined);
  const ref2 = useRef(undefined);
  const ref3 = useRef(undefined);
  const ref4 = useRef(undefined);
  const ref5 = useRef(undefined);


  const watchChildAlive = props.watch("CHILD.CHILD_ALIVE")
  const watchBirthPlace = props.watch("ISEE.LIEU_ACCOUCHEMENT")
  const declarationDate = props.watch("ACT.ACT_DECL_DATE")
  const birthDate = props.watch("CHILD.INFO_NAI.EVT_DATE")
  const watchMultipleBirth = props.watch("ISEE.NAI_MULTIPLE")
  const watchMultipleBirthType = props.watch("ACT_NAI.TYPE_OF_BIRTH")

  useEffect(()=>{
    if(props.refScroll.current){   
       props.refScroll.current.scrollTo({x:100*1,animated:true})
    }   
  })

  const customWeightValidator = (weight, colPointType ) => {
    if (weight !== 0 ) {
      if(weight < 0 || weight > 9999) {return false}
    }
    if (weight === 0 && colPointType === 'HEALTH') {
      return false
    }
    return true
  }

  const phoneCP_Type = useSelector((state) => {
    return state.setup.PhoneCP_Type;
  });
  var currentWeight = props.getValues("ISEE.ISEE_POIDS");
  const getBirthMax = (watchMultipleBirthType) => {
    let maxRang = 1;
    switch (watchMultipleBirthType) {
      case 'Jumeaux':
        maxRang = 2;
        break;
      case 'Triplés':
        maxRang = 3;
        break;
      case 'Quadruplés':
        maxRang = 4;
        break;
      case 'Quintuplés':
        maxRang = 5;
        break;
      case 'Sextuplés':
        maxRang = 6;
        break;
      case 'Septuplés':
        maxRang = 7;
        break;
      case 'Octuplés':
        maxRang = 8;
        break;
      case 'Nonuplés':
        maxRang = 9;
        break;
      default:
        maxRang = 1;
    }
    return maxRang;
  }

  var maxRang = getBirthMax(watchMultipleBirthType)






  const updateCurrentWeight = () => {
     currentWeight = props.getValues("ISEE.ISEE_POIDS");
  }


  return (
    
        <Surface style={styles.surface} >
          <Text style={styles.title}>{t("forms.title.birthInformation")}</Text>
          {watchChildAlive === "Oui" &&
            <DateInput
              label={t("label-input.birth.date")}
              required
              onSubmitEditing={() => {
                ref1.current.focus()
              }}
              returnKeyType="next"
              control={props.control}
              register={props.register}
              name="CHILD.INFO_NAI.EVT_DATE"
              setValue={props.setValue}
              keyboardType={"default"}
              disabled={props.disabled}
              customControl={() => props.customDateValidator(declarationDate, birthDate)}
              customErrorMessage={t('message.error.bad_date_notification')}
            />}
          {watchChildAlive === "Oui" &&
            <TimeInput
              required
              myRef={ref1}
              returnKeyType="ok"
              label={t("label-input.birth.hour")}
              control={props.control}
              type="string"
              register={props.register}
              name="CHILD.INFO_NAI.EVT_HOUR"
              keyboardType={"numeric"}
              disabled={props.disabled}
            />}
          {watchChildAlive === "Oui" &&
            <RadioButtons
              required
              label={t("label-input.birth.place.default")}
              options={props.list.list["ISEE.LIEU_ACCOUCHEMENT"]}
              orientation={"column"}
              control={props.control}
              register={props.register}
              name="ISEE.LIEU_ACCOUCHEMENT"
              disabled={props.disabled}
            />}

          {watchChildAlive === "Oui" && (watchBirthPlace === "Domicile" || watchBirthPlace === "Autres") &&
            <TextInput
              label={t("label-input.delivery.city")}
              returnKeyType="ok"
              control={props.control}
              register={props.register}
              type="string"
              name="CHILD.INFO_NAI.EVT_ADDRESS.FORWARDING_ADDRESS"
              autoCapitalize="none"
              disabled={props.disabled}
            />}
          {watchChildAlive === "Oui" && watchBirthPlace === "Structure sanitaire" &&
            <TextInput
              myRef={ref2}
              label={t("label-input.formation")}
              returnKeyType="ok"
              control={props.control}
              register={props.register}
              type="string"
              required
              name="ACT_NAI.BIRTH_ADDRESS"
              autoCapitalize="none"
              disabled={props.disabled}
             />}

          <NumericsInput
            required={phoneCP_Type === "HEALTH"}
            myRef={ref3}
            returnKeyType="ok"
            onSubmitEditing={() => {
              if(watchChildAlive === "Non"){
                ref4.current.focus()
              }
            }}
            label={t("label-input.child.birth.weight")}
            control={props.control}
            register={props.register}
            type="string"
            name="ISEE.ISEE_POIDS"
            disabled={props.disabled}
            onChange={updateCurrentWeight}
            customControl={() => customWeightValidator(currentWeight , props.colPointType)}
            customErrorMessage={t('message.error.bad_weight')}
          />

         {watchChildAlive === "Non" &&
          <DateInput
            myRef={ref4}
            label={t("label-input.delivery.date")}
            required
            onSubmitEditing={() => {
              ref5.current.focus()
            }}
            returnKeyType="next"
            control={props.control}
            register={props.register}
            name="ACT_NAI.ACCOUCHEMENT_DATE"
            setValue={props.setValue}
            keyboardType={"default"}
            disabled={props.disabled}

          />
         }
         {watchChildAlive === "Non" &&
          <TimeInput
            required
            myRef={ref5}
            returnKeyType="ok"
            label={t("label-input.delivery.hour")}
            control={props.control}
            type="string"
            register={props.register}
            name="ACT_NAI.ACCOUCHEMENT_HOUR"
            keyboardType={"numeric"}
            disabled={props.disabled}
          />
         }

          <RadioButtons
            required
            label={t("label-input.child.birth.many")}
            options={props.list.list.YES_NO}
            orientation={"row"}
            control={props.control}
            register={props.register}
            name={"ISEE.NAI_MULTIPLE"}
            disabled={props.disabled}
          />
          {watchMultipleBirth === "Oui" &&
            <RadioButtons
              required
              label={t("label-input.child.birth.manyTo")}
              options={props.list.list["ISEE.NAI_MULTIPLE_BIRTH"]}
              orientation={"column"}
              control={props.control}
              register={props.register}
              name={"ACT_NAI.TYPE_OF_BIRTH"}
              disabled={props.disabled}
            />}
          {watchMultipleBirth === "Oui" &&
            <NumericsInput
              required={phoneCP_Type === "HEALTH"}
              returnKeyType="ok"
              label={t("label-input.child.rating")}
              control={props.control}
              register={props.register}
              type="string"
              name="ISEE.NRANG"
              minValue={1}
              maxValue={maxRang}
              editable={false}
              disabled={props.disabled}
            />
          }
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
    elevation:12
  },
});

export default BirthInformation;
