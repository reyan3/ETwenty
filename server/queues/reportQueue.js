import { Queue } from "bullmq";

// Dynamically use Render's REDIS_URL in production, fallback to localhost only if local
export const connection = process.env.REDIS_URL 
  ? process.env.REDIS_URL 
  : "http://localhost:6379/";

// Task queue
export const reportQueue = new Queue("report-processing-queue", { connection });
