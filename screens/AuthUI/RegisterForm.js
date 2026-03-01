import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import baseURL from "../assets/common/baseurl";
import { Ionicons } from "@expo/vector-icons";
import { styles, colors } from "./styles";
import Toast from "react-native-toast-message";
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const RegisterForm = ({ onToggle }) => {
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
                    onToggle(); // Switch to Login form
                }, 500);
            }
        } catch (requestError) {
            console.log(requestError);
            const errorMessage = requestError.response?.data?.message || requestError.message || "Registration failed. Please try again.";
            setError(errorMessage);
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Registration failed",
                text2: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.card}>
            <Animated.Text entering={FadeInUp.delay(200).duration(1000)} style={styles.title}>Get Started</Animated.Text>
            <Animated.Text entering={FadeInUp.delay(300).duration(1000)} style={styles.subtitle}>Create your account</Animated.Text>

            <Animated.View entering={FadeInDown.delay(400).duration(1000)}>
                <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
                    {avatarUri ? (
                        <Image source={{ uri: avatarUri }} style={styles.image} />
                    ) : (
                        <Ionicons name="camera" size={40} color={colors.primary} />
                    )}
                </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(500).duration(1000)} style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={colors.secondary} style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor={colors.placeholder}
                    value={name}
                    onChangeText={setName}
                />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(600).duration(1000)} style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={colors.secondary} style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor={colors.placeholder}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(700).duration(1000)} style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color={colors.secondary} style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Phone Number"
                    placeholderTextColor={colors.placeholder}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(800).duration(1000)} style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.secondary} style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={colors.placeholder}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />
            </Animated.View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Animated.View entering={FadeInDown.delay(900).duration(1000)} style={{ width: '100%' }}>
                <TouchableOpacity style={styles.button} onPress={register} disabled={isLoading}>
                    <LinearGradient
                        colors={[colors.primary, colors.secondary]}
                        style={styles.gradientButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <Text style={styles.buttonText}>Register</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(1000).duration(1000)} style={styles.toggleContainer}>
                <Text style={styles.toggleText}>Already have an account?</Text>
                <TouchableOpacity onPress={onToggle} style={{ padding: 10 }}>
                    <Text style={styles.toggleButton}>Login</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

export default RegisterForm;
