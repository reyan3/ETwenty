import Report from "../models/Report.js";
import User from "../models/User.js";
import { bucket } from "../config/firebaseAdmin.js";
import { reportQueue } from "../queues/reportQueue.js";

const getCurrentUser = async (req, res) => {
  const user = await User.findOne({ firebaseUid: req.firebaseUid });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return null;
  }
  return user;
};

// Saves a new issue report for the time being till reportWorker.js work in bg as redis (auth required)
export const createReport = async (req, res) => {
  try {
    const uploadedFile = req.file;
    if (!uploadedFile) {
      return res.status(400).json({ error: "A receipt image is required" });
    }

    const user = await getCurrentUser(req, res);
    if (!user) return;

    const reportData = { ...req.body };
    // 1. Upload receipt buffer to Firebase Storage
    const fileName = `receipts/${Date.now()}_${uploadedFile.originalname}`;
    const fileRef = bucket.file(fileName);

    const blobStream = fileRef.createWriteStream({
      metadata: {
        contentType: uploadedFile.mimetype,
      },
    });

    await new Promise((resolve, reject) => {
      blobStream.on("error", (error) => reject(error));
      blobStream.on("finish", () => resolve());
      blobStream.end(uploadedFile.buffer);
    });

    await fileRef.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    const evidenceImage = {
      url: publicUrl,
      publicId: fileName,
    };

    // 2. Save Report to MongoDB immediately as "Pending Review"
    const report = await Report.create({
      ...reportData,
      user: user._id,
      evidenceImage,
      verificationStatus: "Pending Review",
    });

    // 3. Push OCR task to Redis Queue for background processing
    await reportQueue.add("process-receipt-ocr", {
      reportId: report._id,
      fileBuffer: uploadedFile.buffer,
      mimeType: uploadedFile.mimetype,
      expectedStationName: reportData.petrolStation?.name || "",
    });
    
    return res.status(202).json({
      message:
        "Report submitted successfully! Receipt verification is running in the background.",
      report,
    });
  } catch (err) {
    console.error("Create Report Error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Failed to create report" });
  }
};

// Get all Reports
export const getMyReports = async (req, res) => {
  try {
    const user = await getCurrentUser(req, res);
    if (!user) return;

    const reports = await Report.find({
      user: user._id,
    }).sort({
      createdAt: -1,
    });

    res.json(reports);
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch reports",
    });
  }
};

// Get specific report
export const getReportById = async (req, res) => {
  try {
    const user = await getCurrentUser(req, res);
    if (!user) return;

    const report = await Report.findOne({
      _id: req.params.id,
      user: user._id,
    });

    if (!report) {
      return res.status(404).json({
        error: "Report not found",
      });
    }

    res.json(report);
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch report",
    });
  }
};

// Update report
export const updateReport = async (req, res) => {
  try {
    const user = await getCurrentUser(req, res);
    if (!user) return;

    const report = await Report.findOneAndUpdate(
      {
        _id: req.params.id,
        user: user._id,
      },
      req.body,
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!report) {
      return res.status(404).json({
        error: "Report not found",
      });
    }

    res.json(report);
  } catch (err) {
    res.status(500).json({
      error: "Failed to update report",
    });
  }
};

// Delete specific report
export const deleteReport = async (req, res) => {
  try {
    const user = await getCurrentUser(req, res);
    if (!user) return;

    const report = await Report.findOneAndDelete({
      _id: req.params.id,
      user: user._id,
    });

    if (!report) {
      return res.status(404).json({
        error: "Report not found",
      });
    }

    res.json({
      message: "Report deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed to delete report",
    });
  }
};

// lists reports, optional filters with pagination (public)
export const listReports = async (req, res) => {
  try {
    const {
      state,
      issueType,
      vehicleType,
      search,
      page = 1,
      limit = 10,
    } = req.query;
    // Base query: ONLY show approved/verified reports for public browsing
    const filter = { verificationStatus: "Verified Receipt" };
    if (state) filter.state = state;
    if (issueType) filter.issueType = issueType;
    if (vehicleType) filter.vehicleType = vehicleType;
    if (search) {
      const escapedSearch = String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { description: { $regex: escapedSearch, $options: "i" } },
        { state: { $regex: escapedSearch, $options: "i" } },
        { district: { $regex: escapedSearch, $options: "i" } },
      ];
    } // Match any field, treating search input literally and ignoring case.

    const requestedPage = Number(page);
    const requestedLimit = Number(limit);
    const pageNum = Number.isFinite(requestedPage)
      ? Math.max(1, Math.trunc(requestedPage))
      : 1;
    const limitNum = Number.isFinite(requestedLimit)
      ? Math.min(100, Math.max(1, Math.trunc(requestedLimit)))
      : 10;
    const skip = (pageNum - 1) * limitNum;

    // how many reports
    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // total num of reports
    const total = await Report.countDocuments(filter);

    res.json({
      reports,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum), // suppose 43 reports and limit is 10 -> 43/10 = 4.3 -> 5
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reports" });
  }
};
// Constants for Precise Calculation
const CONFIDENCE_THRESHOLD = 5; // Min reports required for full risk score validity
const TEMPORAL_DECAY_MONTHS = 6; // Issues older than 6 months have reduced impact
const MIN_REPORT_COUNT = 2; // Exclude stations with fewer reports than this
const SEVERE_MULTIPLIER = 1.5; // Severe reports are 50% more impactful
const MILEAGE_DROP_FACTOR = 0.5; // extra mileage drop impact on total score
const SEVERE_ISSUE_TYPES = [
  "engine_wear",
  "carburettor_clog",
  "starting_issue",
  "engine_knocking",
  "fuel_leakage",
  "fuel_system_damage",
];

export const getStationRiskScores = async (req, res) => {
  try {
    const stations = await Report.aggregate([
      // Only include verified reports
      { $match: { verificationStatus: "Verified Receipt" } },
      {
        $group: {
          _id: "$petrolStation.placeId", 
          stationName: { $first: "$petrolStation.name" }, 
          reportCount: { $sum: 1 },
          avgMileageDrop: { $avg: "$mileageDropPercent" },
          avgRepairCost: { $avg: "$repairCost" },
          lat: { $first: { $arrayElemAt: ["$location.coordinates", 1] } },
          lng: { $first: { $arrayElemAt: ["$location.coordinates", 0] } },
          
          severeReportCount: {
            $sum: {
              $cond: [
                { $in: ["$issueType", SEVERE_ISSUE_TYPES] },
                1,
                0,
              ],
            },
          },

          // Calculate a basic temporal weight per report (new data > old data)
          // formula: (days since created) / maxDays (normalized to 0-1 range)
          totalTemporalWeight: {
            $sum: {
              $divide: [
                1, // Baseline weight (prevent zero division error)
                {
                  $add: [
                    1,
                    {
                      $divide: [
                        { $subtract: [new Date(), "$createdAt"] }, // report age
                        { $multiply: [TEMPORAL_DECAY_MONTHS, 30, 24, 60, 60, 1000] }, // decay rate in ms
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
      },
      
      // Filter out locations with statistically insufficient data
      { $match: { reportCount: { $gte: MIN_REPORT_COUNT } } },
    ]);

    const scored = stations.map((s) => {
      // Step A: Calculate Volume Component (using volume and temporal weight)
      // This increases with volume, but decelerates (square root) and decays with time
      let scoreVolume = s.reportCount * Math.sqrt(s.totalTemporalWeight || 1);

      // Step B: Apply Severe Penalty (Severe Count / Total Count * 1.5)
      if (s.severeReportCount > 0) {
        scoreVolume += scoreVolume * ((s.severeReportCount / s.reportCount) * SEVERE_MULTIPLIER);
      }

      // Step C: Apply Mileage Drop Penalty (Average Mileage Drop % * 0.5)
      scoreVolume += (s.avgMileageDrop || 0) * MILEAGE_DROP_FACTOR;

      // Step D: Normalized to a 0-100 Range (Cap of 100)
      // Instead of infinite score growth, we cap it at 100 to make the risk categories stable.
      let finalScore = (scoreVolume / 10) * 100;
      if (finalScore > 100) finalScore = 100;
      if (finalScore < 0) finalScore = 0;

      // Step E: Statistical Confidence Capping
      // If reportCount < Threshold, scale down the score slightly (we are less confident)
      if (s.reportCount < CONFIDENCE_THRESHOLD) {
        finalScore = finalScore * (s.reportCount / CONFIDENCE_THRESHOLD);
      }

      // 3. Robust, Scalable Risk Level Categories
      let riskLevel = "LOW";
      if (finalScore >= 80) riskLevel = "CRITICAL";
      else if (finalScore >= 50) riskLevel = "HIGH";
      else if (finalScore >= 20) riskLevel = "MEDIUM";

      return {
        stationName: s.stationName,
        stationId: s._id,
        reportCount: s.reportCount,
        severeReportCount: s.severeReportCount,
        avgMileageDrop: Math.round(s.avgMileageDrop || 0),
        avgRepairCost: Math.round(s.avgRepairCost || 0),
        riskScore: Math.round(finalScore),
        riskLevel,
        lat: s.lat,
        lng: s.lng,
      };
    });

    res.json(scored.sort((a, b) => b.riskScore - a.riskScore)); // highest risk first
  } catch (err) {
    console.error("Precise Risk score error:", err);
    res.status(500).json({ error: "Failed to calculate precise risk scores" });
  }
};

// aggregates reports by station for heatmap weight (public)
export const getHeatmapData = async (req, res) => {
  try {
    const data = await Report.aggregate([
      // Only verified reports
      { $match: { verificationStatus: "Verified Receipt" } },
      {
        $group: {
          _id: "$petrolStation.placeId", // group by unique placeId
          lat: { $first: { $arrayElemAt: ["$location.coordinates", 1] } },
          lng: { $first: { $arrayElemAt: ["$location.coordinates", 0] } },
          
          // Advanced Heatmap Weighting:
          // A simple sum(1) creates a simple popularity map.
          // We can make the heatmap reflect risk by adding points for severity/newness.
          simpleCount: { $sum: 1 }, // used in Phase 2 scaling not now
          
          // Severe Weighting: Severe reports add 5 points instead of 1 point
          riskWeightedCount: {
            $sum: {
              $cond: [
                { $in: ["$issueType", SEVERE_ISSUE_TYPES] },
                5, // Severe report weight
                1, // Default report weight
              ],
            },
          },
        },
      },
    ]);
    
    // Process data to output clean lat/lng/weight objects
    const formattedData = data.map((d) => ({
      lat: d.lat,
      lng: d.lng,
      // The frontend uses 'weight' for the heatmap gradient
      weight: d.riskWeightedCount, 
    }));

    res.json(formattedData);
  } catch (err) {
    console.error("Heatmap aggregate error:", err);
    res.status(500).json({ error: "Failed to generate heatmap data" });
  }
};
