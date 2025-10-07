import pkg from 'bullmq';
const { Queue, Worker } = pkg;
import Redis from 'ioredis';
import { notifyAdmins } from '../utils/adminNotification.js';

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableOfflineQueue: true,
  tls: process.env.REDIS_URL?.startsWith('rediss://')
    ? { rejectUnauthorized: false }
    : undefined,
});

redis.on('error', (error) => {
  console.error('Redis connection error:', error);
  notifyAdmins(
    'Redis Connection Failure',
    `Redis connection failed: ${error.message}`
  );
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('reconnecting', () => {
  console.log('Reconnecting to Redis...');
});

export const createQueue = (name) =>
  new Queue(name, {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    },
  });

export const createWorker = (name, processor) =>
  new Worker(name, processor, {
    connection: redis,
    autorun: false,
  });

export default redis;
