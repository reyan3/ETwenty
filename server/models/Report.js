import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    vehicleModel: { type: mongoose.Schema.Types.ObjectId, ref: "VehicleModel" },
    vehicleType: {
      type: String,
      enum: ["car", "motorcycle", "scooter", "commercial"],
    }, 
    vehicleYear: Number,
    issueType: {
      type: String,
      enum: [
        "mileage_drop",
        "engine_wear",
        "carburettor_clog",
        "starting_issue",
        "poor_acceleration",
        "engine_knocking",
        "rough_idling",
        "fuel_leakage",
        "fuel_system_damage",
        "other",
      ],
    },
    mileageDropPercent: Number,
    description: String,
    repairCost: Number,
    location: {
      type: { type: String, default: "Point" },
      coordinates: [Number], // [longitude, latitude]
    },
    petrolStation: { placeId: String, name: String, address: String },
    state: String,
    district: String,

    // Added: Image storage & verification metadata
    evidenceImage: {
      type: {
        url: { type: String, required: true },
        publicId: String,
      },
      required: true,
    },
    verificationStatus: {
      type: String,
      enum: ["Unverified", "Verified Receipt", "Pending Review", "Rejected"],
      default: "Unverified",
    },
    ocrExtractedData: {
      stationName: String,
      date: Date,
      totalAmount: Number,
    },
  },
  { timestamps: true },
);

reportSchema.index({ location: "2dsphere" }); // enables geo queries

export default mongoose.model("Report", reportSchema);