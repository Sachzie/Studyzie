import React, { useCallback, useState, useContext, useEffect, useRef } from "react";
import { View, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from "react-native";
import { Surface, Text, Searchbar, TextInput } from "react-native-paper";
import { useFocusEffect, useNavigation, DrawerActions } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import ProductList from "./ProductList";
import CategoryFilter from "./CategoryFilter";
import Banner from "../Shared/Banner";
import baseURL from "../assets/common/baseurl";
import colors from "../assets/common/colors";
import Notification from "../../Shared/Notification";
import AuthGlobal from "../../backend/Context/Store/AuthGlobal";
import { fetchProducts, fetchCategories } from "../../backend/Redux/Actions/productActions";
import { Ionicons } from "@expo/vector-icons";
import StudyzieLogo from "../../Shared/StudyzieLogo";

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
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const productsState = useSelector((state) => state.products);
    const {
        items: storeProducts,
        categories: storeCategories,
        loading: productsLoading,
        error: productsError,
        categoriesLoading,
    } = productsState;
    const [products, setProducts] = useState(LOCAL_PRODUCTS);
    const [productsCtg, setProductsCtg] = useState(LOCAL_PRODUCTS);
    const [categories, setCategories] = useState(LOCAL_CATEGORIES);
    const [active, setActive] = useState(-1);
    const [keyword, setKeyword] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [notice, setNotice] = useState("");
    const [notification, setNotification] = useState({ visible: false, message: '', type: '' });
    const justLoggedIn = useRef(true);

    useEffect(() => {
        if (context.stateUser.isAuthenticated && justLoggedIn.current) {
            setNotification({ visible: true, message: "Login successful!", type: "success" });
            justLoggedIn.current = false; // Reset after showing the notification
        }
    }, [context.stateUser.isAuthenticated]);

    const applyFilters = useCallback((sourceProducts, searchText, categoryId, minPriceInput, maxPriceInput) => {
        const parsePrice = (value) => {
            if (value === null || value === undefined) return null;
            const trimmed = value.toString().trim();
            if (!trimmed) return null;
            const numberValue = Number(trimmed);
            return Number.isFinite(numberValue) ? numberValue : null;
        };

        const normalizedSearch = searchText.trim().toLowerCase();
        let minValue = parsePrice(minPriceInput);
        let maxValue = parsePrice(maxPriceInput);

        if (minValue !== null && maxValue !== null && minValue > maxValue) {
            const temp = minValue;
            minValue = maxValue;
            maxValue = temp;
        }

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

        if (minValue !== null) {
            filtered = filtered.filter((item) => Number(item?.price) >= minValue);
        }

        if (maxValue !== null) {
            filtered = filtered.filter((item) => Number(item?.price) <= maxValue);
        }

        setProductsCtg(filtered);
    }, []);

    const searchProduct = (text) => {
        setKeyword(text);
    };

    const onClearSearch = () => {
        setKeyword("");
    };

    const changeCtg = (ctg) => {
        setSelectedCategory(ctg);
    };

    const sanitizePriceInput = (value) => value.replace(/[^0-9.]/g, "");

    const updateMinPrice = (value) => {
        setMinPrice(sanitizePriceInput(value));
    };

    const updateMaxPrice = (value) => {
        setMaxPrice(sanitizePriceInput(value));
    };

    const resetFilters = () => {
        setKeyword("");
        setSelectedCategory("all");
        setMinPrice("");
        setMaxPrice("");
        setActive(-1);
    };

    const hasActiveFilters = Boolean(
        keyword.trim() || selectedCategory !== "all" || minPrice || maxPrice
    );

    useEffect(() => {
        applyFilters(products, keyword, selectedCategory, minPrice, maxPrice);
    }, [applyFilters, products, keyword, selectedCategory, minPrice, maxPrice]);

    useFocusEffect(
        useCallback(() => {
            setNotice("");
            setActive(-1);
            setSelectedCategory("all");
            setKeyword("");
            setMinPrice("");
            setMaxPrice("");

            dispatch(fetchProducts());
            dispatch(fetchCategories());
        }, [dispatch])
    );

    useEffect(() => {
        const normalizedProducts = Array.isArray(storeProducts)
            ? storeProducts.map(normalizeProduct)
            : [];
        const hasApiProducts = normalizedProducts.length > 0;
        const activeProducts = hasApiProducts ? normalizedProducts : LOCAL_PRODUCTS;
        setProducts(activeProducts);
        setProductsCtg(activeProducts);

        if (productsLoading) {
            return;
        }

        if (productsError) {
            setNotice("Showing local products while the server is unavailable.");
        } else if (!hasApiProducts) {
            setNotice("No products in database yet. Showing local products.");
        } else {
            setNotice("");
        }
    }, [storeProducts, productsError, productsLoading]);

    useEffect(() => {
        const normalizedCategories = Array.isArray(storeCategories)
            ? storeCategories.map(normalizeCategory)
            : [];
        setCategories(normalizedCategories.length > 0 ? normalizedCategories : LOCAL_CATEGORIES);
    }, [storeCategories]);

    const loading = productsLoading || categoriesLoading;

    return (
        <Surface style={styles.screen}>
            <Notification 
                visible={notification.visible} 
                message={notification.message} 
                type={notification.type} 
                onClose={() => setNotification({ ...notification, visible: false })} 
            />
            <View style={styles.header}>
                <View style={styles.headerTopRow}>
                    <TouchableOpacity
                        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                        style={styles.menuButton}
                    >
                        <Ionicons name="menu" size={24} color={colors.primary} />
                    </TouchableOpacity>
                    <View style={styles.brandWrap}>
                        <Text style={styles.brandText}>Studyzie</Text>
                        <Text style={styles.brandTag}>School Supplies</Text>
                    </View>
                    <View style={styles.headerLogo}>
                        <StudyzieLogo size={32} />
                    </View>
                </View>
                <View style={styles.headerTextWrap}>
                    <Text style={styles.headerTitle}>Studyzie Store</Text>
                    <Text style={styles.headerSubtitle}>Search and filter by category or price</Text>
                </View>
                <Searchbar
                    placeholder="Search by name, brand, or description"
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
                    <View style={styles.filterCard}>
                        <View style={styles.filterHeader}>
                            <View>
                                <Text style={styles.filterTitle}>Filters</Text>
                                <Text style={styles.filterHint}>Refine by category and price</Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.clearButton, !hasActiveFilters && styles.clearButtonDisabled]}
                                onPress={resetFilters}
                                disabled={!hasActiveFilters}
                            >
                                <Text style={[styles.clearButtonText, !hasActiveFilters && styles.clearButtonTextDisabled]}>
                                    Clear
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.categorySection}>
                            <Text style={styles.filterLabel}>Category</Text>
                            <CategoryFilter
                                categories={categories}
                                categoryFilter={changeCtg}
                                productsCtg={productsCtg}
                                active={active}
                                setActive={setActive}
                            />
                        </View>

                        <View style={styles.priceSection}>
                            <View style={styles.priceHeader}>
                                <Text style={styles.filterLabel}>Price Range</Text>
                                <Text style={styles.priceHint}>Filter results by price</Text>
                            </View>
                            <View style={styles.priceRow}>
                                <TextInput
                                    mode="outlined"
                                    dense
                                    label="Min"
                                    value={minPrice}
                                    onChangeText={updateMinPrice}
                                    keyboardType="numeric"
                                    style={styles.priceInput}
                                    contentStyle={styles.priceInputContent}
                                    outlineColor={colors.light}
                                    activeOutlineColor={colors.primary}
                                    textColor={colors.text}
                                    placeholder="0"
                                />
                                <Text style={styles.priceDivider}>to</Text>
                                <TextInput
                                    mode="outlined"
                                    dense
                                    label="Max"
                                    value={maxPrice}
                                    onChangeText={updateMaxPrice}
                                    keyboardType="numeric"
                                    style={styles.priceInput}
                                    contentStyle={styles.priceInputContent}
                                    outlineColor={colors.light}
                                    activeOutlineColor={colors.primary}
                                    textColor={colors.text}
                                    placeholder="999"
                                />
                            </View>
                        </View>
                    </View>

                    {notice ? <Text style={styles.notice}>{notice}</Text> : null}

                    <View style={styles.productsHeader}>
                        <Text style={styles.sectionTitle}>Products</Text>
                        <View style={styles.resultsBadge}>
                            <Text style={styles.resultsText}>
                                {productsCtg.length} of {products.length}
                            </Text>
                        </View>
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
        paddingTop: 46, // Safe area top
        paddingBottom: 18,
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
    headerTopRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    menuButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.inputBg,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.light,
    },
    brandWrap: {
        flex: 1,
        marginHorizontal: 12,
    },
    brandText: {
        fontSize: 16,
        fontWeight: "800",
        color: colors.text,
    },
    brandTag: {
        fontSize: 11,
        color: colors.textLight,
        marginTop: 2,
        fontWeight: "600",
    },
    headerLogo: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: colors.light,
    },
    headerTextWrap: {
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "800",
        color: colors.text,
    },
    headerSubtitle: {
        fontSize: 13,
        color: colors.textLight,
        fontWeight: "600",
        marginTop: 2,
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
        marginBottom: 12,
    },
    filterCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.light,
        marginBottom: 14,
    },
    filterHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    filterTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: colors.text,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: "700",
        color: colors.text,
    },
    filterHint: {
        fontSize: 12,
        color: colors.textLight,
        marginTop: 2,
    },
    clearButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.light,
        backgroundColor: colors.inputBg,
    },
    clearButtonText: {
        fontSize: 12,
        fontWeight: "700",
        color: colors.text,
    },
    clearButtonDisabled: {
        opacity: 0.5,
    },
    clearButtonTextDisabled: {
        color: colors.textLight,
    },
    priceSection: {
        marginBottom: 2,
        marginTop: 4,
    },
    priceHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    priceHint: {
        fontSize: 12,
        color: colors.textLight,
    },
    priceRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    priceInput: {
        flex: 1,
        backgroundColor: colors.white,
        height: 44,
    },
    priceInputContent: {
        fontSize: 13,
    },
    priceDivider: {
        fontSize: 12,
        fontWeight: "600",
        color: colors.textLight,
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
    resultsBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.light,
    },
    resultsText: {
        fontSize: 12,
        fontWeight: "700",
        color: colors.textLight,
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
