import React, { useContext } from "react";
import { StyleSheet, View, Dimensions, Image, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import Toast from "react-native-toast-message";
import { addToCart } from "../../backend/Redux/Actions/cartActions";
import AuthGlobal from "../../backend/Context/Store/AuthGlobal";
import colors from "../assets/common/colors";

const { width } = Dimensions.get("window");

const getItemKey = (item) =>
    item?._id?.$oid || item?._id || item?.id || `${item?.name || "item"}-${item?.price || 0}`;

const ProductCard = (props) => {
    const { name, price, image, imageSource, countInStock, brand } = props;
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const cartItems = useSelector((state) => state.cartItems);
    const context = useContext(AuthGlobal);
    const isAuthenticated = Boolean(context?.stateUser?.isAuthenticated);

    const itemKey = getItemKey(props);
    const inStock = Number(countInStock) > 0;
    const currentQty = Number(cartItems.find((item) => getItemKey(item) === itemKey)?.quantity) || 0;
    const atStockLimit = inStock && currentQty >= Number(countInStock);

    const formatPeso = (value) =>
        `\u20B1${Number(value || 0).toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;

    const resolvedImage = imageSource
        ? imageSource
        : {
            uri: image || "https://cdn.pixabay.com/photo/2012/04/01/17/29/box-23649_960_720.png",
        };

    const handleAddToCart = () => {
        if (!isAuthenticated) {
            Toast.show({
                topOffset: 60,
                type: "info",
                text1: "Login required",
                text2: "Please login or register to add items to cart.",
            });
            navigation.navigate("User", { screen: "Login", params: { from: "cart_action" } });
            return;
        }

        if (!inStock) {
            return;
        }

        if (atStockLimit) {
            Toast.show({
                topOffset: 60,
                type: "info",
                text1: "Maximum stock reached",
                text2: `${name} only has ${countInStock} item(s) available.`,
            });
            return;
        }

        dispatch(addToCart({ ...props, quantity: 1 }));
        Toast.show({
            topOffset: 60,
            type: "success",
            text1: `${name} added to cart`,
            text2: "You can update quantity in the cart.",
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.imageWrap}>
                <Image style={styles.image} resizeMode="contain" source={resolvedImage} />
                {!inStock && (
                    <View style={styles.outOfStockOverlay}>
                        <Text style={styles.outOfStockText}>Out of Stock</Text>
                    </View>
                )}
            </View>

            <View style={styles.content}>
                <Text style={styles.title} numberOfLines={2}>
                    {name}
                </Text>
                <Text style={styles.brand} numberOfLines={1}>
                    {brand || "Studyzie Essentials"}
                </Text>
                <View style={styles.priceRow}>
                    <Text style={styles.price}>{formatPeso(price)}</Text>
                    <View style={styles.actionButtons}>
                        <TouchableOpacity 
                            style={styles.detailButton}
                            onPress={() => navigation.navigate("Product Detail", { item: props })}
                        >
                            <Ionicons name="eye-outline" size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.addButton, (!inStock || atStockLimit) && styles.disabledButton]}
                            onPress={handleAddToCart}
                            disabled={!inStock || atStockLimit}
                        >
                            <Ionicons name="add" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: width / 2 - 24,
        backgroundColor: colors.white,
        borderRadius: 16,
        marginBottom: 16,
        elevation: 4,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        overflow: "hidden",
    },
    imageWrap: {
        height: 140,
        backgroundColor: colors.inputBg,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    image: {
        width: "80%",
        height: "80%",
    },
    outOfStockOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(255,255,255,0.7)", // Light overlay instead of dark
        justifyContent: "center",
        alignItems: "center",
    },
    outOfStockText: {
        color: colors.error,
        fontWeight: "bold",
    },
    content: {
        padding: 12,
    },
    title: {
        color: colors.text,
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 4,
        height: 40, // Fixed height for 2 lines
    },
    brand: {
        color: colors.textLight,
        fontSize: 12,
        marginBottom: 8,
    },
    priceRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 4,
    },
    price: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: "700",
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailButton: {
        backgroundColor: colors.secondary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 8,
    },
    addButton: {
        backgroundColor: colors.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    disabledButton: {
        backgroundColor: colors.light,
    },
});

export default ProductCard;