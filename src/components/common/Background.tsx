import React from "react";
import {KeyboardAvoidingView, StyleSheet} from "react-native";

type Props = {
  children: React.ReactNode;
};

const Background = (props: Props) => (
  <KeyboardAvoidingView
    style={styles.container}
    behavior={"height"}
    keyboardVerticalOffset={-100}>
    {props.children}
  </KeyboardAvoidingView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Background;
