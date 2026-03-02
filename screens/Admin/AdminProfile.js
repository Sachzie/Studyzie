import React, { useCallback, useContext, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";

import AuthGlobal from "../../backend/Context/Store/AuthGlobal";
import baseURL from "../assets/common/baseurl";

const AdminProfile = ({ navigation }) => {
    const context = useContext(AuthGlobal);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updatingAvatar, setUpdatingAvatar] = useState(false);

    useFocusEffect(
        useCallback(() => {
            let isActive = true;

            const loadProfile = async () => {
                setLoading(true);
                try {
                    const token = await AsyncStorage.getItem("jwt");
                    const userId =
                        context?.stateUser?.user?.userId ||
                        context?.stateUser?.user?.id ||
                        context?.stateUser?.user?.sub;

                    if (!userId) {
                        if (isActive) setProfile(null);
                        return;
                    }

                    const response = await axios.get(`${baseURL}users/${userId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    if (isActive) {
                        setProfile(response.data);
                    }
                } catch (error) {
                    if (isActive) setProfile(null);
                } finally {
                    if (isActive) setLoading(false);
                }
            };

            loadProfile();

            return () => {
                isActive = false;
            };
        }, [context?.stateUser?.user?.id, context?.stateUser?.user?.sub, context?.stateUser?.user?.userId])
    );

    const updateAvatar = async (newImage) => {
        if (!profile) return;

        setUpdatingAvatar(true);
        try {
            const token = await AsyncStorage.getItem("jwt");
            const userId = profile.id || profile._id;

            const response = await axios.put(
                `${baseURL}users/${userId}`,
                {
                    ...profile,
                    image: newImage,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setProfile(response.data);
            Toast.show({
                topOffset: 60,
                type: "success",
                text1: "Avatar updated",
            });
        } catch (error) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Update failed",
                text2: "Please try again.",
            });
        } finally {
            setUpdatingAvatar(false);
        }
    };

    const pickAvatar = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permission.status !== "granted") {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Permission needed",
                text2: "Allow photo access to update avatar.",
            });
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets?.[0]?.base64) {
            const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
            updateAvatar(base64Image);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#111827" />
            </View>
        );
    }

    const name = profile?.name || "Admin";
    const email = profile?.email || "No email";
    const phone = profile?.phone || "No phone";

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back-outline" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Admin Profile</Text>
                <View style={styles.backButton} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.profileCard}>
                    <View style={styles.avatarWrap}>
                        {profile?.image ? (
                            <Image source={{ uri: profile.image }} style={styles.avatarImage} />
                        ) : (
                            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
                        )}
                    </View>
                    <TouchableOpacity
                        style={styles.avatarButton}
                        onPress={pickAvatar}
                        disabled={updatingAvatar}
                    >
                        {updatingAvatar ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <Ionicons name="camera-outline" size={16} color="#FFFFFF" />
                                <Text style={styles.avatarButtonText}>Update Avatar</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.name}>{name}</Text>
                    <Text style={styles.roleBadge}>Administrator</Text>
                </View>

                <View style={styles.detailsCard}>
                    <Text style={styles.detailsTitle}>Account Information</Text>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Email</Text>
                        <Text style={styles.detailValue}>{email}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Phone</Text>
                        <Text style={styles.detailValue}>{phone}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Role</Text>
                        <Text style={styles.detailValue}>Admin</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F3F4F6",
    },
    center: {
        alignItems: "center",
        justifyContent: "center",
    },
    header: {
        paddingTop: 52,
        paddingHorizontal: 20,
        paddingBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    backButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        color: "#111827",
        fontSize: 24,
        fontWeight: "700",
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    profileCard: {
        marginTop: 10,
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        paddingVertical: 22,
        paddingHorizontal: 16,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    avatarWrap: {
        width: 104,
        height: 104,
        borderRadius: 52,
        overflow: "hidden",
        backgroundColor: "#111827",
        alignItems: "center",
        justifyContent: "center",
    },
    avatarImage: {
        width: "100%",
        height: "100%",
    },
    avatarText: {
        color: "#FFFFFF",
        fontSize: 36,
        fontWeight: "700",
    },
    avatarButton: {
        marginTop: 12,
        borderRadius: 999,
        backgroundColor: "#111827",
        paddingVertical: 8,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
    },
    avatarButtonText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "700",
        marginLeft: 6,
    },
    name: {
        marginTop: 14,
        color: "#111827",
        fontSize: 20,
        fontWeight: "700",
    },
    roleBadge: {
        marginTop: 4,
        color: "#6B7280",
        fontSize: 13,
        fontWeight: "600",
    },
    detailsCard: {
        marginTop: 14,
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    detailsTitle: {
        color: "#111827",
        fontSize: 17,
        fontWeight: "700",
        marginBottom: 8,
    },
    detailRow: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    detailLabel: {
        fontSize: 12,
        color: "#6B7280",
        marginBottom: 3,
    },
    detailValue: {
        fontSize: 15,
        color: "#111827",
        fontWeight: "600",
    },
});

export default AdminProfile;
