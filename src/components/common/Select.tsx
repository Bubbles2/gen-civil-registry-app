import * as React from "react";
import {StyleSheet, View, Text, TouchableWithoutFeedback} from "react-native";
import {SelectList} from "react-native-dropdown-select-list";
import {Controller} from "react-hook-form";

type Props = React.ComponentProps<typeof Object>

const addValidationRules : Function = (
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

const Select = (props:Props) => {
  return (
    <Controller
      control={props.control}
      name={props.name}
      rules={addValidationRules(props.required, null, null)}
      defaultValue={props.defaultValue}
      render={({fieldState: {error}, field}) => (
        <View
          pointerEvents={props.disabled ? "none" : "auto"}
          style={styles.container}>
          <Text style={props.required ? styles.labelBold : styles.label}>
            {props.required ? props.label + " *" : props.label}
          </Text>
          <SelectList
            setSelected={(val : string)=> field.onChange(val)}
            placeholder={field.value ? field.value : props.placeholder}
            data={props.options}
            inputStyles={styles.input}
            dropdownTextStyles={styles.input}
            dropdownStyles={styles.input}
            boxStyles={styles.box}
            search={true}
            save="value"
          />
          {error ? <Text style={styles.error}>{error.message}</Text> : null}
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    minHeight: 60,
    padding: 8,
    marginTop: 8,
  },
  error: {
    flex: 1,
    color: "red",
    marginStart: 10,
    marginTop: 10,
  },
  label: {
    color: "#808080",
    flex: 1,
    paddingStart: 10,
    alignItems: "center",
    backgroundColor: "#ffffff",
    position: "absolute",
    zIndex: 1,
    marginStart: 20,
    paddingLeft: 10,
    paddingRight: 10,
  },
  labelBold: {
    color: "#808080",
    position: "absolute",
    zIndex: 1,
    marginStart: 20,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: "#ffffff",
    fontWeight: "bold",
  },
  input: {
    color: "#808080",
    flex: 1,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  box: {
    backgroundColor: "#ffffff",
    color: "#000000",
    minHeight: 60,
    alignItems: "center",
  },
});

export default Select;
