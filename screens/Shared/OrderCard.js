import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from "axios";
import baseURL from "../assets/common/baseurl";
import { useNavigation } from '@react-navigation/native'
import Toast from "react-native-toast-message";

const API_ORIGIN = baseURL.replace(/api\/v1\/?$/, "");

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

const formatPeso = (value) =>
  `\u20B1${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const codes = [
  { name: "Cancelled", code: "0" },
  { name: "Pending", code: "3" },
  { name: "Shipped", code: "2" },
  { name: "Delivered", code: "1" },
];

const OrderCard = ({ item, update, avatarUrl, displayName }) => {
  const [statusChange, setStatusChange] = useState(item.status);
  const [token, setToken] = useState('');
  const navigation = useNavigation();
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("jwt")
      .then((res) => {
        setToken(res);
      })
      .catch((error) => console.log(error));
  }, []);

  const updateOrder = (newStatus) => {
    setStatusChange(newStatus);
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const order = {
      ...item,
      status: newStatus,
    };

    axios
      .put(`${baseURL}orders/${item.id}`, order, config)
      .then((res) => {
        if (res.status == 200 || res.status == 201) {
          Toast.show({
            type: "success",
            text1: "Order Updated",
            text2: `Status changed to ${codes.find(c => c.code === newStatus).name}`,
          });
        }
      })
      .catch((error) => {
        Toast.show({
          type: "error",
          text1: "Something went wrong",
          text2: "Please try again",
        });
      });
  };

  const getStatusColor = (status) => {
    if (status === "0" || status === "4" || status === "-1") return "#DC2626";
    if (status === "3") return "#6B7280";
    if (status === "2") return "#3B82F6"; // Shipped - Blue
    return "#10B981"; // Delivered - Green
  };

  const getStatusText = (status) => {
    if (status === "0" || status === "4" || status === "-1") return "Cancelled";
    if (status === "3") return "Pending";
    if (status === "2") return "Shipped";
    return "Delivered";
  };

  const getItemSummary = () => {
    const orderItems = Array.isArray(item?.orderItems) ? item.orderItems : [];
    if (!orderItems.length) return "";

    const normalized = orderItems.map((orderItem) => {
      const product = orderItem?.product || orderItem || {};
      const name = product?.name || orderItem?.name || "Item";
      const qty = Number(orderItem?.quantity) || 1;
      return `${name} x${qty}`;
    });

    if (normalized.length <= 2) {
      return normalized.join(", ");
    }

    return `${normalized.slice(0, 2).join(", ")} +${normalized.length - 2} more`;
  };

  const itemSummary = getItemSummary();
  const resolvedName = displayName || item?.user?.name || "You";
  const resolvedAvatar = avatarUrl || item?.user?.image || "";
  const avatarImage = resolveAvatarUri(resolvedAvatar);
  const statusCode = String(item?.status ?? statusChange ?? "");
  const statusAvatar = statusCode === "3"
    ? { icon: "time-outline", label: "Pending", bg: "#F3F4F6", color: "#6B7280" }
    : statusCode === "1"
        ? { icon: "car-outline", label: "Delivered", bg: "#E8F3EE", color: "#0F5D3A" }
        : null;

  const orderItems = Array.isArray(item?.orderItems) ? item.orderItems : [];
  const itemsCount = orderItems.reduce((sum, orderItem) => sum + (Number(orderItem?.quantity) || 1), 0);
  const dateLabel = item?.dateOrdered
    ? new Date(item.dateOrdered).toLocaleString("en-PH", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Date unavailable";

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        {update ? (
          <View style={[styles.statusSelect, { backgroundColor: getStatusColor(statusChange) }]}>
            <Picker
              selectedValue={statusChange}
              style={styles.statusPicker}
              onValueChange={(itemValue) => updateOrder(itemValue)}
              dropdownIconColor="white"
              mode="dropdown"
            >
              {codes.map((c) => (
                <Picker.Item key={c.code} label={c.name} value={c.code} style={{ fontSize: 12 }} />
              ))}
            </Picker>
          </View>
        ) : (
          <View style={[styles.statusPill, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.detailsLink} onPress={() => setShowDetails((prev) => !prev)}>
          <Text style={styles.detailsText}>See details</Text>
          <Ionicons name={showDetails ? "chevron-up" : "chevron-forward"} size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.avatarContainer}>
          {statusAvatar ? (
            <View style={[styles.statusAvatar, { backgroundColor: statusAvatar.bg }]}>
              <Ionicons name={statusAvatar.icon} size={22} color={statusAvatar.color} />
            </View>
          ) : avatarImage ? (
            <Image source={{ uri: avatarImage }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>
              {resolvedName.substring(0, 2).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={styles.meta}>
          <Text style={styles.storeName}>Studyzie Supplies</Text>
          <Text style={styles.shipTo}>Delivered to {resolvedName}</Text>
          <Text style={styles.date}>{dateLabel}</Text>
          {itemSummary ? <Text style={styles.itemsText}>{itemSummary}</Text> : null}
        </View>
      </View>

      <View style={styles.cardBottom}>
        <Text style={styles.totalLine}>
          {itemsCount} item{itemsCount !== 1 ? "s" : ""} • {formatPeso(item.totalPrice)}
        </Text>
        <TouchableOpacity style={styles.reorderButton}>
          <Text style={styles.reorderText}>Reorder</Text>
        </TouchableOpacity>
      </View>

      {showDetails ? (
        <View style={styles.detailsPanel}>
          {orderItems.length === 0 ? (
            <Text style={styles.detailsEmpty}>No items available.</Text>
          ) : (
            orderItems.map((orderItem, index) => {
              const product = orderItem?.product || orderItem || {};
              const name = product?.name || orderItem?.name || "Item";
              const qty = Number(orderItem?.quantity) || 1;
              const price = Number(product?.price ?? orderItem?.price ?? 0);
              return (
                <View key={`${name}-${index}`} style={styles.detailRow}>
                  <Text style={styles.detailName} numberOfLines={1}>{name}</Text>
                  <Text style={styles.detailMeta}>x{qty}</Text>
                  <Text style={styles.detailPrice}>{formatPeso(price * qty)}</Text>
                </View>
              );
            })
          )}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    marginBottom: 14,
    padding: 14,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#EEF2F0",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  detailsLink: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailsText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginRight: 4,
  },
  cardBody: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E8F3EE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#CBE4D8",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4B5563",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
  },
  statusAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  meta: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  shipTo: {
    marginTop: 2,
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  date: {
    marginTop: 4,
    fontSize: 11,
    color: "#9CA3AF",
  },
  itemsText: {
    marginTop: 4,
    fontSize: 12,
    color: "#4B5563",
  },
  cardBottom: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 10,
  },
  totalLine: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "600",
  },
  reorderButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#C9A47B",
    backgroundColor: "#FFF7EE",
  },
  reorderText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B7791F",
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  statusSelect: {
    borderRadius: 999,
    overflow: "hidden",
    height: 28,
    justifyContent: "center",
  },
  statusPicker: {
    height: 28,
    width: 120,
    color: "white",
  },
  detailsPanel: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  detailName: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
    marginRight: 8,
  },
  detailMeta: {
    fontSize: 12,
    color: "#6B7280",
    marginRight: 10,
  },
  detailPrice: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F5D3A",
  },
  detailsEmpty: {
    fontSize: 12,
    color: "#9CA3AF",
  },
});

export default OrderCard;
