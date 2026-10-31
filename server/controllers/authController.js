import User from "../models/User.js";

// creates user in DB on first login, else returns existing user
export const syncUser = async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.firebaseUid });
    if (!user) {
      const isInitialAdmin = req.email === process.env.ADMIN_EMAIL;

      user = await User.create({
        firebaseUid: req.firebaseUid,
        email: req.email,
        displayName: req.body.displayName || "User",
        role: isInitialAdmin ? "admin" : "user" // <--- Assigns admin role automatically if it's your email
      });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to sync user" });
  }
};