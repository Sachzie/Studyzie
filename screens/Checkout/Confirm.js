import React from 'react'
import { View, StyleSheet, Dimensions, ScrollView } from "react-native";
import { Surface, Avatar, Divider, Button, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux'
import axios from 'axios';
import baseURL from '../assets/common/baseurl';
import Toast from 'react-native-toast-message';
import { clearCart } from '../../backend/Redux/Actions/cartActions';
import { fetchProducts } from '../../backend/Redux/Actions/productActions';
import { clearCartStorage } from '../../backend/Context/Store/CartStorage';
import { getToken } from '../../backend/Context/Store/tokenStorage';

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

const formatPeso = (value) =>
    `\u20B1${Number(value || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const resolveItemImageSource = (item) => {
    if (item?.imageSource) {
        return item.imageSource;
    }
    if (item?.product?.imageSource) {
        return item.product.imageSource;
    }

    const imageUri = resolveImageUri(item?.image || item?.product?.image || "");
    if (imageUri) {
        return { uri: imageUri };
    }

    return { uri: FALLBACK_IMAGE };
};

const getItemPrice = (item) => {
    const direct = Number(item?.price);
    if (Number.isFinite(direct) && direct > 0) return direct;
    const nested = Number(item?.product?.price);
    if (Number.isFinite(nested)) return nested;
    return 0;
};

const getItemName = (item) => item?.name || item?.product?.name || "Item";

const Confirm = (props) => {
    const finalOrder = props.route.params;
    const dispatch = useDispatch()
    let navigation = useNavigation()
    const order = finalOrder?.order?.order;
    const orderItems = Array.isArray(order?.orderItems) ? order.orderItems : [];
    const subtotal = Number(order?.subtotal) || orderItems.reduce((sum, item) => {
        const quantity = Number(item?.quantity) || 1;
        return sum + getItemPrice(item) * quantity;
    }, 0);
    const discountValue = Number(order?.discountValue) || (order?.discountPercent ? subtotal * (Number(order.discountPercent) / 100) : 0);
    const total = Number(order?.totalPrice) || Math.max(subtotal - discountValue, 0);
    const hasDiscount = Boolean(order?.discountCode && discountValue > 0);

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
            const storedToken = await getToken();
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
                dispatch(fetchProducts())
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
                                            source={resolveItemImageSource(item)}
                                        />
                                        <View style={styles.itemInfo}>
                                            <Text style={styles.itemName}>{getItemName(item)}</Text>
                                            <Text style={styles.itemPrice}>{formatPeso(getItemPrice(item))}</Text>
                                            <Text style={styles.itemQty}>Qty: {quantity}</Text>
                                        </View>
                                    </View>
                                )
                            })}
                        </Surface>

                        <Surface style={styles.sectionSurface}>
                            <Text style={styles.sectionTitle}>Summary</Text>
                            <Divider style={styles.divider} />
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Subtotal</Text>
                                <Text style={styles.summaryValue}>{formatPeso(subtotal)}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Discount</Text>
                                <Text style={styles.summaryValue}>- {formatPeso(discountValue)}</Text>
                            </View>
                            {hasDiscount ? (
                                <Text style={styles.promoNote}>Promo applied: {order.discountCode}</Text>
                            ) : null}
                            <Divider style={styles.divider} />
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryTotalLabel}>Total</Text>
                                <Text style={styles.summaryTotalValue}>{formatPeso(total)}</Text>
                            </View>
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
    summaryRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 6,
    },
    summaryLabel: {
        fontSize: 13,
        color: "#6B7280",
        fontWeight: "600",
    },
    summaryValue: {
        fontSize: 13,
        color: "#111827",
        fontWeight: "700",
    },
    summaryTotalLabel: {
        fontSize: 15,
        color: "#111827",
        fontWeight: "800",
    },
    summaryTotalValue: {
        fontSize: 16,
        color: "#103B28",
        fontWeight: "800",
    },
    promoNote: {
        fontSize: 12,
        color: "#16A34A",
        fontWeight: "600",
        marginTop: 4,
        marginBottom: 6,
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
