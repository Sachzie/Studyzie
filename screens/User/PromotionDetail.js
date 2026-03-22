import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import axios from "axios";
import baseURL from "../assets/common/baseurl";

const { width } = Dimensions.get("window");

const PromotionDetail = ({ route, navigation }) => {
    const { promotion: routePromotion } = route.params || {};
    const [promotion, setPromotion] = useState(routePromotion || null);
    const hasPromotion = Boolean(promotion?.discountCode && promotion?.discountAmount);

    useEffect(() => {
        let isMounted = true;

        if (routePromotion) {
            setPromotion(routePromotion);
            return () => {
                isMounted = false;
            };
        }

        const fetchActivePromotion = async () => {
            try {
                const response = await axios.get(`${baseURL}promotions/active`);
                if (!isMounted) return;
                if (response?.data?.active) {
                    setPromotion(response.data.promotion);
                }
            } catch (error) {
                // ignore fetch errors
            }
        };

        fetchActivePromotion();

        return () => {
            isMounted = false;
        };
    }, [routePromotion]);

    const handleShare = async () => {
        if (!hasPromotion) {
            return;
        }
        try {
            await Share.share({
                message: `Check out this special offer at Studyzie! Use code ${promotion?.discountCode} for ${promotion?.discountAmount}% off!`,
            });
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <ScrollView style={styles.container} bounces={false}>
            <LinearGradient
                colors={['#103B28', '#166534']}
                style={styles.header}
            >
                <Ionicons name="gift-outline" size={80} color="#FFFFFF" style={styles.headerIcon} />
                <Text style={styles.headerTitle}>{hasPromotion ? "EXCLUSIVE OFFER" : "PROMOTION UPDATE"}</Text>
            </LinearGradient>

            <View style={styles.content}>
                <View style={styles.promoCard}>
                    <Text style={styles.promoLabel}>{promotion?.title || "Special Update"}</Text>
                    <Text style={styles.promoAmount}>
                        {hasPromotion ? `${promotion.discountAmount}% OFF` : "No active discount"}
                    </Text>

                    {hasPromotion ? (
                        <View style={styles.codeContainer}>
                            <Text style={styles.codeLabel}>USE PROMO CODE</Text>
                            <View style={styles.codeBox}>
                                <Text style={styles.codeText}>{promotion.discountCode}</Text>
                            </View>
                        </View>
                    ) : null}

                    <Text style={styles.promoDescription}>
                        {promotion?.message
                            || (hasPromotion
                                ? "Get amazing discounts on all your school supply needs. From notebooks to art materials, everything is now more affordable at Studyzie."
                                : "There is no active promotion at the moment. Please check back soon.")}
                    </Text>

                    <View style={styles.divider} />

                    {hasPromotion ? (
                        <View style={styles.perksRow}>
                            <View style={styles.perk}>
                                <Ionicons name="checkmark-circle" size={20} color="#103B28" />
                                <Text style={styles.perkText}>All Items</Text>
                            </View>
                            <View style={styles.perk}>
                                <Ionicons name="checkmark-circle" size={20} color="#103B28" />
                                <Text style={styles.perkText}>Limited Time</Text>
                            </View>
                            <View style={styles.perk}>
                                <Ionicons name="checkmark-circle" size={20} color="#103B28" />
                                <Text style={styles.perkText}>One Use</Text>
                            </View>
                        </View>
                    ) : null}
                </View>

                <TouchableOpacity 
                    style={styles.shopButton}
                    onPress={() => navigation.popToTop()}
                >
                    <Text style={styles.shopButtonText}>Shop Now</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </TouchableOpacity>

                {hasPromotion ? (
                    <TouchableOpacity 
                        style={styles.shareButton}
                        onPress={handleShare}
                    >
                        <Ionicons name="share-social-outline" size={20} color="#103B28" />
                        <Text style={styles.shareButtonText}>Share with friends</Text>
                    </TouchableOpacity>
                ) : null}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    header: {
        height: 200,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 20,
    },
    headerIcon: {
        marginBottom: 12,
    },
    headerTitle: {
        color: "#FFFFFF",
        fontSize: 20,
        fontWeight: "800",
        letterSpacing: 2,
    },
    content: {
        padding: 20,
        marginTop: -30,
    },
    promoCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 24,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    promoLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6B7280",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    promoAmount: {
        fontSize: 48,
        fontWeight: "900",
        color: "#103B28",
        marginVertical: 10,
    },
    codeContainer: {
        width: "100%",
        alignItems: "center",
        marginVertical: 20,
    },
    codeLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: "#9CA3AF",
        marginBottom: 8,
    },
    codeBox: {
        backgroundColor: "#F3F4F6",
        borderWidth: 2,
        borderColor: "#103B28",
        borderStyle: "dashed",
        borderRadius: 12,
        paddingHorizontal: 40,
        paddingVertical: 12,
    },
    codeText: {
        fontSize: 24,
        fontWeight: "800",
        color: "#103B28",
        letterSpacing: 2,
    },
    promoDescription: {
        fontSize: 15,
        color: "#4B5563",
        textAlign: "center",
        lineHeight: 22,
        marginTop: 10,
    },
    divider: {
        height: 1,
        width: "100%",
        backgroundColor: "#E5E7EB",
        marginVertical: 24,
    },
    perksRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
    },
    perk: {
        flexDirection: "row",
        alignItems: "center",
    },
    perkText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#374151",
        marginLeft: 4,
    },
    shopButton: {
        backgroundColor: "#103B28",
        borderRadius: 16,
        height: 56,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 24,
    },
    shopButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
        marginRight: 8,
    },
    shareButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 20,
        paddingVertical: 12,
    },
    shareButtonText: {
        color: "#103B28",
        fontSize: 15,
        fontWeight: "600",
        marginLeft: 8,
    },
});

export default PromotionDetail;
