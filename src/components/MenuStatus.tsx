import {View} from "react-native";
import {Checkbox, Text} from "react-native-paper";
import React from "react";
import {useTranslation} from "react-i18next";

type Props = {
    valueCb1:boolean,
    setValueCb1:React.Dispatch<React.SetStateAction<boolean>>,
    valueCb2:boolean,
    setValueCb2:React.Dispatch<React.SetStateAction<boolean>>,
    valueCb3:boolean,
    setValueCb3:React.Dispatch<React.SetStateAction<boolean>>,
    valueCb4:boolean,
    setValueCb4:React.Dispatch<React.SetStateAction<boolean>>
}

const MenuStatus = (props:Props) => {
    const {valueCb1,setValueCb1,valueCb2,setValueCb2,valueCb3,setValueCb3,valueCb4,setValueCb4} = props
    const {t} = useTranslation();
    return (
        <View>
            <Text style={{fontSize: 18, alignSelf: "center"}}>Status</Text>
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
                    {t("button.status.draft")}
                </Text>
                <View style={{flex: 1, alignItems: "flex-end"}}>
                    <Checkbox
                        status={valueCb1 ? "checked" : "unchecked"}
                        onPress={() => {
                            setValueCb1(!valueCb1);
                        }}
                    />
                </View>
            </View>
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
                    {t("button.status.validate")}
                </Text>
                <View style={{flex: 1, alignItems: "flex-end"}}>
                    <Checkbox
                        status={valueCb2 ? "checked" : "unchecked"}
                        onPress={() => {
                            setValueCb2(!valueCb2);
                        }}
                    />
                </View>
            </View>
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
                    {t("button.status.archive")}
                </Text>
                <View style={{flex: 1, alignItems: "flex-end"}}>
                    <Checkbox
                        status={valueCb3 ? "checked" : "unchecked"}
                        onPress={() => {
                            setValueCb3(!valueCb3);
                        }}
                    />
                </View>
            </View>
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
                    {t("button.status.error")}
                </Text>
                <View style={{flex: 1, alignItems: "flex-end"}}>
                    <Checkbox
                        status={valueCb4 ? "checked" : "unchecked"}
                        onPress={() => {
                            setValueCb4(!valueCb4);
                        }}
                    />
                </View>
            </View>
        </View>
    );
};
export default MenuStatus
