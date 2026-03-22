import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import baseURL from "../assets/common/baseurl";
import Toast from "react-native-toast-message";
import { getToken } from "../../backend/Context/Store/tokenStorage";

const SendPromotion = ({ navigation }) => {
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [discountCode, setDiscountCode] = useState("");
    const [discountAmount, setDiscountAmount] = useState("");
    const [loading, setLoading] = useState(false);

    const handleBroadcast = async () => {
        if (!title || !message) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Please fill in title and message",
            });
            return;
        }

        setLoading(true);
        try {
            const token = await getToken();
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };

            const response = await axios.post(
                `${baseURL}users/broadcast-promotion`,
                {
                    title,
                    message,
                    promotionData: {
                        discountCode,
                        discountAmount,
                        type: 'promotion'
                    }
                },
                config
            );

            if (response.data.success) {
                Toast.show({
                    type: "success",
                    text1: "Success",
                    text2: `Promotion sent to ${response.data.count} devices!`,
                });
                navigation.goBack();
            }
        } catch (error) {
            console.log(error);
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to send promotion",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Ionicons name="megaphone-outline" size={48} color="#103B28" />
                    <Text style={styles.title}>Send Promotion</Text>
                    <Text style={styles.subtitle}>Broadcast a discount or product update to all users via push notification.</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Notification Title</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Flash Sale! ⚡"
                            value={title}
                            onChangeText={setTitle}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Message Body</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Describe your promotion here..."
                            multiline
                            numberOfLines={4}
                            value={message}
                            onChangeText={setMessage}
                        />
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>Optional Promotion Details</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Discount Code</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. STUDY20"
                            value={discountCode}
                            onChangeText={setDiscountCode}
                            autoCapitalize="characters"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Discount Amount (%)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 20"
                            keyboardType="numeric"
                            value={discountAmount}
                            onChangeText={setDiscountAmount}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.disabledButton]}
                        onPress={handleBroadcast}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Ionicons name="send" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                                <Text style={styles.buttonText}>Broadcast to All Users</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    scrollContent: {
        padding: 24,
    },
    header: {
        alignItems: "center",
        marginBottom: 32,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#111827",
        marginTop: 16,
    },
    subtitle: {
        fontSize: 14,
        color: "#6B7280",
        textAlign: "center",
        marginTop: 8,
        lineHeight: 20,
    },
    form: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
    },
    input: {
        backgroundColor: "#F3F4F6",
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        color: "#111827",
    },
    textArea: {
        height: 100,
        textAlignVertical: "top",
    },
    divider: {
        height: 1,
        backgroundColor: "#E5E7EB",
        marginVertical: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 16,
    },
    button: {
        backgroundColor: "#103B28",
        borderRadius: 12,
        height: 56,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 12,
    },
    buttonIcon: {
        marginRight: 10,
    },
    buttonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    disabledButton: {
        opacity: 0.7,
    },
});

export default SendPromotion;
