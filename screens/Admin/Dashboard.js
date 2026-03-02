import React, { useCallback, useContext, useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    Dimensions,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { LineChart } from "react-native-chart-kit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

import baseURL from "../assets/common/baseurl";
import AuthGlobal from "../../backend/Context/Store/AuthGlobal";

const { width } = Dimensions.get("window");

const periods = ["Monthly", "Weekly", "Today"];

const formatPeso = (value, fractionDigits = 0) =>
    `\u20B1${Number(value || 0).toLocaleString("en-PH", {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    })}`;

const chartConfig = {
    backgroundGradientFrom: "#FFFFFF",
    backgroundGradientTo: "#FFFFFF",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(17, 24, 39, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    propsForDots: {
        r: "3",
        strokeWidth: "1",
        stroke: "#111827",
    },
    propsForBackgroundLines: {
        stroke: "#E5E7EB",
    },
    fillShadowGradientFrom: "#111827",
    fillShadowGradientTo: "#F3F4F6",
    fillShadowGradientFromOpacity: 0.16,
    fillShadowGradientToOpacity: 0.04,
};

const calculateRevenueData = (orders = []) => {
    const labels = ["S", "M", "T", "W", "T", "F", "S"];
    const revenueByDay = new Array(7).fill(0);
    const countByDay = new Array(7).fill(0);

    orders.forEach((order) => {
        if (!order?.dateOrdered) return;
        const date = new Date(order.dateOrdered);
        const dayIndex = date.getDay();
        revenueByDay[dayIndex] += Number(order.totalPrice || 0);
        countByDay[dayIndex] += 1;
    });

    const normalizedRevenue = revenueByDay.map((value) =>
        Math.max(16, Math.min(60, Math.round(value / 8) + 16))
    );
    const normalizedOrders = countByDay.map((value) => Math.max(16, value * 10 + 16));

    return {
        labels,
        datasets: [
            {
                data: normalizedRevenue,
                color: (opacity = 1) => `rgba(209, 177, 190, ${opacity})`,
                strokeWidth: 3,
            },
            {
                data: normalizedOrders,
                color: (opacity = 1) => `rgba(17, 24, 39, ${opacity})`,
                strokeWidth: 3,
            },
        ],
    };
};

const StatCard = ({ value, title, progress, accentColor, dark, onPress }) => (
    <TouchableOpacity
        style={[styles.statCard, dark ? styles.statCardDark : styles.statCardLight]}
        activeOpacity={0.86}
        onPress={onPress}
    >
        <Text style={[styles.statValue, dark && styles.textLight]}>{value}</Text>
        <Text style={[styles.statTitle, dark ? styles.subtitleDark : styles.subtitleLight]}>{title}</Text>

        <View style={styles.progressRow}>
            <Text style={[styles.progressLabel, dark ? styles.subtitleDark : styles.subtitleLight]}>0%</Text>
            <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: accentColor }]} />
            </View>
            <Text style={[styles.progressLabel, dark ? styles.subtitleDark : styles.subtitleLight]}>{progress}%</Text>
        </View>
    </TouchableOpacity>
);

const Dashboard = ({ navigation }) => {
    const context = useContext(AuthGlobal);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [adminProfile, setAdminProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activePeriod, setActivePeriod] = useState("Weekly");

    useFocusEffect(
        useCallback(() => {
            let isActive = true;

            const fetchData = async () => {
                setLoading(true);
                try {
                    const token = await AsyncStorage.getItem("jwt");
                    const config = token
                        ? {
                            headers: { Authorization: `Bearer ${token}` },
                        }
                        : undefined;
                    const userId =
                        context?.stateUser?.user?.userId ||
                        context?.stateUser?.user?.id ||
                        context?.stateUser?.user?.sub;

                    const [productsRes, ordersRes, usersRes] = await Promise.allSettled([
                        axios.get(`${baseURL}products`),
                        axios.get(`${baseURL}orders`),
                        config ? axios.get(`${baseURL}users`, config) : Promise.resolve({ data: [] }),
                    ]);
                    const currentUserRes =
                        config && userId
                            ? await axios.get(`${baseURL}users/${userId}`, config)
                            : null;

                    if (!isActive) return;

                    setProducts(productsRes.status === "fulfilled" ? productsRes.value.data : []);
                    setOrders(ordersRes.status === "fulfilled" ? ordersRes.value.data : []);
                    setUsers(usersRes.status === "fulfilled" ? usersRes.value.data : []);
                    setAdminProfile(currentUserRes?.data || null);
                } catch (error) {
                    if (isActive) {
                        setProducts([]);
                        setOrders([]);
                        setUsers([]);
                        setAdminProfile(null);
                    }
                } finally {
                    if (isActive) {
                        setLoading(false);
                    }
                }
            };

            fetchData();

            return () => {
                isActive = false;
            };
        }, [context?.stateUser?.user?.id, context?.stateUser?.user?.sub, context?.stateUser?.user?.userId])
    );

    const totalSales = useMemo(
        () => orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0),
        [orders]
    );

    const chartData = useMemo(() => calculateRevenueData(orders), [orders]);

    const avatarLetter = (adminProfile?.name || "A").charAt(0).toUpperCase();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Dashboard</Text>
                <View style={styles.avatar}>
                    {adminProfile?.image ? (
                        <Image source={{ uri: adminProfile.image }} style={styles.avatarImage} />
                    ) : (
                        <Text style={styles.avatarInitial}>{avatarLetter}</Text>
                    )}
                </View>
            </View>

            {loading ? (
                <View style={styles.loaderWrap}>
                    <ActivityIndicator size="large" color="#111827" />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.statGrid}>
                        <View style={styles.cardWrap}>
                            <StatCard
                                value={products.length}
                                title="Total Products"
                                progress={30}
                                accentColor="#E5E7EB"
                                dark
                                onPress={() => navigation.navigate("Products")}
                            />
                        </View>
                        <View style={styles.cardWrap}>
                            <StatCard
                                value={orders.length}
                                title="Total Orders"
                                progress={70}
                                accentColor="#60A5FA"
                                onPress={() => navigation.navigate("Orders")}
                            />
                        </View>
                        <View style={styles.cardWrap}>
                            <StatCard
                                value={users.length}
                                title="Total Clients"
                                progress={70}
                                accentColor="#D1D5DB"
                                onPress={() => navigation.navigate("Users")}
                            />
                        </View>
                        <View style={styles.cardWrap}>
                            <StatCard
                                value={formatPeso(totalSales, 0)}
                                title="Revenue"
                                progress={70}
                                accentColor="#F5BDD5"
                                onPress={() => navigation.navigate("Analytics")}
                            />
                        </View>
                    </View>

                    <View style={styles.chartHeader}>
                        <Text style={styles.sectionTitle}>Revenue</Text>
                        <View style={styles.segment}>
                            {periods.map((period) => (
                                <TouchableOpacity
                                    key={period}
                                    style={[styles.segmentItem, activePeriod === period && styles.segmentItemActive]}
                                    onPress={() => setActivePeriod(period)}
                                >
                                    <Text style={[styles.segmentText, activePeriod === period && styles.segmentTextActive]}>
                                        {period}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.chartCard}>
                        <LineChart
                            data={chartData}
                            width={width - 40}
                            height={220}
                            chartConfig={chartConfig}
                            withVerticalLines={false}
                            withInnerLines
                            withOuterLines={false}
                            withDots
                            withShadow={false}
                            bezier
                            style={styles.chart}
                        />
                    </View>
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F3F4F6",
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 52,
        paddingBottom: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 35,
        fontWeight: "700",
        color: "#111827",
    },
    avatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#111827",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    avatarImage: {
        width: "100%",
        height: "100%",
    },
    avatarInitial: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
    loaderWrap: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 18,
    },
    statGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    cardWrap: {
        width: "48%",
        marginBottom: 12,
    },
    statCard: {
        borderRadius: 18,
        padding: 14,
        minHeight: 130,
        justifyContent: "space-between",
    },
    statCardDark: {
        backgroundColor: "#0F1116",
    },
    statCardLight: {
        backgroundColor: "#FFFFFF",
    },
    statValue: {
        fontSize: 34,
        fontWeight: "700",
        color: "#111827",
    },
    statTitle: {
        fontSize: 14,
        marginTop: -6,
    },
    textLight: {
        color: "#FFFFFF",
    },
    subtitleDark: {
        color: "#D1D5DB",
    },
    subtitleLight: {
        color: "#6B7280",
    },
    progressRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    progressLabel: {
        fontSize: 10,
        width: 22,
    },
    progressTrack: {
        flex: 1,
        height: 8,
        borderRadius: 999,
        backgroundColor: "rgba(17,24,39,0.08)",
        marginHorizontal: 6,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        borderRadius: 999,
    },
    chartHeader: {
        marginTop: 6,
        marginBottom: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    sectionTitle: {
        fontSize: 26,
        fontWeight: "700",
        color: "#111827",
    },
    segment: {
        flexDirection: "row",
        backgroundColor: "#E5E7EB",
        borderRadius: 8,
        overflow: "hidden",
    },
    segmentItem: {
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    segmentItemActive: {
        backgroundColor: "#111827",
    },
    segmentText: {
        fontSize: 11,
        color: "#6B7280",
        fontWeight: "600",
    },
    segmentTextActive: {
        color: "#FFFFFF",
    },
    chartCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        paddingVertical: 6,
        marginBottom: 10,
    },
    chart: {
        borderRadius: 18,
    },
});

export default Dashboard;
