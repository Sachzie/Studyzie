import React, { useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import AuthGlobal from "../../backend/Context/Store/AuthGlobal";
import { logoutUser } from "../../backend/Context/Actions/Auth.actions";

const actionItems = [
    {
        key: "products",
        label: "Manage Products",
        description: "Create, edit, and remove products",
        icon: "cube-outline",
        route: "Products",
    },
    {
        key: "categories",
        label: "Manage Categories",
        description: "Update product categories",
        icon: "pricetags-outline",
        route: "Categories",
    },
    {
        key: "users",
        label: "Manage Users",
        description: "View and moderate accounts",
        icon: "people-outline",
        route: "Users",
    },
];

const AdminSettings = ({ navigation }) => {
    const auth = useContext(AuthGlobal);

    const handleLogout = () => {
        logoutUser(auth.dispatch);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Settings</Text>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => navigation.navigate("Admin Profile")}
                >
                    <Ionicons name="menu-outline" size={22} color="#111827" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Admin Console</Text>
                    <Text style={styles.cardBody}>Configure your store tools and monitor operations.</Text>
                </View>

                {actionItems.map((item) => (
                    <TouchableOpacity
                        key={item.key}
                        style={styles.actionRow}
                        onPress={() => navigation.navigate(item.route)}
                    >
                        <View style={styles.actionIcon}>
                            <Ionicons name={item.icon} size={22} color="#111827" />
                        </View>
                        <View style={styles.actionTextWrap}>
                            <Text style={styles.actionTitle}>{item.label}</Text>
                            <Text style={styles.actionSubtitle}>{item.description}</Text>
                        </View>
                        <Ionicons name="chevron-forward-outline" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                ))}

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F3F4F6",
    },
    header: {
        paddingTop: 52,
        paddingBottom: 14,
        paddingHorizontal: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 36,
        color: "#111827",
        fontWeight: "700",
    },
    iconButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#D1D5DB",
        backgroundColor: "#FFFFFF",
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    card: {
        backgroundColor: "#111827",
        borderRadius: 22,
        padding: 18,
        marginBottom: 18,
    },
    cardTitle: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 6,
    },
    cardBody: {
        color: "#D1D5DB",
        fontSize: 14,
        lineHeight: 20,
    },
    actionRow: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        paddingVertical: 14,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    actionIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    actionTextWrap: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 15,
        color: "#111827",
        fontWeight: "700",
    },
    actionSubtitle: {
        marginTop: 2,
        fontSize: 12,
        color: "#6B7280",
    },
    logoutButton: {
        marginTop: 10,
        borderRadius: 14,
        backgroundColor: "#111827",
        paddingVertical: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    logoutText: {
        marginLeft: 8,
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "700",
    },
});

export default AdminSettings;
