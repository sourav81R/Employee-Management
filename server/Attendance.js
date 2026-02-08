import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  checkIn: { type: Date, default: Date.now },
  checkOut: { type: Date },
  status: { type: String, enum: ['Present', 'Absent', 'On Leave'], default: 'Present' }
}, { timestamps: true });

export default mongoose.model('Attendance', attendanceSchema);