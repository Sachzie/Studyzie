import React, { useContext, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { View, StyleSheet, Dimensions, TouchableOpacity, Text, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SwipeListView } from "react-native-swipe-list-view";
import { Ionicons } from "@expo/vector-icons";
import { Surface, Button } from "react-native-paper";
import { removeFromCart, clearCart, setCartItemQuantity } from "../../backend/Redux/Actions/cartActions";
import AuthGlobal from "../../backend/Context/Store/AuthGlobal";
import baseURL from "../assets/common/baseurl";
import colors from "../assets/common/colors";
import a4Img from "../Picures/a4.jpg";
import ballpenImg from "../Picures/ballpen.jpg";
import notebookImg from "../Picures/notebook.jpg";
import pencilImg from "../Picures/pencil.jpg";
import yellowpadImg from "../Picures/yellowpad.jpg";
import oilpastelImg from "../Picures/oilpastel.png";

const { height } = Dimensions.get("window");
const FALLBACK_IMAGE = "https://cdn.pixabay.com/photo/2012/04/01/17/29/box-23649_960_720.png";
const ASSET_HOST = baseURL.replace(/api\/v1\/?$/, "");

const IMAGE_SOURCE_BY_KEY = {
    a4: a4Img,
    ballpen: ballpenImg,
    notebook: notebookImg,
    pencil: pencilImg,
    yellowpad: yellowpadImg,
    oilpastel: oilpastelImg,
};

const formatPeso = (value) =>
    `\u20B1${Number(value || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const getItemKey = (item, index) =>
    item?._id?.$oid || item?._id || item?.id || `${item?.name || "item"}-${index}`;

const getImageSource = (item) => {
    if (item?.imageSource) return item.imageSource;
    if (item?.imageKey && IMAGE_SOURCE_BY_KEY[item.imageKey]) {
        return IMAGE_SOURCE_BY_KEY[item.imageKey];
    }
    const src = item?.image || "";
    if (typeof src === "string" && src.length > 0) {
        const isAbsolute = /^https?:\/\//i.test(src);
        const url = isAbsolute ? src : `${ASSET_HOST}${src.startsWith("/") ? "" : "/"}${src}`;
        return { uri: url };
    }
    return { uri: FALLBACK_IMAGE };
};

const Cart = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const cartItems = useSelector((state) => state.cartItems);
    const context = useContext(AuthGlobal);
    const isAuthenticated = Boolean(context?.stateUser?.isAuthenticated);

    useEffect(() => {
        if (!isAuthenticated) {
            navigation.navigate("User", { screen: "Login", params: { from: "cart_guard" } });
        }
    }, [isAuthenticated]);

    const total = useMemo(
        () =>
            cartItems.reduce((sum, item) => {
                const price = Number(item?.price) || 0;
                const quantity = Number(item?.quantity) || 1;
                return sum + price * quantity;
            }, 0),
        [cartItems]
    );

    const totalItems = useMemo(
        () => cartItems.reduce((sum, item) => sum + (Number(item?.quantity) || 1), 0),
        [cartItems]
    );

    const updateQuantity = (item, direction) => {
        const currentQty = Number(item?.quantity) || 1;
        const maxStock = Math.max(Number(item?.countInStock) || 1, 1);

        const nextQty = direction === "inc"
            ? Math.min(currentQty + 1, maxStock)
            : Math.max(currentQty - 1, 1);

        dispatch(setCartItemQuantity({ ...item, quantity: nextQty }));
    };

    const renderItem = ({ item }) => {
        const quantity = Number(item?.quantity) || 1;
        const maxStock = Math.max(Number(item?.countInStock) || 1, 1);
        const itemTotal = (Number(item?.price) || 0) * quantity;

        return (
            <Surface style={styles.itemCard}>
                <Image source={getImageSource(item)} style={styles.productImage} resizeMode="cover" />
                <View style={styles.itemMeta}>
                    <TouchableOpacity style={styles.inlineDeleteButton} onPress={() => dispatch(removeFromCart(item))}>
                        <Ionicons name="trash" color={colors.white} size={14} />
                    </TouchableOpacity>
                    <Text style={styles.itemName} numberOfLines={2}>
                        {item?.name || "School Supply"}
                    </Text>
                    <Text style={styles.itemBrand} numberOfLines={1}>
                        {item?.brand || "Studyzie Essentials"}
                    </Text>
                    <View style={styles.priceRow}>
                        <Text style={styles.itemPrice}>{formatPeso(item?.price)}</Text>
                        <Text style={styles.itemSubTotal}>Subtotal: {formatPeso(itemTotal)}</Text>
                    </View>
                    <View style={styles.qtyRow}>
                        <Text style={styles.stockHint}>Stock: {maxStock}</Text>
                        <View style={styles.qtyActions}>
                            <TouchableOpacity
                                style={[styles.qtyButton, quantity <= 1 && styles.qtyButtonDisabled]}
                                disabled={quantity <= 1}
                                onPress={() => updateQuantity(item, "dec")}
                            >
                                <Ionicons name="remove" size={16} color={colors.white} />
                            </TouchableOpacity>
                            <Text style={styles.qtyValue}>{quantity}</Text>
                            <TouchableOpacity
                                style={[styles.qtyButton, quantity >= maxStock && styles.qtyButtonDisabled]}
                                disabled={quantity >= maxStock}
                                onPress={() => updateQuantity(item, "inc")}
                            >
                                <Ionicons name="add" size={16} color={colors.white} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Surface>
        );
    };

    const renderHiddenItem = ({ item }) => (
        <View style={styles.hiddenRow}>
            <TouchableOpacity style={styles.deleteButton} onPress={() => dispatch(removeFromCart(item))}>
                <Ionicons name="trash" color={colors.white} size={18} />
                <Text style={styles.deleteText}>Remove</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <Surface style={styles.container}>
            <View style={styles.cartHeaderCard}>
                <Text style={styles.cartHeaderTitle}>Your Cart</Text>
                <Text style={styles.cartHeaderSubtitle}>{totalItems} item(s) ready for checkout</Text>
            </View>

            {cartItems.length > 0 ? (
                <SwipeListView
                    data={cartItems}
                    renderItem={renderItem}
                    renderHiddenItem={renderHiddenItem}
                    disableRightSwipe
                    rightOpenValue={-96}
                    contentContainerStyle={styles.listContent}
                    keyExtractor={getItemKey}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <Ionicons name="cart-outline" size={48} color={colors.primary} />
                    <Text style={styles.emptyTitle}>Your cart is empty</Text>
                    <Text style={styles.emptyText}>Add products from Home to place your order.</Text>
                </View>
            )}

            <View style={styles.footer}>
                <View>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>{formatPeso(total)}</Text>
                </View>
                <View style={styles.footerButtons}>
                    <Button
                        mode="outlined"
                        textColor={colors.primary}
                        style={styles.clearButton}
                        onPress={() => dispatch(clearCart())}
                    >
                        Clear
                    </Button>
                    <Button
                        mode="contained"
                        buttonColor={colors.primary}
                        textColor={colors.white}
                        style={styles.checkoutButton}
                        onPress={() => navigation.navigate("Checkout")}
                        disabled={!cartItems.length}
                    >
                        Checkout
                    </Button>
                </View>
            </View>
        </Surface>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.inputBg,
    },
    cartHeaderCard: {
        marginHorizontal: 14,
        marginTop: 14,
        marginBottom: 6,
        backgroundColor: colors.white,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.light,
        paddingHorizontal: 14,
        paddingVertical: 12,
        elevation: 2,
    },
    cartHeaderTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.primary,
    },
    cartHeaderSubtitle: {
        marginTop: 4,
        fontSize: 12,
        color: colors.textLight,
    },
    listContent: {
        paddingHorizontal: 14,
        paddingTop: 8,
        paddingBottom: 132,
    },
    itemCard: {
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.light,
        borderRadius: 14,
        marginBottom: 10,
        padding: 10,
        flexDirection: "row",
        alignItems: "center",
        elevation: 2,
    },
    productImage: {
        width: 72,
        height: 72,
        borderRadius: 10,
        backgroundColor: colors.inputBg,
    },
    itemMeta: {
        flex: 1,
        marginLeft: 10,
    },
    inlineDeleteButton: {
        position: "absolute",
        right: 0,
        top: 0,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.error,
        alignItems: "center",
        justifyContent: "center",
    },
    itemName: {
        fontSize: 15,
        fontWeight: "700",
        color: colors.text,
    },
    itemBrand: {
        marginTop: 2,
        fontSize: 12,
        color: colors.textLight,
    },
    priceRow: {
        marginTop: 8,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    itemPrice: {
        fontSize: 15,
        fontWeight: "700",
        color: colors.primary,
    },
    itemSubTotal: {
        fontSize: 12,
        color: colors.textLight,
    },
    qtyRow: {
        marginTop: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    stockHint: {
        fontSize: 11,
        color: colors.textLight,
        fontWeight: "600",
    },
    qtyActions: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.light,
        borderRadius: 999,
        padding: 2,
    },
    qtyButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    qtyButtonDisabled: {
        backgroundColor: colors.textLight,
    },
    qtyValue: {
        minWidth: 26,
        textAlign: "center",
        color: colors.text,
        fontWeight: "700",
        fontSize: 12,
    },
    hiddenRow: {
        alignItems: "flex-end",
        justifyContent: "center",
        marginBottom: 10,
    },
    deleteButton: {
        width: 92,
        height: 92,
        borderRadius: 14,
        backgroundColor: colors.error,
        alignItems: "center",
        justifyContent: "center",
    },
    deleteText: {
        marginTop: 4,
        color: colors.white,
        fontSize: 11,
        fontWeight: "700",
    },
    emptyContainer: {
        minHeight: height * 0.55,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 20,
    },
    emptyTitle: {
        marginTop: 10,
        fontSize: 18,
        fontWeight: "700",
        color: colors.primary,
    },
    emptyText: {
        marginTop: 6,
        fontSize: 13,
        color: colors.textLight,
        textAlign: 'center',
    },
    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: 1,
        borderTopColor: colors.light,
        backgroundColor: colors.white,
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    totalLabel: {
        fontSize: 12,
        color: colors.textLight,
    },
    totalValue: {
        marginTop: 2,
        fontSize: 21,
        fontWeight: "700",
        color: colors.primary,
    },
    footerButtons: {
        flexDirection: "row",
        alignItems: "center",
    },
    clearButton: {
        borderColor: colors.primary,
    },
    checkoutButton: {
        marginLeft: 8,
    },
});

export default Cart;
