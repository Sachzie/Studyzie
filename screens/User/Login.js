import React, { useContext, useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AuthGlobal from "../../backend/Context/Store/AuthGlobal";
import { loginUser } from "../../backend/Context/Actions/Auth.actions";
import { Ionicons } from "@expo/vector-icons";
import Notification from "../../Shared/Notification";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

const Login = () => {
    const context = useContext(AuthGlobal);
    const navigation = useNavigation();
    const route = useRoute();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [notification, setNotification] = useState({ visible: false, message: '', type: '' });
    const [isLoading, setIsLoading] = useState(false);

    const [request, response, promptAsync] = Google.useAuthRequest({
        androidClientId: "389416302400-1fjocq4mkov74o6uaqr8h07dd0il0013.apps.googleusercontent.com",
        iosClientId: "YOUR_IOS_CLIENT_ID",
        webClientId: "389416302400-1fjocq4mkov74o6uaqr8h07dd0il0013.apps.googleusercontent.com",
    }, {
        scheme: "studyzie"
    });

    useEffect(() => {
        if (response?.type === "success") {
            const { authentication } = response;
            handleGoogleLogin(authentication.accessToken);
        }
    }, [response]);

    const handleGoogleLogin = async (token) => {
        setIsLoading(true);
        try {
            // Here you would typically send the token to your backend
            // for validation and to get a JWT from your own system.
            // For now, we'll just show a notification.
            setNotification({ 
                visible: true, 
                message: "Google Login successful! (Connecting to backend...)", 
                type: "success" 
            });
        } catch (err) {
            setNotification({ visible: true, message: "Google Login failed.", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (context?.stateUser?.isAuthenticated === true) {
            // No need to navigate manually, Main.js handles it
        }
    }, [context?.stateUser?.isAuthenticated]);

    const handleSubmit = async () => {
        if (!email.trim() || !password.trim()) {
            setNotification({ visible: true, message: "Please enter your email and password.", type: "error" });
            return;
        }
        setIsLoading(true);
        
        try {
            await loginUser({ email: email.trim().toLowerCase(), password }, context.dispatch);
            // The redirection will be handled by the useEffect
        } catch (err) {
            setNotification({ visible: true, message: "Invalid credentials. Please try again.", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleNotificationClose = () => {
        setNotification({ ...notification, visible: false });
    };

    return (
        <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.headerContainer}>
                    <Text style={styles.welcomeText}>Welcome! Login to</Text>
                    <Text style={styles.brandText}>Studyzie.</Text>
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
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
                            placeholder="Enter your password"
                            placeholderTextColor="#9CA3AF"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>

                    <TouchableOpacity style={styles.forgotPassword}>
                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    <Notification 
                        visible={notification.visible} 
                        message={notification.message} 
                        type={notification.type} 
                        onClose={handleNotificationClose} 
                    />

                    <TouchableOpacity 
                        style={[styles.loginButton, isLoading && styles.disabledButton]} 
                        onPress={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Text style={styles.loginButtonText}>Login</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>Or Login with</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <View style={styles.socialRow}>
                        <TouchableOpacity style={styles.socialButton}>
                            <Ionicons name="logo-facebook" size={24} color="#1877F2" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.socialButton, !request && styles.disabledButton]} 
                            onPress={() => promptAsync()}
                            disabled={!request}
                        >
                            <Ionicons name="logo-google" size={24} color="#DB4437" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.socialButton}>
                            <Ionicons name="logo-apple" size={24} color="#000000" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footerContainer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                            <Text style={styles.registerLink}>Register Now</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
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
        color: "#103B28", // Dark Green
    },
    formContainer: {
        width: "100%",
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
    forgotPassword: {
        alignItems: "flex-end",
        marginBottom: 24,
    },
    forgotPasswordText: {
        color: "#6B7280",
        fontSize: 14,
    },
    errorText: {
        color: "#EF4444",
        marginBottom: 16,
        textAlign: "center",
    },
    loginButton: {
        backgroundColor: "#103B28", // Dark Green
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
        marginBottom: 24,
        height: 56, // Fixed height to prevent jumping when spinner appears
        justifyContent: 'center',
    },
    disabledButton: {
        opacity: 0.7,
    },
    loginButtonText: {
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
    },
    footerText: {
        color: "#6B7280",
        fontSize: 14,
    },
    registerLink: {
        color: "#103B28",
        fontWeight: "600",
        fontSize: 14,
    },
});

export default Login;
