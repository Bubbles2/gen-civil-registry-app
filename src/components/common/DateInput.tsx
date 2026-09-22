import * as React from "react";
import {StyleSheet, View, Text, Keyboard} from "react-native";
import {Controller} from "react-hook-form";
import {TextInput as Input} from "react-native-paper";
import {theme} from "../../core/theme";
import PropTypes from "prop-types";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import moment from "moment"
import { useTranslation } from "react-i18next";

type Props = React.ComponentProps<typeof Object>

const DateInput = (props: Props) => {
  const {t} = useTranslation();
  const [visible, setVisible] = React.useState(false);
  const [veryYoung, setVeryYoung] = React.useState("");

  const maskForDate = (value:String) => {
    if (value.length > 10) {
      return value.substring(0, 10);
    }

    switch (value.length) {
      case 1:
        if (value > "3") {
          value = "3";
        }
        break;
      case 2:
        if (value > "31") {
          value = "31";
        }
        break;
      case 3:
      case 4:
        if (value[2] !== "/") {
          value = value.substr(0, 2) + "/" + value[2];
        }
        if (value[3] > "1") {
          value = value.substr(0, 3) + "1";
        }
        break;
      case 5:
        if (value.substr(3, 2) > "12") {
          value = value.substr(0, 3) + "12";
        }
        break;
      case 6:
      case 7:
        if (value[5] !== "/") {
          value = value.substr(0, 5) + "/" + value[5];
        }
        if (value[6] < "1") {
          value = value.substr(0, 6) + "1";
        }
        break;
      default:
        break;
    }

    return value;
  };


  const addValidationRules : Function = (
    required : boolean,
    customControl : () => boolean,
    customErrorMessage : string,
  ) => {
    let val;
    if (customControl !== null) {
      val = () => customControl() || customErrorMessage;
      } else {
      val = () => true;
    }
    return {
      required: {
        value: required,
        message: "Le champ est obligatoire",
      },
      validate: val,
    };
  };
  const checkParentBirthDate = (value) => {
    setVeryYoung("")
    const dateFormat = "DD/MM/YYYY";
    const parsedDate = moment(value, dateFormat, true);
    if(parsedDate.isValid()) {
      if(props.name === 'FATHER.INFO_NAI.EVT_DATE' || props.name ===  'MOTHER.INFO_NAI.EVT_DATE'){
        const diff = moment().diff(parsedDate, 'years');
        if(diff < 10)
          setVeryYoung(t('message.error.young_parent')) ;
      }
    }
  }


  return (
    <Controller
      control={props.control}
      name={props.name}
      defaultValue={props.defaultValue}
      render={({fieldState: {error}, field}) => { 
        return (
        props.visible && 
        <View style={styles.container} >
          <Input
            {...field}
            {...props.register(
              props.name,
              addValidationRules(
                props.required,
                props.customControl,
                props.customErrorMessage,
              ),
            )}
            maxLength={props.maxLength}
            onBlur={() => {checkParentBirthDate(field.value)}}
            onChange={event => {
              field.onChange(maskForDate(event.nativeEvent.text));
              checkParentBirthDate(event.nativeEvent.text);
            }}
            value={field.value}
            disabled={props.disabled ? props.disabled : false}
            style={props.required ? styles.inputBold : styles.input}
            selectionColor={theme.colors.primary}
            underlineColor="transparent"
            mode="outlined"
            ref={props.myRef}
            returnKeyType={props.returnKeyType}
            onSubmitEditing={props.onSubmitEditing}
            label={props.required ? props.label + " *" : props.label}
            keyboardType={props.keyboardType}
            right={
              <Input.Icon
                icon="calendar"
                forceTextInputFocus={false}
                disabled={props.disabled ? props.disabled : false}
                onPress={() => {
                  setVisible(!visible);
                }}
              />
            }
          />
          <DateTimePickerModal
            isVisible={visible}
            mode="date"
            onConfirm={date => {
              field.onChange(moment(date).format("DD/MM/YYYY"));
              checkParentBirthDate(moment(date).format("DD/MM/YYYY"));
              setVisible(false);
            }}
            onCancel={() => setVisible(false)}
          />

          {error ? <Text style={styles.error}>{error.message}</Text> : null}
          { veryYoung.length > 0 && <Text style={styles.error}>{veryYoung}</Text>}

        </View>

  )}}

    />
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 8,
  },
  input: {
    backgroundColor: theme.colors.surface,
  },
  inputBold: {
    backgroundColor: theme.colors.surface,
    fontWeight: "bold",
  },
    warning: {
      fontSize: 14,
      color: "orange",
      paddingHorizontal: 4,
      paddingTop: 4,
    },
  error: {
    fontSize: 14,
    color: theme.colors.error,
    paddingHorizontal: 4,
    paddingTop: 4,
  },
});

DateInput.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  register: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  customControl: PropTypes.func,
  customErrorMessage: PropTypes.string,
  type: PropTypes.string,
  returnKeyType:PropTypes.string,
  onSubmitEditing:PropTypes.func,
  autoCapitalize:PropTypes.string,
  visible:PropTypes.bool
};

DateInput.defaultProps = {
  disabled: false,
  required: false,
  customControl: null,
  customErrorMessage: "",
  type: "string",
  visible:true
};

export default DateInput;
