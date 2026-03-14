import React, { useContext } from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";

import HomeNavigator from "./HomeNavigator";
import CartNavigator from "./CartNavigator";
import UserNavigator from "./UserNavigator";
import AdminNavigator from "./AdminNavigator";
import MyOrders from "../../screens/User/MyOrders";
import Reviews from "../../screens/User/Reviews";
import { Ionicons } from "@expo/vector-icons";
import CartIcon from "../../screens/Shared/CartIcon";
import AuthGlobal from "../Context/Store/AuthGlobal";
const Tab = createBottomTabNavigator();

const Main = () => {
    const context = useContext(AuthGlobal);
    const isAuthenticated = Boolean(context?.stateUser?.isAuthenticated);
    const isAdmin = Boolean(context?.stateUser?.user?.isAdmin);

    if (!isAuthenticated) {
        return <UserNavigator />
    }

    if (isAdmin) {
        return <AdminNavigator />
    }

    const tabBarBaseStyle = {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        elevation: 5,
        backgroundColor: '#ffffff',
        borderRadius: 30,
        height: 60,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        borderTopWidth: 0,
    };

    const getCartTabBarStyle = (route) => {
        const routeName = getFocusedRouteNameFromRoute(route) ?? "Cart";
        if (["Checkout", "Shipping", "Payment", "Confirm"].includes(routeName)) {
            return { display: 'none' };
        }
        return tabBarBaseStyle;
    };

    return (
        <Tab.Navigator
            initialRouteName="Home"
            screenOptions={{
                headerShown: false,
                tabBarHideOnKeyboard: true,
                tabBarShowLabel: false,
                tabBarActiveTintColor: '#103B28',
                tabBarStyle: tabBarBaseStyle,
                tabBarItemStyle: {
                    padding: 5,
                    justifyContent: 'center',
                    alignItems: 'center',
                }
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeNavigator}
                options={{
                    headerShown: false,
                    tabBarIcon: ({ color }) => (
                        <Ionicons
                            name="home"
                            style={{ position: "relative" }}
                            color={color}
                            size={30}
                        />
                    )
                }}
            />

            <Tab.Screen
                name="My Orders"
                component={MyOrders}
                options={{
                    headerShown: false,
                    tabBarIcon: ({ color }) => (
                        <Ionicons
                            name="bag-handle"
                            style={{ position: "relative" }}
                            color={color}
                            size={30}
                        />
                    )
                }}
            />

            <Tab.Screen
                name="Ratings"
                component={Reviews}
                options={{
                    headerShown: false,
                    tabBarIcon: ({ color }) => (
                        <Ionicons
                            name="star"
                            style={{ position: "relative" }}
                            color={color}
                            size={28}
                        />
                    )
                }}
            />

            <Tab.Screen
                name="Cart Screen"
                component={CartNavigator}
                options={({ route }) => ({
                    headerShown: false,
                    tabBarStyle: getCartTabBarStyle(route),
                    tabBarIcon: ({ color }) => (
                        <View>
                            <Ionicons
                                name="cart"
                                style={{ position: "relative" }}
                                color={color}
                                size={30}
                            />
                            <CartIcon />
                        </View>
                    )
                })}
            />

            <Tab.Screen
                name="User"
                component={UserNavigator}
                options={{
                    tabBarIcon: ({ color }) => (
                        <Ionicons
                            name="person"
                            style={{ position: "relative" }}
                            color={color}
                            size={30}
                        />
                    )
                }}
            />

        </Tab.Navigator>
    )
}
export default Main
