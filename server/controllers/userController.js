import Report from "../models/Report.js";
import User from "../models/User.js";

// Fetch current user's profile stats and reports
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.firebaseUid;
    const user = await User.findOne({ firebaseUid: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const reports = await Report.find({ user: user._id }).sort({ createdAt: -1 });
    const stats = {
      totalReports: 0,
      verifiedReports: 0,
      pendingReports: 0,
    };

    for (const report of reports) {
      stats.totalReports += 1;

      if (report.verificationStatus === "Verified Receipt") {
        stats.verifiedReports += 1;
      } else if (report.verificationStatus === "Pending Review") {
        stats.pendingReports += 1;
      }
    }

    res.status(200).json({
      reports,
      stats,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile details" });
  }
};

// Delete user account & user-created data
export const deleteUserAccount = async (req, res) => {
  try {
    const userId = req.firebaseUid;
    const user = await User.findOne({ firebaseUid: userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await Report.deleteMany({ user: user._id });
    await User.findOneAndDelete({ firebaseUid: userId });

    res.status(200).json({ message: "Account and associated data deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete account" });
  }
};