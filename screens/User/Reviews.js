import React, { useCallback, useContext, useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    TextInput,
    ActivityIndicator,
    Alert,
    Modal,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { SwipeListView } from "react-native-swipe-list-view";

import AuthGlobal from "../../backend/Context/Store/AuthGlobal";
import baseURL from "../assets/common/baseurl";
import colors from "../assets/common/colors";
import {
    fetchReviewables,
    submitReview as submitReviewAction,
    deleteReview as deleteReviewAction,
} from "../../backend/Redux/Actions/reviewActions";
import { getToken } from "../../backend/Context/Store/tokenStorage";
import a4Img from "../Picures/a4.jpg";
import ballpenImg from "../Picures/ballpen.jpg";
import notebookImg from "../Picures/notebook.jpg";
import pencilImg from "../Picures/pencil.jpg";
import yellowpadImg from "../Picures/yellowpad.jpg";
import oilpastelImg from "../Picures/oilpastel.png";

const API_ORIGIN = baseURL.replace(/api\/v1\/?$/, "");
const FALLBACK_IMAGE = "https://cdn.pixabay.com/photo/2012/04/01/17/29/box-23649_960_720.png";
const IMAGE_SOURCE_BY_KEY = {
    a4: a4Img,
    ballpen: ballpenImg,
    notebook: notebookImg,
    pencil: pencilImg,
    yellowpad: yellowpadImg,
    oilpastel: oilpastelImg,
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

const getImageSource = (product) => {
    const imageUri = resolveImageUri(product?.image || "");
    if (imageUri) {
        return { uri: imageUri };
    }

    const imageKey = normalizeImageKey(product?.imageKey || "") || getImageKeyFromName(product?.name || "");
    if (imageKey && IMAGE_SOURCE_BY_KEY[imageKey]) {
        return IMAGE_SOURCE_BY_KEY[imageKey];
    }

    return { uri: FALLBACK_IMAGE };
};

const formatPeso = (value) =>
    `\u20B1${Number(value || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const getProductId = (product) =>
    product?.id || product?._id || product?.product || product?._id?.$oid || "";

const findUserReview = (reviews, userId) => {
    if (!Array.isArray(reviews) || !userId) return null;
    return reviews.find((review) => {
        const reviewerId = review?.user?._id || review?.user || "";
        return reviewerId && String(reviewerId) === String(userId);
    }) || null;
};

const Reviews = ({ navigation }) => {
    const context = useContext(AuthGlobal);
    const dispatch = useDispatch();
    const reviewsState = useSelector((state) => state.reviews);
    const { reviewables: products, loading, savingId } = reviewsState;
    const [expandedId, setExpandedId] = useState("");
    const [drafts, setDrafts] = useState({});
    const [deletedModalVisible, setDeletedModalVisible] = useState(false);
    const [deletedProductName, setDeletedProductName] = useState("");
    const deleteModalTimerRef = useRef(null);

    const userId = context?.stateUser?.user?.userId
        || context?.stateUser?.user?.id
        || context?.stateUser?.user?.sub
        || "";

    useEffect(() => {
        return () => {
            if (deleteModalTimerRef.current) {
                clearTimeout(deleteModalTimerRef.current);
            }
        };
    }, []);

    useFocusEffect(
        useCallback(() => {
            const isAuthenticated = Boolean(context?.stateUser?.isAuthenticated);
            if (!isAuthenticated) {
                navigation.navigate("User", { screen: "Login" });
                return;
            }
            dispatch(fetchReviewables(userId));
        }, [context?.stateUser?.isAuthenticated, dispatch, navigation, userId])
    );

    const updateDraft = (productId, patch) => {
        setDrafts((prev) => ({
            ...prev,
            [productId]: {
                ...(prev[productId] || {}),
                ...patch,
            },
        }));
    };

    const submitReview = async (product, existingReview) => {
        const productId = getProductId(product);
        const draft = drafts[productId] || {};
            if (!draft.rating || draft.rating < 1 || draft.rating > 5) {
                Toast.show({
                    topOffset: 60,
                    type: "error",
                    text1: "Rating required",
                text2: "Please select a rating between 1 and 5.",
            });
            return;
        }

        try {
            const token = await getToken();
            if (!token) {
                Toast.show({
                    topOffset: 60,
                    type: "error",
                    text1: "Please login",
                    text2: "You need to login to submit a review.",
                });
                return;
            }

            const payload = {
                rating: draft.rating,
                comment: (draft.comment || "").trim(),
            };

            await dispatch(submitReviewAction(productId, payload, token, Boolean(existingReview)));

            Toast.show({
                topOffset: 60,
                type: "success",
                text1: existingReview ? "Review updated" : "Review submitted",
                text2: "Thanks for sharing your feedback!",
            });
            setExpandedId("");
            dispatch(fetchReviewables(userId));
        } catch (error) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Review failed",
                text2: error?.response?.data?.message || "Please try again.",
            });
        }
    };

    const deleteReview = async (product) => {
        const productId = getProductId(product);
        if (!productId) return;

        Alert.alert(
            "Delete Review",
            "Are you sure you want to remove your review for this product?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const token = await getToken();
                            if (!token) {
                                Toast.show({
                                    topOffset: 60,
                                    type: "error",
                                    text1: "Please login",
                                    text2: "You need to login to delete a review.",
                                });
                                return;
                            }

                            await dispatch(deleteReviewAction(productId, token));
                            Toast.show({
                                topOffset: 60,
                                type: "success",
                                text1: "Review deleted",
                                text2: "Your review has been removed.",
                            });
                            if (deleteModalTimerRef.current) {
                                clearTimeout(deleteModalTimerRef.current);
                            }
                            setDeletedProductName(product?.name || "Product");
                            setDeletedModalVisible(true);
                            deleteModalTimerRef.current = setTimeout(() => {
                                setDeletedModalVisible(false);
                            }, 1600);
                            setExpandedId("");
                            dispatch(fetchReviewables(userId));
                        } catch (error) {
                            Toast.show({
                                topOffset: 60,
                                type: "error",
                                text1: "Delete failed",
                                text2: error?.response?.data?.message || "Please try again.",
                            });
                        }
                    },
                },
            ]
        );
    };

    const renderStars = (value, onChange) => (
        <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => onChange(star)} style={styles.starButton}>
                    <Ionicons
                        name={value >= star ? "star" : "star-outline"}
                        size={20}
                        color={value >= star ? "#F59E0B" : colors.light}
                    />
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderItem = ({ item }) => {
        const productId = getProductId(item);
        const review = findUserReview(item?.reviews, userId);
        const draft = drafts[productId] || {
            rating: review?.rating || 0,
            comment: review?.comment || "",
        };
        const isExpanded = expandedId === productId;
        const imageSource = getImageSource(item);

        return (
            <View style={styles.card}>
                <View style={styles.cardTop}>
                    <Image source={imageSource} style={styles.productImage} />
                    <View style={styles.meta}>
                        <Text style={styles.productName} numberOfLines={1}>
                            {item?.name || "School Supply"}
                        </Text>
                        <Text style={styles.productSubtitle}>
                            {item?.category?.name || item?.brand || "Studyzie Essentials"}
                        </Text>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceText}>{formatPeso(item?.price)}</Text>
                            <Text style={styles.ratingMeta}>
                                {Number(item?.rating || 0).toFixed(1)} ({item?.numReviews || 0})
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.cardActions}>
                    <TouchableOpacity
                        style={[styles.reviewButton, review ? styles.reviewButtonAlt : null]}
                        onPress={() => setExpandedId(isExpanded ? "" : productId)}
                    >
                        <Ionicons name="create-outline" size={16} color={review ? colors.primary : colors.white} />
                        <Text style={[styles.reviewButtonText, review ? styles.reviewButtonTextAlt : null]}>
                            {review ? "Update Review" : "Write Review"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {isExpanded ? (
                    <View style={styles.reviewPanel}>
                        <Text style={styles.reviewLabel}>Your Rating</Text>
                        {renderStars(draft.rating, (value) => updateDraft(productId, { rating: value }))}
                        <Text style={styles.reviewLabel}>Comment</Text>
                        <TextInput
                            style={styles.reviewInput}
                            placeholder="Share what you liked about this product..."
                            placeholderTextColor={colors.placeholder}
                            value={draft.comment}
                            onChangeText={(text) => updateDraft(productId, { comment: text })}
                            multiline
                        />
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={() => submitReview(item, review)}
                            disabled={savingId === productId}
                        >
                            {savingId === productId ? (
                                <ActivityIndicator size="small" color={colors.white} />
                            ) : (
                                <Text style={styles.submitText}>
                                    {review ? "Save Changes" : "Submit Review"}
                                </Text>
                            )}
                        </TouchableOpacity>
                        {review ? (
                            <Text style={styles.swipeHint}>
                                Swipe left on this card to delete your review
                            </Text>
                        ) : null}
                    </View>
                ) : null}
            </View>
        );
    };

    const renderHiddenItem = ({ item }) => {
        const productId = getProductId(item);
        const review = findUserReview(item?.reviews, userId);
        const isBusy = savingId === productId;

        return (
            <View style={styles.hiddenRow}>
                {review ? (
                    <TouchableOpacity
                        style={[styles.hiddenDeleteButton, isBusy && styles.hiddenDeleteButtonDisabled]}
                        onPress={() => deleteReview(item)}
                        disabled={isBusy}
                    >
                        <Ionicons name="trash" size={18} color={colors.white} />
                        <Text style={styles.hiddenDeleteText}>Delete</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.hiddenDisabledBadge}>
                        <Text style={styles.hiddenDisabledText}>No Review</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Ratings</Text>
                <Text style={styles.headerSubtitle}>Review your purchased school supplies</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading your purchases...</Text>
                </View>
            ) : (
                <SwipeListView
                    data={products}
                    keyExtractor={(item, index) => String(getProductId(item) || index)}
                    renderItem={renderItem}
                    renderHiddenItem={renderHiddenItem}
                    rightOpenValue={-104}
                    disableRightSwipe
                    closeOnRowOpen
                    closeOnRowPress
                    closeOnRowBeginSwipe
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Ionicons name="star-outline" size={40} color={colors.light} />
                            <Text style={styles.emptyText}>No delivered orders yet.</Text>
                        </View>
                    }
                />
            )}
            <Modal transparent visible={deletedModalVisible} animationType="fade">
                <View style={styles.deleteModalOverlay}>
                    <View style={styles.deleteModalCard}>
                        <Ionicons name="checkmark-circle" size={40} color={colors.success} />
                        <Text style={styles.deleteModalTitle}>Review Deleted</Text>
                        <Text style={styles.deleteModalText}>
                            Your review for {deletedProductName} has been removed.
                        </Text>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.inputBg,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 60, // Increased to avoid status bar overlap
        paddingBottom: 14,
        backgroundColor: colors.white,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 4,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: "800",
        color: colors.primary,
    },
    headerSubtitle: {
        marginTop: 4,
        fontSize: 13,
        color: colors.textLight,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 120,
        paddingTop: 14,
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: 18,
        padding: 14,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: colors.light,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardTop: {
        flexDirection: "row",
        alignItems: "center",
    },
    productImage: {
        width: 68,
        height: 68,
        borderRadius: 14,
        backgroundColor: colors.gray,
        marginRight: 12,
    },
    meta: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: "700",
        color: colors.text,
    },
    productSubtitle: {
        marginTop: 2,
        fontSize: 12,
        color: colors.textLight,
    },
    priceRow: {
        marginTop: 6,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    priceText: {
        fontSize: 14,
        fontWeight: "700",
        color: colors.primary,
    },
    ratingMeta: {
        fontSize: 11,
        color: colors.textLight,
        fontWeight: "600",
    },
    cardActions: {
        marginTop: 10,
        flexDirection: "row",
        justifyContent: "flex-end",
    },
    reviewButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: colors.primary,
    },
    reviewButtonAlt: {
        backgroundColor: colors.lighter,
        borderWidth: 1,
        borderColor: colors.light,
    },
    reviewButtonText: {
        marginLeft: 6,
        fontSize: 12,
        fontWeight: "700",
        color: colors.white,
    },
    reviewButtonTextAlt: {
        color: colors.primary,
    },
    reviewPanel: {
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.light,
        paddingTop: 12,
    },
    reviewLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: colors.text,
        marginBottom: 6,
    },
    starRow: {
        flexDirection: "row",
        marginBottom: 10,
    },
    starButton: {
        marginRight: 6,
    },
    reviewInput: {
        minHeight: 80,
        borderWidth: 1,
        borderColor: colors.light,
        borderRadius: 12,
        padding: 10,
        fontSize: 12,
        color: colors.text,
        backgroundColor: colors.white,
        textAlignVertical: "top",
        marginBottom: 12,
    },
    submitButton: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
        backgroundColor: colors.primary,
        paddingVertical: 10,
    },
    submitText: {
        fontSize: 13,
        fontWeight: "700",
        color: colors.white,
    },
    swipeHint: {
        marginTop: 8,
        fontSize: 11,
        color: colors.textLight,
        fontWeight: "600",
    },
    hiddenRow: {
        flex: 1,
        marginBottom: 14,
        borderRadius: 18,
        alignItems: "flex-end",
        justifyContent: "center",
        paddingRight: 8,
    },
    hiddenDeleteButton: {
        width: 96,
        height: "88%",
        borderRadius: 16,
        backgroundColor: colors.error,
        alignItems: "center",
        justifyContent: "center",
    },
    hiddenDeleteButtonDisabled: {
        opacity: 0.6,
    },
    hiddenDeleteText: {
        marginTop: 4,
        color: colors.white,
        fontSize: 12,
        fontWeight: "700",
    },
    hiddenDisabledBadge: {
        width: 96,
        height: "88%",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.light,
        backgroundColor: colors.gray,
        alignItems: "center",
        justifyContent: "center",
    },
    hiddenDisabledText: {
        fontSize: 11,
        fontWeight: "700",
        color: colors.textLight,
    },
    deleteModalOverlay: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.35)",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    deleteModalCard: {
        width: "100%",
        borderRadius: 16,
        backgroundColor: colors.white,
        paddingVertical: 22,
        paddingHorizontal: 18,
        alignItems: "center",
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    deleteModalTitle: {
        marginTop: 8,
        fontSize: 18,
        fontWeight: "800",
        color: colors.text,
    },
    deleteModalText: {
        marginTop: 6,
        fontSize: 13,
        lineHeight: 18,
        color: colors.textLight,
        textAlign: "center",
    },
    center: {
        alignItems: "center",
        justifyContent: "center",
        padding: 30,
    },
    emptyText: {
        marginTop: 10,
        fontSize: 14,
        color: colors.textLight,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 13,
        color: colors.textLight,
    },
});

export default Reviews;
