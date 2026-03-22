import React, { useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import AuthGlobal from '../../backend/Context/Store/AuthGlobal';
import baseURL from '../assets/common/baseurl';
import OrderCard from '../Shared/OrderCard';
import { fetchUserOrders } from '../../backend/Redux/Actions/orderActions';
import { getToken } from '../../backend/Context/Store/tokenStorage';

const MyOrders = (props) => {
    const context = useContext(AuthGlobal);
    const [profile, setProfile] = useState(null);
    const [activeFilter, setActiveFilter] = useState("All");
    const dispatch = useDispatch();
    const ordersState = useSelector((state) => state.orders);
    const { userList: orders, userLoading: loading } = ordersState;
    const route = props.route || {};

    useFocusEffect(
        useCallback(() => {
            let isActive = true;
            if (
                context.stateUser.isAuthenticated === false ||
                context.stateUser.isAuthenticated === null
            ) {
                props.navigation.navigate("Login");
                return;
            }

            const userId = context.stateUser.user.userId || context.stateUser.user.id || context.stateUser.user.sub; 
            
            const loadProfile = async () => {
                try {
                    const token = await getToken();
                    if (!token || !userId) return;
                    const response = await axios.get(`${baseURL}users/${userId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (isActive) {
                        setProfile(response.data);
                    }
                } catch (error) {
                    if (isActive) {
                        setProfile(null);
                    }
                }
            };

            loadProfile();
            dispatch(fetchUserOrders(userId));

            return () => {
                isActive = false;
                setProfile(null);
            };
        }, [context.stateUser.isAuthenticated, dispatch, props.navigation])
    );

    const filteredOrders = useMemo(() => {
        if (activeFilter === "All") return orders;
        if (activeFilter === "Pending") {
            return orders.filter((order) => String(order.status) === "3");
        }
        if (activeFilter === "Delivered") {
            return orders.filter((order) => String(order.status) === "1");
        }
        if (activeFilter === "Cancelled") {
            return orders.filter((order) => ["0", "4", "-1"].includes(String(order.status)));
        }
        return orders;
    }, [orders, activeFilter]);

    // Handle deep link from notification
    useEffect(() => {
        if (route.params?.orderId) {
            // Find the order and potentially highlight it or expand it
            // For now, we'll just ensure the list is showing 'All' so it's visible
            setActiveFilter("All");
        }
    }, [route.params?.orderId]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Orders</Text>
                    <Text style={styles.headerSubtitle}>Your school supply purchases</Text>
                </View>
            </View>

            <View style={styles.filterRow}>
                {["All", "Pending", "Delivered", "Cancelled"].map((label) => (
                    <TouchableOpacity
                        key={label}
                        style={[
                            styles.filterChip,
                            activeFilter === label && styles.filterChipActive,
                        ]}
                        onPress={() => setActiveFilter(label)}
                    >
                        <Text
                            style={[
                                styles.filterChipText,
                                activeFilter === label && styles.filterChipTextActive,
                            ]}
                        >
                            {label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View style={styles.center}>
                    <Text>Loading Orders...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredOrders}
                    renderItem={({ item }) => (
                        <OrderCard
                            item={item}
                            avatarUrl={profile?.image || ""}
                            displayName={profile?.name || ""}
                        />
                    )}
                    keyExtractor={(item, index) =>
                        String(item?.id || item?._id || item?._id?.$oid || `${item?.dateOrdered || "order"}-${index}`)
                    }
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
        backgroundColor: "#F4F7F5",
    },
    header: {
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
        zIndex: 10,
        marginBottom: 12,
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: "800",
        color: "#0F5D3A",
    },
    headerSubtitle: {
        fontSize: 14,
        color: "#6B7280",
        marginTop: 4,
    },
    filterRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        paddingHorizontal: 16,
        marginBottom: 8,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#D1D5DB",
        backgroundColor: "#FFFFFF",
    },
    filterChipActive: {
        backgroundColor: "#0F5D3A",
        borderColor: "#0F5D3A",
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#374151",
    },
    filterChipTextActive: {
        color: "#FFFFFF",
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 110,
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
