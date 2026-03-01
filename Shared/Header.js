import React from "react"
import { StyleSheet, Image, View, Text } from "react-native"
import { SafeAreaView } from 'react-native-safe-area-context';

const Header = () => {
    return (
        <SafeAreaView edges={["top"]} style={styles.header}>
            <View style={styles.inner}>
                <Image
                    source={require("../assets/Logo.png")}
                    resizeMode="contain"
                    style={styles.logo}
                />
                <View>
                    <Text style={styles.title}>Studyzie</Text>
                    <Text style={styles.subtitle}>School Supplies</Text>
                </View>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    header: {
        width: "100%",
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 16,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    inner: {
        flexDirection: "row",
        alignItems: "center",
    },
    logo: {
        height: 42,
        width: 42,
        marginRight: 10,
    },
    title: {
        color: "#103B28",
        fontSize: 17,
        fontWeight: "700",
    },
    subtitle: {
        color: "#6B7280",
        fontSize: 12,
        marginTop: 2,
    },
})

export default Header;
