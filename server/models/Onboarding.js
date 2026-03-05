import mongoose from "mongoose";

const onboardingStepSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const onboardingSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    steps: {
      type: [onboardingStepSchema],
      default: [
        { name: "document upload", completed: false },
        { name: "HR verification", completed: false },
        { name: "manager assignment", completed: false },
        { name: "account activation", completed: false },
      ],
    },
    documentsSubmitted: { type: Boolean, default: false },
    managerAssigned: { type: Boolean, default: false },
    status: { type: String, enum: ["Pending", "In Progress", "Completed"], default: "Pending" },
  },
  { timestamps: true }
);

export default mongoose.model("Onboarding", onboardingSchema);
