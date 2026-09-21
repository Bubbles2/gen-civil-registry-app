import React from "react";
import {View, StyleSheet, Text} from "react-native";
import {TextInput as Input} from "react-native-paper";
import {theme} from "../../core/theme";
import {Controller} from "react-hook-form";
import PropTypes from "prop-types";

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

const TextInput = (props: Props) => {
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
               props.customControl,
               props.customErrorMessage,
             ),
           )}
           onChange={event => {
             if (props.type === "number") {
               field.onChange(parseInt(event.nativeEvent.text));
             } else {
               field.onChange(event.nativeEvent.text);
             }
           }}
           value={field.value}
           editable={props.editable ? props.editable : false}
           disabled={props.disabled ? props.disabled : false}
           style={[
            props.required ? styles.inputBold : styles.input,
            props.display ? {} : {display: "none"}
          ]}
           selectionColor={theme.colors.primary}
           underlineColor="transparent"
           mode="outlined"
           returnKeyType={props.returnKeyType}
           label={props.required ? props.label + " *" : props.label}
           right={props.right ? props.right : null}
           onSubmitEditing={props.onSubmitEditing}
           ref={props.myRef}
           keyboardType={props.keyboardType}
           secureTextEntry={props.secureTextEntry}
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

TextInput.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  register: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  customControl: PropTypes.func,
  customErrorMessage: PropTypes.string,
  type: PropTypes.string,
  returnKeyType:PropTypes.string,
  onSubmitEditing:PropTypes.func,
  autoCapitalize:PropTypes.string,
  display:PropTypes.bool,
};

TextInput.defaultProps = {
  disabled: false,
  required: false,
  customControl: null,
  customErrorMessage: "",
  type: "string",
  editable:true,
  display:true,
};

export default TextInput;
