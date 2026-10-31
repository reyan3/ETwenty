import express from "express";
import { getUserProfile, deleteUserAccount } from "../controllers/userController.js";
import verifyFirebaseToken from "../middleware/verifyFirebaseToken.js";

const router = express.Router();

// GET /api/user/profile - Fetch current user's submitted reports & statistics
router.get("/profile", verifyFirebaseToken, getUserProfile);

// DELETE /api/user/account - Permanently delete user account & submitted data
router.delete("/account", verifyFirebaseToken, deleteUserAccount);

export default router;