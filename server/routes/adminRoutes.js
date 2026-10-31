import express from "express";
import { getAllReports, updateReportStatus } from "../controllers/adminController.js";
import verifyFirebaseToken from "../middleware/verifyFirebaseToken.js";
import { getUserCount } from "../controllers/adminController.js";
import { deleteReport } from "../controllers/adminController.js";
import { verifyAdmin } from "../middleware/adminMiddleware.js"; // Assumes your custom admin check

const router = express.Router();

// Protect all admin routes with token check + admin role check
router.get("/reports", verifyFirebaseToken, verifyAdmin, getAllReports);
router.get("/users/count", verifyFirebaseToken, verifyAdmin, getUserCount);
router.patch("/reports/:id/status", verifyFirebaseToken, verifyAdmin, updateReportStatus);
router.delete("/reports/:id", verifyFirebaseToken, verifyAdmin, deleteReport); 

export default router;