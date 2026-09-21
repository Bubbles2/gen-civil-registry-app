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
const MenuType = (props: Props) => {

    const { valueType, manageTypeChange } = props;

    const { t } = useTranslation();


    const handleNavigate = () => {
      props.navigation.navigate("PhoneManagement");
    };
    return (
      <View>
        <Text
          style={{
            fontSize: 18,
            alignSelf: "center",
          }}>
          Type
        </Text>
        <RadioButton.Group
          onValueChange={(newValue: string) => manageTypeChange(newValue)}
          value={valueType}>
          <View
            style={{
              flexDirection: "column",
            }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}>
              <Text
                style={{
                  color: "black",
                  fontSize: 18,
                  textAlign: "center",
                }}>
                {t("button.all")}
              </Text>
              <View
                style={{
                  flex: 1,
                  alignItems: "flex-end",
                }}>
                <RadioButton value={"TOUS"} color={theme.colors.primary} />
              </View>
            </View>
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
              }}>
              <Text
                style={{
                  color: "black",
                  fontSize: 18,
                  textAlign: "center",
                }}>
                {t("button.birth")}
              </Text>
              <View
                style={{
                  flex: 1,
                  alignItems: "flex-end",
                }}>
                <RadioButton value={"NAISSANCE"} color={theme.colors.primary} />
              </View>
            </View>
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
              }}>
              <Text
                style={{
                  color: "black",
                  fontSize: 18,
                  textAlign: "center",
                }}>
                {t("button.death")}
              </Text>
              <View
                style={{
                  flex: 1,
                  alignItems: "flex-end",
                }}>
                <RadioButton value={"DECES"} color={theme.colors.primary} />
              </View>
            </View>
          </View>
        </RadioButton.Group>
      </View>
    );
  }
;
export default MenuType;
