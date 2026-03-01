import React, { useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar } from 'react-native';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import AuthGlobal from '../../Context/Store/AuthGlobal';
import baseURL from '../../assets/common/baseurl';
import OrderCard from '../../Shared/OrderCard';

const MyOrders = (props) => {
    const context = useContext(AuthGlobal);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            if (
                context.stateUser.isAuthenticated === false ||
                context.stateUser.isAuthenticated === null
            ) {
                props.navigation.navigate("Login");
                return;
            }

            const userId = context.stateUser.user.userId || context.stateUser.user.id || context.stateUser.user.sub; // Handle different JWT payloads
            
            setLoading(true);
            axios
                .get(`${baseURL}orders/get/userorders/${userId}`)
                .then((res) => {
                    setOrders(res.data);
                    setLoading(false);
                })
                .catch((error) => {
                    console.log(error);
                    setLoading(false);
                });

            return () => {
                setOrders([]);
            };
        }, [context.stateUser.isAuthenticated, props.navigation])
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Orders</Text>
                <Text style={styles.headerSubtitle}>Track your purchases</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <Text>Loading Orders...</Text>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={({ item }) => (
                        <OrderCard item={item} />
                    )}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>You have no orders yet</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    header: {
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
        zIndex: 10,
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "800",
        color: "#103B28",
    },
    headerSubtitle: {
        fontSize: 14,
        color: "#6B7280",
        marginTop: 4,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 80, // Space for bottom tab
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        marginTop: 50
    },
    emptyText: {
        fontSize: 16,
        color: "#9CA3AF",
    }
});

export default MyOrders;
