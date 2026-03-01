import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    ActivityIndicator,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    StatusBar,
    Image
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native"
import { Searchbar } from 'react-native-paper';
import { SwipeListView } from 'react-native-swipe-list-view';

import axios from "axios"
import baseURL from "../../assets/common/baseurl";
import AsyncStorage from '@react-native-async-storage/async-storage'

import { useNavigation } from "@react-navigation/native"
import Toast from "react-native-toast-message"

import ListItem from "./ListItem"

var { height, width } = Dimensions.get("window")

const Products = (props) => {

    const [productList, setProductList] = useState([]);
    const [productFilter, setProductFilter] = useState([]);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState();
    const navigation = useNavigation()
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [dark, setDark] = useState(true); // Default to dark mode for admin

    const searchProduct = (text) => {
        setSearchQuery(text);
        if (text === "") {
            setProductFilter(productList)
        } else {
            setProductFilter(
                productList.filter((i) =>
                    i.name.toLowerCase().includes(text.toLowerCase())
                )
            )
        }
    }

    const deleteProduct = (id) => {
        axios
            .delete(`${baseURL}products/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                const products = productFilter.filter((item) => item.id !== id)
                setProductFilter(products)
                Toast.show({
                    topOffset: 60,
                    type: "success",
                    text1: "Product Deleted",
                    text2: ""
                });
            })
            .catch((error) => console.log(error));
    }

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => {
            axios
                .get(`${baseURL}products`)
                .then((res) => {
                    setProductList(res.data);
                    setProductFilter(res.data);
                    setLoading(false);
                    setRefreshing(false);
                })
        }, 2000);
    }, []);

    useFocusEffect(
        useCallback(() => {
            AsyncStorage.getItem("jwt")
                .then((res) => {
                    setToken(res)
                })
                .catch((error) => console.log(error))

            axios
                .get(`${baseURL}products`)
                .then((res) => {
                    setProductList(res.data);
                    setProductFilter(res.data);
                    setLoading(false);
                })

            return () => {
                setProductList([]);
                setProductFilter([]);
                setLoading(true);
            }
        }, [])
    )

    const renderHiddenItem = (data) => (
        <View style={styles.hiddenContainer}>
            <TouchableOpacity 
                style={[styles.hiddenButton, styles.editButton]}
                onPress={() => navigation.navigate("ProductForm", { item: data.item })}
            >
                <Ionicons name="create-outline" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.hiddenButton, styles.deleteButton]}
                onPress={() => deleteProduct(data.item.id)}
            >
                <Ionicons name="trash-outline" size={24} color="white" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, dark ? styles.bgDark : styles.bgLight]}>
            <StatusBar barStyle={dark ? "light-content" : "dark-content"} />
            
            <View style={styles.header}>
                <Text style={[styles.headerTitle, dark ? styles.textWhite : styles.textDark]}>
                    Products
                </Text>
                <Searchbar
                    placeholder="Search products..."
                    onChangeText={searchProduct}
                    value={searchQuery}
                    style={[styles.searchBar, dark ? styles.searchBarDark : styles.searchBarLight]}
                    inputStyle={dark ? styles.textWhite : styles.textDark}
                    iconColor={dark ? "#9CA3AF" : "#6B7280"}
                    placeholderTextColor={dark ? "#9CA3AF" : "#6B7280"}
                />
            </View>

            {loading ? (
                <View style={styles.spinner}>
                    <ActivityIndicator size="large" color="#10B981" />
                </View>
            ) : (
                <SwipeListView
                    data={productFilter}
                    renderItem={({ item, index }) => (
                        <ListItem 
                            item={item} 
                            index={index} 
                            dark={dark}
                        />
                    )}
                    renderHiddenItem={renderHiddenItem}
                    disableRightSwipe={true}
                    leftOpenValue={75}
                    rightOpenValue={-150}
                    previewRowKey={'0'}
                    previewOpenValue={-40}
                    previewOpenDelay={3000}
                    keyExtractor={(item) => item.id}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    contentContainerStyle={styles.listContainer}
                />
            )}

            <TouchableOpacity 
                style={styles.fab}
                onPress={() => navigation.navigate("ProductForm")}
            >
                <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>
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
        padding: 20,
        paddingTop: 50,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 15,
    },
    searchBar: {
        elevation: 0,
        borderRadius: 10,
        height: 50,
    },
    searchBarDark: {
        backgroundColor: "#1F2937",
    },
    searchBarLight: {
        backgroundColor: "white",
    },
    listContainer: {
        paddingBottom: 100,
    },
    spinner: {
        height: height / 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textWhite: {
        color: "white",
    },
    textDark: {
        color: "#111827",
    },
    hiddenContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        backgroundColor: '#111827',
        height: '100%', // Match item height
        paddingRight: 15,
    },
    hiddenButton: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 50,
        height: 50,
        borderRadius: 25,
        marginLeft: 10,
    },
    editButton: {
        backgroundColor: '#3B82F6',
    },
    deleteButton: {
        backgroundColor: '#EF4444',
    },
    fab: {
        position: "absolute",
        bottom: 30,
        right: 30,
        backgroundColor: "#10B981",
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    }
});

export default Products;