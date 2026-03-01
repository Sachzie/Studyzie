import React, { useContext, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import baseURL from "../assets/common/baseurl";
import AuthGlobal from "../../backend/Context/Store/AuthGlobal";
import { logoutUser } from "../../backend/Context/Actions/Auth.actions";
import { Ionicons } from "@expo/vector-icons";

import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";

const UserProfile = () => {
    const context = useContext(AuthGlobal);
    const navigation = useNavigation();
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updatingAvatar, setUpdatingAvatar] = useState(false);

    useFocusEffect(
        useCallback(() => {
            let isMounted = true;

            const isAuthenticated = Boolean(context?.stateUser?.isAuthenticated);
            if (!isAuthenticated) {
                navigation.navigate("Login");
                return () => {
                    isMounted = false;
                };
            }

            const loadProfile = async () => {
                setLoading(true);
                try {
                    const token = await AsyncStorage.getItem("jwt");
                    // Check if we have user ID in context
                    const userId = context?.stateUser?.user?.userId || context?.stateUser?.user?.id || context?.stateUser?.user?.sub;
                    
                    if (!userId) {
                        // Fallback to context user if no ID (shouldn't happen if auth is correct)
                        if (isMounted) {
                            setUserProfile(context?.stateUser?.user);
                            setLoading(false);
                        }
                        return;
                    }

                    const response = await axios.get(`${baseURL}users/${userId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    if (isMounted) {
                        setUserProfile(response.data);
                    }
                } catch (error) {
                    console.error("Profile load error:", error);
                    if (isMounted) {
                        setUserProfile(context?.stateUser?.user);
                    }
                } finally {
                    if (isMounted) {
                        setLoading(false);
                    }
                }
            };

            loadProfile();

            return () => {
                isMounted = false;
            };
        }, [context?.stateUser?.isAuthenticated, context?.stateUser?.user])
    );

    const handleUpdateAvatar = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permission.status !== "granted") {
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions?.Images ?? 'Images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets?.[0]?.base64) {
            const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
            updateUserAvatar(base64Image);
        }
    };

    const updateUserAvatar = async (newImage) => {
        setUpdatingAvatar(true);
        try {
            const token = await AsyncStorage.getItem("jwt");
            const userId = userProfile?._id || userProfile?.id || context?.stateUser?.user?.userId;
            
            const response = await axios.put(`${baseURL}users/${userId}`, {
                ...userProfile,
                image: newImage
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 200) {
                setUserProfile(response.data);
                Toast.show({
                    topOffset: 60,
                    type: "success",
                    text1: "Profile Updated",
                    text2: "Your avatar has been updated successfully."
                });
            }
        } catch (error) {
            console.error("Update avatar error:", error);
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Update Failed",
                text2: "Could not update avatar. Please try again."
            });
        } finally {
            setUpdatingAvatar(false);
        }
    };

    const handleLogout = () => {
        AsyncStorage.removeItem("jwt");
        logoutUser(context.dispatch);
        navigation.navigate("Login");
    };

    if (loading) {
        return (
            <View style={[styles.screen, styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#103B28" />
            </View>
        );
    }

    const userName = userProfile?.name || "Studyzie User";
    const userEmail = userProfile?.email || "";
    const userPhone = userProfile?.phone || "";

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.profileCard}>
                <View style={styles.avatar}>
                {userProfile?.image ? (
                    <Image source={{ uri: userProfile.image }} style={styles.avatarImage} />
                ) : (
                    <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
                )}
                <TouchableOpacity style={styles.editIconContainer} onPress={handleUpdateAvatar} disabled={updatingAvatar}>
                    {updatingAvatar ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Ionicons name="camera" size={20} color="#FFFFFF" />
                    )}
                </TouchableOpacity>
            </View>
                <Text style={styles.name}>{userName}</Text>
                <Text style={styles.memberTag}>Studyzie Member</Text>
            </View>

            <View style={styles.detailsCard}>
                <View style={styles.cardHeader}>
                     <Ionicons name="person-circle-outline" size={24} color="#103B28" />
                     <Text style={styles.sectionTitle}>Account Details</Text>
                </View>
                
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email</Text>
                    <Text style={styles.detailValue}>{userEmail}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone</Text>
                    <Text style={styles.detailValue}>{userPhone}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>Active</Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color="#FFFFFF" style={{marginRight: 8}} />
                <Text style={styles.logoutButtonText}>Sign Out</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    loadingContainer: {
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        padding: 16,
        paddingBottom: 30,
    },
    profileCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        paddingVertical: 24,
        paddingHorizontal: 16,
        alignItems: "center",
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#103B28",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
        overflow: "hidden",
        position: 'relative',
        borderWidth: 3,
        borderColor: "#E5E7EB",
    },
    avatarImage: {
        width: "100%",
        height: "100%",
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        left: 0,
        height: 30,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: "#FFFFFF",
        fontSize: 32,
        fontWeight: "700",
    },
    name: {
        fontSize: 22,
        fontWeight: "700",
        color: "#111827",
    },
    memberTag: {
        marginTop: 4,
        fontSize: 14,
        color: "#10B981", // Green accent
        fontWeight: "600",
    },
    detailsCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#103B28",
    },
    detailRow: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    detailLabel: {
        fontSize: 12,
        color: "#6B7280",
        marginBottom: 4,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    detailValue: {
        fontSize: 16,
        color: "#1F2937",
        fontWeight: "500",
    },
    statusBadge: {
        backgroundColor: "#D1FAE5",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        alignSelf: "flex-start",
    },
    statusText: {
        color: "#065F46",
        fontSize: 12,
        fontWeight: "700",
    },
    logoutButton: {
        backgroundColor: "#EF4444", // Red for logout
        borderRadius: 12,
        height: 56,
        flexDirection: 'row',
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#EF4444",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    logoutButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
});

export default UserProfile;
