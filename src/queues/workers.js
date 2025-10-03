import { createWorker, createScheduler, createQueue } from './redis.js';
import { extractStudentDataFromImage } from '../utils/extractStudentDataFromImage.js';
import sendVerificationEmail from '../utils/sendVerificationEmail.js';
import { sendNotification } from '../utils/notification.js';
import Session from '../models/attendanceSession.model.js';
import User from '../models/user.model.js';
import {
  checkGeofence,
  handleDeviceValidation,
} from '../utils/attendanceUtils.js';
import { BadRequestError, NotFoundError } from '../errors/index.js';

// Initialize schedulers for each queue
createScheduler('extract-data');
createScheduler('send-email-verification');
createScheduler('notification');
createScheduler('mark-attendance');

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

createWorker('mark-attendance', async (job) => {
  const { sessionId, deviceId, selfie, latitude, longitude, matricNumber } =
    job.data;

  const session = await Session.findById(sessionId)
    .select('status endTime attendees locationId courseId')
    .populate('locationId', 'corners')
    .populate('courseId', 'name')
    .exec();

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  if (session.status !== 'active' || new Date() > session.endTime) {
    throw new BadRequestError('Session has ended or is not active');
  }

  const hasAlreadyMarked = session.attendees.some(
    (attendee) => attendee.matricNumber === matricNumber
  );

  if (hasAlreadyMarked) {
    throw new BadRequestError(
      'Attendance already marked for this session with this matric number'
    );
  }

  const isWithinGeofence = checkGeofence(
    latitude,
    longitude,
    session.locationId.corners
  );
  if (!isWithinGeofence) {
    throw new BadRequestError(
      'You are not within the required location for this class'
    );
  }

  const deviceCheck = await handleDeviceValidation(matricNumber, deviceId);
  if (!deviceCheck.success) {
    throw new BadRequestError(deviceCheck.message, {
      requiresOverride: true,
      conflictInfo: deviceCheck.conflictInfo,
    });
  }

  const user = await User.findOne({ matricNumber }).select('_id').lean();
  if (!user) {
    throw new NotFoundError('Student not found with this matric number');
  }

  session.attendees.push({
    studentId: user._id,
    matricNumber,
    selfie,
    deviceIdUsed: deviceId,
    timestamp: new Date(),
  });

  await session.save();

  // Notify lecturer via queue (for getLiveAttendance)
  const notificationQueue = createQueue('notification');
  await notificationQueue.add('attendance-update', {
    userId: session.lecturerId,
    message: `Student ${matricNumber} marked attendance for session ${sessionId}`,
  });

  return {
    sessionName: session.courseId.name,
    timestamp: new Date(),
    attendeeCount: session.attendees.length,
  };
});

console.log('Workers initialized');
