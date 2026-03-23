import React, { useState, useContext, useEffect, useMemo } from "react";
import { Image, View, StyleSheet, Text, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from "react-native";
import { Surface } from "react-native-paper";
import { useDispatch } from 'react-redux';
import { addToCart } from "../../backend/Redux/Actions/cartActions";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import AuthGlobal from "../../backend/Context/Store/AuthGlobal";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import baseURL from "../assets/common/baseurl";
import colors from "../assets/common/colors";

const { width } = Dimensions.get("window");
const API_ORIGIN = baseURL.replace(/api\/v1\/?$/, "");
const FALLBACK_IMAGE = "https://cdn.pixabay.com/photo/2012/04/01/17/29/box-23649_960_720.png";

const resolveImageUri = (rawUri) => {
    if (!rawUri) return "";
    if (/^https?:\/\//i.test(rawUri)) {
        return rawUri;
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

    const [product, setProduct] = useState(item || {});
    const [detailsLoading, setDetailsLoading] = useState(false);

    useEffect(() => {
        let mounted = true;

        const hydrateProductDetails = async () => {
            const productId = item?._id || item?.id;
            if (!productId || String(productId).startsWith("local-")) {
                return;
            }

            setDetailsLoading(true);
            try {
                const response = await axios.get(`${baseURL}products/${productId}`);
                const incoming = response?.data || {};
                if (!mounted) return;
                setProduct((prev) => ({
                    ...prev,
                    ...incoming,
                    imageSource: prev?.imageSource || incoming?.imageSource || null,
                }));
            } catch (error) {
                // Keep fallback item data if detail fetch fails.
            } finally {
                if (mounted) {
                    setDetailsLoading(false);
                }
            }
        };

        setProduct(item || {});
        hydrateProductDetails();

        return () => {
            mounted = false;
        };
    }, [item]);

    const formatPeso = (value) => `\u20B1${Number(value || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

    const imageUri = resolveImageUri(product?.image || "");
    const resolvedImage = imageUri
        ? { uri: imageUri }
        : (product?.imageSource || item?.imageSource || { uri: FALLBACK_IMAGE });

    const productReviews = useMemo(() => (
        Array.isArray(product?.reviews)
            ? product.reviews.filter((review) => Number(review?.rating) > 0)
            : []
    ), [product?.reviews]);

    const averageRating = useMemo(() => {
        if (!productReviews.length) return 0;
        const total = productReviews.reduce((sum, review) => sum + Number(review?.rating || 0), 0);
        return total / productReviews.length;
    }, [productReviews]);

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

        if (Number(product?.countInStock) < 1) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Out of Stock",
                text2: "This item is currently unavailable."
            });
            return;
        }

        dispatch(addToCart({ ...product, quantity: 1 }));
        Toast.show({
            topOffset: 60,
            type: "success",
            text1: "Added to Cart",
            text2: `${product.name} has been added to your cart.`
        });
    };

    const handleBuyNow = () => {
        if (!isAuthenticated) {
            Toast.show({
                topOffset: 60,
                type: "info",
                text1: "Login required",
                text2: "Please login to buy items."
            });
            navigation.navigate("User", { screen: "Login" });
            return;
        }

        if (Number(product?.countInStock) < 1) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Out of Stock",
                text2: "This item is currently unavailable."
            });
            return;
        }

        // Create a single item cart structure for checkout
        const buyNowItem = { ...product, quantity: 1 };
        
        // Add to actual cart as well just in case they go back
        dispatch(addToCart(buyNowItem));
        
        // Navigate straight to checkout passing this item as the selected item
        navigation.navigate("Cart Screen", { 
            screen: "Checkout", 
            params: { 
                screen: "Shipping",
                params: { selectedItems: [buyNowItem] } 
            } 
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
                            <Text style={styles.brand}>{product.brand || "Studyzie Essentials"}</Text>
                            <Text style={styles.name}>{product.name}</Text>
                        </View>
                        <Text style={styles.price}>{formatPeso(product.price)}</Text>
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.description}>{product.description}</Text>

                    <View style={styles.divider} />

                    <View style={styles.metaContainer}>
                        <View style={styles.metaItem}>
                            <Text style={styles.metaLabel}>Availability</Text>
                            <Text style={[styles.metaValue, Number(product?.countInStock) > 0 ? styles.inStock : styles.outStock]}>
                                {Number(product?.countInStock) > 0 ? "In Stock" : "Out of Stock"}
                            </Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Text style={styles.metaLabel}>Category</Text>
                            <Text style={styles.metaValue}>{product.category?.name || "General"}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.reviewHeader}>
                        <Text style={styles.sectionTitle}>Customer Reviews</Text>
                        {detailsLoading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
                    </View>
                    {productReviews.length > 0 ? (
                        <>
                            <View style={styles.ratingSummary}>
                                <Text style={styles.ratingValue}>{averageRating.toFixed(1)}</Text>
                                <View style={styles.starsRow}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Ionicons
                                            key={`avg-star-${star}`}
                                            name={star <= Math.round(averageRating) ? "star" : "star-outline"}
                                            size={16}
                                            color="#F59E0B"
                                        />
                                    ))}
                                </View>
                                <Text style={styles.ratingCount}>({productReviews.length} reviews)</Text>
                            </View>
                            {productReviews.map((review, index) => (
                                <View
                                    key={review?._id || `${review?.user || "review"}-${index}`}
                                    style={styles.reviewCard}
                                >
                                    <View style={styles.reviewTopRow}>
                                        <Text style={styles.reviewName}>{review?.name || "Studyzie Customer"}</Text>
                                        <View style={styles.starsRow}>
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Ionicons
                                                    key={`review-star-${index}-${star}`}
                                                    name={star <= Number(review?.rating || 0) ? "star" : "star-outline"}
                                                    size={14}
                                                    color="#F59E0B"
                                                />
                                            ))}
                                        </View>
                                    </View>
                                    {review?.comment ? (
                                        <Text style={styles.reviewComment}>{review.comment}</Text>
                                    ) : null}
                                </View>
                            ))}
                        </>
                    ) : (
                        <Text style={styles.noReviewsText}>
                            No reviews yet from delivered orders for this product.
                        </Text>
                    )}
                </View>
            </ScrollView>

            <View style={styles.bottomBar}>
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={[styles.addToCartIconBtn, Number(product?.countInStock) < 1 && styles.disabledButton]}
                        onPress={handleAddToCart}
                        disabled={Number(product?.countInStock) < 1}
                    >
                        <Ionicons name="cart-outline" size={24} color={colors.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.buyNowButton, Number(product?.countInStock) < 1 && styles.disabledButton]}
                        onPress={handleBuyNow}
                        disabled={Number(product?.countInStock) < 1}
                    >
                        <Text style={styles.buyNowText}>
                            {Number(product?.countInStock) > 0 ? "Buy now" : "Out of Stock"}
                        </Text>
                        {Number(product?.countInStock) > 0 && (
                            <Text style={styles.buyNowPrice}>{formatPeso(product.price)}</Text>
                        )}
                    </TouchableOpacity>
                </View>
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
    reviewHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    ratingSummary: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    ratingValue: {
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
        marginRight: 8,
    },
    starsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
    },
    ratingCount: {
        marginLeft: 8,
        fontSize: 12,
        color: "#6B7280",
    },
    reviewCard: {
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 10,
        padding: 10,
        marginBottom: 10,
        backgroundColor: "#FAFAFA",
    },
    reviewTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    reviewName: {
        fontSize: 13,
        fontWeight: "700",
        color: "#374151",
    },
    reviewComment: {
        fontSize: 13,
        lineHeight: 18,
        color: "#4B5563",
    },
    noReviewsText: {
        fontSize: 13,
        color: "#6B7280",
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.white,
        padding: 16,
        paddingBottom: 24,
        borderTopWidth: 1,
        borderTopColor: colors.light,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 10,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
    },
    iconButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    iconButtonText: {
        fontSize: 10,
        color: colors.text,
        marginTop: 2,
    },
    addToCartIconBtn: {
        backgroundColor: colors.inputBg,
        borderRadius: 24,
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 4,
    },
    buyNowButton: {
        flex: 1,
        backgroundColor: colors.primary,
        borderRadius: 24,
        height: 48,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    disabledButton: {
        opacity: 0.5,
    },
    buyNowText: {
        color: colors.white,
        fontSize: 15,
        fontWeight: "700",
    },
    buyNowPrice: {
        color: colors.white,
        fontSize: 11,
        fontWeight: "500",
    },
});

export default SingleProduct
