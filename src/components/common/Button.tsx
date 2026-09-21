import React from "react";
import {StyleSheet} from "react-native";
import {Button as PaperButton} from "react-native-paper";

type Props = React.ComponentProps<typeof Object>;

const Button = (props: Props) => (
  <PaperButton
    style={[styles.button, {backgroundColor: props.backgroundColor}]}
    labelStyle={styles.text}
    mode="contained"
    {...props}>
    {props.children}
  </PaperButton>
);

const styles = StyleSheet.create({
  button: {
    width: "90%",
    marginVertical: 10,
    borderRadius: 10,
    alignSelf: "center",
  },
  text: {
    fontWeight: "bold",
    fontSize: 15,
    lineHeight: 26,
    color: "#ffffff",
  },
});

export default Button;
