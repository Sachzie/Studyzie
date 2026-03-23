import React, { useCallback, useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Image,
    Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { LineChart } from "react-native-chart-kit";
import a4Img from "../Picures/a4.jpg";
import ballpenImg from "../Picures/ballpen.jpg";
import notebookImg from "../Picures/notebook.jpg";
import pencilImg from "../Picures/pencil.jpg";
import yellowpadImg from "../Picures/yellowpad.jpg";
import oilpastelImg from "../Picures/oilpastel.png";

import baseURL from "../assets/common/baseurl";
import { fetchOrders } from "../../backend/Redux/Actions/orderActions";
import { fetchProducts } from "../../backend/Redux/Actions/productActions";

const { width } = Dimensions.get("window");
const API_ORIGIN = baseURL.replace(/api\/v1\/?$/, "");

const periods = ["Monthly", "Weekly", "Today"];
const IMAGE_SOURCE_BY_KEY = {
    a4: a4Img,
    ballpen: ballpenImg,
    notebook: notebookImg,
    pencil: pencilImg,
    yellowpad: yellowpadImg,
    oilpastel: oilpastelImg,
};

const formatPeso = (value, fractionDigits = 0) =>
    `\u20B1${Number(value || 0).toLocaleString("en-PH", {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    })}`;

const normalizeImageKey = (value) =>
    (value || "")
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^a-z0-9]/g, "");

const getImageKeyFromName = (name) => {
    const normalized = normalizeImageKey(name);
    if (normalized.includes("oilpastel")) return "oilpastel";
    if (normalized.includes("yellowpad")) return "yellowpad";
    if (normalized.includes("ballpen")) return "ballpen";
    if (normalized.includes("notebook")) return "notebook";
    if (normalized.includes("pencil")) return "pencil";
    if (normalized.includes("a4")) return "a4";
    return "";
};

const resolveImageUri = (rawUri) => {
    if (!rawUri) return "";
    if (/^https?:\/\//i.test(rawUri)) {
        try {
            const url = new URL(rawUri);
            if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
                return `${API_ORIGIN}${url.pathname}`;
            }
            return rawUri;
        } catch (e) {
            return rawUri;
        }
    }

    if (rawUri.startsWith("/")) {
        return `${API_ORIGIN}${rawUri}`;
    }

    return `${API_ORIGIN}/public/uploads/${rawUri}`;
};

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
    fillShadowGradientTo: "#D1D5DB",
    fillShadowGradientFromOpacity: 0.16,
    fillShadowGradientToOpacity: 0.04,
};

const buildChartData = (orders = [], period = "Weekly") => {
    const now = new Date();
    let labels = [];
    let salesData = [];
    let ordersData = [];

    if (period === "Today") {
        labels = ["4am", "8am", "12pm", "4pm", "8pm", "12am"];
        salesData = new Array(6).fill(0);
        ordersData = new Array(6).fill(0);
        
        orders.forEach((order) => {
            if (!order.dateOrdered) return;
            const date = new Date(order.dateOrdered);
            // Robust check for same day
            if (
                date.getFullYear() === now.getFullYear() &&
                date.getMonth() === now.getMonth() &&
                date.getDate() === now.getDate()
            ) {
                const hour = date.getHours();
                const idx = Math.min(5, Math.floor(hour / 4));
                salesData[idx] += Number(order.totalPrice || 0);
                ordersData[idx] += 1;
            }
        });
    } else if (period === "Weekly") {
        // Use Last 7 Days instead of Fixed Sun-Sat for better visibility
        labels = [];
        salesData = new Array(7).fill(0);
        ordersData = new Array(7).fill(0);
        
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            labels.push(dayNames[d.getDay()]);
        }

        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        orders.forEach((order) => {
            if (!order.dateOrdered) return;
            const date = new Date(order.dateOrdered);
            if (date >= sevenDaysAgo) {
                const dayDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
                if (dayDiff >= 0 && dayDiff <= 6) {
                    const idx = 6 - dayDiff; // Map oldest to 0, today to 6
                    salesData[idx] += Number(order.totalPrice || 0);
                    ordersData[idx] += 1;
                }
            }
        });
    } else {
        // Monthly - Last 4 Weeks
        labels = ["W1", "W2", "W3", "W4"];
        salesData = new Array(4).fill(0);
        ordersData = new Array(4).fill(0);

        orders.forEach((order) => {
            if (!order.dateOrdered) return;
            const date = new Date(order.dateOrdered);
            if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
                const day = date.getDate();
                const weekIdx = Math.min(3, Math.floor((day - 1) / 7));
                salesData[weekIdx] += Number(order.totalPrice || 0);
                ordersData[weekIdx] += 1;
            }
        });
    }

    const safeOrdersData = ordersData.map(v => v || 0);
    const maxOrders = Math.max(...safeOrdersData, 5);
    
    return {
        labels,
        datasets: [
            {
                data: safeOrdersData,
                color: (opacity = 1) => `rgba(17, 24, 39, ${opacity})`,
                strokeWidth: 3,
            },
            {
                data: salesData.map(s => (s / 1000) * (maxOrders / 4) || 0), 
                color: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
                strokeWidth: 3,
            },
        ],
        legend: ["Orders", "Sales (k)"],
    };
};

const resolveItemTag = (item) => {
    const sales = item.salesCount || 0;
    if (sales > 20) return { text: "Best Seller", color: "#059669" };
    if (sales > 10) return { text: "Hot", color: "#2563EB" };
    if (sales > 0) return { text: "Growing", color: "#D97706" };
    return { text: "New", color: "#6B7280" };
};

const Analytics = () => {
    const dispatch = useDispatch();
    const productsState = useSelector((state) => state.products);
    const ordersState = useSelector((state) => state.orders);
    const orders = ordersState.list || [];
    const products = productsState.items || [];
    const loading =
        (ordersState.loading || productsState.loading)
        && (orders.length === 0 && products.length === 0);
    const [activePeriod, setActivePeriod] = useState("Weekly");

    useFocusEffect(
        useCallback(() => {
            dispatch(fetchOrders());
            dispatch(fetchProducts());
        }, [dispatch])
    );

    const totalSales = useMemo(
        () => orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0),
        [orders]
    );

    const averageSales = useMemo(() => {
        if (orders.length === 0) return 0;
        return totalSales / orders.length;
    }, [orders.length, totalSales]);

    const trendingItems = useMemo(() => {
        const productSales = {};
        orders.forEach(order => {
            if (order.orderItems) {
                order.orderItems.forEach(item => {
                    const productId = item.product?.id || item.product?._id || item.product;
                    if (productId) {
                        productSales[productId] = (productSales[productId] || 0) + (item.quantity || 0);
                    }
                });
            }
        });

        return [...products]
            .map(p => ({
                ...p,
                salesCount: productSales[p.id] || productSales[p._id] || 0
            }))
            .sort((a, b) => b.salesCount - a.salesCount)
            .slice(0, 4);
    }, [products, orders]);

    const chartData = useMemo(() => buildChartData(orders, activePeriod), [orders, activePeriod]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Analytics</Text>
                <TouchableOpacity style={styles.filterButton}>
                    <Ionicons name="filter-outline" size={22} color="#111827" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loaderWrap}>
                    <ActivityIndicator size="large" color="#111827" />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.metricRow}>
                        <View style={styles.metricCard}>
                            <View style={styles.metricIcon}>
                                <Ionicons name="bar-chart-outline" size={18} color="#111827" />
                            </View>
                            <Text style={styles.metricValue}>{formatPeso(totalSales, 0)}</Text>
                            <Text style={styles.metricLabel}>Total Sales</Text>
                        </View>
                        <View style={styles.metricCard}>
                            <View style={styles.metricIcon}>
                                <Ionicons name="trending-up-outline" size={18} color="#111827" />
                            </View>
                            <Text style={styles.metricValue}>{formatPeso(averageSales, 0)}</Text>
                            <Text style={styles.metricLabel}>Average Sales</Text>
                        </View>
                    </View>

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Chart Orders</Text>
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
                            height={215}
                            chartConfig={chartConfig}
                            withInnerLines
                            withOuterLines={false}
                            withShadow
                            withDots={false}
                            withVerticalLines={false}
                            bezier
                            style={styles.chart}
                        />
                    </View>

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Trending Items</Text>
                        <View style={styles.segment}>
                            {periods.map((period) => (
                                <TouchableOpacity
                                    key={`trending-${period}`}
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

                    <View style={styles.listCard}>
                        {trendingItems.length === 0 ? (
                            <Text style={styles.emptyText}>No items available yet.</Text>
                        ) : (
                            trendingItems.map((item) => {
                                const tag = resolveItemTag(item);
                                const imageUri = resolveImageUri(item?.image || "");
                                const imageKey = normalizeImageKey(item.imageKey) || getImageKeyFromName(item.name);
                                const imageSource = imageUri
                                    ? { uri: imageUri }
                                    : (
                                        IMAGE_SOURCE_BY_KEY[imageKey] || {
                                            uri: "https://dummyimage.com/100x100/e5e7eb/6b7280&text=No+Image",
                                        }
                                    );
                                return (
                                    <View key={item.id} style={styles.itemRow}>
                                        <Image
                                            source={imageSource}
                                            style={styles.itemImage}
                                        />
                                        <View style={styles.itemTextWrap}>
                                            <Text style={styles.itemTitle} numberOfLines={1}>
                                                {item.name}
                                            </Text>
                                            <Text style={styles.itemSubtitle} numberOfLines={1}>
                                                {item.brand || "Studyzie"}
                                            </Text>
                                        </View>
                                        <View style={styles.itemRight}>
                                            <Text style={styles.itemValue}>{item.salesCount || 0} Sold</Text>
                                            <Text style={[styles.itemTag, { color: tag.color }]}>{tag.text}</Text>
                                        </View>
                                    </View>
                                );
                            })
                        )}
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
        paddingTop: 52,
        paddingBottom: 16,
        paddingHorizontal: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 36,
        fontWeight: "700",
        color: "#111827",
    },
    filterButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 1,
        borderColor: "#D1D5DB",
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
    },
    loaderWrap: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    metricRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 18,
    },
    metricCard: {
        width: "48%",
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 14,
    },
    metricIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
    },
    metricValue: {
        fontSize: 22,
        fontWeight: "700",
        color: "#111827",
    },
    metricLabel: {
        fontSize: 14,
        color: "#6B7280",
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
        marginTop: 8,
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
        paddingVertical: 6,
        paddingHorizontal: 10,
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
        marginBottom: 14,
    },
    chart: {
        borderRadius: 18,
    },
    listCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        overflow: "hidden",
        paddingVertical: 4,
    },
    itemRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    itemImage: {
        width: 54,
        height: 54,
        borderRadius: 10,
        backgroundColor: "#E5E7EB",
    },
    itemTextWrap: {
        flex: 1,
        marginLeft: 10,
    },
    itemTitle: {
        color: "#111827",
        fontSize: 16,
        fontWeight: "700",
    },
    itemSubtitle: {
        marginTop: 2,
        color: "#9CA3AF",
        fontSize: 13,
    },
    itemRight: {
        alignItems: "flex-end",
    },
    itemValue: {
        color: "#111827",
        fontSize: 15,
        fontWeight: "700",
    },
    itemTag: {
        marginTop: 2,
        fontSize: 13,
        fontWeight: "600",
    },
    emptyText: {
        color: "#6B7280",
        fontSize: 14,
        padding: 14,
    },
});

export default Analytics;
