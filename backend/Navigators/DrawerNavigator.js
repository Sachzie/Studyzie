import * as React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  createDrawerNavigator,

} from "@react-navigation/drawer";

import Main from "./Main";

import DrawerContent from "../Shared/DrawerContent";

const NativeDrawer = createDrawerNavigator();
const DrawerNavigator = () => {
  return (

    <NativeDrawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: '50%',
        },
        headerStyle: {
          backgroundColor: "#FFFFFF",
        },
        headerTintColor: "#A16207",
        headerTitleStyle: {
          fontWeight: "700",
        },
      }}
      drawerContent={() => <DrawerContent />}>
      <NativeDrawer.Screen 
        name="Studyzie" 
        component={Main} 
        options={{
            title: ""
        }}
      />

    </NativeDrawer.Navigator>


  );
}
export default DrawerNavigator
