import React, { useEffect, useRef, useContext, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import { Platform, DeviceEventEmitter } from 'react-native';
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
  const handledResponseId = useRef(null);

  const getPromotionFromPayload = useCallback((data) => {
    if (!data) return null;

    // Backward compatibility: old payload used a nested promotion object.
    if (data?.promotion && typeof data.promotion === "object") {
      return data.promotion;
    }

    if (typeof data?.promotion === "string") {
      try {
        const parsed = JSON.parse(data.promotion);
        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      } catch (error) {
        // Ignore malformed string payloads and try flat fields below.
      }
    }

    // New flat payload (mirrors order-status notification style).
    if (data?.discountCode && Number(data?.discountAmount) > 0) {
      return {
        id: data?.promotionId || "",
        title: data?.title || "Special Promotion",
        message: data?.message || "",
        discountCode: String(data.discountCode).toUpperCase(),
        discountAmount: Number(data.discountAmount) || 0,
        startsAt: data?.startsAt || null,
        endsAt: data?.endsAt || null,
        maxRedemptions: Number(data?.maxRedemptions) || null,
        maxRedemptionsPerUser: Number(data?.maxRedemptionsPerUser) || null,
      };
    }

    return null;
  }, []);

  const handleNotificationResponse = useCallback(
    (response) => {
      const request = response?.notification?.request;
      const responseId = request?.identifier;
      if (responseId && handledResponseId.current === responseId) {
        return;
      }
      if (responseId) {
        handledResponseId.current = responseId;
      }

      const { data } = request?.content || {};
      if (!data) return;

      if (data?.screen === 'My Orders') {
        navigation.navigate('My Orders', { orderId: data?.orderId });
      } else if (data?.screen === 'Orders') {
        navigation.navigate('AdminTabs', { screen: 'Orders' });
      } else if (data?.screen === 'PromotionDetail') {
        const promotionPayload = getPromotionFromPayload(data);
        if (promotionPayload?.discountCode && promotionPayload?.discountAmount) {
          setPromotion(promotionPayload);
          DeviceEventEmitter.emit("promotion:update", promotionPayload);
        } else if (data?.promotion === null || data?.promotionActive === false || data?.promotionActive === "false") {
          clearPromotion();
          DeviceEventEmitter.emit("promotion:update", null);
        }
        navigation.navigate('PromotionDetail', { promotion: promotionPayload });
      }
    },
    [getPromotionFromPayload, navigation]
  );

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
      const data = notification.request?.content?.data;
      const promo = getPromotionFromPayload(data);
      if (promo?.discountCode && promo?.discountAmount) {
        setPromotion(promo);
        DeviceEventEmitter.emit("promotion:update", promo);
      }
      if (data?.promotion === null || data?.promotionActive === false || data?.promotionActive === "false") {
        clearPromotion();
        DeviceEventEmitter.emit("promotion:update", null);
      }
    });

    const checkLastResponse = async () => {
      try {
        const lastResponse = await Notifications.getLastNotificationResponseAsync();
        if (lastResponse) {
          handleNotificationResponse(lastResponse);
        }
      } catch (error) {
        // ignore
      }
    };

    checkLastResponse();

    responseListener.current = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

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
  }, [context.stateUser.isAuthenticated, getPromotionFromPayload, handleNotificationResponse]);

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
