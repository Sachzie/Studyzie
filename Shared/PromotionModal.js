import React from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const PromotionModal = ({ visible, promotion, onClose, onView }) => {
    if (!promotion) return null;

    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
            <View style={styles.backdrop}>
                <View style={styles.card}>
                    <View style={styles.header}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="notifications" size={20} color="#FFFFFF" />
                        </View>
                        <Text style={styles.headerText}>Promotion Alert</Text>
                    </View>

                    {promotion.image ? (
                        <Image source={{ uri: promotion.image }} style={styles.hero} resizeMode="cover" />
                    ) : null}

                    <Text style={styles.title}>{promotion.title || "Special Offer"}</Text>
                    <Text style={styles.subtitle}>{promotion.subtitle || "Limited-time discount just for you."}</Text>

                    <View style={styles.codeBlock}>
                        <Text style={styles.codeLabel}>USE CODE</Text>
                        <Text style={styles.codeText}>{promotion.discountCode || "STUDY20"}</Text>
                    </View>

                    <Text style={styles.description}>
                        {promotion.description ||
                            `Enjoy ${promotion.discountAmount || 20}% off on selected school supplies.`}
                    </Text>

                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
                            <Text style={styles.secondaryText}>Maybe Later</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.primaryButton} onPress={onView}>
                            <Text style={styles.primaryText}>View Details</Text>
                            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(17, 24, 39, 0.6)",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    card: {
        width: "100%",
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        padding: 18,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 6,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    iconCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: "#103B28",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },
    headerText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#111827",
        letterSpacing: 0.4,
    },
    hero: {
        width: "100%",
        height: 140,
        borderRadius: 16,
        marginBottom: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: "800",
        color: "#0F172A",
    },
    subtitle: {
        marginTop: 4,
        fontSize: 13,
        color: "#6B7280",
    },
    codeBlock: {
        marginTop: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#D1D5DB",
        paddingVertical: 10,
        alignItems: "center",
        backgroundColor: "#F9FAFB",
    },
    codeLabel: {
        fontSize: 11,
        color: "#9CA3AF",
        fontWeight: "700",
        letterSpacing: 0.6,
    },
    codeText: {
        marginTop: 4,
        fontSize: 20,
        fontWeight: "800",
        color: "#103B28",
        letterSpacing: 1.2,
    },
    description: {
        marginTop: 12,
        fontSize: 12,
        color: "#4B5563",
        lineHeight: 18,
    },
    actions: {
        marginTop: 18,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    secondaryButton: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: "#F3F4F6",
    },
    secondaryText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#6B7280",
    },
    primaryButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: "#103B28",
        gap: 6,
    },
    primaryText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#FFFFFF",
    },
});

export default PromotionModal;
