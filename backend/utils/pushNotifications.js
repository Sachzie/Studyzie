const axios = require('axios');

/**
 * Sends a push notification using Expo Push API
 * @param {string|string[]} pushTokens - The recipient's Expo Push Token or array of tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Custom data payload
 */
const sendPushNotification = async (pushTokens, title, body, data = {}) => {
  const tokens = Array.isArray(pushTokens) ? pushTokens : [pushTokens];

  const isExpoPushToken = (token) =>
    typeof token === "string" &&
    (token.startsWith("ExponentPushToken") || token.startsWith("ExpoPushToken"));

  const messages = tokens
    .filter(isExpoPushToken)
    .map(token => ({
      to: token,
      sound: 'default',
      title: title,
      body: body,
      data: data,
    }));

  if (messages.length === 0) {
    console.log('No valid push tokens provided.');
    return;
  }

  try {
    const response = await axios.post('https://exp.host/--/api/v2/push/send', messages, {
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
    });
    console.log(`Push notification(s) sent successfully to ${messages.length} device(s)`);
    return response.data;
  } catch (error) {
    console.error('Error sending push notification:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = { sendPushNotification };
