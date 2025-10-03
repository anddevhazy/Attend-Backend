import { createWorker, createScheduler } from './redis.js';
import { extractStudentDataFromImage } from '../utils/extractStudentDataFromImage.js';
import sendVerificationEmail from '../utils/sendVerificationEmail.js';
import { sendNotification } from '../utils/notification.js';

// Initialize schedulers for each queue
createScheduler('extract-data');
createScheduler('send-email-verification');
createScheduler('notification');

// Worker for extracting student data from image
createWorker('extract-data', async (job) => {
  const { image, userId } = job.data;
  try {
    const extractedData = await extractStudentDataFromImage(image);
    // Store result in DB or notify user (implement later)
    console.log(`Extracted data for user ${userId}:`, extractedData);
    return extractedData;
  } catch (error) {
    console.error(
      `Error processing extract-data job for user ${userId}:`,
      error
    );
    throw error;
  }
});

// Worker for sending verification emails
createWorker('send-verification-email', async (job) => {
  const { user, verificationToken } = job.data;
  try {
    await sendVerificationEmail(user, verificationToken);
    console.log(`Verification email sent to ${user.email}`);
  } catch (error) {
    console.error(`Error sending email to ${user.email}:`, error);
    throw error;
  }
});

// Worker for sending notifications
createWorker('notification', async (job) => {
  const { userId, message } = job.data;
  try {
    await sendNotification(userId, message);
    console.log(`Notification sent to user ${userId}: ${message}`);
  } catch (error) {
    console.error(`Error sending notification to user ${userId}:`, error);
    throw error;
  }
});

console.log('Workers initialized');
