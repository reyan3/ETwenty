import { Queue } from "bullmq";

// Use process.env.REDIS_URL provided by Render 
const redisUrl = process.env.REDIS_URL;

export const connection = redisUrl?.startsWith("rediss://")
  ? {
      url: redisUrl,
      tls: {
        rejectUnauthorized: false, // Prevents local self-signed certificate errors
      },
    }
  : redisUrl || { host: "127.0.0.1", port: 6379 };

// Create the task queue
export const reportQueue = new Queue("report-processing-queue", { 
  connection,
  defaultJobOptions: {
    removeOnComplete: true, // Deletes successful jobs immediately
    removeOnFail: { age: 86400 } // Keeps failed jobs for 24 hours then deletes
  }
});;
