import mongoose from "mongoose";
import { PAYROLL_STATUS } from "../utils/constants.js";

const payrollSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    month: { type: Number, min: 1, max: 12, required: true },
    year: { type: Number, required: true },
    basicSalary: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    overtime: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    attendanceDeduction: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    finalSalary: { type: Number, default: 0 },
    paymentDate: { type: Date, default: null },
    status: { type: String, enum: PAYROLL_STATUS, default: "Processed" },
  },
  { timestamps: true }
);

payrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model("Payroll", payrollSchema);
