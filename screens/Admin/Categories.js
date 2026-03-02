import React, { useCallback, useState } from "react";
import {
    View,
    Text,
    FlatList,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import baseURL from "../assets/common/baseurl";

const Categories = ({ navigation }) => {
    const [categories, setCategories] = useState([]);
    const [categoryName, setCategoryName] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [token, setToken] = useState("");

    const fetchCategories = useCallback(async () => {
        try {
            const response = await axios.get(`${baseURL}categories`);
            setCategories(response.data || []);
        } catch (error) {
            setCategories([]);
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Load failed",
                text2: "Could not fetch categories.",
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            let isActive = true;

            const init = async () => {
                setLoading(true);
                try {
                    const jwt = await AsyncStorage.getItem("jwt");
                    if (isActive) setToken(jwt || "");
                } catch (error) {
                    if (isActive) setToken("");
                }
                if (isActive) fetchCategories();
            };

            init();

            return () => {
                isActive = false;
                setCategories([]);
            };
        }, [fetchCategories])
    );

    const addCategory = async () => {
        const name = categoryName.trim();
        if (!name) return;

        try {
            const response = await axios.post(
                `${baseURL}categories`,
                { name },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setCategories((prev) => [response.data, ...prev]);
            setCategoryName("");
            Toast.show({
                topOffset: 60,
                type: "success",
                text1: "Category added",
            });
        } catch (error) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Add failed",
                text2: error?.response?.data?.message || "Please try again.",
            });
        }
    };

    const deleteCategory = async (id) => {
        try {
            await axios.delete(`${baseURL}categories/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setCategories((prev) => prev.filter((item) => item.id !== id));
            Toast.show({
                topOffset: 60,
                type: "success",
                text1: "Category deleted",
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

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardLeft}>
                <View style={styles.tagIcon}>
                    <Ionicons name="pricetag-outline" size={16} color="#374151" />
                </View>
                <Text style={styles.cardText} numberOfLines={1}>
                    {item.name}
                </Text>
            </View>
            <TouchableOpacity style={styles.deleteButton} onPress={() => deleteCategory(item.id)}>
                <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back-outline" size={22} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Manage Categories</Text>
                </View>
                <Text style={styles.headerSubtitle}>{categories.length} categories available</Text>
            </View>

            <View style={styles.addCard}>
                <TextInput
                    value={categoryName}
                    style={styles.input}
                    onChangeText={setCategoryName}
                    placeholder="Add a new category"
                    placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity onPress={addCategory} style={styles.addButton}>
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loaderWrap}>
                    <ActivityIndicator size="large" color="#111827" />
                </View>
            ) : (
                <FlatList
                    data={categories}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    refreshing={refreshing}
                    onRefresh={() => {
                        setRefreshing(true);
                        fetchCategories();
                    }}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <Ionicons name="pricetags-outline" size={32} color="#9CA3AF" />
                            <Text style={styles.emptyText}>No categories yet</Text>
                        </View>
                    }
                />
            )}
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
        paddingBottom: 10,
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
        color: "#6B7280",
        fontSize: 13,
    },
    addCard: {
        marginHorizontal: 16,
        marginBottom: 10,
        borderRadius: 14,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        padding: 8,
        flexDirection: "row",
        alignItems: "center",
    },
    input: {
        flex: 1,
        height: 44,
        paddingHorizontal: 12,
        color: "#111827",
        fontSize: 14,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "#111827",
        alignItems: "center",
        justifyContent: "center",
    },
    loaderWrap: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 30,
    },
    card: {
        borderRadius: 14,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        paddingHorizontal: 12,
        paddingVertical: 12,
        marginBottom: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    cardLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        marginRight: 8,
    },
    tagIcon: {
        width: 30,
        height: 30,
        borderRadius: 10,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },
    cardText: {
        color: "#111827",
        fontSize: 15,
        fontWeight: "600",
    },
    deleteButton: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: "#DC2626",
        alignItems: "center",
        justifyContent: "center",
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
});

export default Categories;
