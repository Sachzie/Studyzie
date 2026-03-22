import React, { useCallback, useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Modal,
    Pressable,
    Image,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { BarChart } from "react-native-chart-kit";
import * as Notifications from 'expo-notifications';

import baseURL from "../assets/common/baseurl";
import { fetchOrders, updateOrderStatus as updateOrderStatusAction } from "../../backend/Redux/Actions/orderActions";
import { getToken } from "../../backend/Context/Store/tokenStorage";

const { width } = Dimensions.get("window");
const API_ORIGIN = baseURL.replace(/api\/v1\/?$/, "");

const periods = ["Monthly", "Weekly", "Today"];

const formatPeso = (value) =>
    `\u20B1${Number(value || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const resolveAvatarUri = (rawUri) => {
    if (!rawUri) return "";
    if (rawUri.startsWith("data:image")) return rawUri;

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
    propsForBackgroundLines: {
        stroke: "#E5E7EB",
    },
    fillShadowGradient: "#111827",
    fillShadowGradientOpacity: 1,
    barPercentage: 0.65,
};

const statusOptions = [
    { label: "Pending", value: "3", color: "#6B7280" },
    { label: "Shipped", value: "2", color: "#2563EB" },
    { label: "Delivered", value: "1", color: "#16A34A" },
    { label: "Cancelled", value: "0", color: "#DC2626" },
];

const toStatusInfo = (statusCode) => {
    const code = String(statusCode);

    if (code === "1") return { label: "Delivered", color: "#16A34A" };
    if (code === "2") return { label: "Shipped", color: "#2563EB" };
    if (code === "0" || code === "4" || code === "-1") return { label: "Cancelled", color: "#DC2626" };
    return { label: "Pending", color: "#6B7280" };
};

const isInActivePeriod = (dateString, period) => {
    const createdAt = new Date(dateString);
    const now = new Date();

    if (period === "Today") {
        return createdAt.toDateString() === now.toDateString();
    }

    const diffDays = (now - createdAt) / (1000 * 60 * 60 * 24);
    if (period === "Weekly") return diffDays <= 7;

    return diffDays <= 30;
};

const buildChartData = (orders) => {
    const sorted = [...orders].sort((a, b) => new Date(a.dateOrdered) - new Date(b.dateOrdered));
    const latest = sorted.slice(-4);

    const labels = latest.map((order) => {
        const date = new Date(order.dateOrdered);
        return `${date.toLocaleString("en-US", { month: "short" })} ${date.getDate()}`;
    });

    const values = latest.map((order) => Math.round(Number(order.totalPrice || 0)));

    if (labels.length === 0) {
        return {
            labels: ["-", "-", "-", "-"],
            datasets: [{ data: [0, 0, 0, 0] }],
        };
    }

    return {
        labels,
        datasets: [{ data: values }],
    };
};

const OrderRow = ({ item, onPressStatus, disabled }) => {
    const statusInfo = toStatusInfo(item.status);
    const userName = item?.user?.name || "Unknown User";
    const parts = userName.split(" ").filter(Boolean);
    const initials = parts.length > 1
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : userName.slice(0, 2).toUpperCase();
    const orderItems = Array.isArray(item?.orderItems) ? item.orderItems : [];
    const itemNames = orderItems
        .map((orderItem) => {
            const product = orderItem?.product || orderItem || {};
            const name = product?.name || orderItem?.name || "Item";
            const qty = Number(orderItem?.quantity) || 1;
            return `${name} x${qty}`;
        })
        .filter(Boolean);
    const itemsPreview = itemNames.length > 0
        ? (itemNames.length > 2 ? `${itemNames.slice(0, 2).join(", ")} +${itemNames.length - 2} more` : itemNames.join(", "))
        : "";
    const avatarImage = resolveAvatarUri(item?.user?.image || "");

    return (
        <View style={styles.orderRow}>
            <View style={styles.rowLeft}>
                <View style={styles.avatar}>
                    {avatarImage ? (
                        <Image source={{ uri: avatarImage }} style={styles.avatarImage} />
                    ) : (
                        <Text style={styles.avatarText}>{initials}</Text>
                    )}
                </View>
                <View>
                    <Text style={styles.customerName}>{userName}</Text>
                    <Text style={styles.orderDate}>
                        {new Date(item.dateOrdered).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                        })}
                    </Text>
                    {itemsPreview ? <Text style={styles.orderItemsPreview}>{itemsPreview}</Text> : null}
                </View>
            </View>

            <View style={styles.rowRight}>
                <Text style={styles.orderAmount}>+{formatPeso(item.totalPrice)}</Text>
                <TouchableOpacity
                    onPress={() => onPressStatus(item)}
                    disabled={disabled}
                    style={[styles.statusPill, { backgroundColor: statusInfo.color, opacity: disabled ? 0.6 : 1 }]}
                >
                    <Text style={styles.statusText}>{statusInfo.label}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const Orders = () => {
    const dispatch = useDispatch();
    const ordersState = useSelector((state) => state.orders);
    const {
        list: orders,
        loading,
        updating,
        updatingId,
    } = ordersState;
    const [activePeriod, setActivePeriod] = useState("Weekly");
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useFocusEffect(
        useCallback(() => {
            if (!orders.length && !loading) {
                dispatch(fetchOrders());
            }
        }, [dispatch, loading, orders.length])
    );

    const visibleOrders = useMemo(
        () => orders.filter((order) => isInActivePeriod(order.dateOrdered, activePeriod)),
        [orders, activePeriod]
    );

    const statusSummary = useMemo(() => {
        const summary = { pending: 0, delivered: 0, cancelled: 0 };
        visibleOrders.forEach((order) => {
            const state = toStatusInfo(order.status).label;
            if (state === "Delivered") summary.delivered += 1;
            else if (state === "Cancelled") summary.cancelled += 1;
            else if (state === "Pending") summary.pending += 1;
        });
        return summary;
    }, [visibleOrders]);

    const chartData = useMemo(() => buildChartData(visibleOrders), [visibleOrders]);
    const isLoading = loading && orders.length === 0;

    const openStatusModal = (order) => {
        setSelectedOrder(order);
        setStatusModalVisible(true);
    };

    const closeStatusModal = () => {
        if (updating) return;
        setStatusModalVisible(false);
        setSelectedOrder(null);
    };

    const getOrderId = (order) => order?.id || order?._id;

    const handleUpdateStatus = async (nextStatus) => {
        if (!selectedOrder) return;
        const orderId = getOrderId(selectedOrder);
        if (!orderId) return;

        try {
            const token = await getToken();
            await dispatch(updateOrderStatusAction(orderId, nextStatus, token));
            
            // Send Push Notification after successful update
            const statusLabel = statusOptions.find(o => o.value === nextStatus)?.label || "Updated";
            await sendLocalNotification(selectedOrder, statusLabel);
            
            closeStatusModal();
        } catch (error) {
            // Fallback: keep local state unchanged if update fails
            closeStatusModal();
        }
    };

    const sendLocalNotification = async (order, status) => {
        const orderId = getOrderId(order);
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "📦 Order Status Updated!",
                body: `Order #${orderId.slice(-6)} is now ${status.toUpperCase()}. Tap to view details.`,
                data: { 
                    screen: 'My Orders', 
                    orderId: orderId 
                },
                sound: true,
                priority: Notifications.AndroidImportance.MAX,
            },
            trigger: null, // Send immediately
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Orders</Text>
                <TouchableOpacity style={styles.filterButton}>
                    <Ionicons name="filter-outline" size={22} color="#111827" />
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View style={styles.loaderWrap}>
                    <ActivityIndicator size="large" color="#111827" />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Orders</Text>
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
                        <BarChart
                            data={chartData}
                            width={width - 40}
                            height={220}
                            fromZero
                            showValuesOnTopOfBars={false}
                            chartConfig={chartConfig}
                            withInnerLines
                            withHorizontalLabels
                            style={styles.chart}
                        />
                    </View>

                    <View style={styles.statusRow}>
                        <View style={styles.statusCard}>
                            <Text style={styles.statusCount}>{statusSummary.pending}</Text>
                            <Text style={styles.statusLabel}>Pending</Text>
                        </View>
                        <View style={styles.statusCard}>
                            <Text style={styles.statusCount}>{statusSummary.delivered}</Text>
                            <Text style={styles.statusLabel}>Delivered</Text>
                        </View>
                        <View style={styles.statusCard}>
                            <Text style={styles.statusCount}>{statusSummary.cancelled}</Text>
                            <Text style={styles.statusLabel}>Cancelled</Text>
                        </View>
                    </View>

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Order List</Text>
                        <View style={styles.segment}>
                            {periods.map((period) => (
                                <TouchableOpacity
                                    key={`list-${period}`}
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

                    <View style={styles.orderListCard}>
                        {visibleOrders.length === 0 ? (
                            <Text style={styles.emptyText}>No orders found for this time range.</Text>
                        ) : (
                            visibleOrders.map((order) => (
                                <OrderRow
                                    key={getOrderId(order)}
                                    item={order}
                                    onPressStatus={openStatusModal}
                                    disabled={updating && updatingId === getOrderId(order)}
                                />
                            ))
                        )}
                    </View>
                </ScrollView>
            )}

            <Modal
                transparent
                visible={statusModalVisible}
                animationType="fade"
                onRequestClose={closeStatusModal}
            >
                <Pressable style={styles.modalOverlay} onPress={closeStatusModal}>
                    <Pressable style={styles.modalCard} onPress={() => {}}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Update Order Status</Text>
                            <TouchableOpacity onPress={closeStatusModal} disabled={updating}>
                                <Ionicons name="close" size={20} color="#111827" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubtitle}>
                            {selectedOrder?.user?.name || "Unknown User"} • {formatPeso(selectedOrder?.totalPrice)}
                        </Text>

                    {statusOptions.map((option) => {
                        const isActive = String(selectedOrder?.status) === option.value;
                        return (
                            <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.statusOption,
                                        isActive && styles.statusOptionActive,
                                    ]}
                                    onPress={() => handleUpdateStatus(option.value)}
                                    disabled={updating}
                                >
                                    <View style={[styles.statusDot, { backgroundColor: option.color }]} />
                                    <Text style={styles.statusOptionText}>{option.label}</Text>
                                    {isActive ? (
                                        <Ionicons name="checkmark-circle" size={18} color={option.color} />
                                    ) : null}
                                </TouchableOpacity>
                            );
                        })}

                        {updating ? (
                            <View style={styles.modalLoading}>
                                <ActivityIndicator size="small" color="#111827" />
                                <Text style={styles.modalLoadingText}>Updating status...</Text>
                            </View>
                        ) : null}
                    </Pressable>
                </Pressable>
            </Modal>
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
        paddingBottom: 14,
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
        paddingBottom: 22,
    },
    sectionHeader: {
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
        paddingVertical: 8,
        marginBottom: 14,
    },
    chart: {
        borderRadius: 18,
    },
    statusRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    statusCard: {
        width: "32%",
        borderRadius: 14,
        backgroundColor: "#FFFFFF",
        paddingVertical: 12,
        alignItems: "center",
    },
    statusCount: {
        color: "#111827",
        fontSize: 24,
        fontWeight: "700",
    },
    statusLabel: {
        marginTop: 2,
        fontSize: 12,
        color: "#6B7280",
        fontWeight: "600",
    },
    orderListCard: {
        borderRadius: 18,
        backgroundColor: "#FFFFFF",
        overflow: "hidden",
    },
    orderRow: {
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    rowLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        marginRight: 6,
    },
    avatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
        overflow: "hidden",
    },
    avatarText: {
        color: "#4B5563",
        fontSize: 13,
        fontWeight: "700",
    },
    avatarImage: {
        width: "100%",
        height: "100%",
        borderRadius: 21,
    },
    customerName: {
        color: "#111827",
        fontSize: 15,
        fontWeight: "700",
    },
    orderDate: {
        marginTop: 2,
        color: "#9CA3AF",
        fontSize: 12,
    },
    orderItemsPreview: {
        marginTop: 4,
        color: "#6B7280",
        fontSize: 12,
        maxWidth: 200,
    },
    rowRight: {
        alignItems: "flex-end",
    },
    orderAmount: {
        color: "#111827",
        fontSize: 17,
        fontWeight: "700",
        marginBottom: 4,
    },
    statusPill: {
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    statusText: {
        color: "#FFFFFF",
        fontSize: 11,
        fontWeight: "700",
    },
    emptyText: {
        color: "#6B7280",
        fontSize: 14,
        padding: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.35)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalCard: {
        width: "100%",
        borderRadius: 16,
        backgroundColor: "#FFFFFF",
        padding: 16,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 6,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
    },
    modalSubtitle: {
        fontSize: 12,
        color: "#6B7280",
        marginBottom: 12,
    },
    statusOption: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        marginBottom: 10,
        backgroundColor: "#F9FAFB",
        gap: 8,
    },
    statusOptionActive: {
        borderColor: "#111827",
        backgroundColor: "#F3F4F6",
    },
    statusOptionText: {
        flex: 1,
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    modalLoading: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 4,
    },
    modalLoadingText: {
        fontSize: 12,
        color: "#6B7280",
        fontWeight: "600",
    },
});

export default Orders;
