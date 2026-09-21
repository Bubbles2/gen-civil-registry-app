import React from "react";
import {createNativeStackNavigator} from "@react-navigation/native-stack";

import {LoginScreen, Dashboard, Forms} from "./screens";
import PhoneManagement from "./screens/PhoneManagement";

const Stack = createNativeStackNavigator();

const Router = () => (
  <Stack.Navigator
    initialRouteName="LoginScreen"
    screenOptions={{headerShown: false}}>
    <Stack.Screen name="PhoneManagement" component={PhoneManagement} />
    <Stack.Screen name="LoginScreen" component={LoginScreen} />
    <Stack.Screen name="Dashboard" component={Dashboard} />
    <Stack.Screen name="Forms" component={Forms} />
  </Stack.Navigator>
);

export default Router;
