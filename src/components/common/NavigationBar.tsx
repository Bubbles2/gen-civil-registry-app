import * as React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { IconButton, Text } from "react-native-paper";
import { theme } from "../../core/theme";
import Dialog from "./Dialog";

type Props = React.ComponentProps<typeof Object>

const renderButton = (props: Props) => {
  if (props.labelVisibility) {
    return (
      <TouchableOpacity style={props.button} onPress={() => props.onClick()}>
        <Text style={styles.text}>{props.label}</Text>
      </TouchableOpacity>
    );
  } else {
    return <TouchableOpacity style={[props.button, { opacity: 0 }]} disabled />;
  }
};
const Button = (props: Props) => {
  return renderButton(props);
};

const NavigationBar = (props: Props) => {

  const [visible, setVisible] = React.useState(false);
  const showDialog = () => setVisible(true);
  const hideDialog = () => setVisible(false);

  const handleClickOk = () => {
    hideDialog()
    props.onClick("home")
  }

  return (
    <View style={styles.container}>
      <Dialog title={"Attention"} content={"Etes vous sur de vouloir quitter la notification en cours ?"} 
              ok="Oui" cancel="Non" visible={visible} hideDialog={hideDialog} handleClickOk={handleClickOk}
              handleClickCancel = {() => hideDialog()} />
      <Button
        button={styles.buttonLeft}
        onClick={() => props.onClick("prev")}
        label={props.prevLabel}
        labelVisibility={props.prevLabelVisible}
      />
      <IconButton
        style={styles.icon}
        icon="home"
        size={48}
        onPress={() => showDialog()}
      />
      <Button
        button={styles.buttonRight}
        onClick={() => props.onClick("next")}
        label={props.nextLabel}
        labelVisibility={props.nextLabelVisible}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  buttonRight: {
    flex: 0.3,
    //backgroundColor: "#2f3837",
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  buttonLeft: {
    flex: 0.3,
    //backgroundColor: "#2f3837",
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },

  text: {
    color: "white",
  },
  icon: {
    flex: 0.3,
    alignSelf: "center",
  },
});

export default NavigationBar;
