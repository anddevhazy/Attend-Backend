import admin from 'firebase-admin';
import User from '../models/user.model.js';
import { InternalServerError } from '../errors/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'; // Utility for ES Modules paths

// Get the directory name for correct path resolution
const _filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(_filename); // <-- Use the standard double underscore (and it is used below)

// ✅ Secure Firebase Initialization (works locally & on Heroku)
let serviceAccount;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Parse credentials from environment variable
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // Fallback for local development using fs.readFileSync
    const serviceAccountPath = path.resolve(
      __dirname, // <-- The variable is now correctly used here.
      '../../firebase-service-account.json'
    );
    const serviceAccountJson = fs.readFileSync(serviceAccountPath, 'utf8');
    serviceAccount = JSON.parse(serviceAccountJson);
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('🔥 Firebase Admin initialized successfully');
  }
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error);
}

// ✅ Send Notification Utility
export const sendNotification = async (userId, message) => {
  try {
    const user = await User.findById(userId).select('fcmToken').lean();

    if (!user || !user.fcmToken) {
      console.warn(`⚠️ No FCM token found for user ${userId}`);
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

    console.log(`✅ Notification sent to user ${userId}: ${message}`);
  } catch (error) {
    console.error(`❌ Error sending notification to user ${userId}:`, error);
    throw new InternalServerError('Failed to send notification');
  }
};
