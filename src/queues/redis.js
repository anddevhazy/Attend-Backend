import { Queue, Worker, QueueScheduler } from 'bullmq';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const createQueue = (name) => new Queue(name, { connection: redis });
export const createWorker = (name, processor) =>
  new Worker(name, processor, { connection: redis });
export const createScheduler = (name) =>
  new QueueScheduler(name, { connection: redis });

export default redis;
