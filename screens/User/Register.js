import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import baseURL from "../assets/common/baseurl";
import { Ionicons } from "@expo/vector-icons";

const Register = () => {
    const navigation = useNavigation();
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [avatarUri, setAvatarUri] = useState("");
    const [avatarBase64, setAvatarBase64] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const pickImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permission.status !== "granted") {
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions?.Images ?? 'Images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets?.[0]?.uri) {
            setAvatarUri(result.assets[0].uri);
            if (result.assets[0].base64) {
                setAvatarBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
            }
        }
    };

    const register = async () => {
        if (!email.trim() || !name.trim() || !phone.trim() || !password.trim()) {
            setError("Please complete all required fields.");
            return;
        }

        setError("");
        setIsLoading(true);
        const payload = {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: password.trim(),
            phone: phone.trim(),
            isAdmin: false,
            image: avatarBase64 || "",
        };

        try {
            const response = await axios.post(`${baseURL}users/register`, payload);

            if (response.status === 200 || response.status === 201) {
                Toast.show({
                    topOffset: 60,
                    type: "success",
                    text1: "Account created",
                    text2: "You can now login to continue shopping.",
                });
                setTimeout(() => {
                    navigation.navigate("Login");
                }, 500);
            }
        } catch (requestError) {
            console.log(requestError);
            setError("Registration failed. Please try again.");
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Registration failed",
                text2: "Please check your details and try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAwareScrollView
            viewIsInsideTabBar={true}
            extraHeight={200}
            enableOnAndroid={true}
            contentContainerStyle={styles.scrollContent}
            style={styles.screen}
        >
            <View style={styles.headerContainer}>
                <Text style={styles.welcomeText}>Hello! Register to</Text>
                <Text style={styles.brandText}>get started.</Text>
            </View>

            <View style={styles.formContainer}>
                <TouchableOpacity style={styles.avatarWrap} onPress={pickImage}>
                    {avatarUri ? (
                        <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Ionicons name="camera" size={24} color="#103B28" />
                            <Text style={styles.avatarText}>Add Photo</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Full Name"
                        placeholderTextColor="#9CA3AF"
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Email Address"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Phone Number"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity 
                    style={[styles.registerButton, isLoading && styles.disabledButton]} 
                    onPress={register}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Text style={styles.registerButtonText}>Register</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>Or Register with</Text>
                    <View style={styles.dividerLine} />
                </View>

                <View style={styles.socialRow}>
                    <TouchableOpacity style={styles.socialButton}>
                        <Ionicons name="logo-facebook" size={24} color="#1877F2" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialButton}>
                        <Ionicons name="logo-google" size={24} color="#DB4437" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialButton}>
                        <Ionicons name="logo-apple" size={24} color="#000000" />
                    </TouchableOpacity>
                </View>

                <View style={styles.footerContainer}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                        <Text style={styles.loginLink}>Login Now</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAwareScrollView>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        padding: 24,
        paddingTop: 60,
    },
    headerContainer: {
        marginBottom: 32,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: "600",
        color: "#1F2937",
        marginBottom: 4,
    },
    brandText: {
        fontSize: 24,
        fontWeight: "700",
        color: "#103B28",
    },
    formContainer: {
        width: "100%",
    },
    avatarWrap: {
        alignSelf: "center",
        marginBottom: 24,
        height: 100,
        width: 100,
        borderRadius: 50,
        backgroundColor: "#E5E7EB",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        borderWidth: 2,
        borderColor: "#103B28",
    },
    avatarPlaceholder: {
        alignItems: "center",
    },
    avatarImage: {
        width: "100%",
        height: "100%",
    },
    avatarText: {
        fontSize: 12,
        color: "#103B28",
        fontWeight: "600",
        marginTop: 4,
    },
    inputContainer: {
        marginBottom: 16,
    },
    input: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: "#1F2937",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    errorText: {
        color: "#EF4444",
        marginBottom: 16,
        textAlign: "center",
    },
    registerButton: {
        backgroundColor: "#103B28",
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
        marginBottom: 24,
        height: 56,
        justifyContent: 'center',
    },
    disabledButton: {
        opacity: 0.7,
    },
    registerButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    dividerContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: "#E5E7EB",
    },
    dividerText: {
        marginHorizontal: 16,
        color: "#6B7280",
        fontSize: 14,
    },
    socialRow: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 16,
        marginBottom: 32,
    },
    socialButton: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        padding: 12,
        width: 60,
        alignItems: "center",
    },
    footerContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 20,
    },
    footerText: {
        color: "#6B7280",
        fontSize: 14,
    },
    loginLink: {
        color: "#103B28",
        fontWeight: "600",
        fontSize: 14,
    },
});

export default Register;
