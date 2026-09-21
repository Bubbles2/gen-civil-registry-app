import React, { useEffect, useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { TextInput, Appbar, Menu, Divider } from "react-native-paper";
import { SelectList } from "react-native-dropdown-select-list";
import { useSelector, useDispatch } from "react-redux";
import Logger from "../core/Logger";
import { theme } from "../core/theme";
import { getDBConnection, setPhoneCollectionPoint, getCollectionPoints } from "../core/services/databaseService";
import { setupActions } from "../store/setup-slice";
import { useTranslation } from "react-i18next";
import { Navigation } from "../types";
import Button from "../components/common/Button";


type Props = {
  navigation: Navigation;
};
const PhoneManagement = ({ navigation, ...props }: Props) => {
  const [colPointError, setColPointError] = React.useState(false);
  const dispatch = useDispatch()
  const [collectionPoints, setCollectionPoints] = React.useState([]);
  const { t } = useTranslation();
  const continueBtn = () => {
    navigation.navigate("Dashboard");
  };
// TODO Get description for Collection point to display as default
// TODO make sue all calls of setPhoneCollectionPoint adds a value (added to deselct)
  const phoneCollectionPoint = useSelector((state) => {
    return state.setup.PhoneCollectionPoint;
  });

  const PhoneCollectionPointLabel = useSelector((state) => {
    return state.setup.PhoneCollectionPointLabel;
  });


  useEffect(() => {
    getDBConnection().then((db: any) => {
        getCollectionPoints(db).then(cps => {
          if (cps !== null) {
            setCollectionPoints(cps);
          }
        });

    });
  }, []);




  const setCollectionPoint = async (item) => {
    setColPointError(false);
    try {
      const selectedObject = collectionPoints.find(obj => obj.value === item);
      const db = await getDBConnection();
      // Unflag old value
      const resultDel = await setPhoneCollectionPoint(db, phoneCollectionPoint, 0);
      // Set new Col Point
      const resultAdd = await setPhoneCollectionPoint(db, selectedObject.key, 1);
      dispatch(setupActions.updatePhone(selectedObject.key));
      dispatch(setupActions.updatePhoneCollectionPointLabel(selectedObject.value));
      dispatch(setupActions.updatePhoneCPType(selectedObject.type));

    } catch (error) {
      Logger.error("SQLite Error:", error);
    }
  };

  //...
  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => {  navigation.navigate("Dashboard"); }} />
        <Appbar.Content title="" />
      </Appbar.Header>
      <View style={styles.container}>
        <View style={styles.innercontainer}>
          <View>
            <Text  style={styles.titleCollect}>{t("collect.request")}</Text>
            <SelectList setSelected={(val) => setCollectionPoint(val)}
                        data={collectionPoints}
                        placeholder={PhoneCollectionPointLabel}
                        inputStyles={styles.inputCp}
                            dropdownTextStyles={styles.dropdownCp}
                            dropdownStyles={styles.inputCp}
                            boxStyles={styles.boxCp}
                        save="value" />
            {colPointError && <Text>* {t("message.error.bad_col_point")}</Text>}
          </View>
          <View style={styles.buttonContainer}>
            <Button backgroundColor={theme.colors.primary}
                    onPress={continueBtn}>{t("collect.continue")}</Button>
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 40,
  },
  innercontainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleCollect: {
    marginTop: 30,
    marginBottom: 20,
    color: "black",
  },
  buttonContainer: {
    alignSelf: 'center',
    marginBottom: 36,
  },
  inputCp: {
    color: "#808080",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  dropdownCp: {
    color: "black",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  boxCp: {
    backgroundColor: "#ffffff",
    color: "#000000",
    minHeight: 60,
    alignItems: "center",
  },
});

export default PhoneManagement;
