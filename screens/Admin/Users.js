import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
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
import axios from "axios"
import baseURL from "../assets/common/baseurl";
import AsyncStorage from '@react-native-async-storage/async-storage'
import Toast from "react-native-toast-message"

var { height, width } = Dimensions.get("window")

const Users = (props) => {

    const [userList, setUserList] = useState([]);
    const [userFilter, setUserFilter] = useState([]);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState();
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [dark, setDark] = useState(true); // Default to dark mode for admin

    const searchUser = (text) => {
        setSearchQuery(text);
        if (text === "") {
            setUserFilter(userList)
        } else {
            setUserFilter(
                userList.filter((i) =>
                    i.name.toLowerCase().includes(text.toLowerCase()) ||
                    i.email.toLowerCase().includes(text.toLowerCase())
                )
            )
        }
    }

    const deleteUser = (id) => {
        axios
            .delete(`${baseURL}users/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                const users = userFilter.filter((item) => item.id !== id)
                setUserFilter(users)
                // Also update the main list so search works correctly after delete
                setUserList(userList.filter((item) => item.id !== id))
                Toast.show({
                    topOffset: 60,
                    type: "success",
                    text1: "User Deleted",
                    text2: ""
                });
            })
            .catch((error) => {
                console.log(error);
                Toast.show({
                    topOffset: 60,
                    type: "error",
                    text1: "Error",
                    text2: "Could not delete user"
                });
            });
    }

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => {
            axios
                .get(`${baseURL}users`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                .then((res) => {
                    setUserList(res.data);
                    setUserFilter(res.data);
                    setLoading(false);
                    setRefreshing(false);
                })
                .catch((error) => {
                    console.log(error);
                    setRefreshing(false);
                })
        }, 2000);
    }, [token]);

    useFocusEffect(
        useCallback(() => {
            AsyncStorage.getItem("jwt")
                .then((res) => {
                    setToken(res)
                    axios
                        .get(`${baseURL}users`, {
                            headers: { Authorization: `Bearer ${res}` }
                        })
                        .then((userRes) => {
                            setUserList(userRes.data);
                            setUserFilter(userRes.data);
                            setLoading(false);
                        })
                        .catch((error) => console.log(error))
                })
                .catch((error) => console.log(error))

            return () => {
                setUserList([]);
                setUserFilter([]);
                setLoading(true);
            }
        }, [])
    )

    const renderItem = ({ item }) => (
        <View style={[styles.item, dark ? styles.itemDark : styles.itemLight]}>
            <View style={styles.itemLeft}>
                <Image 
                    source={{ uri: item.image ? item.image : "https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
                    style={styles.avatar}
                />
                <View>
                    <Text style={[styles.itemName, dark ? styles.textWhite : styles.textDark]}>{item.name}</Text>
                    <Text style={[styles.itemEmail, dark ? styles.textGray : styles.textGrayLight]}>{item.email}</Text>
                    {item.isAdmin && (
                        <View style={styles.adminBadge}>
                            <Text style={styles.adminText}>Admin</Text>
                        </View>
                    )}
                </View>
            </View>
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteUser(item.id)}
            >
                <Ionicons name="trash-outline" size={24} color="#EF4444" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, dark ? styles.bgDark : styles.bgLight]}>
            <StatusBar barStyle={dark ? "light-content" : "dark-content"} />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => props.navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={dark ? "white" : "black"} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, dark ? styles.textWhite : styles.textDark]}>
                    Users
                </Text>
            </View>

            <View style={styles.searchContainer}>
                <Searchbar
                    placeholder="Search users..."
                    onChangeText={searchUser}
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
                <FlatList
                    data={userFilter}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, dark ? styles.textGray : styles.textGrayLight]}>No users found</Text>
                        </View>
                    }
                />
            )}
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
        flexDirection: "row",
        alignItems: "center",
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "bold",
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
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
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    spinner: {
        height: height / 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    item: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 15,
        marginBottom: 10,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    itemDark: {
        backgroundColor: "#1F2937",
    },
    itemLight: {
        backgroundColor: "white",
    },
    itemLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
        backgroundColor: "#E5E7EB",
    },
    itemName: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 2,
    },
    itemEmail: {
        fontSize: 12,
    },
    adminBadge: {
        backgroundColor: "#10B981",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: "flex-start",
        marginTop: 4,
    },
    adminText: {
        color: "white",
        fontSize: 10,
        fontWeight: "bold",
    },
    deleteButton: {
        padding: 10,
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
        color: "#6B7280",
    },
    emptyContainer: {
        alignItems: "center",
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
    }
});

export default Users;