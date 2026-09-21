import { View, TouchableOpacity } from "react-native";
import { RadioButton, Text, Divider } from "react-native-paper";
import { theme } from "../core/theme";
import React from "react";
import { useTranslation } from "react-i18next";
import { Navigation } from "../types";

type Props = {
  navigation: Navigation;
  valueType: string,
  manageTypeChange: (arg0: string) => void
}
const MenuAdmin = (props: Props) => {

    const { valueType, manageTypeChange } = props;

    const { t } = useTranslation();


    const handleNavigate = () => {
      manageTypeChange()
      props.navigation.navigate("PhoneManagement");
    };
    return (
      <View
        style={{
          marginTop: 10,
        }}>
          <Divider />
        <Text
          style={{
             fontSize: 18,
            alignSelf: "center",
          }}>
          Administration
        </Text>
          <TouchableOpacity onPress={handleNavigate} style={{ alignSelf: "center", marginTop: 15 }}>
            <Text style={{ fontSize: 18, color: theme.colors.primary }}>
              Phone Manager
            </Text>
          </TouchableOpacity>
          <Divider />
        </View>
    );
  }
;
export default MenuAdmin;
