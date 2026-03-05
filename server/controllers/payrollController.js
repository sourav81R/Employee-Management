import Payroll from "../models/Payroll.js";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { calculateAttendanceDeduction, calculateFinalSalary } from "../services/payrollService.js";
import { generatePayslipPdf } from "../services/pdfService.js";
import { createAuditLog } from "../services/auditService.js";
import { createNotification } from "../services/notificationService.js";

async function getEmployeeForUser(user) {
  return Employee.findOne({
    $or: [
      { userId: user._id },
      { email: String(user.email || "").toLowerCase().trim() },
    ],
  });
}

export const processPayroll = asyncHandler(async (req, res) => {
  const { employeeId, month, year, basicSalary, hra = 0, bonus = 0, overtime = 0, deductions = 0, tax = 0, status = "Processed" } = req.body;

  const employee = await Employee.findById(employeeId);
  if (!employee) return res.status(404).json({ message: "Employee not found" });

  const payrollMonth = Number(month);
  const payrollYear = Number(year);

  if (!payrollMonth || !payrollYear) {
    return res.status(400).json({ message: "month and year are required" });
  }

  const linkedUser = employee.userId || (await User.findOne({ email: employee.email }).select("_id"))?._id;

  const attendanceDeduction = linkedUser
    ? await calculateAttendanceDeduction({
      userId: linkedUser,
      monthlySalary: Number(basicSalary || employee.salary || 0),
      month: payrollMonth,
      year: payrollYear,
    })
    : 0;

  const finalSalary = calculateFinalSalary({
    basicSalary: Number(basicSalary ?? employee.salary ?? 0),
    hra,
    bonus,
    overtime,
    deductions,
    tax,
    attendanceDeduction,
  });

  const payroll = await Payroll.findOneAndUpdate(
    { employeeId: employee._id, month: payrollMonth, year: payrollYear },
    {
      $set: {
        employeeId: employee._id,
        month: payrollMonth,
        year: payrollYear,
        basicSalary: Number(basicSalary ?? employee.salary ?? 0),
        hra: Number(hra),
        bonus: Number(bonus),
        overtime: Number(overtime),
        deductions: Number(deductions),
        tax: Number(tax),
        attendanceDeduction,
        finalSalary,
        status,
        paymentDate: status === "Paid" ? new Date() : null,
      },
    },
    { new: true, upsert: true }
  );

  if (status === "Paid") {
    employee.lastPaid = new Date();
    await employee.save();
  }

  if (linkedUser) {
    await createNotification({
      userId: linkedUser,
      title: "Payroll Updated",
      message: `Payroll for ${payrollMonth}/${payrollYear} was ${String(status).toLowerCase()}.`,
      type: "payroll",
    });
  }

  await createAuditLog({
    userId: req.user._id,
    action: "payroll processed",
    targetType: "Payroll",
    targetId: payroll._id,
    metadata: { employeeId: employee._id, month: payrollMonth, year: payrollYear },
  });

  return res.json(payroll);
});

export const listPayroll = asyncHandler(async (req, res) => {
  const role = String(req.user.role || "").toLowerCase();

  if (role === "employee") {
    const employee = await getEmployeeForUser(req.user);
    if (!employee) return res.json([]);

    const payroll = await Payroll.find({ employeeId: employee._id }).sort({ year: -1, month: -1 });
    return res.json(payroll);
  }

  if (role === "manager") {
    const team = await Employee.find({ managerId: req.user._id }).select("_id");
    const payroll = await Payroll.find({ employeeId: { $in: team.map((item) => item._id) } }).sort({ year: -1, month: -1 });
    return res.json(payroll);
  }

  const payroll = await Payroll.find().sort({ year: -1, month: -1 }).populate("employeeId", "name employeeId email department");
  return res.json(payroll);
});

export const myPayrollHistory = asyncHandler(async (req, res) => {
  const employee = await getEmployeeForUser(req.user);
  if (!employee) return res.json([]);

  const payroll = await Payroll.find({ employeeId: employee._id }).sort({ year: -1, month: -1 });
  return res.json(payroll);
});

export const getPayrollById = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id).populate("employeeId", "name employeeId email department");
  if (!payroll) return res.status(404).json({ message: "Payroll not found" });
  return res.json(payroll);
});

export const downloadPayslip = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id);
  if (!payroll) return res.status(404).json({ message: "Payroll not found" });

  const employee = await Employee.findById(payroll.employeeId);
  if (!employee) return res.status(404).json({ message: "Employee not found" });

  const role = String(req.user.role || "").toLowerCase();
  if (role === "employee") {
    const ownEmployee = await getEmployeeForUser(req.user);
    if (!ownEmployee || String(ownEmployee._id) !== String(employee._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }
  }

  const pdfBuffer = await generatePayslipPdf({ payroll, employee });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=payslip-${employee.employeeId || employee._id}-${payroll.month}-${payroll.year}.pdf`);
  return res.send(pdfBuffer);
});
