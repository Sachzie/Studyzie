import React, { useEffect, useState } from "react"
import {
    View,
    Text,
    FlatList,
    Dimensions,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    KeyboardAvoidingView,
    Platform
} from "react-native"
import baseURL from "../../assets/common/baseurl";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Ionicons } from "@expo/vector-icons";

var { width } = Dimensions.get("window")

const Item = (props) => {
    const { item, index, delete: deleteCategory, dark } = props;
    return (
        <View style={[styles.item, dark ? styles.itemDark : styles.itemLight]}>
            <Text style={[styles.itemText, dark ? styles.textWhite : styles.textDark]}>{item.name}</Text>
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteCategory(item.id)}
            >
                <Ionicons name="trash" size={20} color="white" />
            </TouchableOpacity>
        </View>
    )
}

const Categories = (props) => {

    const [categories, setCategories] = useState([]);
    const [categoryName, setCategoryName] = useState("");
    const [token, setToken] = useState();
    const [dark, setDark] = useState(true); // Default to dark mode for admin

    useEffect(() => {
        AsyncStorage.getItem("jwt")
            .then((res) => {
                setToken(res);
            })
            .catch((error) => console.log(error));

        axios
            .get(`${baseURL}categories`)
            .then((res) => setCategories(res.data))
            .catch((error) => alert("Error loading categories"))

        return () => {
            setCategories([]);
            setToken();
        }
    }, [])

    const addCategory = () => {
        if (!categoryName) return;
        
        const category = {
            name: categoryName
        };

        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
            }
        };

        axios
            .post(`${baseURL}categories`, category, config)
            .then((res) => {
                setCategories([...categories, res.data]);
                setCategoryName("");
            })
            .catch((error) => alert("Error adding category"));
    }

    const deleteCategory = (id) => {
        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
            }
        };

        axios
            .delete(`${baseURL}categories/${id}`, config)
            .then((res) => {
                const newCategories = categories.filter((item) => item.id !== id);
                setCategories(newCategories);
            })
            .catch((error) => alert("Error deleting category"));
    }

    return (
        <View style={[styles.container, dark ? styles.bgDark : styles.bgLight]}>
            <StatusBar barStyle={dark ? "light-content" : "dark-content"} />
            
            <View style={styles.header}>
                <Text style={[styles.headerTitle, dark ? styles.textWhite : styles.textDark]}>
                    Categories
                </Text>
            </View>

            <View style={styles.listContainer}>
                <FlatList
                    data={categories}
                    renderItem={({ item, index }) => (
                        <Item item={item} index={index} delete={deleteCategory} dark={dark} />
                    )}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.bottomBarWrapper}
            >
                <View style={[styles.bottomBar, dark ? styles.bottomBarDark : styles.bottomBarLight]}>
                    <View style={styles.inputContainer}>
                        <TextInput
                            value={categoryName}
                            style={[styles.input, dark ? styles.inputDark : styles.inputLight]}
                            onChangeText={(text) => setCategoryName(text)}
                            placeholder="Add Category"
                            placeholderTextColor={dark ? "#9CA3AF" : "#6B7280"}
                        />
                    </View>
                    <TouchableOpacity onPress={() => addCategory()} style={styles.addButton}>
                        <Ionicons name="add" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    )
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
        padding: 20,
        paddingTop: 50,
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "bold",
    },
    listContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    bottomBarWrapper: {
        width: width,
    },
    bottomBar: {
        padding: 15,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    bottomBarDark: {
        backgroundColor: "#1F2937",
    },
    bottomBarLight: {
        backgroundColor: "white",
    },
    inputContainer: {
        flex: 1,
        marginRight: 15,
    },
    input: {
        height: 50,
        borderRadius: 25,
        paddingHorizontal: 20,
        borderWidth: 1,
    },
    inputDark: {
        backgroundColor: "#374151",
        borderColor: "#4B5563",
        color: "white",
    },
    inputLight: {
        backgroundColor: "#F9FAFB",
        borderColor: "#E5E7EB",
        color: "#111827",
    },
    addButton: {
        backgroundColor: "#10B981",
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: "center",
        justifyContent: "center",
        elevation: 4,
        shadowColor: "#10B981",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    item: {
        padding: 20,
        marginVertical: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderRadius: 15,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    itemDark: {
        backgroundColor: "#1F2937",
    },
    itemLight: {
        backgroundColor: "white",
    },
    itemText: {
        fontSize: 16,
        fontWeight: "600",
    },
    deleteButton: {
        backgroundColor: "#EF4444",
        padding: 10,
        borderRadius: 10,
    },
    textWhite: {
        color: "white",
    },
    textDark: {
        color: "#111827",
    }
})

export default Categories;