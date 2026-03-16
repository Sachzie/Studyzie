import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Searchbar } from "react-native-paper";
import axios from "axios";
import Toast from "react-native-toast-message";
import { useDispatch, useSelector } from "react-redux";

import baseURL from "../assets/common/baseurl";
import { fetchUsers } from "../../backend/Redux/Actions/userActions";
import { getToken } from "../../backend/Context/Store/tokenStorage";

const FALLBACK_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const normalizeImageUri = (uri) => {
    if (!uri) return FALLBACK_AVATAR;
    if (uri.startsWith("http://")) return uri.replace("http://", "https://");
    return uri;
};

const Users = ({ navigation }) => {
    const dispatch = useDispatch();
    const usersState = useSelector((state) => state.users);
    const { list: userList, loading } = usersState;
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [token, setToken] = useState("");

    useFocusEffect(
        useCallback(() => {
            let isActive = true;

            const init = async () => {
                try {
                    const jwt = await getToken();
                    if (!isActive) return;
                    setToken(jwt || "");
                    if (jwt) {
                        if (!userList.length && !loading) {
                            dispatch(fetchUsers(jwt));
                        }
                    } else {
                        setRefreshing(false);
                    }
                } catch (error) {
                    if (isActive) {
                        setToken("");
                        setRefreshing(false);
                    }
                }
            };

            init();

            return () => {
                isActive = false;
                setSearchQuery("");
            };
        }, [dispatch, loading, userList.length])
    );

    const searchUser = (text) => {
        setSearchQuery(text);
    };

    const deleteUser = async (id) => {
        try {
            await axios.delete(`${baseURL}users/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (token) {
                dispatch(fetchUsers(token));
            }

            Toast.show({
                topOffset: 60,
                type: "success",
                text1: "User deleted",
            });
        } catch (error) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Delete failed",
                text2: "Could not delete user.",
            });
        }
    };

    const totalUsers = useMemo(() => userList.length, [userList.length]);
    const isLoading = loading && userList.length === 0;
    const userFilter = useMemo(() => {
        if (!searchQuery.trim()) return userList;
        const q = searchQuery.toLowerCase();
        return userList.filter((user) => {
            const byName = user?.name?.toLowerCase().includes(q);
            const byEmail = user?.email?.toLowerCase().includes(q);
            return byName || byEmail;
        });
    }, [searchQuery, userList]);

    useEffect(() => {
        if (!loading) {
            setRefreshing(false);
        }
    }, [loading]);

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardLeft}>
                <Image source={{ uri: normalizeImageUri(item?.image) }} style={styles.avatar} />
                <View style={styles.textWrap}>
                    <Text style={styles.userName} numberOfLines={1}>
                        {item?.name || "Unnamed User"}
                    </Text>
                    <Text style={styles.userEmail} numberOfLines={1}>
                        {item?.email || "No email"}
                    </Text>
                    {item?.isAdmin ? (
                        <View style={styles.adminBadge}>
                            <Text style={styles.adminBadgeText}>Admin</Text>
                        </View>
                    ) : null}
                </View>
            </View>
            <View style={styles.buttonGroup}>
                <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate("UserForm", { item })}>
                    <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => deleteUser(item.id)}>
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
                    <Text style={styles.headerTitle}>Manage Users</Text>
                </View>
                <Text style={styles.headerSubtitle}>{totalUsers} users registered</Text>
            </View>

            <View style={styles.searchWrap}>
                <Searchbar
                    placeholder="Search users..."
                    onChangeText={searchUser}
                    value={searchQuery}
                    style={styles.searchBar}
                    inputStyle={styles.searchInput}
                    iconColor="#6B7280"
                    placeholderTextColor="#9CA3AF"
                />
            </View>

            {isLoading ? (
                <View style={styles.loaderWrap}>
                    <ActivityIndicator size="large" color="#111827" />
                </View>
            ) : (
                <FlatList
                    data={userFilter}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    refreshing={refreshing}
                    onRefresh={() => {
                        setRefreshing(true);
                        if (token) {
                            dispatch(fetchUsers(token));
                        } else {
                            setRefreshing(false);
                        }
                    }}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <Ionicons name="people-outline" size={32} color="#9CA3AF" />
                            <Text style={styles.emptyText}>No users found</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("UserForm")}>
                <Ionicons name="add" size={30} color="#FFFFFF" />
            </TouchableOpacity>
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
    searchWrap: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    searchBar: {
        elevation: 0,
        borderRadius: 12,
        height: 48,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    searchInput: {
        color: "#111827",
        fontSize: 14,
    },
    loaderWrap: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 26,
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
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#E5E7EB",
        marginRight: 10,
    },
    textWrap: {
        flex: 1,
    },
    userName: {
        fontSize: 15,
        color: "#111827",
        fontWeight: "700",
    },
    userEmail: {
        marginTop: 2,
        fontSize: 12,
        color: "#6B7280",
    },
    adminBadge: {
        marginTop: 6,
        backgroundColor: "#111827",
        alignSelf: "flex-start",
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    adminBadgeText: {
        color: "#FFFFFF",
        fontSize: 10,
        fontWeight: "700",
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
});

export default Users;
