const mongoose = require('mongoose');


const employeeSchema = new mongoose.Schema({
name: { type: String, required: true },
email: { type: String, required: true, unique: true },
position: { type: String },
department: { type: String },
salary: { type: Number, default: 0 },
hireDate: { type: Date, default: Date.now }
}, { timestamps: true });


module.exports = mongoose.model('Employee', employeeSchema);