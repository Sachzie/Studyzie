import React from "react"
import { createStackNavigator } from "@react-navigation/stack"

import Products from "../../screens/Admin/Products";
import ProductForm from "../../screens/Admin/ProductForm";
import Categories from "../../screens/Admin/Categories";
import Users from "../../screens/Admin/Users";
import UserForm from "../../screens/Admin/UserForm";
import AdminTabs from "./AdminTabs";
import AdminProfile from "../../screens/Admin/AdminProfile";

const Stack = createStackNavigator();

const AdminNavigator = () => {

    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: "#FFFFFF",
                },
                headerTintColor: "#111827",
                headerTitleStyle: {
                    fontWeight: "700",
                },
            }}
        >
            <Stack.Screen
                name="AdminTabs"
                component={AdminTabs}
                options={{
                    title: "Admin",
                    headerShown: false
                }}
            />
            <Stack.Screen
                name="Products"
                component={Products}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="Categories"
                component={Categories}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="ProductForm"
                component={ProductForm}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="Users"
                component={Users}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="UserForm"
                component={UserForm}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="Admin Profile"
                component={AdminProfile}
                options={{
                    headerShown: false,
                }}
            />
        </Stack.Navigator>
    )
}
export default AdminNavigator
