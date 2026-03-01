import React, { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet, StatusBar, Dimensions, TouchableOpacity } from 'react-native'
import axios from 'axios'
import baseURL from "../../assets/common/baseurl";
import { useFocusEffect } from '@react-navigation/native'
import OrderCard from "../../Shared/OrderCard";
import { BarChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const chartConfig = {
    backgroundGradientFrom: "#FFFFFF",
    backgroundGradientTo: "#FFFFFF",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    barPercentage: 0.7,
    style: {
        borderRadius: 16
    }
};

const Orders = (props) => {
    const [orderList, setOrderList] = useState()
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("Weekly");

    useFocusEffect(
        useCallback(
            () => {
                getOrders();
                return () => {
                    setOrderList()
                }
            }, [],
        )
    )

    const getOrders = () => {
        setLoading(true);
        axios.get(`${baseURL}orders`)
            .then((res) => {
                setOrderList(res.data)
                setLoading(false);
            })
            .catch((error) => {
                console.log(error)
                setLoading(false);
            })
    }

    const chartData = {
        labels: ["Aug 19", "Aug 20", "Aug 21", "Aug 22"],
        datasets: [
            {
                data: [45, 28, 30, 40]
            }
        ]
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
            
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Orders</Text>
                <TouchableOpacity onPress={() => {}}>
                     <Ionicons name="filter-circle-outline" size={32} color="#1F2937" />
                </TouchableOpacity>
            </View>

            <View style={styles.chartContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Orders</Text>
                    <View style={styles.tabContainer}>
                        {["Monthly", "Weekly", "Today"].map((tab) => (
                            <TouchableOpacity 
                                key={tab} 
                                style={[styles.tab, activeTab === tab && styles.activeTab]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
                <BarChart
                    data={chartData}
                    width={width - 40}
                    height={220}
                    yAxisLabel=""
                    chartConfig={chartConfig}
                    style={styles.chart}
                    showValuesOnTopOfBars
                    withInnerLines={true}
                    fromZero
                />
            </View>

            <View style={styles.listHeader}>
                <Text style={styles.sectionTitle}>Order List</Text>
                 <View style={styles.tabContainer}>
                        {["Monthly", "Weekly", "Today"].map((tab) => (
                            <TouchableOpacity 
                                key={tab} 
                                style={[styles.tab, activeTab === tab && styles.activeTab]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <Text>Loading Orders...</Text>
                </View>
            ) : (
                <FlatList
                    data={orderList}
                    renderItem={({ item }) => (
                        <OrderCard item={item} update={true} />
                    )}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>No orders found</Text>
                        </View>
                    }
                />
            )}
            
            {/* Bottom Nav Placeholder */}
             <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem} onPress={() => props.navigation.navigate("Dashboard")}>
                    <Ionicons name="grid-outline" size={24} color="#9CA3AF" />
                    <Text style={styles.navText}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="stats-chart-outline" size={24} color="#9CA3AF" />
                    <Text style={styles.navText}>Analytics</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="list" size={24} color="#000" />
                    <Text style={[styles.navText, styles.navTextActive]}>Orders</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="settings-outline" size={24} color="#9CA3AF" />
                    <Text style={styles.navText}>Settings</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#111827",
    },
    chartContainer: {
        backgroundColor: "#FFFFFF",
        margin: 20,
        padding: 16,
        borderRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#111827",
    },
    tabContainer: {
        flexDirection: "row",
        backgroundColor: "#F3F4F6",
        borderRadius: 20,
        padding: 4,
    },
    tab: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 16,
    },
    activeTab: {
        backgroundColor: "#1F2937",
    },
    tabText: {
        fontSize: 10,
        color: "#6B7280",
        fontWeight: "600",
    },
    activeTabText: {
        color: "#FFFFFF",
    },
    chart: {
        borderRadius: 16,
        marginVertical: 8,
        paddingRight: 0,
    },
    listHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1
    },
    emptyText: {
        marginTop: 50,
        color: '#6B7280'
    },
    bottomNav: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
    },
    navItem: {
        alignItems: "center",
    },
    navText: {
        fontSize: 10,
        marginTop: 4,
        color: "#9CA3AF",
        fontWeight: "600",
    },
    navTextActive: {
        color: "#000000",
    },
});

export default Orders;
