import React, {useEffect, useRef} from "react";
import RadioButtons from "../../common/RadioButtons";
import TextInput from "../../common/TextInput";
import DateInput from "../../common/DateInput";
import TimeInput from "../../common/TimeInput";
import AllList from "../../../core/allList";
import Select from "../../common/Select";
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

type Props = React.ComponentProps<typeof Object>

const Child = (props:Props) => {
  const {t} = useTranslation();
  
  useEffect(()=>{
    if(props.refScroll.current){   
       props.refScroll.current.scrollTo({x:100*0,animated:true})
    }   
  })

  return (
   
          <Surface style={styles.surface} >
            <Text style={styles.title}>{t("forms.title.child")}</Text>
           
            <RadioButtons
              required
              label={t("label-input.child.birth.alive")}
              options={props.list.list.YES_NO}
              orientation={"row"}
              control={props.control}
              register={props.register}
              name="CHILD.CHILD_ALIVE"
              disabled={props.disabled}
            />

            <TextInput
              label={t("label-input.firstname.default")}
              returnKeyType="next"
              control={props.control}
              register={props.register}
              type="string"       
              name="CHILD.FIRSTNAME"
              autoCapitalize="none"
              disabled={props.disabled}
            />
        
            <RadioButtons
              required
              label={t("label-input.gender.default")}
              options={props.list.list.LST_SEX}
              orientation={"row"}
              control={props.control}
              register={props.register}
              name="CHILD.SEXE"
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
    elevation:12
  },
});

export default Child;
