import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
    View,
    Text,
    ActivityIndicator,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Searchbar } from "react-native-paper";
import { SwipeListView } from "react-native-swipe-list-view";
import axios from "axios";
import Toast from "react-native-toast-message";
import { useDispatch, useSelector } from "react-redux";

import baseURL from "../assets/common/baseurl";
import ListItem from "./ListItem";
import { fetchProducts } from "../../backend/Redux/Actions/productActions";
import { getToken } from "../../backend/Context/Store/tokenStorage";

const { height } = Dimensions.get("window");

const Products = () => {
    const dispatch = useDispatch();
    const productsState = useSelector((state) => state.products);
    const { items: productList, loading } = productsState;
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [token, setToken] = useState("");
    const navigation = useNavigation();

    useFocusEffect(
        useCallback(() => {
            let isActive = true;

            const init = async () => {
                try {
                    const jwt = await getToken();
                    if (isActive) {
                        setToken(jwt || "");
                    }
                } catch (error) {
                    if (isActive) {
                        setToken("");
                    }
                }

                if (isActive) {
                    if (!productList.length && !loading) {
                        dispatch(fetchProducts());
                    }
                }
            };

            init();

            return () => {
                isActive = false;
                setSearchQuery("");
            };
        }, [dispatch, loading, productList.length])
    );

    const searchProduct = (text) => {
        setSearchQuery(text);
    };

    const onRefresh = () => {
        setRefreshing(true);
        dispatch(fetchProducts());
    };

    const deleteProduct = async (id) => {
        try {
            await axios.delete(`${baseURL}products/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            dispatch(fetchProducts());

            Toast.show({
                topOffset: 60,
                type: "success",
                text1: "Product deleted",
            });
        } catch (error) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Delete failed",
                text2: "Please try again.",
            });
        }
    };

    useEffect(() => {
        if (!loading) {
            setRefreshing(false);
        }
    }, [loading]);

    const renderHiddenItem = ({ item }) => (
        <View style={styles.hiddenContainer}>
            <TouchableOpacity
                style={[styles.hiddenButton, styles.editButton]}
                onPress={() => navigation.navigate("ProductForm", { item })}
            >
                <Ionicons name="create-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.hiddenButton, styles.deleteButton]}
                onPress={() => deleteProduct(item.id)}
            >
                <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );

    const totalCount = useMemo(() => productList.length, [productList.length]);
    const isLoading = loading && productList.length === 0;
    const filteredProducts = useMemo(() => {
        if (!searchQuery.trim()) return productList;
        const q = searchQuery.toLowerCase();
        return productList.filter((product) => product?.name?.toLowerCase().includes(q));
    }, [productList, searchQuery]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back-outline" size={22} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Manage Products</Text>
                </View>
                <Text style={styles.headerSubtitle}>{totalCount} items in catalog</Text>
                <Searchbar
                    placeholder="Search products..."
                    value={searchQuery}
                    onChangeText={searchProduct}
                    style={styles.searchBar}
                    inputStyle={styles.searchInput}
                    iconColor="#6B7280"
                    placeholderTextColor="#9CA3AF"
                />
            </View>

            {isLoading ? (
                <View style={styles.spinner}>
                    <ActivityIndicator size="large" color="#111827" />
                </View>
            ) : (
                <SwipeListView
                    data={filteredProducts}
                    renderItem={({ item }) => <ListItem item={item} />}
                    renderHiddenItem={renderHiddenItem}
                    disableRightSwipe
                    rightOpenValue={-140}
                    keyExtractor={(item) => item.id}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <Ionicons name="cube-outline" size={32} color="#9CA3AF" />
                            <Text style={styles.emptyText}>No matching products</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("ProductForm")}>
                <Ionicons name="add" size={30} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F3F4F6",
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 52,
        paddingBottom: 12,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    backButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        marginRight: 6,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    headerTitle: {
        color: "#111827",
        fontSize: 28,
        fontWeight: "700",
    },
    headerSubtitle: {
        marginTop: 2,
        marginBottom: 12,
        color: "#6B7280",
        fontSize: 13,
    },
    searchBar: {
        elevation: 0,
        borderRadius: 12,
        height: 48,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    searchInput: {
        color: "#111827",
        fontSize: 14,
    },
    listContent: {
        paddingBottom: 110,
    },
    spinner: {
        height: height / 2,
        alignItems: "center",
        justifyContent: "center",
    },
    hiddenContainer: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
        paddingRight: 18,
    },
    hiddenButton: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 8,
    },
    editButton: {
        backgroundColor: "#2563EB",
    },
    deleteButton: {
        backgroundColor: "#DC2626",
    },
    emptyWrap: {
        marginTop: 40,
        alignItems: "center",
    },
    emptyText: {
        marginTop: 8,
        color: "#6B7280",
        fontSize: 14,
    },
    fab: {
        position: "absolute",
        bottom: 28,
        right: 22,
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: "#111827",
        alignItems: "center",
        justifyContent: "center",
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
});

export default Products;
