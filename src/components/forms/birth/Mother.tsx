import React, {useEffect, useRef} from "react";
import RadioButtons from "../../common/RadioButtons";
import TextInput from "../../common/TextInput";
import DateInput from "../../common/DateInput";
import {Text, Surface} from "react-native-paper";
import {View, StyleSheet, KeyboardAvoidingView, ScrollView} from "react-native";
import {useTranslation} from "react-i18next";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Autocomplete from "../../common/Autocomplete";

type Props = React.ComponentProps<typeof Object>
const Mother = (props:Props) => {
  const {t} = useTranslation();
  const ref1 = useRef();
  const ref2 = useRef();
  const ref3 = useRef();
  const ref4 = useRef();
  const ref5 = useRef();
  const ref6 = useRef();
  const ref7 = useRef();
  const ref8 = useRef();

  const watchFatherDeceased = props.watch("FATHER.DECEASED")
  const watchIndicateFather = props.watch("ACT_NAI.INDICATE_FATHER_y8n")
  const watchMotherDeceased = props.watch("MOTHER.DECEASED")
  const watchNniNational = props.watch("MOTHER.NNI_NATIONAL")
  const watchSameAddress = props.watch("MOTHER.INFO_DOM.SAME_ADR")

  useEffect(()=>{
    if(props.refScroll.current){   
       props.refScroll.current.scrollTo({x:100*3,animated:true})
    }   
  })

  useEffect(() => {
    if(ref6.current || ref8.current){
      if (props.watch("MOTHER.INFO_DOM.SAME_ADR") === "Oui"  && ref8.current) {
        ref8.current.focus();
      }
      if (props.watch("MOTHER.INFO_DOM.SAME_ADR") === "Non" && ref6.current){
        ref6.current.focus();
      }
    }

  }, [props.watch("MOTHER.INFO_DOM.SAME_ADR")])


  const validateNniPattern = () => {
    if (props.getValues("MOTHER.NATIONAL_ID").length > 0) {
        return /^[12]{1}[0-9]{12}$/.test(props.getValues("MOTHER.NATIONAL_ID"))
    }
    return true
  }

  return (
   
          <Surface style={styles.surface} >
            <Text style={styles.title}>{t("forms.title.mother")}</Text>
            <RadioButtons
              required
              label={t("label-input.mother.deceased")}
              options={props.list.list.YES_NO}
              orientation={"row"}
              control={props.control}
              register={props.register}
              name={"MOTHER.DECEASED"}
              disabled={props.disabled}
            />

            <RadioButtons
              required
              label={t("label-input.nni.question")}
              options={props.list.list.YES_NO}
              orientation={"row"}
              control={props.control}
              register={props.register}
              name={"MOTHER.NNI_NATIONAL"}
              disabled={props.disabled}
            />
            {(watchNniNational === "Oui") &&
            <TextInput
              label={t("label-input.nni.default")}
              returnKeyType="next"
              control={props.control}
              register={props.register}
              type="string"
              onSubmitEditing={() => {
                ref1.current.focus();
              }}
              name="MOTHER.NATIONAL_ID"
              customControl={validateNniPattern}
              customErrorMessage={t('message.error.nniPattern')}
              autoCapitalize="none"
              disabled={props.disabled}
            />}
            {(watchNniNational === "Non") &&
            <TextInput
              label={t("label-input.numIdent")}
              returnKeyType="next"
              onSubmitEditing={() => {
                ref1.current.focus();
              }}
              control={props.control}
              register={props.register}
              type="string"
              name="MOTHER.NUM_IDENT"
              autoCapitalize="none"
              disabled={props.disabled}
            />}
            <TextInput
              required
              myRef={ref1}
              label={t("label-input.mother.firstname")}
              returnKeyType="next"
              control={props.control}
              register={props.register}
              type="string"
              onSubmitEditing={() => {
                ref2.current.focus();
              }}
              name="MOTHER.FIRSTNAME"
              autoCapitalize="none"
              disabled={props.disabled}
            />
            <TextInput
              required
              myRef={ref2}
              label={t("label-input.mother.lastname")}
              returnKeyType="next"
              control={props.control}
              register={props.register}
              type="string"
              onSubmitEditing={() => {
                ref3.current.focus();
              }}
              name="MOTHER.NAME"
              autoCapitalize="none"
              disabled={props.disabled}
            />
            <DateInput
              myRef={ref3}
              label={t("label-input.mother.date.birth")}
              control={props.control}
              register={props.register}
              onSubmitEditing={() => {
                ref4.current.focus();
              }}
              name={"MOTHER.INFO_NAI.EVT_DATE"}
              setValue={props.setValue}
              returnKeyType="next"
              keyboardType={"numbers-and-punctuation"}
              disabled={props.disabled}
            />
            <Autocomplete
              myRef={ref4}
              label={t("label-input.mother.birth.place")}
              returnKeyType="next"
              onSubmitEditing={() => {
                ref5.current.focus();
              }}
              name="MOTHER.INFO_NAI.EVT_ADDRESS.CITY"
              disabled={props.disabled}
              control={props.control}
              register={props.register}
              list={props.list.list.VILLE}
            />

          <Autocomplete
              myRef={ref5}
              label={t("label-input.mother.occupation")}
              returnKeyType="next"
              name="MOTHER.OCCUPATION"
              disabled={props.disabled}
              control={props.control}
              register={props.register}
              list={props.list.list.PROFESSION}
            />
            {watchMotherDeceased === "Non" && watchFatherDeceased === "Non" && watchIndicateFather === "Oui" &&
            <RadioButtons
              required
              label={t("label-input.mother.same-residence")}
              options={props.list.list.YES_NO}
              orientation={"row"}
              control={props.control}
              register={props.register}
              name={"MOTHER.INFO_DOM.SAME_ADR"}
              disabled={props.disabled}
            />}
             {watchMotherDeceased === "Non" && watchFatherDeceased === "Non" && watchSameAddress === "Non"  &&
             <Autocomplete
             myRef={ref6}
             label={t(
              "label-input.mother.residence",
            )}
             returnKeyType="next"
             onSubmitEditing={() => {
              ref7.current.focus();
            }}
            name="MOTHER.INFO_DOM.CITY"
             disabled={props.disabled}
             control={props.control}
             register={props.register}
             required
             list={props.list.list.VILLE}
           />}
             {watchMotherDeceased === "Non" && watchFatherDeceased === "Non" && watchSameAddress === "Non" &&
            <TextInput
              myRef={ref7}
              label={t("label-input.mother.address")}
              returnKeyType="ok"
              control={props.control}
              onSubmitEditing={() => {
                ref8.current.focus();
              }}
              register={props.register}
              type="string"
              name="MOTHER.INFO_DOM.FORWARDING_ADDRESS"
              autoCapitalize="none"
              disabled={props.disabled}
            />}
            {watchMotherDeceased === "Non" &&
            <TextInput
              label={t("label-input.mother.telephone.number")}
              returnKeyType="ok"
              control={props.control}
              register={props.register}
              type="string"
              myRef={ref8}
              name="MOTHER.TEL_PARENT"
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

export default Mother;
