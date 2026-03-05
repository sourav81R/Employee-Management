import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true, trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    position: { type: String, default: "" },
    department: { type: String, default: "" },
    salary: { type: Number, default: 0 },
    lastPaid: { type: Date, default: null },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reportingTo: { type: String, default: "" },
    shiftId: { type: mongoose.Schema.Types.ObjectId, ref: "Shift", default: null },
  },
  { timestamps: true }
);

employeeSchema.index({ email: 1 });
employeeSchema.index({ managerId: 1 });

export default mongoose.model("Employee", employeeSchema);
