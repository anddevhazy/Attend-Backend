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

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
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

console.log('Starting workers initialization...');

const startWorkers = async () => {
  const MAX_RETRIES = 5;
  let attempt = 1;

  while (attempt <= MAX_RETRIES) {
    try {
      // Test Redis connection
      await redis.ping();
      console.log('Redis is connected and responsive');

      // Helper to start a worker
      const start = async (name, processor) => {
        const worker = createWorker(name, processor, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
        });

        worker.on('failed', (job, err) => {
          console.error(`Job ${job?.id} failed:`, err.message);
        });

        worker.on('error', (err) => {
          console.error(`Worker ${name} error:`, err);
        });

        await worker.run(); // This starts it!
        console.log(`Worker "${name}" is running`);
      };

      // Start only the email worker for now (add others later)
      await start('send-verification-email', async (job) => {
        const { user, verificationToken } = job.data;
        await sendVerificationEmail(user, verificationToken);
        console.log(`Email sent to ${user.email}`);
      });

      console.log('All workers started successfully!');
      return;

    } catch (err) {
      console.error(`Attempt ${attempt} failed:`, err.message);
      if (attempt === MAX_RETRIES) {
        console.error('GIVING UP: Workers failed to start');
        process.exit(1);
      }
      const delay = 2000 * attempt;
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
      attempt++;
    }
  }
};

startWorkers().catch(err => {
  console.error('FATAL: Could not start workers:', err);
  process.exit(1);
});
 

