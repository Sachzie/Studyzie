const axios = require('axios');

const chunkArray = (items, size) => {
  if (!Array.isArray(items) || size <= 0) return [];
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

/**
 * Sends a push notification using Expo Push API
 * @param {string|string[]} pushTokens - The recipient's Expo Push Token or array of tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Custom data payload
 * @param {object} options
 * @param {boolean} options.throwOnError - throw when Expo request fails
 */
const sendPushNotification = async (pushTokens, title, body, data = {}, options = {}) => {
  const { throwOnError = true } = options;
  const tokens = Array.isArray(pushTokens) ? pushTokens : [pushTokens];
  const cleanedTokens = tokens
    .map((token) => (typeof token === "string" ? token.trim() : ""))
    .filter(Boolean);

  const isExpoPushToken = (token) =>
    typeof token === "string" &&
    (token.startsWith("ExponentPushToken") || token.startsWith("ExpoPushToken"));

  const messages = cleanedTokens
    .filter(isExpoPushToken)
    .map(token => ({
      to: token,
      sound: 'default',
      channelId: 'default',
      priority: 'high',
      title: title,
      body: body,
      data: data,
    }));

  const report = {
    attempted: messages.length,
    accepted: 0,
    failed: 0,
    filteredOut: Math.max(cleanedTokens.length - messages.length, 0),
    invalidDeviceTokens: [],
    errors: [],
    tickets: [],
  };

  if (messages.length === 0) {
    console.log('No valid push tokens provided.');
    return report;
  }

  const chunks = chunkArray(messages, 100);
  for (const chunk of chunks) {
    try {
      const response = await axios.post('https://exp.host/--/api/v2/push/send', chunk, {
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
      });
      const tickets = Array.isArray(response?.data?.data) ? response.data.data : [];
      report.tickets.push(...tickets);

      tickets.forEach((ticket, index) => {
        const token = chunk[index]?.to || "";
        if (ticket?.status === "ok") {
          report.accepted += 1;
          return;
        }

        report.failed += 1;
        const ticketError = ticket?.details?.error || ticket?.message || "Unknown push ticket error";
        report.errors.push(ticketError);
        if (ticketError === "DeviceNotRegistered" && token) {
          report.invalidDeviceTokens.push(token);
        }
      });

      // If tickets are unexpectedly empty, mark chunk as failed to avoid false positives.
      if (tickets.length === 0) {
        report.failed += chunk.length;
        report.errors.push("Expo push API returned no ticket data.");
      }
    } catch (error) {
      const requestError = error.response?.data || error.message || "Push request failed";
      report.failed += chunk.length;
      report.errors.push(requestError);
      if (throwOnError) {
        console.error('Error sending push notification:', requestError);
        throw error;
      }
    }
  }

  if (report.accepted > 0) {
    console.log(`Push notification(s) accepted for ${report.accepted} device(s) out of ${report.attempted}.`);
  } else {
    console.log('No push notifications were accepted by Expo Push API.');
  }

  report.invalidDeviceTokens = [...new Set(report.invalidDeviceTokens)];
  return report;
};

module.exports = { sendPushNotification };
