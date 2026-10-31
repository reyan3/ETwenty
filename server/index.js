import "dotenv/config.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import userRoutes from "./routes/userRoutes.js";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import { startReportWorker } from "./queues/reportWorker.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import mongoSanitize from "express-mongo-sanitize";

connectDB();

const app = express();
app.use(cors());
app.use(express.json()); 
app.use((req, res, next) => {
  Object.defineProperty(req, "query", {
    configurable: true, // MiddlewareMake req.query writable before the sanitizer inspects it
    enumerable: true,
    value: { ...req.query },
    writable: true,
  });
  next();
});
// Sanitize data against NoSQL injection
app.use(mongoSanitize());
app.use(helmet()); //prevent clickjacking
app.get("/", (req, res) => {
  res.json({ message: "Etwenty backend is healthy!" });
});

app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.listen(process.env.PORT, () =>
  console.log(`Server on ${process.env.PORT}`),
);

// Start the background Redis worker without crashing the API if infrastructure is unavailable.
try {
  startReportWorker();
} catch (error) {
  console.error("Failed to start report worker:", error.message || error);
}
