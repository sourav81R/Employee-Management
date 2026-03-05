import mongoose from "mongoose";

const performanceReviewSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    period: { type: String, required: true, trim: true },
    ratings: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    technicalSkill: { type: Number, default: 0 },
    teamwork: { type: Number, default: 0 },
    problemSolving: { type: Number, default: 0 },
    overallScore: { type: Number, default: 0 },
    feedback: { type: String, default: "" },
  },
  { timestamps: true }
);

performanceReviewSchema.index({ employeeId: 1, createdAt: -1 });

export default mongoose.model("PerformanceReview", performanceReviewSchema);
