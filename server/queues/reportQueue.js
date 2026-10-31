import { Queue } from "bullmq";

// Use process.env.REDIS_URL provided by Render
export const connection = process.env.REDIS_URL;

// Create the task queue
export const reportQueue = new Queue("report-processing-queue", { connection });
