import React, { useContext, useState, useCallback, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Alert, Platform, TextInput } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import axios from "axios";
import baseURL from "../assets/common/baseurl";
import AuthGlobal from "../../backend/Context/Store/AuthGlobal";
import { logoutUser } from "../../backend/Context/Actions/Auth.actions";
import { Ionicons } from "@expo/vector-icons";
import { getToken } from "../../backend/Context/Store/tokenStorage";

import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import mime from "mime";

const isLocalUri = (value) => /^(file|content|ph):\/\//i.test(value || "");

const normalizeLocalUri = (uri) => {
    if (!uri) return "";
    if (!uri.startsWith("file:")) return uri;
    if (uri.startsWith("file:///")) return uri;
    return `file:///${uri.replace(/^file:\/*/, "")}`;
};

const UserProfile = () => {
    const context = useContext(AuthGlobal);
    const navigation = useNavigation();
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updatingAvatar, setUpdatingAvatar] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [form, setForm] = useState({
        name: "",
        phone: "",
        street: "",
        apartment: "",
        city: "",
        zip: "",
        country: "",
    });

    useEffect(() => {
        if (userProfile) {
            setForm({
                name: userProfile?.name || "",
                phone: userProfile?.phone || "",
                street: userProfile?.street || "",
                apartment: userProfile?.apartment || "",
                city: userProfile?.city || "",
                zip: userProfile?.zip || "",
                country: userProfile?.country || "",
            });
        }
    }, [userProfile]);

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
                    const token = await getToken();
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

    const openImageLibrary = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permission.status !== "granted") {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Permission required",
                text2: "Please allow media access to upload a photo.",
            });
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions?.Images ?? 'Images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.6,
        });

        if (!result.canceled && result.assets?.[0]?.uri) {
            updateUserAvatar(result.assets[0].uri);
        }
    };

    const openCamera = async () => {
        if (Platform.OS === "web") {
            Toast.show({
                topOffset: 60,
                type: "info",
                text1: "Camera not available",
                text2: "Use a mobile device to take a photo.",
            });
            return;
        }

        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (permission.status !== "granted") {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Permission required",
                text2: "Please allow camera access to take a photo.",
            });
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions?.Images ?? 'Images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.6,
        });

        if (!result.canceled && result.assets?.[0]?.uri) {
            updateUserAvatar(result.assets[0].uri);
        }
    };

    const handleUpdateAvatar = () => {
        Alert.alert(
            "Update Photo",
            "Choose a photo source",
            [
                { text: "Upload Photo", onPress: openImageLibrary },
                { text: "Use Camera", onPress: openCamera },
                { text: "Cancel", style: "cancel" },
            ]
        );
    };

    const updateUserAvatar = async (newImageUri) => {
        if (!newImageUri || !isLocalUri(newImageUri)) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Invalid image",
                text2: "Please select a valid photo.",
            });
            return;
        }

        setUpdatingAvatar(true);
        try {
            const token = await getToken();
            const userId = userProfile?._id || userProfile?.id || context?.stateUser?.user?.userId;
            if (!userId) {
                Toast.show({
                    topOffset: 60,
                    type: "error",
                    text1: "Update Failed",
                    text2: "User profile not found.",
                });
                return;
            }

            const payload = new FormData();
            const safeUri = normalizeLocalUri(newImageUri);
            payload.append("image", {
                uri: safeUri,
                type: mime.getType(safeUri) || "image/jpeg",
                name: safeUri.split("/").pop() || `avatar-${Date.now()}.jpg`,
            });

            payload.append("name", userProfile?.name || "");
            payload.append("email", userProfile?.email || "");
            payload.append("phone", userProfile?.phone || "");
            payload.append("isAdmin", String(Boolean(userProfile?.isAdmin)));
            payload.append("street", userProfile?.street || "");
            payload.append("apartment", userProfile?.apartment || "");
            payload.append("zip", userProfile?.zip || "");
            payload.append("city", userProfile?.city || "");
            payload.append("country", userProfile?.country || "");

            const response = await axios.put(`${baseURL}users/${userId}`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                }
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

    const handleLogout = async () => {
        const userId = context.stateUser.user.userId || context.stateUser.user.id || context.stateUser.user.sub;
        try {
            await logoutUser(context.dispatch, userId);
            navigation.navigate("Login");
        } catch (error) {
            console.log("Logout failed:", error.message);
        }
    };

    const updateField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleSaveProfile = async () => {
        if (!form.name.trim() || !form.phone.trim()) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Missing Information",
                text2: "Please enter your name and phone number.",
            });
            return;
        }

        setSavingProfile(true);
        try {
            const token = await getToken();
            const userId = userProfile?._id || userProfile?.id || context?.stateUser?.user?.userId;
            if (!userId) {
                Toast.show({
                    topOffset: 60,
                    type: "error",
                    text1: "Update Failed",
                    text2: "User profile not found.",
                });
                return;
            }

            const payload = new FormData();
            payload.append("name", form.name.trim());
            payload.append("email", userProfile?.email || "");
            payload.append("phone", form.phone.trim());
            payload.append("isAdmin", String(Boolean(userProfile?.isAdmin)));
            payload.append("street", form.street.trim());
            payload.append("apartment", form.apartment.trim());
            payload.append("zip", form.zip.trim());
            payload.append("city", form.city.trim());
            payload.append("country", form.country.trim());

            const response = await axios.put(`${baseURL}users/${userId}`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                }
            });

            if (response.status === 200) {
                setUserProfile(response.data);
                Toast.show({
                    topOffset: 60,
                    type: "success",
                    text1: "Profile Updated",
                    text2: "Your profile information was saved.",
                });
            }
        } catch (error) {
            console.error("Update profile error:", error);
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Update Failed",
                text2: "Could not save profile changes.",
            });
        } finally {
            setSavingProfile(false);
        }
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

                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                    style={styles.input}
                    value={form.name}
                    onChangeText={(value) => updateField("name", value)}
                    placeholder="Enter your name"
                />

                <Text style={styles.inputLabel}>Email (read-only)</Text>
                <View style={styles.readOnlyField}>
                    <Text style={styles.readOnlyText}>{userEmail}</Text>
                </View>

                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                    style={styles.input}
                    value={form.phone}
                    onChangeText={(value) => updateField("phone", value)}
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                />

                <Text style={styles.inputLabel}>Street</Text>
                <TextInput
                    style={styles.input}
                    value={form.street}
                    onChangeText={(value) => updateField("street", value)}
                    placeholder="Street address"
                />

                <Text style={styles.inputLabel}>Apartment / Unit</Text>
                <TextInput
                    style={styles.input}
                    value={form.apartment}
                    onChangeText={(value) => updateField("apartment", value)}
                    placeholder="Apartment, suite, etc."
                />

                <Text style={styles.inputLabel}>City</Text>
                <TextInput
                    style={styles.input}
                    value={form.city}
                    onChangeText={(value) => updateField("city", value)}
                    placeholder="City"
                />

                <Text style={styles.inputLabel}>Zip Code</Text>
                <TextInput
                    style={styles.input}
                    value={form.zip}
                    onChangeText={(value) => updateField("zip", value)}
                    placeholder="Zip code"
                    keyboardType="numeric"
                />

                <Text style={styles.inputLabel}>Country</Text>
                <TextInput
                    style={styles.input}
                    value={form.country}
                    onChangeText={(value) => updateField("country", value)}
                    placeholder="Country"
                />

                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>Active</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, savingProfile && styles.disabledButton]}
                    onPress={handleSaveProfile}
                    disabled={savingProfile}
                >
                    {savingProfile ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <>
                            <Ionicons name="save-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        </>
                    )}
                </TouchableOpacity>
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
        paddingBottom: 140,
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
    inputLabel: {
        fontSize: 12,
        color: "#6B7280",
        marginTop: 12,
        marginBottom: 6,
        textTransform: "uppercase",
        letterSpacing: 0.4,
        fontWeight: "600",
    },
    input: {
        backgroundColor: "#F9FAFB",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: "#111827",
    },
    readOnlyField: {
        backgroundColor: "#F3F4F6",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    readOnlyText: {
        color: "#6B7280",
        fontSize: 14,
        fontWeight: "600",
    },
    saveButton: {
        marginTop: 18,
        backgroundColor: "#103B28",
        borderRadius: 12,
        height: 50,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    saveButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "700",
    },
    disabledButton: {
        opacity: 0.7,
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
        marginBottom: 10,
    },
    logoutButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
});

export default UserProfile;
