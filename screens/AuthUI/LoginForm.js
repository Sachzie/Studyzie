import React, { useContext, useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import AuthGlobal from "../../backend/Context/Store/AuthGlobal";
import { loginUser, loginWithGoogle } from "../../backend/Context/Actions/Auth.actions";
import { styles, colors } from "./styles";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import StudyzieLogo from "../../Shared/StudyzieLogo";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

const LoginForm = ({ onToggle }) => {
    const context = useContext(AuthGlobal);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const androidClientId = "389416302400-kbkq1su4lo0gp35gutlrha4mq5f4mbgv.apps.googleusercontent.com";
    const webClientId = "389416302400-g2us37q2kh02t56eca11ncbqj6g3kljp.apps.googleusercontent.com";
    const googleScheme = `com.googleusercontent.apps.${androidClientId.split(".")[0]}`;
    const redirectUri = AuthSession.makeRedirectUri({
        native: `${googleScheme}:/oauthredirect`,
    });

    const [request, response, promptAsync] = Google.useAuthRequest(
        {
            androidClientId,
            webClientId,
            expoClientId: webClientId,
            redirectUri,
        },
        undefined
    );

    useEffect(() => {
        if (response?.type === "success") {
            const token = response?.authentication?.accessToken;
            if (token) {
                handleGoogleLogin(token);
            } else {
                setError("Google login failed. Please try again.");
            }
        }
    }, [response]);

    const handleSubmit = async () => {
        if (!email.trim() || !password.trim()) {
            setError("Please enter your email and password.");
            return;
        }
        setError("");
        setIsLoading(true);
        
        try {
            await loginUser({ email: email.trim().toLowerCase(), password }, context.dispatch);
        } catch (err) {
            setError("Invalid credentials. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async (accessToken) => {
        setError("");
        setIsGoogleLoading(true);
        try {
            await loginWithGoogle(accessToken, context.dispatch);
        } catch (err) {
            setError("Google login failed. Please try again.");
        } finally {
            setIsGoogleLoading(false);
        }
    };

    return (
        <View style={styles.card}>
            {/* Logo and text removed from here as they are better placed outside or simplified */}
            <Animated.View entering={FadeInUp.delay(200).duration(1000)} style={styles.logoContainer}>
                <StudyzieLogo size={70} />
            </Animated.View>

            <Animated.Text entering={FadeInDown.delay(300).duration(1000)} style={styles.title}>Welcome Back</Animated.Text>
            <Animated.Text entering={FadeInDown.delay(400).duration(1000)} style={styles.subtitle}>Login to continue</Animated.Text>

            <Animated.View entering={FadeInDown.delay(500).duration(1000)} style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={colors.secondary} style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={colors.placeholder}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(600).duration(1000)} style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.secondary} style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={colors.placeholder}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </Animated.View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Animated.View entering={FadeInDown.delay(700).duration(1000)} style={{ width: '100%' }}>
                <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isLoading}>
                    <LinearGradient
                        colors={[colors.primary, colors.secondary]}
                        style={styles.gradientButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <Text style={styles.buttonText}>Login</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(800).duration(1000)} style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                <View style={styles.dividerLine} />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(900).duration(1000)} style={{ width: '100%' }}>
                <TouchableOpacity
                    style={[styles.googleButton, (!request || isGoogleLoading) && styles.disabledButton]}
                    onPress={() => promptAsync()}
                    disabled={!request || isGoogleLoading}
                >
                    {isGoogleLoading ? (
                        <ActivityIndicator color={colors.primary} />
                    ) : (
                        <>
                            <Ionicons name="logo-google" size={18} color="#DB4437" style={styles.googleIcon} />
                            <Text style={styles.googleButtonText}>Continue with Google</Text>
                        </>
                    )}
                </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(1000).duration(1000)} style={styles.toggleContainer}>
                <Text style={styles.toggleText}>Don't have an account?</Text>
                <TouchableOpacity onPress={onToggle} style={{ padding: 10 }}>
                    <Text style={styles.toggleButton}>Sign Up</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

export default LoginForm;
