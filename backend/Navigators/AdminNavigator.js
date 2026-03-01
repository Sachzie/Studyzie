import React from "react"
import { createStackNavigator } from "@react-navigation/stack"

import Orders from "../screens/Admin/Orders";
import Products from "../screens/Admin/Products";
import ProductForm from "../screens/Admin/ProductForm";
import Categories from "../screens/Admin/Categories";
import Dashboard from "../screens/Admin/Dashboard";
import Users from "../screens/Admin/Users";

const Stack = createStackNavigator();

const AdminNavigator = () => {

    return (
        <Stack.Navigator>
            <Stack.Screen 
                name="Dashboard" 
                component={Dashboard} 
                options={{
                    headerShown: false
                }}
            />
            <Stack.Screen
                name="Products"
                component={Products}
                options={{
                    title: "Products"
                }}
            />
            <Stack.Screen name="Categories" component={Categories} />
            <Stack.Screen name="Orders" component={Orders} />
            <Stack.Screen name="ProductForm" component={ProductForm} />
            <Stack.Screen name="Users" component={Users} />
        </Stack.Navigator>
    )
}
export default AdminNavigator