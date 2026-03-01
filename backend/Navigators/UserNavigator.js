import React, { useContext } from "react";
import { createStackNavigator } from '@react-navigation/stack'

import Login from "../../Screeens/User/Login";
import Register from "../../Screeens/User/Register";
import UserProfile from "../../Screeens/User/UserProfile";
import AuthGlobal from "../Context/Store/AuthGlobal";
// import MyOrders from "../Screens/User/MyOrders";
const Stack = createStackNavigator();

const UserNavigator = (props) => {
    const context = useContext(AuthGlobal);
    const isAuthenticated = Boolean(context?.stateUser?.isAuthenticated);

    return (
        <Stack.Navigator
            initialRouteName={isAuthenticated ? "User Profile" : "Login"}
            screenOptions={{
                headerStyle: {
                    backgroundColor: "#FFFFFF",
                },
                headerTintColor: "#A16207",
                headerTitleStyle: {
                    fontWeight: "700",
                },
            }}
        >
            <Stack.Screen
                name="Login"
                component={Login}
                options={{
                    headerShown: false
                }}
            />

            <Stack.Screen
                name="Register"
                component={Register}
                options={{
                    headerShown: false
                }}
            />

            <Stack.Screen
                name="User Profile"
                component={UserProfile}
                options={{
                    title: "My Account"
                }}
            />

            {/* <Stack.Screen
                name="My Orders"
                component={MyOrders}
                options={{
                    headerShown: false
                }}
            /> */}
        </Stack.Navigator>
    )

}

export default UserNavigator;
