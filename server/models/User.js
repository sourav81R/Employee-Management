import mongoose from "mongoose";
import { ROLE_VALUES } from "../utils/constants.js";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ROLE_VALUES, default: "employee" },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    department: { type: String, default: "" },
    phoneNumber: { type: String, default: "" },
    profilePicture: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    employmentStatus: { type: String, enum: ["active", "inactive"], default: "active" },
    shiftId: { type: mongoose.Schema.Types.ObjectId, ref: "Shift", default: null },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
