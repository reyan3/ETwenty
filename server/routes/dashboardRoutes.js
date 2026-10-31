import express from "express";
import { getStats } from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/stats", getStats); // public dashboard stats

export default router;