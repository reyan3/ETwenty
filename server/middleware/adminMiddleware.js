import User from "../models/User.js";

export const verifyAdmin = async (req, res, next) => {
  try {
    if (!req.firebaseUid) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = await User.findOne({
      firebaseUid: req.firebaseUid,
      role: "admin",
    });

    if (!user) {
      return res.status(403).json({ error: "Access denied. Admin privileges required." });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};