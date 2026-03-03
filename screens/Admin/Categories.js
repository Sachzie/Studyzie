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
    Modal,
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
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [editedCategoryName, setEditedCategoryName] = useState("");

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
            setIsAddModalVisible(false);
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

    const openEditModal = (category) => {
        setCurrentCategory(category);
        setEditedCategoryName(category.name);
        setIsEditModalVisible(true);
    };

    const handleUpdateCategory = async () => {
        if (!currentCategory || !editedCategoryName.trim()) return;

        try {
            const response = await axios.put(
                `${baseURL}categories/${currentCategory.id}`,
                { name: editedCategoryName.trim() },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setCategories((prev) =>
                prev.map((item) =>
                    item.id === currentCategory.id ? response.data : item
                )
            );
            setIsEditModalVisible(false);
            setCurrentCategory(null);
            setEditedCategoryName("");
            Toast.show({
                topOffset: 60,
                type: "success",
                text1: "Category updated",
            });
        } catch (error) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Update failed",
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
            <View style={styles.buttonGroup}>
                <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(item)}>
                    <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => deleteCategory(item.id)}>
                    <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
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

            <TouchableOpacity style={styles.fab} onPress={() => setIsAddModalVisible(true)}>
                <Ionicons name="add" size={30} color="#FFFFFF" />
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={isAddModalVisible}
                onRequestClose={() => setIsAddModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalText}>Add Category</Text>
                        <TextInput
                            style={styles.modalInput}
                            onChangeText={setCategoryName}
                            value={categoryName}
                            placeholder="Category Name"
                        />
                        <View style={styles.modalButtonGroup}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonClose]}
                                onPress={() => setIsAddModalVisible(false)}
                            >
                                <Text style={styles.textStyle}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonUpdate]}
                                onPress={addCategory}
                            >
                                <Text style={styles.textStyle}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                animationType="slide"
                transparent={true}
                visible={isEditModalVisible}
                onRequestClose={() => setIsEditModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalText}>Edit Category</Text>
                        <TextInput
                            style={styles.modalInput}
                            onChangeText={setEditedCategoryName}
                            value={editedCategoryName}
                        />
                        <View style={styles.modalButtonGroup}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonClose]}
                                onPress={() => setIsEditModalVisible(false)}
                            >
                                <Text style={styles.textStyle}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonUpdate]}
                                onPress={handleUpdateCategory}
                            >
                                <Text style={styles.textStyle}>Update</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    buttonGroup: {
        flexDirection: "row",
    },
    editButton: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: "#2563EB",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
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
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalView: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 35,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalText: {
        marginBottom: 15,
        textAlign: "center",
        fontSize: 18,
        fontWeight: "bold",
    },
    modalInput: {
        width: 200,
        height: 40,
        borderColor: "gray",
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 10,
        marginBottom: 20,
    },
    modalButtonGroup: {
        flexDirection: "row",
    },
    modalButton: {
        borderRadius: 10,
        padding: 10,
        elevation: 2,
        marginHorizontal: 5,
    },
    modalButtonClose: {
        backgroundColor: "#6B7280",
    },
    modalButtonUpdate: {
        backgroundColor: "#2563EB",
    },
    textStyle: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center",
    },
});

export default Categories;
