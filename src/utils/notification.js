import admin from 'firebase-admin';
import User from '../models/user.model.js';
import { InternalServerError } from '../errors/index.js';

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert('./firebase-service-account.json'),
});

export const sendNotification = async (userId, message) => {
  try {
    const user = await User.findById(userId).select('fcmToken').lean();
    if (!user || !user.fcmToken) {
      console.warn(`No FCM token found for user ${userId}`);
      return;
    }

    await admin.messaging().send({
      token: user.fcmToken,
      notification: {
        title: 'Attend',
        body: message,
      },
      data: { userId, timestamp: new Date().toISOString() },
    });

    console.log(`Notification sent to user ${userId}: ${message}`);
  } catch (error) {
    console.error(`Error sending notification to user ${userId}:`, error);
    throw new InternalServerError('Failed to send notification');
  }
};
