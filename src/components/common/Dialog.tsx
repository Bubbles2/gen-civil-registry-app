import React from "react";
import {View} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import {Dialog as RDialog, Portal, Text,Button as RButton} from "react-native-paper";
import Logger from "../../core/Logger";

type Props = React.ComponentProps<typeof Object>;

export const Dialog = (props: Props) => {
    return (
        <View>
            <Portal >
                <RDialog style={props.styles} visible={props.visible} onDismiss={props.hideDialog}>
                    <RDialog.Title>{props.title}</RDialog.Title>
                    <RDialog.ScrollArea >
                        <ScrollView >
                            <Text variant="bodyMedium">{props.content}</Text>    
                        </ScrollView>
                    </RDialog.ScrollArea>
                    
                    <RDialog.Actions>
                        {props.cancel !== null &&<RButton onPress={() => props.handleClickCancel()}>{props.cancel}</RButton>}
                        {props.ok !== null && <RButton onPress={() => props.handleClickOk()}>{props.ok}</RButton>}
                    </RDialog.Actions>
                </RDialog>
            </Portal>
        </View>
    )
};



export default Dialog;
