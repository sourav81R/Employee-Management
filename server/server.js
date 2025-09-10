const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();


const app = express();
app.use(cors());
app.use(express.json());


const employeeRoutes = require('./routes/employees');
app.use('/api/employees', employeeRoutes);


const PORT = process.env.PORT || 5000;


mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/employee_db', {
useNewUrlParser: true,
useUnifiedTopology: true,
}).then(() => {
console.log('✅ MongoDB connected');
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
console.error('❌ MongoDB connection error:', err);
});