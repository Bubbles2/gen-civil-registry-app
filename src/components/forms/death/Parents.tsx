import React, {useEffect, useRef} from "react";
import TextInput from "../../common/TextInput";
import {Text, Surface} from "react-native-paper";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  TextInput as Input,
} from "react-native";

import {useTranslation} from "react-i18next";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Autocomplete from "../../common/Autocomplete";

type Props = React.ComponentProps<typeof Object>
const Parents = (props:Props) => {
  const {t} = useTranslation();
  const ref1 = useRef();
  const ref2 = useRef();
  const ref3 = useRef();
 

  useEffect(()=>{
    if(props.refScroll.current){   
       props.refScroll.current.scrollTo({x:100*0,animated:true})
    }   
  })
  return (
   
        <Surface style={styles.surface} >
          <Text style={styles.title}>{t("forms.title.parents")}</Text>
          <TextInput       
            label={t("label-input.father.firstname")}
            returnKeyType="next"
            control={props.control}
            onSubmitEditing={() => {
              ref1.current.focus()
            }}
            register={props.register}
            type="string"
            name="FATHER_DECEASED.FIRSTNAME"
            autoCapitalize="none"
          />
          <TextInput
            myRef={ref1}            
            label={t("label-input.father.lastname")}
            returnKeyType="next"
            onSubmitEditing={() => {
              ref2.current.focus()
            }}
            control={props.control}
            register={props.register}
            type="string"
            name="FATHER_DECEASED.NAME"
            autoCapitalize="none"
            disabled={props.disabled}
          />
          <TextInput           
            myRef={ref2}
            label={t("label-input.mother.firstname")}
            returnKeyType="next"
            onSubmitEditing={() => {
              ref3.current.focus()
            }}
            control={props.control}
            register={props.register}
            type="string"
            name="MOTHER_DECEASED.FIRSTNAME"
            autoCapitalize="none"
          />
          <TextInput
            myRef={ref3}           
            label={t("label-input.mother.lastname")}
            returnKeyType="Ok"
            control={props.control}
            register={props.register}
            type="string"
            name="MOTHER_DECEASED.NAME"
            autoCapitalize="none"
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
    elevation:12
  },
});

export default Parents;
