import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true }, // links Firebase identity to this doc
    email: { type: String, required: true, unique: true },
    displayName: String,
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
