import React, {useEffect, useRef} from "react";
import {Text, Surface} from "react-native-paper";
import {
  View,
  StyleSheet,
 } from "react-native";

import {useTranslation} from "react-i18next";
import TimeInput from "../../common/TimeInput";
import DateInput from "../../common/DateInput";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import RadioButtons from "../../common/RadioButtons";

type Props = React.ComponentProps<typeof Object>
const Death = (props:Props) => {
  const {t} = useTranslation();
  const ref1 = useRef();

  const knownDate = props.watch("DECES.DEATH_DATA.KNOWN_DEATH_DATE")

  useEffect(()=>{
    if(props.refScroll.current){   
       props.refScroll.current.scrollTo({x:100*1,animated:true})
    }   
  })
  return (
  
       
          <Surface style={styles.surface} >
            <Text style={styles.title}>{t("forms.title.deces")}</Text>
            <RadioButtons
              required
              label={t("label-input.decesConnue")}
              options={props.list.list.YES_NO}
              orientation={"row"}
              control={props.control}
              register={props.register}
              name="DECES.DEATH_DATA.KNOWN_DEATH_DATE"
              disabled={props.disabled}
            />
            {knownDate === "Oui" && ( <DateInput
              label={t("label-input.death.date")}
              required
              onSubmitEditing={() => {
                ref1.current.focus();
              }}
              returnKeyType="next"
              control={props.control}
              register={props.register}
              name="DEFUNCT.INFO_DEC.EVT_DATE"
              setValue={props.setValue}
              keyboardType={"default"}
              disabled={props.disabled}
            /> )}

            {knownDate === "Non" &&
            <DateInput            
              label={t("label-input.decouvert")}
              required
              onSubmitEditing={() => {
                ref1.current.focus();
              }}
              returnKeyType="next"
              control={props.control}
              register={props.register}
              name="DECES.DEATH_DATA.BODY_FOUND_DATE"
              setValue={props.setValue}
              keyboardType={"default"}
              disabled={props.disabled}
            />}
            <TimeInput
              required
              myRef={ref1}
              returnKeyType="ok"
              label={t("label-input.heuredec")}
              control={props.control}
              type="string"
              register={props.register}
              name="DEFUNCT.INFO_DEC.EVT_HOUR"
              keyboardType={"numeric"}
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

export default Death;
