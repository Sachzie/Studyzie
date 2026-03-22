import { useNavigation } from '@react-navigation/native';
import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import AuthGlobal from '../../backend/Context/Store/AuthGlobal';
import { logoutUser } from '../../backend/Context/Actions/Auth.actions';
import StudyzieLogo from '../../Shared/StudyzieLogo';
import axios from 'axios';
import baseURL from '../assets/common/baseurl';
import { getToken } from '../../backend/Context/Store/tokenStorage';

const API_ORIGIN = baseURL.replace(/api\/v1\/?$/, "");

const resolveAvatarUri = (rawUri) => {
    if (!rawUri) return "";
    if (rawUri.startsWith("data:image")) return rawUri;

    if (/^https?:\/\//i.test(rawUri)) {
        try {
            const url = new URL(rawUri);
            if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
                return `${API_ORIGIN}${url.pathname}`;
            }
            return rawUri;
        } catch (e) {
            return rawUri;
        }
    }

    if (rawUri.startsWith("/")) {
        return `${API_ORIGIN}${rawUri}`;
    }

    return `${API_ORIGIN}/public/uploads/${rawUri}`;
};

const DrawerContent = (props) => {
    const navigation = useNavigation();
    const context = useContext(AuthGlobal);
    const user = context?.stateUser?.user || {};
    const isAdmin = Boolean(user?.isAdmin);
    const userId = user.userId || user.id || user.sub;
    const [profileImage, setProfileImage] = useState("");

    const handleLogout = async () => {
        try {
            await logoutUser(context.dispatch, userId);
            navigation.navigate('Login');
        } catch (error) {
            console.log("Logout failed:", error.message);
        }
    };

    const userName = user?.name || "Studyzie User";

    useEffect(() => {
        let isMounted = true;

        const fetchProfile = async () => {
            if (!userId) return;
            try {
                const token = await getToken();
                if (!token) return;
                const response = await axios.get(`${baseURL}users/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (isMounted) {
                    setProfileImage(response.data?.image || "");
                }
            } catch (error) {
                if (isMounted) {
                    setProfileImage(user?.image || "");
                }
            }
        };

        fetchProfile();

        return () => {
            isMounted = false;
        };
    }, [userId, user?.image]);

    return (
        <View style={styles.container}>
            <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerScroll}>
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <StudyzieLogo size={60} color="#FFFFFF" />
                    </View>
                    <View style={styles.profileInfo}>
                        <View style={styles.avatar}>
                            {profileImage ? (
                                <Image source={{ uri: resolveAvatarUri(profileImage) }} style={styles.avatarImage} />
                            ) : (
                                <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
                            )}
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
                            <Text style={styles.userRole}>{isAdmin ? 'Administrator' : 'Student'}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.menuContainer}>
                    <TouchableOpacity 
                        style={styles.menuItem} 
                        onPress={() => navigation.navigate('Home')}
                    >
                        <Ionicons name="home-outline" size={22} color="#103B28" />
                        <Text style={styles.menuLabel}>Home</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.menuItem} 
                        onPress={() => {
                            if (isAdmin) {
                                navigation.navigate('AdminTabs', { screen: 'Settings' });
                            } else {
                                navigation.navigate('User', { screen: 'User Profile' });
                            }
                        }}
                    >
                        <Ionicons name="person-outline" size={22} color="#103B28" />
                        <Text style={styles.menuLabel}>Profile</Text>
                    </TouchableOpacity>

                    {!isAdmin && (
                        <TouchableOpacity 
                            style={styles.menuItem} 
                            onPress={() => navigation.navigate('User', { screen: 'My Orders' })}
                        >
                            <Ionicons name="receipt-outline" size={22} color="#103B28" />
                            <Text style={styles.menuLabel}>My Orders</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity 
                        style={styles.menuItem} 
                        onPress={() => navigation.navigate('Cart')}
                    >
                        <Ionicons name="cart-outline" size={22} color="#103B28" />
                        <Text style={styles.menuLabel}>Cart</Text>
                    </TouchableOpacity>
                </View>
            </DrawerContentScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                    <Text style={styles.logoutLabel}>Logout</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    drawerScroll: {
        backgroundColor: '#FFFFFF',
    },
    header: {
        padding: 20,
        backgroundColor: '#103B28',
        paddingTop: 60,
    },
    logoContainer: {
        marginBottom: 15,
        alignItems: 'flex-start',
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 25,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#103B28',
    },
    textContainer: {
        marginLeft: 15,
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    userRole: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 2,
    },
    menuContainer: {
        padding: 10,
        marginTop: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 10,
        marginBottom: 5,
    },
    menuLabel: {
        fontSize: 16,
        color: '#374151',
        marginLeft: 15,
        fontWeight: '500',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    logoutLabel: {
        fontSize: 16,
        color: '#EF4444',
        marginLeft: 15,
        fontWeight: '600',
    },
});

export default DrawerContent;
