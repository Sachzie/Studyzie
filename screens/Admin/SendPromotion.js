import React, { useState, useCallback } from "react";
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
    Modal,
    Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import baseURL from "../assets/common/baseurl";
import Toast from "react-native-toast-message";
import { getToken } from "../../backend/Context/Store/tokenStorage";
import { useFocusEffect } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";

const SendPromotion = ({ navigation }) => {
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [discountCode, setDiscountCode] = useState("");
    const [discountAmount, setDiscountAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [startsAt, setStartsAt] = useState(null);
    const [endsAt, setEndsAt] = useState(null);
    const [maxRedemptions, setMaxRedemptions] = useState("");
    const [maxRedemptionsPerUser, setMaxRedemptionsPerUser] = useState("");
    const [activePromotion, setActivePromotion] = useState(null);
    const [endingPromo, setEndingPromo] = useState(false);
    const [activePicker, setActivePicker] = useState(null);
    const [tempDate, setTempDate] = useState(new Date());
    const placeholderTextColor = "#111827";

    const formatDate = (value) => {
        if (!value) return "";
        try {
            return new Date(value).toLocaleDateString("en-CA");
        } catch (error) {
            return "";
        }
    };

    const openDatePicker = (type) => {
        const current = type === "start" ? startsAt : endsAt;
        setTempDate(current ? new Date(current) : new Date());
        setActivePicker(type);
    };

    const applySelectedDate = (type, dateValue) => {
        if (!dateValue) return;

        if (type === "start") {
            setStartsAt(dateValue);
            if (endsAt && new Date(endsAt) < dateValue) {
                setEndsAt(null);
            }
            return;
        }

        if (startsAt && dateValue < new Date(startsAt)) {
            Toast.show({
                type: "error",
                text1: "Invalid date",
                text2: "End date cannot be before the start date.",
            });
            return;
        }
        setEndsAt(dateValue);
    };

    const loadActivePromotion = useCallback(async () => {
        try {
            const response = await axios.get(`${baseURL}promotions/active`);
            if (response?.data?.active) {
                setActivePromotion(response.data.promotion);
            } else {
                setActivePromotion(null);
            }
        } catch (error) {
            setActivePromotion(null);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadActivePromotion();
        }, [loadActivePromotion])
    );

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
                        startsAt: startsAt ? new Date(startsAt).toISOString() : "",
                        endsAt: endsAt ? new Date(endsAt).toISOString() : "",
                        maxRedemptions,
                        maxRedemptionsPerUser,
                        type: 'promotion'
                    }
                },
                config
            );

            if (response.data.success) {
                const push = response?.data?.push || {};
                const status = push?.status || "sent";
                const delivered = Number(push?.delivered || response?.data?.count || 0);
                const attempted = Number(push?.attempted || 0);
                const failed = Number(push?.failed || 0);
                const cleared = Number(push?.clearedInvalidTokens || 0);

                let toastType = "success";
                let toastText2 = `Promotion sent to ${delivered} devices!`;

                if (status === "partial") {
                    toastType = "info";
                    toastText2 = `Sent to ${delivered}/${attempted}. Failed: ${failed}.`;
                } else if (status === "failed") {
                    toastType = "info";
                    toastText2 = `Promotion saved, but push delivery failed for ${attempted} tokens.`;
                } else if (status === "no-valid-tokens") {
                    toastType = "info";
                    toastText2 = "Promotion saved. No valid push tokens are registered.";
                }

                if (cleared > 0) {
                    toastText2 += ` Cleared ${cleared} invalid token${cleared > 1 ? "s" : ""}.`;
                }

                Toast.show({
                    type: toastType,
                    text1: "Success",
                    text2: toastText2,
                });
                loadActivePromotion();
                navigation.goBack();
            }
        } catch (error) {
            console.log("Promotion broadcast failed:", error?.response?.data || error?.message || error);
            const backendMessage = error?.response?.data?.error || error?.response?.data?.message;
            Toast.show({
                type: "error",
                text1: "Error",
                text2: backendMessage || "Failed to send promotion",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEndPromotion = async () => {
        setEndingPromo(true);
        try {
            const token = await getToken();
            await axios.post(`${baseURL}promotions/deactivate`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            Toast.show({
                type: "success",
                text1: "Promotion Ended",
                text2: "Active promotion has been deactivated.",
            });
            setActivePromotion(null);
        } catch (error) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Could not end promotion.",
            });
        } finally {
            setEndingPromo(false);
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
                    {activePromotion ? (
                        <View style={styles.activePromoCard}>
                            <Text style={styles.activePromoTitle}>Active Promotion</Text>
                            <Text style={styles.activePromoText}>
                                {activePromotion.title} â€¢ {activePromotion.discountCode} ({activePromotion.discountAmount}%)
                            </Text>
                            {activePromotion.endsAt ? (
                                <Text style={styles.activePromoSub}>
                                    Ends: {new Date(activePromotion.endsAt).toLocaleDateString("en-US")}
                                </Text>
                            ) : null}
                            <TouchableOpacity
                                style={[styles.endPromoButton, endingPromo && styles.disabledButton]}
                                onPress={handleEndPromotion}
                                disabled={endingPromo}
                            >
                                {endingPromo ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.endPromoText}>End Promotion</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    ) : null}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Notification Title</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Flash Sale! ⚡"
                            placeholderTextColor={placeholderTextColor}
                            value={title}
                            onChangeText={setTitle}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Message Body</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Describe your promotion here..."
                            placeholderTextColor={placeholderTextColor}
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
                            placeholderTextColor={placeholderTextColor}
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
                            placeholderTextColor={placeholderTextColor}
                            keyboardType="numeric"
                            value={discountAmount}
                            onChangeText={setDiscountAmount}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Start Date (optional)</Text>
                        <TouchableOpacity
                            style={styles.dateField}
                            onPress={() => openDatePicker("start")}
                        >
                            <Text style={[styles.dateText, !startsAt && styles.datePlaceholder]}>
                                {startsAt ? formatDate(startsAt) : "Select start date"}
                            </Text>
                            <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>End Date (optional)</Text>
                        <TouchableOpacity
                            style={styles.dateField}
                            onPress={() => openDatePicker("end")}
                        >
                            <Text style={[styles.dateText, !endsAt && styles.datePlaceholder]}>
                                {endsAt ? formatDate(endsAt) : "Select end date"}
                            </Text>
                            <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Max Redemptions (optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 100"
                            placeholderTextColor={placeholderTextColor}
                            keyboardType="numeric"
                            value={maxRedemptions}
                            onChangeText={setMaxRedemptions}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Max Redemptions Per User (optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 1"
                            placeholderTextColor={placeholderTextColor}
                            keyboardType="numeric"
                            value={maxRedemptionsPerUser}
                            onChangeText={setMaxRedemptionsPerUser}
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
            {activePicker ? (
                Platform.OS === "ios" ? (
                    <Modal
                        transparent
                        animationType="fade"
                        visible
                        onRequestClose={() => setActivePicker(null)}
                    >
                        <Pressable style={styles.modalOverlay} onPress={() => setActivePicker(null)}>
                            <Pressable style={styles.modalCard} onPress={() => {}}>
                                <Text style={styles.modalTitle}>
                                    {activePicker === "start" ? "Select start date" : "Select end date"}
                                </Text>
                                <DateTimePicker
                                    value={tempDate}
                                    mode="date"
                                    display="spinner"
                                    onChange={(event, selectedDate) => {
                                        if (selectedDate) {
                                            setTempDate(selectedDate);
                                        }
                                    }}
                                />
                                <TouchableOpacity
                                    style={styles.modalButton}
                                    onPress={() => {
                                        applySelectedDate(activePicker, tempDate);
                                        setActivePicker(null);
                                    }}
                                >
                                    <Text style={styles.modalButtonText}>Done</Text>
                                </TouchableOpacity>
                            </Pressable>
                        </Pressable>
                    </Modal>
                ) : (
                    <DateTimePicker
                        value={tempDate}
                        mode="date"
                        display="calendar"
                        onChange={(event, selectedDate) => {
                            if (event?.type === "dismissed") {
                                setActivePicker(null);
                                return;
                            }
                            const nextDate = selectedDate || tempDate;
                            applySelectedDate(activePicker, nextDate);
                            setActivePicker(null);
                        }}
                    />
                )
            ) : null}
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
    activePromoCard: {
        backgroundColor: "#F0FDF4",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#86EFAC",
        padding: 16,
        marginBottom: 20,
    },
    activePromoTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#166534",
        marginBottom: 6,
    },
    activePromoText: {
        fontSize: 13,
        color: "#14532D",
        fontWeight: "600",
    },
    activePromoSub: {
        marginTop: 4,
        fontSize: 12,
        color: "#4D7C0F",
    },
    endPromoButton: {
        marginTop: 12,
        backgroundColor: "#DC2626",
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: "center",
    },
    endPromoText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 13,
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
    dateField: {
        backgroundColor: "#F3F4F6",
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    dateText: {
        fontSize: 15,
        color: "#111827",
        fontWeight: "600",
    },
    datePlaceholder: {
        color: "#111827",
        fontWeight: "500",
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
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalCard: {
        width: "100%",
        borderRadius: 16,
        backgroundColor: "#FFFFFF",
        padding: 20,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 12,
    },
    modalButton: {
        marginTop: 16,
        backgroundColor: "#103B28",
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: "center",
    },
    modalButtonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 14,
    },
});

export default SendPromotion;
