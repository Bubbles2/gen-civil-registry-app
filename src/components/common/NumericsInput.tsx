import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { TextInput as Input } from "react-native-paper";
import { theme } from "../../core/theme";
import { Controller } from "react-hook-form";
import PropTypes from "prop-types";
import NumericInput from 'react-native-numeric-input'
import Logger from "../../core/Logger";
import {withDefaults} from "./withDefaults";

type Props = React.ComponentProps<typeof Object>

const addValidationRules : Function  = (
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

const NumericsInputDefaults = {
  disabled: false,
  required: false,
  customControl: null,
  customErrorMessage: "",
  type: "string",
};

const NumericsInput = (rawProps: Props) => {
  const props = withDefaults(rawProps, NumericsInputDefaults);
  const handleInputChange = (value) => {
    if (props.onChange) {
      props.onChange(value);
    }
  };
  return (
    <Controller
      control={props.control}
      name={props.name}
      defaultValue={props.defaultValue}
      render={({ fieldState: { error }, field }) => (
        <React.Fragment>
          <View style={styles.container} pointerEvents={props.disabled ? "none" : "auto"}>
            <View style={styles.innerContainerText}>
              <Text style={props.required ? styles.textBold : styles.text}>
                {props.required ? props.label + " *" : props.label}
              </Text>
            </View>
            <View style={styles.innerContainerRadioGroup}>
              <View style={{ borderWidth: 1, borderColor: "grey", borderTopWidth: 0, borderBottomWidth: 0, borderEndWidth: 0, paddingEnd: 1 }}>
                <NumericInput
                  {...field}
                  {...props.register(
                    props.name,
                    addValidationRules(
                      props.required,
                      props.customControl,
                      props.customErrorMessage,
                    ),
                  )}
                  editable={props.editable}
                  style={props.required ? styles.inputBold : styles.input}
                  value={field.value}
                  onChange={value => {
                    field.onChange(value)
                    handleInputChange(value)
                  }}
                  rounded
                  minValue={props.minValue}
                  maxValue={props.maxValue}
                  borderColor={"white"}
                  inputStyle={{ borderColor: "grey" }}
                  totalWidth={145}
                  type="up-down"
                  iconSize={25}
                  ref={props.myRef}
                  returnKeyType={props.returnKeyType}
                  onSubmitEditing={props.onSubmitEditing}
                  iconStyle={{ color: 'black' }}
                  step={1} />
              </View>
            </View>
          </View>
          <View style={{ marginStart: 12 }}>
            {error ? <Text style={styles.error}>{error.message}</Text> : null}
          </View>
        </React.Fragment>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0.8,
    borderRadius: 5,
    margin: 8,
  },
  innerContainerText: {
    flex: 1,
  },
  input: {
    backgroundColor: theme.colors.surface,
  },
  inputBold: {
    backgroundColor: theme.colors.surface,
    fontWeight: "bold",
  },
  innerContainerRadioGroup: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  containerRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  innerRow: {
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  containerColumn: {
    flex: 1,
  },
  innerColumn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  text: {
    fontSize: 16,
    marginLeft: 12,
    color: "#808080",
  },
  textBold: {
    fontSize: 16,
    marginLeft: 12,
    color: "#808080",
    fontWeight: "bold",
  },
  error: {
    fontSize: 14,
    color: theme.colors.error,
    paddingHorizontal: 4,
    paddingTop: 4,
  },
});

NumericsInput.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  register: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  customControl: PropTypes.func,
  customErrorMessage: PropTypes.string,
  type: PropTypes.string,
};


export default NumericsInput;
