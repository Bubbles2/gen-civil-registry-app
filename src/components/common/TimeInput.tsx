import * as React from "react";
import { StyleSheet, View, Keyboard } from "react-native";
import { Text, TextInput as Input } from "react-native-paper";
import { TimePickerModal } from "react-native-paper-dates";
import PropTypes from "prop-types";
import { Controller } from "react-hook-form";
import { theme } from "../../core/theme";

type Props = React.ComponentProps<typeof Object>;

const TimeInput = (props: Props) => {
  const [visible, setVisible] = React.useState(false);
  const onDismiss = React.useCallback(() => {
    setVisible(false);
  }, [setVisible]);

  const formatTime = (data: { hours: string, minutes: string }) => {
    let tempHours = data.hours;
    let tempMin = data.minutes;

    if (data.hours < "9") {
      tempHours = "0" + data.hours;
    }
    if (data.minutes < "9") {
      tempMin = "0" + data.minutes;
    }

    return tempHours + ":" + tempMin;
  };

  const maskForTime = (value: string) => {
    if (value.length > 5) {
      return value.substring(0, 5);
    }

    switch (value.length) {
      case 1:
        if (value > "2") {
          value = "";
        }
        break;
      case 2:
        if (value > "24") {
          value = value.substr(0, 1);
        }
        break;
      case 3:
      case 4:
        if (value[2] !== ":") {
          value = value.substr(0, 2) + ":" + value[2];
        }
        if (value[3] > "5") {
          value = value.substr(0, 3);
        }
        break;

      default:
        break;
    }

    return value;
  };

  const addValidationRules: Function = (
    required: boolean | undefined,
    customControl: () => boolean,
    customErrorMessage: string,
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



  return (
    <Controller
      control={props.control}
      name={props.name}
      defaultValue={props.defaultValue}
      render={({ fieldState: { error }, field }) => {
        return(
        props.visible &&
        <View style={styles.container}>
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
            onChange={event => {
              field.onChange(maskForTime(event.nativeEvent.text));
            }}
            type={props.type}
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
                name="calendar"
                disabled={props.disabled ? props.disabled : false}
                onPress={() => {
                  setVisible(!visible);
                  Keyboard.dismiss();
                }}
              />
            }
          />

          <TimePickerModal
            visible={visible}
            onDismiss={onDismiss}
            onConfirm={data => {
              field.onChange(formatTime(data));
              setVisible(false);
            }}
            label={props.label} // optional, default 'Select time'
            uppercase={false} // optional, default is true
            cancelLabel="Annuler" // optional, default: 'Cancel'
            confirmLabel="Ok" // optional, default: 'Ok'
            animationType="none" // optional, default is 'none'
            locale="fr" // optional, default is automically detected by your system
          />
          {error ? <Text style={styles.error}>{error.message}</Text> : null}
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
  error: {
    fontSize: 14,
    color: theme.colors.error,
    paddingHorizontal: 4,
    paddingTop: 4,
  },
});

TimeInput.propTypes = {
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
  visible: PropTypes.bool,

};

TimeInput.defaultProps = {
  disabled: false,
  required: false,
  customControl: null,
  customErrorMessage: "",
  type: "string",
  visible : true
};

export default TimeInput;
