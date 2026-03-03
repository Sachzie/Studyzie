import React, { useMemo, useState } from "react";
import {
    View,
    StyleSheet,
    Text,
    Image,
    Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import baseURL from "../assets/common/baseurl";
import a4Img from "../Picures/a4.jpg";
import ballpenImg from "../Picures/ballpen.jpg";
import notebookImg from "../Picures/notebook.jpg";
import pencilImg from "../Picures/pencil.jpg";
import yellowpadImg from "../Picures/yellowpad.jpg";
import oilpastelImg from "../Picures/oilpastel.png";

const { width } = Dimensions.get("window");

const API_ORIGIN = baseURL.replace(/api\/v1\/?$/, "");
const DEFAULT_IMAGE = notebookImg;

const IMAGE_SOURCE_BY_KEY = {
    a4: a4Img,
    ballpen: ballpenImg,
    notebook: notebookImg,
    pencil: pencilImg,
    yellowpad: yellowpadImg,
    oilpastel: oilpastelImg,
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

const formatPeso = (value) =>
    `\u20B1${Number(value || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const resolveImageUri = (rawUri) => {
    if (!rawUri) return "";
    if (rawUri.startsWith("data:image")) return rawUri;

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

const ListItem = ({ item }) => {
    const [imageError, setImageError] = useState(false);

    const imageSource = useMemo(() => {
        if (imageError) {
            return DEFAULT_IMAGE;
        }

        const imageUri = resolveImageUri(item?.image || "");
        if (imageUri) {
            return { uri: imageUri };
        }

        const imageKey = normalizeImageKey(item?.imageKey) || getImageKeyFromName(item?.name);
        if (imageKey && IMAGE_SOURCE_BY_KEY[imageKey]) {
            return IMAGE_SOURCE_BY_KEY[imageKey];
        }

        return DEFAULT_IMAGE;
    }, [item?.image, item?.imageKey, item?.name, imageError]);

    const stockLabel = item?.countInStock > 0 ? `In Stock: ${item.countInStock}` : "Out of Stock";
    const stockColor = item?.countInStock > 0 ? "#15803D" : "#B91C1C";
    const categoryName =
        typeof item?.category === "object" && item?.category?.name
            ? item.category.name
            : "Uncategorized";

    return (
        <View style={styles.container}>
            <View style={styles.imageWrap}>
                <Image
                    source={imageSource}
                    resizeMode="cover"
                    style={styles.image}
                    onError={() => setImageError(true)}
                />
            </View>

            <View style={styles.body}>
                <Text style={styles.title} numberOfLines={1}>
                    {item?.name || "Untitled Product"}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                    {item?.brand || "Studyzie"} | {categoryName}
                </Text>
                <View style={styles.metaRow}>
                    <View style={[styles.stockBadge, { backgroundColor: stockColor }]}>
                        <Text style={styles.stockText}>{stockLabel}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.priceWrap}>
                <Ionicons name="pricetag-outline" size={14} color="#6B7280" />
                <Text style={styles.price}>{formatPeso(item?.price)}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        width: width - 32,
        alignSelf: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        alignItems: "center",
    },
    imageWrap: {
        width: 72,
        height: 72,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#F3F4F6",
        marginRight: 12,
    },
    image: {
        width: "100%",
        height: "100%",
    },
    body: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        color: "#111827",
        fontWeight: "700",
    },
    subtitle: {
        fontSize: 12,
        color: "#6B7280",
        marginTop: 2,
    },
    metaRow: {
        marginTop: 8,
        flexDirection: "row",
        alignItems: "center",
    },
    stockBadge: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    stockText: {
        color: "#FFFFFF",
        fontSize: 10,
        fontWeight: "700",
    },
    priceWrap: {
        minWidth: 92,
        alignItems: "flex-end",
    },
    price: {
        marginTop: 2,
        fontSize: 14,
        fontWeight: "700",
        color: "#059669",
    },
});

export default ListItem;
