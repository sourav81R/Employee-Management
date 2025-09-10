const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');


// Create employee
router.post('/', async (req, res) => {
try {
const emp = new Employee(req.body);
const saved = await emp.save();
res.status(201).json(saved);
} catch (err) {
res.status(400).json({ error: err.message });
}
});


// Read all
router.get('/', async (req, res) => {
try {
const list = await Employee.find().sort({ createdAt: -1 });
res.json(list);
} catch (err) {
res.status(500).json({ error: err.message });
}
});


// Read one
router.get('/:id', async (req, res) => {
try {
const emp = await Employee.findById(req.params.id);
if (!emp) return res.status(404).json({ error: 'Not found' });
res.json(emp);
} catch (err) {
res.status(500).json({ error: err.message });
}
});


// Update
router.put('/:id', async (req, res) => {
try {
const updated = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
res.json(updated);
} catch (err) {
res.status(400).json({ error: err.message });
}
});


// Delete
router.delete('/:id', async (req, res) => {
try {
await Employee.findByIdAndDelete(req.params.id);
res.json({ message: 'Deleted' });
} catch (err) {
res.status(500).json({ error: err.message });
}
});


module.exports = router;