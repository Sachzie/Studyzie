import React, { useState, useContext } from "react";
import { Image, View, StyleSheet, Text, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { Surface } from "react-native-paper";
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from "../../backend/Redux/Actions/cartActions";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import AuthGlobal from "../../backend/Context/Store/AuthGlobal";
import { useNavigation } from "@react-navigation/native";
import baseURL from "../assets/common/baseurl";

const { width } = Dimensions.get("window");
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

const SingleProduct = ({ route }) => {
    const item = route.params.item;
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const context = useContext(AuthGlobal);
    const isAuthenticated = Boolean(context?.stateUser?.isAuthenticated);

    const [qty, setQty] = useState(1);

    const formatPeso = (value) => `\u20B1${Number(value || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

    const imageUri = resolveImageUri(item?.image || "");
    const resolvedImage = imageUri
        ? { uri: imageUri }
        : (item?.imageSource || { uri: FALLBACK_IMAGE });

    const handleAddToCart = () => {
        if (!isAuthenticated) {
            Toast.show({
                topOffset: 60,
                type: "info",
                text1: "Login required",
                text2: "Please login to add items to cart."
            });
            navigation.navigate("User", { screen: "Login" });
            return;
        }

        if (item.countInStock < 1) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Out of Stock",
                text2: "This item is currently unavailable."
            });
            return;
        }

        dispatch(addToCart({ ...item, quantity: 1 }));
        Toast.show({
            topOffset: 60,
            type: "success",
            text1: "Added to Cart",
            text2: `${item.name} has been added to your cart.`
        });
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <View style={styles.imageContainer}>
                    <Image
                        source={resolvedImage}
                        resizeMode="contain"
                        style={styles.image}
                    />
                </View>

                <View style={styles.contentContainer}>
                    <View style={styles.headerRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.brand}>{item.brand || "Studyzie Essentials"}</Text>
                            <Text style={styles.name}>{item.name}</Text>
                        </View>
                        <Text style={styles.price}>{formatPeso(item.price)}</Text>
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.description}>{item.description}</Text>

                    <View style={styles.divider} />

                    <View style={styles.metaContainer}>
                        <View style={styles.metaItem}>
                            <Text style={styles.metaLabel}>Availability</Text>
                            <Text style={[styles.metaValue, item.countInStock > 0 ? styles.inStock : styles.outStock]}>
                                {item.countInStock > 0 ? "In Stock" : "Out of Stock"}
                            </Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Text style={styles.metaLabel}>Category</Text>
                            <Text style={styles.metaValue}>{item.category?.name || "General"}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[styles.addToCartButton, item.countInStock < 1 && styles.disabledButton]}
                    onPress={handleAddToCart}
                    disabled={item.countInStock < 1}
                >
                    <Ionicons name="cart" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.addToCartText}>
                        {item.countInStock > 0 ? "Add to Cart" : "Out of Stock"}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    imageContainer: {
        width: '100%',
        height: 300,
        backgroundColor: "#F9FAFB",
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    image: {
        width: "100%",
        height: "100%",
    },
    contentContainer: {
        padding: 24,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        marginTop: -20,
        backgroundColor: "#FFFFFF",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 10,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    brand: {
        fontSize: 14,
        color: "#6B7280",
        fontWeight: "600",
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    name: {
        fontSize: 22,
        fontWeight: "800",
        color: "#1F2937",
        lineHeight: 28,
        marginRight: 10,
    },
    price: {
        fontSize: 24,
        fontWeight: "700",
        color: "#10B981",
    },
    divider: {
        height: 1,
        backgroundColor: "#F3F4F6",
        marginVertical: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#374151",
        marginBottom: 8,
    },
    description: {
        fontSize: 15,
        lineHeight: 24,
        color: "#4B5563",
    },
    availabilityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stockCount: {
        fontSize: 14,
        color: "#6B7280",
        marginLeft: 4,
    },
    metaContainer: {
        flexDirection: 'row',
        marginTop: 8,
    },
    metaItem: {
        marginRight: 32,
    },
    metaLabel: {
        fontSize: 12,
        color: "#9CA3AF",
        marginBottom: 4,
    },
    metaValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1F2937",
    },
    inStock: {
        color: "#059669",
    },
    outStock: {
        color: "#DC2626",
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#FFFFFF",
        padding: 16,
        paddingBottom: 24,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 10,
    },
    addToCartButton: {
        backgroundColor: "#103B28",
        borderRadius: 12,
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#103B28",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        backgroundColor: "#D1D5DB",
        shadowOpacity: 0,
        elevation: 0,
    },
    addToCartText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
});

export default SingleProduct
