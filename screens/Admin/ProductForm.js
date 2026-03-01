import React, { useState, useEffect } from "react"
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    Platform,
    TextInput,
    StatusBar,
    ScrollView
} from "react-native"
import { Picker } from "@react-native-picker/picker"
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import Toast from "react-native-toast-message"
import AsyncStorage from '@react-native-async-storage/async-storage'
import baseURL from "../../assets/common/baseurl"
import Error from "../../Shared/Error"
import axios from "axios"
import * as ImagePicker from "expo-image-picker"
import { useNavigation } from "@react-navigation/native"
import mime from "mime";

const ProductForm = (props) => {
    
    const [pickerValue, setPickerValue] = useState('');
    const [brand, setBrand] = useState('');
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState('');
    const [mainImage, setMainImage] = useState();
    const [category, setCategory] = useState('');
    const [categories, setCategories] = useState([]);
    const [token, setToken] = useState();
    const [error, setError] = useState();
    const [countInStock, setCountInStock] = useState('');
    const [richDescription, setRichDescription] = useState();
    const [numReviews, setNumReviews] = useState(0);
    const [item, setItem] = useState(null);
    const [dark, setDark] = useState(true); // Default to dark mode for admin

    let navigation = useNavigation()

    useEffect(() => {
        if (!props.route.params) {
            setItem(null);
        } else {
            setItem(props.route.params.item);
            setBrand(props.route.params.item.brand);
            setName(props.route.params.item.name);
            setPrice(props.route.params.item.price.toString());
            setDescription(props.route.params.item.description);
            setMainImage(props.route.params.item.image);
            setImage(props.route.params.item.image);
            setCategory(props.route.params.item.category._id);
            setPickerValue(props.route.params.item.category._id);
            setCountInStock(props.route.params.item.countInStock.toString());
        }
        AsyncStorage.getItem("jwt")
            .then((res) => {
                setToken(res)
            })
            .catch((error) => console.log(error))
        axios
            .get(`${baseURL}categories`)
            .then((res) => setCategories(res.data))
            .catch((error) => alert("Error to load categories"));
        
        // Request permissions
        (async () => {
            if (Platform.OS !== "web") {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== "granted") {
                    alert("Sorry, we need camera roll permissions to make this work!")
                }
            }
        })();

        return () => {
            setCategories([])
        }
    }, [])

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1
        });

        if (!result.canceled) {
            setMainImage(result.assets[0].uri);
            setImage(result.assets[0].uri);
        }
    }

    const addProduct = () => {
        if (
            name == "" ||
            brand == "" ||
            price == "" ||
            description == "" ||
            category == "" ||
            countInStock == ""
        ) {
            setError("Please fill in the form correctly")
            return;
        }

        let formData = new FormData();

        const newImageUri = "file:///" + image.split("file:/").join("");

        if (image && image !== item?.image) {
             formData.append("image", {
                uri: newImageUri,
                type: mime.getType(newImageUri),
                name: newImageUri.split("/").pop()
            });
        }
       
        formData.append("name", name);
        formData.append("brand", brand);
        formData.append("price", price);
        formData.append("description", description);
        formData.append("category", category);
        formData.append("countInStock", countInStock);
        formData.append("richDescription", richDescription || description); // Default rich desc
        formData.append("rating", 0);
        formData.append("numReviews", 0);
        formData.append("isFeatured", false);

        const config = {
            headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${token}`
            }
        }

        if (item !== null) {
            axios
                .put(`${baseURL}products/${item.id}`, formData, config)
                .then((res) => {
                    if (res.status == 200 || res.status == 201) {
                        Toast.show({
                            topOffset: 60,
                            type: "success",
                            text1: "Product successfuly updated",
                            text2: ""
                        });
                        setTimeout(() => {
                            navigation.navigate("Products");
                        }, 500)
                    }
                })
                .catch((error) => {
                    console.log(error)
                    Toast.show({
                        topOffset: 60,
                        type: "error",
                        text1: "Something went wrong",
                        text2: "Please try again"
                    });
                })
        } else {
            axios
                .post(`${baseURL}products`, formData, config)
                .then((res) => {
                    if (res.status == 200 || res.status == 201) {
                        Toast.show({
                            topOffset: 60,
                            type: "success",
                            text1: "New Product added",
                            text2: ""
                        });
                        setTimeout(() => {
                            navigation.navigate("Products");
                        }, 500)
                    }
                })
                .catch((error) => {
                    console.log(error)
                    Toast.show({
                        topOffset: 60,
                        type: "error",
                        text1: "Something went wrong",
                        text2: "Please try again"
                    });
                })
        }
    }

    return (
        <View style={[styles.container, dark ? styles.bgDark : styles.bgLight]}>
             <StatusBar barStyle={dark ? "light-content" : "dark-content"} />
             
             <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={dark ? "white" : "black"} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, dark ? styles.textWhite : styles.textDark]}>
                    {item ? "Edit Product" : "Add Product"}
                </Text>
             </View>

            <KeyboardAwareScrollView
                viewIsInsideTabBar={true}
                extraHeight={200}
                enableOnAndroid={true}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.imageContainer}>
                    <Image 
                        style={styles.image} 
                        source={{ uri: mainImage }} 
                        resizeMode="contain"
                    />
                    <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                        <Ionicons name="camera" color="white" size={24} />
                    </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, dark ? styles.textGray : styles.textGrayLight]}>Brand</Text>
                    <TextInput 
                        style={[styles.input, dark ? styles.inputDark : styles.inputLight]}
                        placeholder="Brand"
                        placeholderTextColor={dark ? "#6B7280" : "#9CA3AF"}
                        name="brand"
                        id="brand"
                        value={brand}
                        onChangeText={(text) => setBrand(text)}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, dark ? styles.textGray : styles.textGrayLight]}>Name</Text>
                    <TextInput 
                        style={[styles.input, dark ? styles.inputDark : styles.inputLight]}
                        placeholder="Name"
                        placeholderTextColor={dark ? "#6B7280" : "#9CA3AF"}
                        name="name"
                        id="name"
                        value={name}
                        onChangeText={(text) => setName(text)}
                    />
                </View>

                <View style={styles.row}>
                    <View style={[styles.formGroup, {flex: 1, marginRight: 10}]}>
                        <Text style={[styles.label, dark ? styles.textGray : styles.textGrayLight]}>Price</Text>
                        <TextInput 
                            style={[styles.input, dark ? styles.inputDark : styles.inputLight]}
                            placeholder="Price"
                            placeholderTextColor={dark ? "#6B7280" : "#9CA3AF"}
                            name="price"
                            id="price"
                            value={price}
                            keyboardType={"numeric"}
                            onChangeText={(text) => setPrice(text)}
                        />
                    </View>
                    <View style={[styles.formGroup, {flex: 1}]}>
                         <Text style={[styles.label, dark ? styles.textGray : styles.textGrayLight]}>Count in Stock</Text>
                        <TextInput 
                            style={[styles.input, dark ? styles.inputDark : styles.inputLight]}
                            placeholder="Stock"
                            placeholderTextColor={dark ? "#6B7280" : "#9CA3AF"}
                            name="stock"
                            id="stock"
                            value={countInStock}
                            keyboardType={"numeric"}
                            onChangeText={(text) => setCountInStock(text)}
                        />
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, dark ? styles.textGray : styles.textGrayLight]}>Description</Text>
                    <TextInput 
                        style={[styles.input, styles.textArea, dark ? styles.inputDark : styles.inputLight]}
                        placeholder="Description"
                        placeholderTextColor={dark ? "#6B7280" : "#9CA3AF"}
                        name="description"
                        id="description"
                        value={description}
                        onChangeText={(text) => setDescription(text)}
                        multiline={true}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, dark ? styles.textGray : styles.textGrayLight]}>Category</Text>
                    <View style={[styles.pickerContainer, dark ? styles.inputDark : styles.inputLight]}>
                        <Picker
                            mode="dropdown"
                            selectedValue={pickerValue}
                            style={{ color: dark ? "white" : "black" }}
                            dropdownIconColor={dark ? "white" : "black"}
                            onValueChange={(e) => {
                                setPickerValue(e);
                                setCategory(e);
                            }}
                        >
                            {categories.map((c) => {
                                return <Picker.Item key={c.id} label={c.name} value={c.id} />
                            })}
                        </Picker>
                    </View>
                </View>

                {error ? <Error message={error} /> : null}

                <TouchableOpacity 
                    style={[styles.confirmButton, {backgroundColor: '#10B981'}]} 
                    onPress={() => addProduct()}
                >
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>

            </KeyboardAwareScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    bgDark: {
        backgroundColor: "#111827",
    },
    bgLight: {
        backgroundColor: "#F3F4F6",
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingTop: 50,
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    imageContainer: {
        width: 150,
        height: 150,
        borderRadius: 75,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignSelf: 'center',
        marginBottom: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E5E7EB',
        position: 'relative',
        overflow: 'hidden'
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imagePicker: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#10B981',
        padding: 8,
        borderRadius: 20,
        zIndex: 10,
        width: 150,
        alignItems: 'center',
        opacity: 0.7
    },
    formGroup: {
        marginBottom: 15,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    label: {
        fontSize: 14,
        marginBottom: 5,
        fontWeight: '600',
    },
    input: {
        height: 50,
        borderRadius: 10,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    inputDark: {
        backgroundColor: "#1F2937",
        color: "white",
    },
    inputLight: {
        backgroundColor: "white",
        color: "#111827",
        borderWidth: 1,
        borderColor: "#E5E7EB"
    },
    textArea: {
        height: 100,
        paddingTop: 15,
        textAlignVertical: 'top'
    },
    pickerContainer: {
        borderRadius: 10,
        overflow: 'hidden',
    },
    confirmButton: {
        height: 50,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    confirmButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    textWhite: {
        color: "white",
    },
    textDark: {
        color: "#111827",
    },
    textGray: {
        color: "#9CA3AF",
    },
    textGrayLight: {
        color: "#4B5563",
    }
});

export default ProductForm;