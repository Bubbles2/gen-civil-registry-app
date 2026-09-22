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

type Props = React.ComponentProps<typeof Object>
const Contact = (props:Props) => {
  const {t} = useTranslation();
  const ref1 = useRef(undefined);
  const ref2 = useRef(undefined);

  useEffect(()=>{
    if(props.refScroll.current){   
       props.refScroll.current.scrollTo({x:100*2,animated:true})
    }   
  })
  return (
    
          <Surface style={styles.surface} >
            <Text style={styles.title}>{t("forms.title.contact")}</Text>
            <TextInput
              label={t("label-input.telephone")}
              returnKeyType="next"
              control={props.control}
              register={props.register}
              type="string"
              onSubmitEditing={() => {
                ref1.current.focus();
              }}
              name="DECL.DECL_TEL"
              autoCapitalize="none"
              disabled={props.disabled}
              
            />
            <TextInput
              label={t("label-input.names")}
              returnKeyType="next"
              myRef={ref1}
              control={props.control}
              register={props.register}
              type="string"
              onSubmitEditing={() => {
                ref2.current.focus();
              }}
              name="DECL.DECL_FIRSTNAME"
              autoCapitalize="none"
              disabled={props.disabled}
              
            />

            <TextInput
              label={t("label-input.relation")}
              returnKeyType="Ok"
              myRef={ref2}
              control={props.control}
              register={props.register}
              type="string"     
              name="DECL.DECL_NAME"
              autoCapitalize="none"
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

export default Contact;
