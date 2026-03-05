import PDFDocument from "pdfkit";

export function generatePayslipPdf({ payroll, employee }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text("Employee Payslip", { align: "center" });
    doc.moveDown(1);

    doc.fontSize(12);
    doc.text(`Employee: ${employee?.name || "N/A"}`);
    doc.text(`Employee ID: ${employee?.employeeId || "N/A"}`);
    doc.text(`Email: ${employee?.email || "N/A"}`);
    doc.text(`Payroll Period: ${payroll.month}/${payroll.year}`);
    doc.text(`Status: ${payroll.status}`);
    doc.text(`Payment Date: ${payroll.paymentDate ? new Date(payroll.paymentDate).toLocaleDateString() : "Pending"}`);

    doc.moveDown(1);
    doc.text(`Basic Salary: ${payroll.basicSalary}`);
    doc.text(`HRA: ${payroll.hra}`);
    doc.text(`Bonus: ${payroll.bonus}`);
    doc.text(`Overtime: ${payroll.overtime}`);
    doc.text(`Deductions: ${payroll.deductions}`);
    doc.text(`Attendance Deduction: ${payroll.attendanceDeduction}`);
    doc.text(`Tax: ${payroll.tax}`);

    doc.moveDown(1);
    doc.fontSize(14).text(`Final Salary: ${payroll.finalSalary}`, { underline: true });

    doc.end();
  });
}
