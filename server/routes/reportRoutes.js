import express from "express";
import verifyFirebaseToken from "../middleware/verifyFirebaseToken.js";
import rateLimit from "express-rate-limit";
import multer from "multer";
import {
  createReport,
  getMyReports,
  getReportById,
  updateReport,
  deleteReport,
  listReports,
  getHeatmapData,
  getStationRiskScores,
} from "../controllers/reportController.js";

const upload = multer({ storage: multer.memoryStorage() }); // Keeps file in RAM as a Buffer
const router = express.Router();
// Rate limiter
const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 10, // Limit each IP to 10 report submissions per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,
  message: {
    error:
      "Too many reports submitted from this IP, please try again after 15 minutes.",
  },
});

// Route with multer middleware catching the file field named "receipt"
router.post(
  "/",
  verifyFirebaseToken,
  upload.single("receipt"),
  reportLimiter,
  createReport,
); // auth required to submit
router.get("/", listReports); // public listing
router.get("/heatmap", getHeatmapData); // public heatmap data
router.get("/station-risk", getStationRiskScores); // public
router.get("/mine", verifyFirebaseToken, getMyReports);
router.get("/:id", verifyFirebaseToken, getReportById); 
router.put("/:id", verifyFirebaseToken, updateReport); 
router.delete("/:id", verifyFirebaseToken, deleteReport); 

export default router;
