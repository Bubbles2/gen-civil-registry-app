import React from "react";
// Plain RN ScrollView: the gesture-handler one requires a GestureHandlerRootView
// ancestor, which this app never mounts (dev builds throw a Render Error).
import {View, ScrollView} from "react-native";
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
