import React from "react";
import {View, StyleSheet, Text} from "react-native";
import {TextInput as Input} from "react-native-paper";
import {theme} from "../../core/theme";
import {Controller} from "react-hook-form";
import PropTypes from "prop-types";
import {useTranslation} from "react-i18next";

type Props = React.ComponentProps<typeof Object>



const addValidationRules : Function = (
  required: boolean | undefined,
  disabled: boolean | undefined,
) => {
  return {
    required: {
      value: required,
      message: "Le champ est obligatoire",
    }
  };
};

const NotificationNumberInput = (props: Props) => {
  const {t} = useTranslation();
  return (
    <Controller
      control={props.control}
      name={props.name}
      defaultValue={props.defaultValue}
      render={({fieldState: {error}, field}) => (
        <View style={styles.container}>
          <Input
            {...field}
            {...props.register(
              props.name,
              addValidationRules(
                props.required,
              ),
            )}
            onChange={event => {
                field.onChange(event.nativeEvent.text);
            }}
            value={field.value}
            style={props.required ? styles.inputBold : styles.input}
            selectionColor={theme.colors.primary}
            underlineColor="transparent"
            mode="flat"
            returnKeyType={props.returnKeyType}
            right={props.right ? props.right : null}
            onSubmitEditing={props.onSubmitEditing}
            ref={props.myRef}
            secureTextEntry={props.secureTextEntry}
            placeholder={t("label-input.notification.enter_ref")}
            disabled={props.disabled ? props.disabled : false}
           
          />

          {error ? <Text style={styles.error}>{error.message}</Text> : null}
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    width: "60%",
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

NotificationNumberInput.propTypes = {
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
  autoCapitalize:PropTypes.string
};

NotificationNumberInput.defaultProps = {
  disabled: false,
  required: false,
  customControl: null,
  customErrorMessage: "",
  type: "string",
  editable:true
};

export default NotificationNumberInput;
