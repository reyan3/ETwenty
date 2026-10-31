import express from "express";
import verifyFirebaseToken from "../middleware/verifyFirebaseToken.js";
import { syncUser } from "../controllers/authController.js";

const router = express.Router();

router.post("/sync", verifyFirebaseToken, syncUser); // creates/fetches user on login

export default router;