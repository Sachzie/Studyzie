import React from "react"
import { createStackNavigator } from "@react-navigation/stack"

import Orders from "../Screeens/Admin/Orders";
import Products from "../Screeens/Admin/Products";
import ProductForm from "../Screeens/Admin/ProductForm";
import Categories from "../Screeens/Admin/Categories";
import Dashboard from "../Screeens/Admin/Dashboard";
import Users from "../Screeens/Admin/Users";

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