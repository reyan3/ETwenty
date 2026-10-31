import Report from "../models/Report.js";
import User from "../models/User.js";

export const getAllReports = async (req, res) => {
  try {
    // Extract page and limit from query params (defaults: page 1, 10 items per page)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination math
    const totalReports = await Report.countDocuments();

    // Fetch paginated reports
    const reports = await Report.find()
      .populate("user", "email displayName") // Pulls user details if linked
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      reports,
      currentPage: page,
      totalPages: Math.ceil(totalReports / limit),
      totalReports,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reports" });
  }
};
// Get User Count
export const getUserCount = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    res.status(200).json({ totalUsers });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user count" + err.message });
  }
};

// Update a report's verification status (Approve / Reject)
export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { verificationStatus } = req.body; // Expects "Verified Receipt" or "Verification Failed"

    const updatedReport = await Report.findByIdAndUpdate(
      id,
      { verificationStatus },
      { new: true }
    );

    if (!updatedReport) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.status(200).json(updatedReport);
  } catch (err) {
    res.status(500).json({ error: "Failed to update report status" });
  }
};

// Delete a report by ID
export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedReport = await Report.findByIdAndDelete(id);

    if (!deletedReport) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.status(200).json({ message: "Report deleted successfully", id });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete report" });
  }
};