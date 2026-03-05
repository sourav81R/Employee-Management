import Employee from "../models/Employee.js";
import User from "../models/User.js";
import Payroll from "../models/Payroll.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createAuditLog } from "../services/auditService.js";
import { createNotification } from "../services/notificationService.js";

export const listEmployees = asyncHandler(async (req, res) => {
  const role = String(req.user.role || "").toLowerCase();
  let query = {};

  if (role === "manager") {
    query = { managerId: req.user._id };
  }

  const employees = await Employee.find(query).sort({ createdAt: -1 });
  return res.json(employees);
});

export const createEmployee = asyncHandler(async (req, res) => {
  const payload = req.body || {};

  const existing = await Employee.findOne({
    $or: [{ employeeId: payload.employeeId }, { email: String(payload.email || "").toLowerCase().trim() }],
  });

  if (existing) {
    return res.status(409).json({ message: "Employee ID or email already exists" });
  }

  const linkedUser = await User.findOne({ email: String(payload.email || "").toLowerCase().trim() });

  const employee = await Employee.create({
    ...payload,
    email: String(payload.email || "").toLowerCase().trim(),
    userId: linkedUser?._id || null,
  });

  await createAuditLog({
    userId: req.user._id,
    action: "employee created",
    targetType: "Employee",
    targetId: employee._id,
    metadata: { employeeId: employee.employeeId, email: employee.email },
  });

  return res.status(201).json(employee);
});

export const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!employee) return res.status(404).json({ message: "Employee not found" });

  await createAuditLog({
    userId: req.user._id,
    action: "employee updated",
    targetType: "Employee",
    targetId: employee._id,
  });

  return res.json(employee);
});

export const deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findByIdAndDelete(req.params.id);
  if (!employee) return res.status(404).json({ message: "Employee not found" });

  await createAuditLog({
    userId: req.user._id,
    action: "employee deleted",
    targetType: "Employee",
    targetId: employee._id,
  });

  return res.json({ message: "Employee deleted successfully" });
});

export const payEmployeeSalary = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) return res.status(404).json({ message: "Employee not found" });

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  let payroll = await Payroll.findOne({ employeeId: employee._id, month, year });

  if (!payroll) {
    payroll = await Payroll.create({
      employeeId: employee._id,
      month,
      year,
      basicSalary: Number(employee.salary) || 0,
      hra: 0,
      bonus: 0,
      overtime: 0,
      deductions: 0,
      tax: 0,
      attendanceDeduction: 0,
      finalSalary: Number(employee.salary) || 0,
      paymentDate: now,
      status: "Paid",
    });
  } else {
    payroll.paymentDate = now;
    payroll.status = "Paid";
    await payroll.save();
  }

  employee.lastPaid = now;
  await employee.save();

  const recipientUser = employee.userId || (await User.findOne({ email: employee.email }).select("_id"))?._id;
  if (recipientUser) {
    await createNotification({
      userId: recipientUser,
      title: "Payroll Processed",
      message: `Your salary for ${month}/${year} has been processed.`,
      type: "payroll",
    });
  }

  await createAuditLog({
    userId: req.user._id,
    action: "salary processed",
    targetType: "Employee",
    targetId: employee._id,
    metadata: { month, year, finalSalary: payroll.finalSalary },
  });

  return res.json({ message: "Salary paid successfully", payroll });
});

export const managerEmployees = asyncHandler(async (req, res) => {
  const employees = await Employee.find({ managerId: req.params.managerId }).sort({ createdAt: -1 });
  return res.json(employees);
});

export const managerTeamStats = asyncHandler(async (req, res) => {
  const currentRole = String(req.user.role || "").toLowerCase();

  let query = {};
  if (currentRole === "manager") {
    query = { managerId: req.user._id };
  }

  const team = await Employee.find(query);
  const now = new Date();
  const paid = team.filter((item) => item.lastPaid && item.lastPaid.getMonth() === now.getMonth() && item.lastPaid.getFullYear() === now.getFullYear()).length;

  const totalSalary = team.reduce((sum, item) => sum + (Number(item.salary) || 0), 0);

  return res.json({
    teamSize: team.length,
    paid,
    unpaid: Math.max(0, team.length - paid),
    totalSalary,
  });
});
