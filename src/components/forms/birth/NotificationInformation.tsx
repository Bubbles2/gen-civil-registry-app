import React, {useEffect, useRef} from "react";
import NotificationNumberInput from "../../common/NotificationNumberInput";
import DateInput from "../../common/DateInput";
import TimeInput from "../../common/TimeInput";
import {Text, Surface} from "react-native-paper";
import {
  View,
  StyleSheet,
  TextInput as Input,
} from "react-native";
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {useTranslation} from "react-i18next";
import { useSelector, useDispatch } from 'react-redux';


type Props = React.ComponentProps<typeof Object>
const NotificationInformation = (props:Props) => {
  const {t} = useTranslation();
  const ref1 = useRef(undefined);
  const ref2 = useRef(undefined);

  const userState = useSelector((state) => {
    return state.user
  });

  return (
   
          <Surface style={styles.surface} >
            <Text style={styles.title}>{t("forms.title.notificationInformation")}</Text>
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
                 name="ACT_NAI.DECL_NAISS"         
                 disabled={props.disabled}
                 autoCapitalize="none" />
            </View>

             <DateInput
              myRef={ref1}
              label={t("label-input.notification.date")}
              required
              onSubmitEditing={() => {
                ref2.current.focus();
              }}
              returnKeyType="next"
              control={props.control}
              register={props.register}
              name="ACT.ACT_DECL_DATE"
              setValue={props.setValue}
              keyboardType={"default"}
              disabled={props.disabled}
            />

            <TimeInput
              required
              myRef={ref2}
              returnKeyType="ok"
              label={t("label-input.notification.hour")}
              control={props.control}
              type="string"
              register={props.register}
              name="ACT.ACT_DECL_HOUR"
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

export default NotificationInformation;
