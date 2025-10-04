/* eslint-disable no-unused-vars */
import redis, { createWorker } from './redis.js';
import { extractStudentDataFromImage } from '../utils/extractStudentDataFromImage.js';
import sendVerificationEmail from '../utils/sendVerificationEmail.js';
import { sendNotification } from '../utils/notification.js';
import Session from '../models/attendanceSession.model.js';
import User from '../models/user.model.js';
import JobResult from '../models/jobResult.model.js';
import {
  checkGeofence,
  handleDeviceValidation,
} from '../utils/attendanceUtils.js';
import { notifyAdmins } from '../utils/adminNotification.js';
import { BadRequestError, NotFoundError } from '../errors/index.js';

const startWorker = async (name, processor) => {
  const worker = createWorker(name, processor, {
    connection: redis,
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    onFailed: async (job, error) => {
      console.error(`Job ${job.id} in ${name} failed after retries:`, error);
    },
  });
  worker.on('error', (error) => {
    console.error(`Worker ${name} error:`, error);
  });
  await worker.run();
  console.log(`Worker ${name} started`);
};

const startWorkers = async () => {
  const maxRetries = 5;
  let attempt = 1;

  while (attempt <= maxRetries) {
    try {
      await redis.ping();

      await startWorker('extract-data', async (job) => {
        const { image, userId } = job.data;
        try {
          const extractedData = await extractStudentDataFromImage(image);
          if (
            !extractedData.matricNumber ||
            !extractedData.name ||
            !extractedData.programme ||
            !extractedData.level
          ) {
            await JobResult.create({
              jobId: job.id,
              userId,
              type: 'extract-data',
              status: 'failed',
              error: 'Incomplete data extracted from image',
            });
            await sendNotification(
              userId,
              'Failed to activate account: Incomplete data extracted.'
            );
            throw new BadRequestError('Incomplete data extracted from image');
          }

          const user = await User.findByIdAndUpdate(
            userId,
            {
              matricNumber: extractedData.matricNumber,
              name: extractedData.name,
              programme: extractedData.programme,
              level: extractedData.level,
              isActivated: true,
            },
            { new: true }
          );

          await JobResult.create({
            jobId: job.id,
            userId,
            type: 'extract-data',
            result: extractedData,
            status: 'completed',
          });

          await sendNotification(userId, 'Account activated successfully.');
          return extractedData;
        } catch (error) {
          await JobResult.create({
            jobId: job.id,
            userId,
            type: 'extract-data',
            status: 'failed',
            error: error.message,
          });
          await sendNotification(
            userId,
            'Failed to activate account due to an error.'
          );
          throw error;
        }
      });

      await startWorker('send-verification-email', async (job) => {
        const { user, verificationToken } = job.data;
        try {
          await sendVerificationEmail(user, verificationToken);
          console.log(`Verification email sent to ${user.email}`);
        } catch (error) {
          console.error(`Error sending email to ${user.email}:`, error);
          throw error;
        }
      });

      await startWorker('mark-attendance', async (job) => {
        const {
          sessionId,
          deviceId,
          selfie,
          latitude,
          longitude,
          matricNumber,
          userId,
        } = job.data;

        const session = await Session.findById(sessionId)
          .select('status endTime attendees locationId courseId')
          .populate('locationId', 'corners')
          .populate('courseId', 'name')
          .exec();

        if (!session) {
          await JobResult.create({
            jobId: job.id,
            userId,
            type: 'attendance',
            status: 'failed',
            error: 'Session not found',
          });
          throw new NotFoundError('Session not found');
        }

        if (session.status !== 'active' || new Date() > session.endTime) {
          await JobResult.create({
            jobId: job.id,
            userId,
            type: 'attendance',
            status: 'failed',
            error: 'Session has ended or is not active',
          });
          throw new BadRequestError('Session has ended or is not active');
        }

        const hasAlreadyMarked = session.attendees.some(
          (attendee) => attendee.matricNumber === matricNumber
        );

        if (hasAlreadyMarked) {
          await JobResult.create({
            jobId: job.id,
            userId,
            type: 'attendance',
            status: 'failed',
            error:
              'Attendance already marked for this session with this matric number',
          });
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
          await JobResult.create({
            jobId: job.id,
            userId,
            type: 'attendance',
            status: 'failed',
            error: 'You are not within the required location for this class',
          });
          throw new BadRequestError(
            'You are not within the required location for this class'
          );
        }

        const deviceCheck = await handleDeviceValidation(
          matricNumber,
          deviceId
        );
        if (!deviceCheck.success) {
          await JobResult.create({
            jobId: job.id,
            userId,
            type: 'attendance',
            status: 'failed',
            error: deviceCheck.message,
            result: {
              requiresOverride: true,
              conflictInfo: deviceCheck.conflictInfo,
            },
          });
          throw new BadRequestError(deviceCheck.message, {
            requiresOverride: true,
            conflictInfo: deviceCheck.conflictInfo,
          });
        }

        const user = await User.findOne({ matricNumber })
          .select('_id name level')
          .lean();
        if (!user) {
          await JobResult.create({
            jobId: job.id,
            userId,
            type: 'attendance',
            status: 'failed',
            error: 'Student not found with this matric number',
          });
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

        const result = {
          sessionName: session.courseId.name,
          timestamp: new Date(),
          attendeeCount: session.attendees.length,
        };

        await JobResult.create({
          jobId: job.id,
          userId,
          type: 'attendance',
          status: 'completed',
          result,
        });

        await sendNotification(
          userId,
          `Attendance marked successfully for ${session.courseId.name}`
        );

        const channel = `attendance:${sessionId}`;
        await redis.publish(
          channel,
          JSON.stringify({
            matricNumber,
            name: user.name,
            level: user.level,
            timestamp: new Date(),
          })
        );

        return result;
      });

      await startWorker('notification', async (job) => {
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
      return;
    } catch (error) {
      console.error(
        `Failed to start workers (attempt ${attempt}/${maxRetries}):`,
        error
      );
      await notifyAdmins(
        'Worker Startup Failure',
        `Failed to start workers: ${error.message}`
      );
      if (attempt === maxRetries) {
        console.error('Max retries reached. Exiting process.');
        process.exit(1);
      }
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      attempt++;
    }
  }
};

startWorkers();
