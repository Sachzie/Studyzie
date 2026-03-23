import React, { useState, useEffect } from "react";
import { View, Dimensions, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, StatusBar } from "react-native";
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    withSpring,
    withRepeat,
    withSequence,
    interpolateColor,
    interpolate,
    Extrapolate,
    Easing
} from 'react-native-reanimated';
import { styles, colors } from "./styles";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get("window");

const AuthScreen = () => {
    const [isLogin, setIsLogin] = useState(true);
    const translateX = useSharedValue(0);
    const switchX = useSharedValue(0);
    const circle1Scale = useSharedValue(1);
    const circle2Scale = useSharedValue(1);
    const circle3Y = useSharedValue(0);

    useEffect(() => {
        // Floating animation for the third circle
        circle3Y.value = withRepeat(
            withSequence(
                withTiming(-20, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, []);

    const toggleAuth = (targetState) => {
        // Ensure we are toggling based on the REQUESTED target state
        const toValue = targetState ? 0 : -width;
        
        translateX.value = withTiming(toValue, {
            duration: 800, // Slower for more visibility
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });

        // Switch animation
        switchX.value = withSpring(targetState ? 0 : 1, {
            damping: 15,
            stiffness: 100,
        });

        // Animate background shapes MORE dramatically
        circle1Scale.value = withTiming(targetState ? 1 : 1.5, { duration: 800 });
        circle2Scale.value = withTiming(targetState ? 1 : 0.6, { duration: 800 });
        
        setIsLogin(targetState);
    };

    const slideStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }],
        };
    });

    // Individual Screen Animations for "Depth" Effect
    const loginScreenStyle = useAnimatedStyle(() => {
        const scale = interpolate(
            translateX.value,
            [-width, 0],
            [0.85, 1],
            Extrapolate.CLAMP
        );
        
        const opacity = interpolate(
            translateX.value,
            [-width, -width/2, 0],
            [0, 0.5, 1],
            Extrapolate.CLAMP
        );

        return {
            transform: [{ scale }],
            opacity
        };
    });

    const registerScreenStyle = useAnimatedStyle(() => {
        const scale = interpolate(
            translateX.value,
            [-width, 0],
            [1, 0.85],
            Extrapolate.CLAMP
        );
        
        const opacity = interpolate(
            translateX.value,
            [-width, -width/2, 0],
            [1, 0.5, 0],
            Extrapolate.CLAMP
        );

        return {
            transform: [{ scale }],
            opacity
        };
    });

    const circle1Style = useAnimatedStyle(() => {
        return {
            transform: [{ scale: circle1Scale.value }],
        };
    });

    const circle2Style = useAnimatedStyle(() => {
        return {
            transform: [{ scale: circle2Scale.value }],
        };
    });
    
    const circle3Style = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: circle3Y.value }],
        };
    });

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <StatusBar barStyle="dark-content" />
            <LinearGradient 
                colors={[colors.lighter, '#FDFBF9', colors.light]} 
                style={styles.container}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Animated Background Shapes */}
                <View style={styles.backgroundContainer}>
                    <Animated.View style={[styles.circle1, circle1Style]} />
                    <Animated.View style={[styles.circle2, circle2Style]} />
                    <Animated.View style={[styles.circle3, circle3Style]} />
                </View>

                <Animated.View style={[styles.slideContainer, slideStyle]}>
                    <Animated.View style={[{ width: width }, loginScreenStyle]}>
                        <ScrollView 
                            contentContainerStyle={{ flexGrow: 1 }}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={styles.screen}>
                                <LoginForm onToggle={() => toggleAuth(false)} />
                            </View>
                        </ScrollView>
                    </Animated.View>

                    <Animated.View style={[{ width: width }, registerScreenStyle]}>
                        <ScrollView 
                            contentContainerStyle={{ flexGrow: 1 }}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={styles.screen}>
                                <RegisterForm onToggle={() => toggleAuth(true)} />
                            </View>
                        </ScrollView>
                    </Animated.View>
                </Animated.View>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
};

export default AuthScreen;
