import React, { useContext, useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import AuthGlobal from "../../backend/Context/Store/AuthGlobal";
import { loginUser } from "../../backend/Context/Actions/Auth.actions";
import { styles, colors } from "./styles";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const LoginForm = ({ onToggle }) => {
    const context = useContext(AuthGlobal);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

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

    return (
        <View style={styles.card}>
            {/* Logo and text removed from here as they are better placed outside or simplified */}
            <Animated.View entering={FadeInUp.delay(200).duration(1000)} style={styles.logoContainer}>
                <Image 
                    source={require("../assets/Logo.png")} 
                    style={styles.logo}
                    resizeMode="contain"
                />
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

            <Animated.View entering={FadeInDown.delay(800).duration(1000)} style={styles.toggleContainer}>
                <Text style={styles.toggleText}>Don't have an account?</Text>
                <TouchableOpacity onPress={onToggle} style={{ padding: 10 }}>
                    <Text style={styles.toggleButton}>Sign Up</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

export default LoginForm;
