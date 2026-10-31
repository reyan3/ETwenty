import express from "express";
import { checkCompatibility } from "../controllers/vehicleController.js";

const router = express.Router();

router.get("/check", checkCompatibility); // public compatibility lookup

export default router;