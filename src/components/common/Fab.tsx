import React from "react";
import {useTranslation} from "react-i18next";
import {StyleSheet, View, Image} from "react-native";
import {FAB, Portal} from "react-native-paper";

type Props = {
  goForm: (arg0:string) => void;
  props :React.ComponentProps<typeof Object>
  children:React.ReactNode
};

const Fab = (props: Props) => {
  const [state, setState] = React.useState({open: false});
  const {open} = state;
  const onStateChange = ({open}) => setState({open});
  const {t} = useTranslation();


  return (
        <FAB.Group
          style={styles.fab}
          open={open}
          visible
          icon={open ? require("../../assets/icone-quadri-180.png") : "plus"}
          actions={[
            {
              icon: "plus",
              label: t("button.birth").toString(),
              onPress: () => props.goForm("NAISSANCE"),
            },
            {
              icon: "plus",
              label: t("button.death").toString(),
              onPress: () => props.goForm("DECES"),
            },
          ]}
          onStateChange={onStateChange}
          onPress={() => {
            if (open) {
              // do something if the speed dial is open
            }
          }}
        />
  );
};

const styles = StyleSheet.create({
  fab: {
    position:"absolute",
    bottom:65
  },
});

export default Fab;
