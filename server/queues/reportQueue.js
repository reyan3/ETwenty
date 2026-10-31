import { Queue } from "bullmq";

// Dynamically use Render's REDIS_URL in production, fallback to localhost only if local
const connection = process.env.REDIS_URL 
  ? process.env.REDIS_URL 
  : { host: "127.0.0.1", port: 6379 };

// Task queue
export const reportQueue = new Queue("report-processing-queue", { connection });
