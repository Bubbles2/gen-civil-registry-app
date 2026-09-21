import React from "react";
import { View, StyleSheet, Text, TouchableOpacity, ReturnKeyTypeOptions, KeyboardTypeOptions } from "react-native";
import { TextInput as Input, Surface } from "react-native-paper";
import { theme } from "../../core/theme";
import { Control, Controller, FieldValues, UseFormRegister, ValidationRule } from "react-hook-form";
import PropTypes from "prop-types";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

type Props = React.ComponentProps<typeof Object>

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

const AutocompletePcsInput = (props: Props) => {

  const [visible, setVisible] = React.useState(false)
  const [filteredData, setFilteredData] = React.useState([]);

  const filterData = (query: string) => {

    if (query) {
      const regex = new RegExp(`${query.trim()}`, 'i');
      setFilteredData(props.list.filter((item: {value:string}) => item.value.search(regex) >= 0));
    } else {
      setFilteredData([])
    }
  };

  const ResultList = (props: Props) => {
    return (
      <React.Fragment>
        {props.visible && props.filteredList.length > 0 &&
          <KeyboardAwareScrollView style={styles.listContainerStyle}>
            <Surface style={styles.surface}>
              {props.filteredList.map((item: {value:string}) => {
                return (
                  <TouchableOpacity style={{ flex: 1, alignItems: "center" }} onPress={() => props.onClick(item.value)}>
                    <Text style={{ color: "black", fontSize: 18 }}>{item.value}</Text>
                  </TouchableOpacity>
                )
              })}
            </Surface>
          </KeyboardAwareScrollView>
        }</React.Fragment>


    )
  }

  return (
    <Controller
      control={props.control}
      name={props.name}
      defaultValue={props.defaultValue}
      render={({ fieldState: { error }, field }) => (
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
            onChange={event => {
              if (props.type === "number") {
                field.onChange(parseInt(event.nativeEvent.text));
              } else {
                field.onChange(event.nativeEvent.text);
              }
              filterData(event.nativeEvent.text)
            }}
            value={field.value}
            disabled={props.disabled ? props.disabled : false}
            style={props.required ? styles.inputBold : styles.input}
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
            onFocus={() => setVisible(true)}
          />

          {error ? <Text style={styles.error}>{error.message}</Text> : null}

          <ResultList
            filteredList={filteredData}
            visible={visible}
            onClick={(clickedItem:string) => {
              field.onChange(clickedItem)
              setVisible(false)
            }
            }
          />
        </View>)} />)
}



const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 8,
  },
  listContainerStyle: {
    maxHeight: 100,
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
  surface: {
    flex: 1,
    marginTop: 6,
    marginBottom: 6,
    marginStart: 2,
    marginEnd: 2,
    borderRadius: 5,
    elevation: 6
  },
});

AutocompletePcsInput.propTypes = {
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
  autoCapitalize:PropTypes.string
};

AutocompletePcsInput.defaultProps = {
  disabled: false,
  required: false,
  customControl: null,
  customErrorMessage: "",
  type: "string",
};

export default AutocompletePcsInput;
