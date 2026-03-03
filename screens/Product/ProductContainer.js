import React, { useCallback, useState, useContext, useEffect, useRef } from "react";
import { View, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { Surface, Text, Searchbar } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import ProductList from "./ProductList";
import CategoryFilter from "./CategoryFilter";
import Banner from "../Shared/Banner";
import baseURL from "../assets/common/baseurl";
import axios from "axios";
import colors from "../assets/common/colors";
import Notification from "../../Shared/Notification";
import AuthGlobal from "../../backend/Context/Store/AuthGlobal";

const API_ORIGIN = baseURL.replace(/api\/v1\/?$/, "");

const IMAGE_SOURCE_BY_KEY = {
    a4: require("../Picures/a4.jpg"),
    ballpen: require("../Picures/ballpen.jpg"),
    notebook: require("../Picures/notebook.jpg"),
    pencil: require("../Picures/pencil.jpg"),
    yellowpad: require("../Picures/yellowpad.jpg"),
    oilpastel: require("../Picures/oilpastel.png"),
};

const LOCAL_PRODUCTS = [
    {
        _id: "local-a4",
        name: "A4 Bond Paper Ream",
        brand: "Studyzie Essentials",
        description: "Premium 80gsm paper, 500 sheets. Perfect for printing and school reports.",
        price: 225,
        countInStock: 42,
        category: { _id: "paper", name: "Paper" },
        categoryId: "paper",
        imageSource: require("../Picures/a4.jpg"),
    },
    {
        _id: "local-ballpen",
        name: "Blue Ballpen Pack (12pcs)",
        brand: "Studyzie Essentials",
        description: "Smooth-writing ballpens with quick-dry ink for class notes and exams.",
        price: 89,
        countInStock: 68,
        category: { _id: "writing", name: "Writing" },
        categoryId: "writing",
        imageSource: require("../Picures/ballpen.jpg"),
    },
    {
        _id: "local-notebook",
        name: "Spiral Notebook",
        brand: "Studyzie Essentials",
        description: "Durable cover notebook with ruled pages for daily note-taking.",
        price: 65,
        countInStock: 55,
        category: { _id: "notebook", name: "Notebooks" },
        categoryId: "notebook",
        imageSource: require("../Picures/notebook.jpg"),
    },
    {
        _id: "local-pencil",
        name: "No.2 Pencil Set (10pcs)",
        brand: "Studyzie Essentials",
        description: "High-quality pencils for writing, sketching, and shading.",
        price: 59,
        countInStock: 76,
        category: { _id: "writing", name: "Writing" },
        categoryId: "writing",
        imageSource: require("../Picures/pencil.jpg"),
    },
    {
        _id: "local-yellowpad",
        name: "Yellow Pad (80 leaves)",
        brand: "Studyzie Essentials",
        description: "Classic yellow pad for assignments, drafting, and reviewers.",
        price: 72,
        countInStock: 47,
        category: { _id: "paper", name: "Paper" },
        categoryId: "paper",
        imageSource: require("../Picures/yellowpad.jpg"),
    },
    {
        _id: "local-oilpastel",
        name: "Oil Pastel Set (24 colors)",
        brand: "Studyzie Essentials",
        description: "Rich pigments for art projects, posters, and classroom activities.",
        price: 149,
        countInStock: 35,
        category: { _id: "art", name: "Art Supplies" },
        categoryId: "art",
        imageSource: require("../Picures/oilpastel.png"),
    },
];

const LOCAL_CATEGORIES = [
    { _id: "paper", name: "Paper" },
    { _id: "writing", name: "Writing" },
    { _id: "notebook", name: "Notebooks" },
    { _id: "art", name: "Art Supplies" },
];

const getCategoryId = (item) => {
    if (!item || !item.category) {
        return item?.categoryId || "general";
    }
    if (typeof item.category === "string") {
        return item.category;
    }
    return (
        item.category._id?.$oid
        || item.category._id
        || item.category.id
        || item.categoryId
        || "general"
    );
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

const resolveImageUri = (rawUri) => {
    if (!rawUri) return "";
    if (rawUri.startsWith("data:image")) return rawUri;

    if (/^https?:\/\//i.test(rawUri)) {
        return rawUri;
    }

    if (rawUri.startsWith("/")) {
        return `${API_ORIGIN}${rawUri}`;
    }

    return `${API_ORIGIN}/public/uploads/${rawUri}`;
};

const resolveImageSource = (item) => {
    const imageUri = resolveImageUri(item?.image || "");
    if (imageUri) {
        return { uri: imageUri };
    }

    const keyFromItem = normalizeImageKey(item?.imageKey);
    const keyFromName = getImageKeyFromName(item?.name);
    const key = keyFromItem || keyFromName;
    return IMAGE_SOURCE_BY_KEY[key] || null;
};

const normalizeProduct = (item, index) => ({
    ...item,
    _id: item?._id?.$oid || item?._id || item?.id || `api-product-${index}`,
    categoryId: getCategoryId(item),
    imageSource: resolveImageSource(item),
    price: Number(item?.price) || 0,
    countInStock: Number(item?.countInStock) || 0,
});

const normalizeCategory = (item, index) => ({
    _id: item?._id?.$oid || item?._id || item?.id || `api-category-${index}`,
    name: item?.name || "General",
});

const ProductContainer = () => {
    const context = useContext(AuthGlobal);
    const [products, setProducts] = useState(LOCAL_PRODUCTS);
    const [productsCtg, setProductsCtg] = useState(LOCAL_PRODUCTS);
    const [categories, setCategories] = useState(LOCAL_CATEGORIES);
    const [active, setActive] = useState(-1);
    const [keyword, setKeyword] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [loading, setLoading] = useState(false);
    const [notice, setNotice] = useState("");
    const [notification, setNotification] = useState({ visible: false, message: '', type: '' });
    const justLoggedIn = useRef(true);

    useEffect(() => {
        if (context.stateUser.isAuthenticated && justLoggedIn.current) {
            setNotification({ visible: true, message: "Login successful!", type: "success" });
            justLoggedIn.current = false; // Reset after showing the notification
        }
    }, [context.stateUser.isAuthenticated]);

    const applyFilters = useCallback((sourceProducts, searchText, categoryId) => {
        const normalizedSearch = searchText.trim().toLowerCase();

        let filtered = sourceProducts;
        if (categoryId !== "all") {
            filtered = filtered.filter((item) => getCategoryId(item) === categoryId);
        }

        if (normalizedSearch) {
            filtered = filtered.filter((item) =>
                [item.name, item.brand, item.description]
                    .filter(Boolean)
                    .some((value) => value.toLowerCase().includes(normalizedSearch))
            );
        }

        setProductsCtg(filtered);
    }, []);

    const searchProduct = (text) => {
        setKeyword(text);
        applyFilters(products, text, selectedCategory);
    };

    const onClearSearch = () => {
        setKeyword("");
        applyFilters(products, "", selectedCategory);
    };

    const changeCtg = (ctg) => {
        setSelectedCategory(ctg);
        applyFilters(products, keyword, ctg);
    };

    useFocusEffect(
        useCallback(() => {
            let isActive = true;
            setLoading(true);
            setNotice("");
            setActive(-1);
            setSelectedCategory("all");
            setKeyword("");

            Promise.allSettled([
                axios.get(`${baseURL}products`),
                axios.get(`${baseURL}categories`),
            ])
                .then(([productResponse, categoryResponse]) => {
                    if (!isActive) {
                        return;
                    }

                    const apiProducts = productResponse.status === "fulfilled"
                        ? productResponse.value.data.map(normalizeProduct)
                        : [];

                    const hasApiProducts = apiProducts.length > 0;
                    const activeProducts = hasApiProducts ? apiProducts : LOCAL_PRODUCTS;
                    setProducts(activeProducts);
                    setProductsCtg(activeProducts);

                    const apiCategories = categoryResponse.status === "fulfilled"
                        ? categoryResponse.value.data.map(normalizeCategory)
                        : [];

                    const activeCategories = apiCategories.length > 0
                        ? apiCategories
                        : LOCAL_CATEGORIES;
                    setCategories(activeCategories);

                    if (productResponse.status === "rejected") {
                        setNotice("Showing local products while the server is unavailable.");
                    } else if (!hasApiProducts) {
                        setNotice("No products in database yet. Showing local products.");
                    }
                })
                .catch(() => {
                    if (!isActive) {
                        return;
                    }
                    setProducts(LOCAL_PRODUCTS);
                    setProductsCtg(LOCAL_PRODUCTS);
                    setCategories(LOCAL_CATEGORIES);
                    setNotice("Showing local products while the server is unavailable.");
                })
                .finally(() => {
                    if (isActive) {
                        setLoading(false);
                    }
                });

            return () => {
                isActive = false;
            };
        }, [])
    );

    return (
        <Surface style={styles.screen}>
            <Notification 
                visible={notification.visible} 
                message={notification.message} 
                type={notification.type} 
                onClose={() => setNotification({ ...notification, visible: false })} 
            />
            <View style={styles.header}>
                <Searchbar
                    placeholder="Search school supplies"
                    onChangeText={searchProduct}
                    value={keyword}
                    onClearIconPress={onClearSearch}
                    style={styles.searchbar}
                    inputStyle={styles.searchInput}
                    iconColor={colors.primary}
                    placeholderTextColor={colors.placeholder}
                />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Banner />
                <View style={styles.mainBody}>
                    <View style={styles.categorySection}>
                        <CategoryFilter
                            categories={categories}
                            categoryFilter={changeCtg}
                            productsCtg={productsCtg}
                            active={active}
                            setActive={setActive}
                        />
                    </View>

                    {notice ? <Text style={styles.notice}>{notice}</Text> : null}

                    <View style={styles.productsHeader}>
                        <Text style={styles.sectionTitle}>Featured Products</Text>
                    </View>

                    {loading ? (
                        <View style={styles.loaderWrap}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : productsCtg.length > 0 ? (
                        <View style={styles.listContainer}>
                            {productsCtg.map((item, index) => (
                                <ProductList
                                    key={item._id || item.id || `${item.name}-${index}`}
                                    item={item}
                                />
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyTitle}>No products found</Text>
                            <Text style={styles.emptyText}>Try another keyword or category.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </Surface>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.inputBg, // Cleaner off-white background
    },
    header: {
        backgroundColor: colors.white,
        paddingHorizontal: 16,
        paddingTop: 50, // Safe area top
        paddingBottom: 16,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
        marginBottom: 16,
        zIndex: 10,
    },
    headerContent: {
        marginBottom: 12,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: colors.primary,
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 12,
        color: colors.textLight,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    scrollContent: {
        paddingBottom: 100, // Extra space for floating nav
    },
    mainBody: {
        paddingHorizontal: 16,
    },
    searchbar: {
        borderRadius: 12,
        backgroundColor: colors.white,
        elevation: 0,
        height: 48,
        borderWidth: 1,
        borderColor: colors.light
    },
    searchInput: {
        fontSize: 14,
        color: colors.text,
        alignSelf: 'center', // Fix text alignment in react-native-paper Searchbar
    },
    categorySection: {
        marginBottom: 20,
    },
    productsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: colors.text,
    },
    listContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    loaderWrap: {
        height: 180,
        alignItems: "center",
        justifyContent: "center",
    },
    notice: {
        marginBottom: 16,
        color: colors.primary,
        backgroundColor: colors.lighter,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        textAlign: 'center',
        overflow: 'hidden',
    },
    emptyState: {
        padding: 40,
        alignItems: "center",
        justifyContent: 'center',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.textLight,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: colors.textLight,
        textAlign: 'center',
    },
});

export default ProductContainer;
