import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Switch,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";

import baseURL from "../assets/common/baseurl";
import Error from "../Shared/Error";

const UserForm = (props) => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const [password, setPassword] = useState("");
    const [item, setItem] = useState(null);
    const [token, setToken] = useState("");
    const [error, setError] = useState("");

    const navigation = useNavigation();

    useEffect(() => {
        const routeItem = props?.route?.params?.item;

        if (routeItem) {
            setItem(routeItem);
            setName(routeItem.name || "");
            setEmail(routeItem.email || "");
            setPhone(routeItem.phone || "");
            setIsAdmin(routeItem.isAdmin || false);
        }

        AsyncStorage.getItem("jwt")
            .then((res) => setToken(res || ""))
            .catch(() => setToken(""));

    }, [props?.route?.params?.item]);

    const saveUser = async () => {
        setError("");

        if (!name || !email) {
            setError("Please fill in the name and email.");
            return;
        }

        const config = {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        };

        const userData = {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            isAdmin: isAdmin,
        };

        if (password) {
            userData.password = password;
        }

        try {
            if (item) {
                await axios.put(`${baseURL}users/${item.id}`, userData, config);
                Toast.show({
                    topOffset: 60,
                    type: "success",
                    text1: "User updated",
                });
            } else {
                await axios.post(`${baseURL}users`, userData, config);
                Toast.show({
                    topOffset: 60,
                    type: "success",
                    text1: "User created",
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
                        <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {item ? "Manage User" : "Create User"}
                    </Text>
                </View>
                <Text style={styles.headerSubtitle}>
                    {item ? "Update user details" : "Add a new user"}
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

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#9CA3AF"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Phone</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Phone"
                            placeholderTextColor="#9CA3AF"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#9CA3AF"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <View style={styles.switchGroup}>
                        <Text style={styles.label}>Is Admin?</Text>
                        <Switch
                            value={isAdmin}
                            onValueChange={setIsAdmin}
                        />
                    </View>

                    {error ? <Error message={error} /> : null}

                    <TouchableOpacity style={styles.confirmButton} onPress={saveUser}>
                        <Text style={styles.confirmButtonText}>{item ? "Save Changes" : "Create User"}</Text>
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
        marginRight: 6,
    },
    backButtonText: {
        color: "#111827",
        fontSize: 16,
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
    formGroup: {
        marginBottom: 12,
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
    switchGroup: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
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

export default UserForm;