import React, { useEffect, useRef, useContext } from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import axios from 'axios';
import baseURL from '../screens/assets/common/baseurl';
import AuthGlobal from '../backend/Context/Store/AuthGlobal';
import { getToken } from '../backend/Context/Store/tokenStorage';
import { setPromotion, clearPromotion } from '../backend/Context/Store/promotionStorage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const NotificationHandler = () => {
  const navigation = useNavigation();
  const context = useContext(AuthGlobal);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    const setupNotifications = async () => {
        try {
            const token = await registerForPushNotificationsAsync();
            if (token && context.stateUser.isAuthenticated) {
                await savePushTokenToBackend(token);
            }
        } catch (error) {
            console.log("Push notification setup failed:", error.message);
        }
    };

    setupNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('???? Notification Received:', notification.request.content.title);
      const promo = notification.request?.content?.data?.promotion;
      if (promo?.discountCode && promo?.discountAmount) {
        setPromotion(promo);
      }
      if (promo === null) {
        clearPromotion();
      }
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const { data } = response.notification.request.content;
      console.log('???? Notification Tapped:', data?.screen);

      if (data?.screen === 'My Orders') {
        navigation.navigate('My Orders', { orderId: data?.orderId });
      } else if (data?.screen === 'Orders') {
        navigation.navigate('AdminTabs', { screen: 'Orders' });
      } else if (data?.screen === 'PromotionDetail') {
        if (data?.promotion?.discountCode && data?.promotion?.discountAmount) {
          setPromotion(data.promotion);
        }
        navigation.navigate('PromotionDetail', { promotion: data?.promotion });
      }
    });

    return () => {
      const removeSubscription = (subscription) => {
        if (!subscription) return;
        if (typeof subscription.remove === "function") {
          subscription.remove();
          return;
        }
        if (typeof Notifications.removeNotificationSubscription === "function") {
          Notifications.removeNotificationSubscription(subscription);
        }
      };

      removeSubscription(notificationListener.current);
      removeSubscription(responseListener.current);
    };
  }, [context.stateUser.isAuthenticated]);

  const savePushTokenToBackend = async (pushToken) => {
    const userId = context.stateUser.user.userId || context.stateUser.user.id || context.stateUser.user.sub;
    if (!userId || !pushToken) return;

    try {
        const token = await getToken();
        await axios.put(`${baseURL}users/${userId}/push-token`, 
            { pushToken },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Push token saved to backend');
    } catch (error) {
        console.log('Error saving push token:', error.message);
    }
  };

  return null;
};

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    try {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        if (!projectId) {
            console.log('Project ID not found');
        }
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log('Expo Push Token:', token);
    } catch (e) {
        console.log('Error getting push token:', e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

export default NotificationHandler;
