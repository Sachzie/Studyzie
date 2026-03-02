import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    Platform,
    TextInput,
    StatusBar,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import mime from "mime";
import a4Img from "../Picures/a4.jpg";
import ballpenImg from "../Picures/ballpen.jpg";
import notebookImg from "../Picures/notebook.jpg";
import pencilImg from "../Picures/pencil.jpg";
import yellowpadImg from "../Picures/yellowpad.jpg";
import oilpastelImg from "../Picures/oilpastel.png";

import baseURL from "../assets/common/baseurl";
import Error from "../Shared/Error";

const PLACEHOLDER_IMAGE = "https://dummyimage.com/300x300/e5e7eb/6b7280&text=Pick+Image";
const API_ORIGIN = baseURL.replace(/api\/v1\/?$/, "");
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

const ProductForm = (props) => {
    const [pickerValue, setPickerValue] = useState("");
    const [brand, setBrand] = useState("");
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState("");
    const [mainImage, setMainImage] = useState("");
    const [category, setCategory] = useState("");
    const [categories, setCategories] = useState([]);
    const [token, setToken] = useState("");
    const [error, setError] = useState("");
    const [countInStock, setCountInStock] = useState("");
    const [item, setItem] = useState(null);
    const [imageError, setImageError] = useState(false);

    const navigation = useNavigation();
    const previewImage = resolveImageUri(mainImage || "");
    const fallbackPreviewSource = useMemo(() => {
        const key = normalizeImageKey(item?.imageKey) || getImageKeyFromName(item?.name);
        return IMAGE_SOURCE_BY_KEY[key] || null;
    }, [item?.imageKey, item?.name]);

    useEffect(() => {
        const routeItem = props?.route?.params?.item;

        if (routeItem) {
            setItem(routeItem);
            setBrand(routeItem.brand || "");
            setName(routeItem.name || "");
            setPrice(routeItem.price?.toString?.() || "");
            setDescription(routeItem.description || "");
            setMainImage(routeItem.image || "");
            setImage(routeItem.image || "");
            const currentCategoryId =
                typeof routeItem?.category === "object"
                    ? routeItem?.category?._id || routeItem?.category?.id || ""
                    : routeItem?.category || "";
            setCategory(currentCategoryId);
            setPickerValue(currentCategoryId);
            setCountInStock(routeItem.countInStock?.toString?.() || "");
        }

        AsyncStorage.getItem("jwt")
            .then((res) => setToken(res || ""))
            .catch(() => setToken(""));

        axios
            .get(`${baseURL}categories`)
            .then((res) => setCategories(res.data || []))
            .catch(() => {
                Toast.show({
                    topOffset: 60,
                    type: "error",
                    text1: "Could not load categories",
                });
            });

        (async () => {
            if (Platform.OS !== "web") {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== "granted") {
                    Toast.show({
                        topOffset: 60,
                        type: "error",
                        text1: "Permission required",
                        text2: "Please allow media access to upload images.",
                    });
                }
            }
        })();

        return () => {
            setCategories([]);
        };
    }, [props?.route?.params?.item]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            const uri = result.assets?.[0]?.uri;
            if (uri) {
                setMainImage(uri);
                setImage(uri);
                setImageError(false);
            }
        }
    };

    const saveProduct = async () => {
        setError("");

        if (!name || !brand || !price || !description || !category || !countInStock) {
            setError("Please fill in all fields.");
            return;
        }

        if (!item && !image) {
            setError("Please select an image for the product.");
            return;
        }

        const formData = new FormData();
        const newImageUri =
            image && image.startsWith("file:")
                ? "file:///" + image.split("file:/").join("")
                : null;

        if (newImageUri && image !== item?.image) {
            formData.append("image", {
                uri: newImageUri,
                type: mime.getType(newImageUri) || "image/jpeg",
                name: newImageUri.split("/").pop(),
            });
        }

        formData.append("name", name.trim());
        formData.append("brand", brand.trim());
        formData.append("price", price);
        formData.append("description", description.trim());
        formData.append("category", category);
        formData.append("countInStock", countInStock);
        formData.append("richDescription", description.trim());
        formData.append("rating", 0);
        formData.append("numReviews", 0);
        formData.append("isFeatured", false);

        const config = {
            headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${token}`,
            },
        };

        try {
            if (item) {
                await axios.put(`${baseURL}products/${item.id}`, formData, config);
                Toast.show({
                    topOffset: 60,
                    type: "success",
                    text1: "Product updated",
                });
            } else {
                await axios.post(`${baseURL}products`, formData, config);
                Toast.show({
                    topOffset: 60,
                    type: "success",
                    text1: "Product created",
                });
            }

            setTimeout(() => {
                navigation.goBack();
            }, 350);
        } catch (e) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Save failed",
                text2: "Please check your input and try again.",
            });
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back-outline" size={22} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {item ? "Manage Product" : "Create Product"}
                    </Text>
                </View>
                <Text style={styles.headerSubtitle}>
                    {item ? "Update product details" : "Add a new product to your catalog"}
                </Text>
            </View>

            <KeyboardAwareScrollView
                viewIsInsideTabBar
                extraHeight={160}
                enableOnAndroid
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.formCard}>
                    <View style={styles.imageContainer}>
                        <Image
                            style={styles.image}
                            source={
                                imageError || !previewImage
                                    ? (fallbackPreviewSource || { uri: PLACEHOLDER_IMAGE })
                                    : { uri: previewImage }
                            }
                            resizeMode="cover"
                            onError={() => setImageError(true)}
                        />
                        <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                            <Ionicons name="camera-outline" color="#FFFFFF" size={18} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Brand</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Brand"
                            placeholderTextColor="#9CA3AF"
                            value={brand}
                            onChangeText={setBrand}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Name"
                            placeholderTextColor="#9CA3AF"
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.formGroup, styles.half, styles.halfLeft]}>
                            <Text style={styles.label}>Price (₱)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Price"
                                placeholderTextColor="#9CA3AF"
                                value={price}
                                keyboardType="numeric"
                                onChangeText={setPrice}
                            />
                        </View>
                        <View style={[styles.formGroup, styles.half]}>
                            <Text style={styles.label}>Count in Stock</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Stock"
                                placeholderTextColor="#9CA3AF"
                                value={countInStock}
                                keyboardType="numeric"
                                onChangeText={setCountInStock}
                            />
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Description"
                            placeholderTextColor="#9CA3AF"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Category</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                mode="dropdown"
                                selectedValue={pickerValue}
                                style={styles.picker}
                                dropdownIconColor="#111827"
                                onValueChange={(value) => {
                                    setPickerValue(value);
                                    setCategory(value);
                                }}
                            >
                                <Picker.Item label="Select category" value="" />
                                {categories.map((c) => (
                                    <Picker.Item key={c.id} label={c.name} value={c.id} />
                                ))}
                            </Picker>
                        </View>
                    </View>

                    {error ? <Error message={error} /> : null}

                    <TouchableOpacity style={styles.confirmButton} onPress={saveProduct}>
                        <Text style={styles.confirmButtonText}>{item ? "Save Changes" : "Create Product"}</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAwareScrollView>
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
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 26,
    },
    formCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        padding: 14,
    },
    imageContainer: {
        width: 140,
        height: 140,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        alignSelf: "center",
        marginBottom: 16,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F3F4F6",
        position: "relative",
        overflow: "hidden",
    },
    image: {
        width: "100%",
        height: "100%",
    },
    imagePicker: {
        position: "absolute",
        bottom: 8,
        right: 8,
        backgroundColor: "#111827",
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
    },
    formGroup: {
        marginBottom: 12,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    half: {
        flex: 1,
    },
    halfLeft: {
        marginRight: 10,
    },
    label: {
        fontSize: 13,
        marginBottom: 5,
        fontWeight: "600",
        color: "#374151",
    },
    input: {
        height: 46,
        borderRadius: 10,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        backgroundColor: "#FFFFFF",
        color: "#111827",
        fontSize: 14,
    },
    textArea: {
        height: 96,
        paddingTop: 12,
        textAlignVertical: "top",
    },
    pickerContainer: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        overflow: "hidden",
    },
    picker: {
        color: "#111827",
    },
    confirmButton: {
        height: 48,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 8,
        backgroundColor: "#111827",
    },
    confirmButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "700",
    },
});

export default ProductForm;
