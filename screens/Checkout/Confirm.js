import React, { useState, useContext } from 'react'
import { View, StyleSheet, Dimensions, ScrollView } from "react-native";
import { Surface, Avatar, Divider, Button, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux'
import AsyncStorage from "@react-native-async-storage/async-storage"
import axios from 'axios';
import baseURL from '../assets/common/baseurl';
import AuthGlobal from '../../backend/Context/Store/AuthGlobal';
import Toast from 'react-native-toast-message';
import { clearCart } from '../../backend/Redux/Actions/cartActions';
import { clearCartStorage } from '../../backend/Context/Store/CartStorage';

var { width, height } = Dimensions.get("window");
const API_ORIGIN = baseURL.replace(/api\/v1\/?$/, "");
const FALLBACK_IMAGE = "https://cdn.pixabay.com/photo/2012/04/01/17/29/box-23649_960_720.png";

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

const Confirm = (props) => {
    const context = useContext(AuthGlobal)
    const [token, setToken] = useState();
    const finalOrder = props.route.params;
    const dispatch = useDispatch()
    let navigation = useNavigation()

    const confirmOrder = async () => {
        const order = finalOrder?.order?.order;
        if (!order) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Order missing",
                text2: "Please go back and try again.",
            });
            return;
        }

        try {
            const storedToken = await AsyncStorage.getItem("jwt");
            if (!storedToken) {
                Toast.show({
                    topOffset: 60,
                    type: "error",
                    text1: "Please login",
                    text2: "You need to login before placing an order.",
                });
                navigation.navigate("User", { screen: "Login" });
                return;
            }

            setToken(storedToken);
            const config = {
                headers: {
                    Authorization: `Bearer ${storedToken}`
                }
            };

            await axios.post(`${baseURL}orders`, order, config);
            Toast.show({
                topOffset: 60,
                type: "success",
                text1: "Order Completed",
                text2: "Thank you for shopping with Studyzie!",
            });
            setTimeout(() => {
                dispatch(clearCart())
                clearCartStorage().catch(() => {});
                navigation.navigate('Cart Screen', { screen: 'Cart' })
            }, 500);
        } catch (error) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Something went wrong",
                text2: "Please try again",
            });
        }
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.headerTitle}>Review Order</Text>
                
                {props.route.params ? (
                    <View style={styles.orderContainer}>
                        <Surface style={styles.sectionSurface}>
                            <Text style={styles.sectionTitle}>Shipping Details</Text>
                            <Divider style={styles.divider} />
                            <View style={styles.detailsRow}>
                                <Text style={styles.label}>Address:</Text>
                                <Text style={styles.value}>{finalOrder.order.order.shippingAddress1}</Text>
                            </View>
                            {finalOrder.order.order.shippingAddress2 ? (
                                <View style={styles.detailsRow}>
                                    <Text style={styles.label}>Address 2:</Text>
                                    <Text style={styles.value}>{finalOrder.order.order.shippingAddress2}</Text>
                                </View>
                            ) : null}
                            <View style={styles.detailsRow}>
                                <Text style={styles.label}>City:</Text>
                                <Text style={styles.value}>{finalOrder.order.order.city}</Text>
                            </View>
                            <View style={styles.detailsRow}>
                                <Text style={styles.label}>Zip Code:</Text>
                                <Text style={styles.value}>{finalOrder.order.order.zip}</Text>
                            </View>
                            <View style={styles.detailsRow}>
                                <Text style={styles.label}>Country:</Text>
                                <Text style={styles.value}>{finalOrder.order.order.country}</Text>
                            </View>
                        </Surface>

                        <Surface style={styles.sectionSurface}>
                            <Text style={styles.sectionTitle}>Items</Text>
                            <Divider style={styles.divider} />
                            {finalOrder.order.order.orderItems.map((item) => {
                                const quantity = Number(item?.quantity) || 1;
                                return (
                                    <View key={item.id || Math.random()} style={styles.itemRow}>
                                        <Avatar.Image 
                                            size={50} 
                                            source={{
                                                uri: resolveImageUri(item?.image || "") || FALLBACK_IMAGE
                                            }} 
                                        />
                                        <View style={styles.itemInfo}>
                                            <Text style={styles.itemName}>{item.name}</Text>
                                            <Text style={styles.itemPrice}>$ {item.price}</Text>
                                            <Text style={styles.itemQty}>Qty: {quantity}</Text>
                                        </View>
                                    </View>
                                )
                            })}
                        </Surface>
                    </View>
                ) : null}
                
                <View style={styles.buttonContainer}>
                    <Button
                        mode="contained"
                        buttonColor="#103B28"
                        textColor="#FFFFFF"
                        onPress={confirmOrder}
                        style={styles.confirmButton}
                        contentStyle={{ height: 50 }}
                    >
                        Place Order
                    </Button>
                </View>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#103B28",
        marginBottom: 20,
        textAlign: "center"
    },
    orderContainer: {
        marginBottom: 20
    },
    sectionSurface: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: "white",
        marginBottom: 16,
        elevation: 2
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#374151",
        marginBottom: 8
    },
    divider: {
        backgroundColor: "#E5E7EB",
        marginBottom: 12
    },
    detailsRow: {
        flexDirection: "row",
        marginBottom: 6,
        justifyContent: "space-between"
    },
    label: {
        fontWeight: "600",
        color: "#6B7280",
        width: 100
    },
    value: {
        flex: 1,
        color: "#111827",
        textAlign: "right"
    },
    itemRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
        paddingBottom: 12
    },
    itemInfo: {
        marginLeft: 16,
        flex: 1
    },
    itemName: {
        fontSize: 16,
        fontWeight: "500",
        color: "#111827"
    },
    itemPrice: {
        fontSize: 14,
        color: "#10B981",
        fontWeight: "700",
        marginTop: 4
    },
    itemQty: {
        marginTop: 2,
        fontSize: 12,
        color: "#6B7280",
        fontWeight: "600",
    },
    buttonContainer: {
        alignItems: "center",
        marginTop: 10
    },
    confirmButton: {
        width: "100%",
        borderRadius: 8
    }
});

export default Confirm;
