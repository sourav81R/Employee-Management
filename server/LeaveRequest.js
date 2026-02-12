import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, required: true },
  totalDays: { type: Number, default: 0 },
  paidDays: { type: Number, default: 0 },
  unpaidDays: { type: Number, default: 0 },
  salaryCut: { type: Boolean, default: false },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  appliedOn: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('LeaveRequest', leaveRequestSchema);
