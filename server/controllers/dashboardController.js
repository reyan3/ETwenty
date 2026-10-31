import Report from "../models/Report.js";

// grouped stats for the dashboard charts (public)
export const getStats = async (req, res) => {
  try {
    // Base match filter to ensure only verified receipts contribute to statistics
    const matchVerified = {
      $match: { verificationStatus: "Verified Receipt" },
    };
    const byState = await Report.aggregate([
      matchVerified,
      {
        $group: {
          _id: "$state",
          count: { $sum: 1 },
          avgMileageDrop: { $avg: "$mileageDropPercent" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const byIssueType = await Report.aggregate([
      matchVerified,
      { $group: { _id: "$issueType", count: { $sum: 1 } } },
    ]);

    const byVehicleType = await Report.aggregate([
      matchVerified,
      {
        $group: {
          _id: "$vehicleType",
          count: { $sum: 1 },
          avgMileageDrop: { $avg: "$mileageDropPercent" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const byMonth = await Report.aggregate([
      matchVerified,
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]); //monthly trend

    const avgRepairCostByIssue = await Report.aggregate([
      matchVerified,
      {
        $group: {
          _id: "$issueType",
          avgRepairCost: { $avg: "$repairCost" },
          repairCostCount: {
            $sum: { $cond: [{ $isNumber: "$repairCost" }, 1, 0] },
          },
        },
      },
      { $sort: { avgRepairCost: -1 } },
    ]); //most costly trend

    const byDistrict = await Report.aggregate([
      matchVerified,
      {
        $group: {
          _id: { state: "$state", district: "$district" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 }, // top 10 hotspots only, avoids a huge unreadable chart
    ]); //Top districts trend

    res.json({
      byState,
      byIssueType,
      byVehicleType,
      byMonth,
      avgRepairCostByIssue,
      byDistrict,
    });
  } catch (err) {
    console.error("[Dashboard] Failed to fetch stats:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};
