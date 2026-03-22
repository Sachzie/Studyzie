const axios = require('axios');

/**
 * Sends a push notification using Expo Push API
 * @param {string} pushToken - The recipient's Expo Push Token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Custom data payload
 */
const sendPushNotification = async (pushToken, title, body, data = {}) => {
  if (!pushToken || !pushToken.startsWith('ExponentPushToken')) {
    console.log('Invalid or missing push token:', pushToken);
    return;
  }

  const message = {
    to: pushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data,
  };

  try {
    const response = await axios.post('https://exp.host/--/api/v2/push/send', message, {
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
    });
    console.log('Push notification sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending push notification:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = { sendPushNotification };
