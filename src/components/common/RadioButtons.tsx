import * as React from "react";
import {StyleSheet, View} from "react-native";
import {RadioButton, Text} from "react-native-paper";
import PropTypes from "prop-types";
import {Controller} from "react-hook-form";
import {theme} from "../../core/theme";
import Logger from "../../core/Logger";
import {withDefaults} from "./withDefaults";

type Props = React.ComponentProps<typeof Object>

const RadioButtonsDefaults = {
  disabled: false,
  required: false,
};

const RadioButtons =  (rawProps: Props) =>{
  const props = withDefaults(rawProps, RadioButtonsDefaults);
  const generateButton = () => {
    if (props.orientation === "row") {
      return (
        <View style={styles.containerRow}>
          {props.options.map((item : {value:string,label:string}) => {
            return (
              <View style={styles.innerRow} key={item.value}>
                <Text style={styles.text}>{item.label}</Text>
                <RadioButton
                  value={item.value}
                   disabled={props.disabled}
                  {...props.register(props.name, {
                    required: {
                      value: props.required,
                      message: "Le champ est obligatoire",
                    },
                  })}
                  onPress={() => Logger.debug("Button pressed   ")}
                  color={theme.colors.primary}
                />
              </View>
            );
          })}
        </View>
      );
    }
    if (props.orientation === "column") {
      return (
        <View style={styles.containerColumn}>
          {props.options.map((item : {label:string,value:string}) => {
            return (
              <View style={styles.innerColumn} key={item.value}>
                <Text style={styles.text}>{item.label}</Text>
                <RadioButton
                  value={item.value}
                  disabled={props.disabled}
                  {...props.register(props.name, {
                    required: {
                      value: props.required,
                      message: "Le champ est obligatoire",
                    },
                  })}
                  color={theme.colors.primary}
                />
              </View>
            );
          })}
        </View>
      );
    }
  };
  const Radios = () => {
    return(<React.Fragment>
      {generateButton()}
    </React.Fragment>)

  };

  return (
    <Controller
      control={props.control}
      name={props.name}
      render={({fieldState: {error}, field}) => (
        <React.Fragment>
          <View style={styles.container}>
            <View style={styles.innerContainerText}>
              <Text style={props.required ? styles.textBold : styles.text}>
                {props.required ? props.label + " *" : props.label}
              </Text>
            </View>
            <View style={styles.innerContainerRadioGroup}>
              <View>
                <RadioButton.Group
                  onValueChange={newValue => {
                    // Log the field's name and new value
                    if(props.onPress)props.onPress(newValue);
                    // Original field.onChange call
                    field.onChange(newValue);
                  }}
                  value={field.value}>
                  <Radios />
                </RadioButton.Group>
              </View>
            </View>
          </View>
          <View style={{marginStart: 12}}>
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
    flex: 0.8,
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

RadioButtons.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  register: PropTypes.func.isRequired,
  onPress: PropTypes.func,
  options: PropTypes.array.isRequired,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  orientation: PropTypes.oneOf(["row", "column"]),
};


export default RadioButtons;
