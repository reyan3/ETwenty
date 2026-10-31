import { Queue } from "bullmq";

const redisUrl = process.env.REDIS_URL;

// Dynamically use Render's REDIS_URL in production, fallback to localhost only if local
export const connection = redisUrl?.startsWith("rediss://")
  ? {
      url: redisUrl,
      tls: {
        rejectUnauthorized: false, // Bypasses self-signed proxy cert validation errors
      },
    }
  : redisUrl || { host: "127.0.0.1", port: 6379 };

// Task queue
export const reportQueue = new Queue("report-processing-queue", { connection });
