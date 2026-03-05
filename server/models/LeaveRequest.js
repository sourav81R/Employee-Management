import mongoose from "mongoose";
import { LEAVE_STATUS } from "../utils/constants.js";

const leaveRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true },
    totalDays: { type: Number, default: 0 },
    paidDays: { type: Number, default: 0 },
    unpaidDays: { type: Number, default: 0 },
    salaryCut: { type: Boolean, default: false },
    status: { type: String, enum: LEAVE_STATUS, default: "Pending" },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    appliedOn: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

leaveRequestSchema.index({ userId: 1, status: 1 });

export default mongoose.model("LeaveRequest", leaveRequestSchema);
