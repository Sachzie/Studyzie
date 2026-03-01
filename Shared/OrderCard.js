import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from "axios";
import baseURL from "../assets/common/baseurl";
import { useNavigation } from '@react-navigation/native'
import Toast from "react-native-toast-message";

const codes = [
  { name: "Pending", code: "3" },
  { name: "Shipped", code: "2" },
  { name: "Delivered", code: "1" },
];

const OrderCard = ({ item, update }) => {
  const [statusChange, setStatusChange] = useState(item.status);
  const [token, setToken] = useState('');
  const navigation = useNavigation();

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
    if (status === "3") return "#6B7280";
    if (status === "2") return "#3B82F6"; // Shipped - Blue
    return "#10B981"; // Delivered - Green
  };

  const getStatusText = (status) => {
    if (status === "3") return "Pending";
    if (status === "2") return "Shipped";
    return "Delivered";
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {item.user ? item.user.name.substring(0, 2).toUpperCase() : "US"}
          </Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.userName}>{item.user ? item.user.name : "Unknown User"}</Text>
          <Text style={styles.date}>{item.dateOrdered.split("T")[0]}</Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <Text style={styles.price}>+${item.totalPrice}</Text>
        
        {update ? (
            <View style={[styles.statusButton, { backgroundColor: getStatusColor(statusChange) }]}>
                 <Picker
                    selectedValue={statusChange}
                    style={{ height: 30, width: 110, color: 'white' }}
                    onValueChange={(itemValue) => updateOrder(itemValue)}
                    dropdownIconColor="white"
                    mode="dropdown"
                >
                    {codes.map((c) => (
                        <Picker.Item key={c.code} label={c.name} value={c.code} style={{fontSize: 12}} />
                    ))}
                </Picker>
            </View>
        ) : (
            <View style={[styles.statusPill, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
            </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4B5563",
  },
  infoContainer: {
    justifyContent: "center",
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  rightSection: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusButton: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 30,
    justifyContent: 'center',
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});

export default OrderCard;
