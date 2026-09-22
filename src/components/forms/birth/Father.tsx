import React, { useEffect, useRef } from "react";
import RadioButtons from "../../common/RadioButtons";
import TextInput from "../../common/TextInput";
import DateInput from "../../common/DateInput";
import { Text, Surface } from "react-native-paper";
import { View, StyleSheet, KeyboardAvoidingView, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import Autocomplete from "../../common/Autocomplete";
import Logger from "../../../core/Logger";

type Props = React.ComponentProps<typeof Object>
const Father = (props:Props) => {
  const { t } = useTranslation();
  const ref1 = useRef(undefined);
  const ref2 = useRef(undefined);
  const ref3 = useRef(undefined);
  const ref4 = useRef(undefined);
  const ref5 = useRef(undefined);
  const ref6 = useRef(undefined);
  const ref7 = useRef(undefined);
  const ref8 = useRef(undefined);
  const ref9 = useRef(undefined);
  const ref10 = useRef(undefined);

  const watchIndicateFather = props.watch("ACT_NAI.INDICATE_FATHER_y8n")
  const watchFatherDeceased = props.watch("FATHER.DECEASED")
  const watchNniNational = props.watch("FATHER.NNI_NATIONAL")
  const watchKnownDateDeath = props.watch("FATHER.INFO_DEC.EVT_KNOWN_DATE")

  useEffect(()=>{
    if(props.refScroll.current){   
       props.refScroll.current.scrollTo({x:100*2,animated:true})
    }   
  })

  const validateNniPattern = () => {
    Logger.debug("validate",props.getValues("FATHER.NATIONAL_ID"))
    if (props.getValues("FATHER.NATIONAL_ID").length > 0) {
        return  /^[12]{1}[0-9]{12}$/.test(props.getValues("FATHER.NATIONAL_ID"))
    }
    return true
  }   

  return (
  

        <Surface style={styles.surface}>
          <Text style={styles.title}>{t("forms.title.father")}</Text>
          <RadioButtons
            required
            label={t("label-input.father.known")}
            options={props.list.list.YES_NO}
            orientation={"row"}
            control={props.control}
            register={props.register}
            name={"ACT_NAI.INDICATE_FATHER_y8n"}
            disabled={props.disabled}
          />
          {watchIndicateFather === "Oui" &&
            <RadioButtons
              required
              label={t("label-input.father.deceased")}
              options={props.list.list.YES_NO}
              orientation={"row"}
              control={props.control}
              register={props.register}
              name={"FATHER.DECEASED"}
              disabled={props.disabled}
            />}
            {watchIndicateFather === "Oui" &&
            <RadioButtons
              required
              label={t("label-input.nni.question")}
              options={props.list.list.YES_NO}
              orientation={"row"}
              control={props.control}
              register={props.register}
              name={"FATHER.NNI_NATIONAL"}
              disabled={props.disabled}
            />}
          {(watchIndicateFather === "Oui" && watchNniNational === "Oui") &&
            <TextInput
              label={t("label-input.nni.default")}
              returnKeyType="next"
              onSubmitEditing={() => {
                ref1.current.focus();
              }}
              control={props.control}
              register={props.register}
              type="string"
              customControl={validateNniPattern}
              customErrorMessage={t('message.error.nniPattern')}
              name="FATHER.NATIONAL_ID"
              autoCapitalize="none"
              disabled={props.disabled}
            />}
            {(watchIndicateFather === "Oui" && watchNniNational === "Non") &&
            <TextInput
              label={t("label-input.numIdent")}
              returnKeyType="next"
              onSubmitEditing={() => {
                ref1.current.focus();
              }}
              control={props.control}
              register={props.register}
              type="string"
              name="FATHER.NUM_IDENT"
              autoCapitalize="none"
              disabled={props.disabled}
            />}
          {watchIndicateFather === "Oui" &&
            <TextInput
              required
              label={t("label-input.father.firstname")}
              myRef={ref1}
              onSubmitEditing={() => {
                ref2.current.focus();
              }}
              returnKeyType="next"
              control={props.control}
              register={props.register}
              type="string"
              name="FATHER.FIRSTNAME"
              autoCapitalize="none"
              disabled={props.disabled}
            />}
          {watchIndicateFather === "Oui" &&
            <TextInput
              required
              label={t("label-input.father.lastname")}
              myRef={ref2}
              returnKeyType="next"
              onSubmitEditing={() => {
                ref3.current.focus();
              }}
              control={props.control}
              register={props.register}
              type="string"
              name="FATHER.NAME"
              autoCapitalize="none"
              disabled={props.disabled}
            />}
          {watchIndicateFather === "Oui" &&
            <DateInput
              label={t("label-input.father.date.birth")}
              control={props.control}
              onSubmitEditing={() => {
                ref4.current.focus();
              }}
              myRef={ref3}
              returnKeyType="next"
              register={props.register}
              name={"FATHER.INFO_NAI.EVT_DATE"}
              setValue={props.setValue}
              keyboardType={"numbers-and-punctuation"}
              disabled={props.disabled}
            />}
          {watchIndicateFather === "Oui" &&
            <Autocomplete
              myRef={ref4}
              label={t("label-input.father.birth.place")}
              returnKeyType="next"
              onSubmitEditing={() => {
                if (watchIndicateFather === "Oui" && watchFatherDeceased === "Oui") {
                  ref5.current.focus();
                } else {
                  ref7.current.focus()
                }
              }}
              name="FATHER.INFO_NAI.EVT_ADDRESS.CITY"
              disabled={props.disabled}
              control={props.control}
              register={props.register}            
              list={props.list.list.VILLE}
            />
          }
          {(watchIndicateFather === "Oui" && watchFatherDeceased === "Oui") &&
           <RadioButtons
           required
           label={t("label-input.father.death.date.known")}
           options={props.list.list.YES_NO}
           orientation={"row"}
           control={props.control}
           register={props.register}
           name={"FATHER.INFO_DEC.EVT_KNOWN_DATE"}
           disabled={props.disabled}
         />}
          {(watchIndicateFather === "Oui" && watchFatherDeceased === "Oui" && watchKnownDateDeath === "Oui" ) &&
            <DateInput
              label={t("label-input.father.date.death")}
              control={props.control}
              returnKeyType="next"
              register={props.register}
              myRef={ref5}
              onSubmitEditing={() => {
                ref6.current.focus();
              }}
              name={"FATHER.INFO_DEC.EVT_DATE"}
              setValue={props.setValue}
              keyboardType={"numbers-and-punctuation"}
              disabled={props.disabled}
            />}
          {(watchIndicateFather === "Oui" && watchFatherDeceased === "Oui") &&
            <Autocomplete
              myRef={ref6}
              label={t("label-input.father.death.place")}
              returnKeyType="next"
              onSubmitEditing={() => {
                ref7.current.focus();
              }}
              name="FATHER.INFO_DEC.EVT_ADDRESS.CITY"
              disabled={props.disabled}
              control={props.control}
              register={props.register}
              list={props.list.list.VILLE}
            />}

          {watchIndicateFather === "Oui" &&
            <Autocomplete
              myRef={ref7}
              label={t("label-input.father.occupation")}
              returnKeyType="next"
              onSubmitEditing={() => {
                if (watchIndicateFather === "Oui" && watchFatherDeceased === "Non") {
                  ref8.current.focus();
                }
              }}
              name="FATHER.OCCUPATION"
              disabled={props.disabled}
              control={props.control}
              register={props.register}
              list={props.list.list.PROFESSION}
            />}
          {(watchIndicateFather === "Oui" && watchFatherDeceased === "Non") &&
            <Autocomplete
              myRef={ref8}
              label={t(
                "label-input.father.residence",
              )}
              returnKeyType="next"
              onSubmitEditing={() => {
                ref9.current.focus();
              }}
              name="FATHER.INFO_DOM.CITY"
              disabled={props.disabled}
              control={props.control}
              register={props.register}
              required
              list={props.list.list.VILLE}
            />
          }
          {(watchIndicateFather === "Oui" && watchFatherDeceased === "Non") &&
            <TextInput
              label={t("label-input.father.address")}
              returnKeyType="next"
              control={props.control}
              register={props.register}
              type="string"
              myRef={ref9}
              onSubmitEditing={() => {
                ref10.current.focus();
              }}
              name="FATHER.INFO_DOM.FORWARDING_ADDRESS"
              autoCapitalize="none"
              disabled={props.disabled}
            />}
          {(watchIndicateFather === "Oui" && watchFatherDeceased === "Non") &&
            <TextInput
              label={t("label-input.father.telephone.number")}
              returnKeyType="ok"
              control={props.control}
              register={props.register}
              type="string"
              myRef={ref10}
              name="FATHER.TEL_PARENT"
              autoCapitalize="none"
              keyboardType={"phone-pad"}
              disabled={props.disabled}
            />}
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

export default Father;
