import PDFDocument from "pdfkit";

const THEME = {
  primary: "#0f766e",
  primaryLight: "#d8f3ef",
  border: "#d1dbe6",
  muted: "#64748b",
  text: "#0f172a",
  white: "#ffffff",
  success: "#065f46",
};

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function formatAmount(value) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(toNumber(value));
  } catch (_err) {
    return `INR ${toNumber(value).toFixed(2)}`;
  }
}

function monthLabel(month, year) {
  const m = toNumber(month);
  const y = toNumber(year);
  if (!m || !y) return `${month}/${year}`;
  const date = new Date(Date.UTC(y, m - 1, 1));
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function drawLabelValue(doc, x, y, label, value, width) {
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(THEME.muted)
    .text(label, x, y, { width, continued: false });

  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor(THEME.text)
    .text(String(value || "-"), x, y + 12, { width });
}

function drawInfoCard(doc, { x, y, w, h, title, rows }) {
  doc
    .roundedRect(x, y, w, h, 8)
    .lineWidth(1)
    .strokeColor(THEME.border)
    .stroke();

  doc
    .rect(x, y, w, 26)
    .fillColor(THEME.primaryLight)
    .fill();

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(THEME.primary)
    .text(title, x + 10, y + 8, { width: w - 20 });

  let rowY = y + 36;
  rows.forEach((row) => {
    drawLabelValue(doc, x + 10, rowY, row.label, row.value, w - 20);
    rowY += 31;
  });
}

function drawPayBreakdown(doc, { x, y, w, h, earnings, deductions }) {
  const halfW = (w - 12) / 2;

  const drawColumn = (title, startX, rows, totalLabel) => {
    doc
      .roundedRect(startX, y, halfW, h, 8)
      .lineWidth(1)
      .strokeColor(THEME.border)
      .stroke();

    doc
      .rect(startX, y, halfW, 26)
      .fillColor(THEME.primaryLight)
      .fill();

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(THEME.primary)
      .text(title, startX + 10, y + 8, { width: halfW - 20 });

    let rowY = y + 36;
    rows.forEach((row) => {
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor(THEME.text)
        .text(row.label, startX + 10, rowY, { width: halfW - 120 });

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(THEME.text)
        .text(formatAmount(row.value), startX + halfW - 110, rowY, {
          width: 100,
          align: "right",
        });

      rowY += 23;
    });

    const total = rows.reduce((sum, row) => sum + toNumber(row.value), 0);

    doc
      .moveTo(startX + 10, y + h - 30)
      .lineTo(startX + halfW - 10, y + h - 30)
      .lineWidth(1)
      .strokeColor(THEME.border)
      .stroke();

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(THEME.text)
      .text(totalLabel, startX + 10, y + h - 22, { width: halfW - 120 });

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(THEME.text)
      .text(formatAmount(total), startX + halfW - 110, y + h - 22, {
        width: 100,
        align: "right",
      });
  };

  drawColumn("Earnings", x, earnings, "Total Earnings");
  drawColumn("Deductions", x + halfW + 12, deductions, "Total Deductions");
}

export function generatePayslipPdf({ payroll, employee }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - 80;

    const companyName = process.env.COMPANY_NAME || "EmployeeHub Pvt. Ltd.";
    const companyAddress = process.env.COMPANY_ADDRESS || "India";
    const companyEmail = process.env.COMPANY_EMAIL || "payroll@employeehub.com";

    const issuedAt = new Date();
    const payslipNo = `PS-${payroll.year}${String(payroll.month).padStart(2, "0")}-${String(employee?.employeeId || employee?._id || "NA")}`;

    // Header block
    doc
      .roundedRect(40, 32, contentWidth, 86, 10)
      .fillColor(THEME.primary)
      .fill();

    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .fillColor(THEME.white)
      .text(companyName, 56, 50, { width: contentWidth - 180 });

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#d1fae5")
      .text(companyAddress, 56, 78, { width: contentWidth - 180 })
      .text(companyEmail, 56, 93, { width: contentWidth - 180 });

    doc
      .font("Helvetica-Bold")
      .fontSize(24)
      .fillColor(THEME.white)
      .text("PAYSLIP", pageWidth - 210, 58, { width: 150, align: "right" });

    // Meta row
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(THEME.muted)
      .text(`Payslip No: ${payslipNo}`, 40, 130)
      .text(`Generated: ${issuedAt.toLocaleString()}`, pageWidth - 260, 130, { width: 220, align: "right" });

    // Info cards
    drawInfoCard(doc, {
      x: 40,
      y: 152,
      w: (contentWidth - 12) / 2,
      h: 168,
      title: "Employee Information",
      rows: [
        { label: "Employee Name", value: employee?.name || "N/A" },
        { label: "Employee ID", value: employee?.employeeId || "N/A" },
        { label: "Email", value: employee?.email || "N/A" },
        { label: "Department", value: employee?.department || "-" },
      ],
    });

    drawInfoCard(doc, {
      x: 40 + (contentWidth - 12) / 2 + 12,
      y: 152,
      w: (contentWidth - 12) / 2,
      h: 168,
      title: "Payroll Summary",
      rows: [
        { label: "Payroll Period", value: monthLabel(payroll.month, payroll.year) },
        { label: "Payment Status", value: payroll.status || "Processed" },
        { label: "Payment Date", value: payroll.paymentDate ? new Date(payroll.paymentDate).toLocaleDateString() : "Pending" },
        { label: "Net Salary", value: formatAmount(payroll.finalSalary) },
      ],
    });

    // Earnings vs deductions
    drawPayBreakdown(doc, {
      x: 40,
      y: 336,
      w: contentWidth,
      h: 178,
      earnings: [
        { label: "Basic Salary", value: payroll.basicSalary },
        { label: "House Rent Allowance (HRA)", value: payroll.hra },
        { label: "Bonus", value: payroll.bonus },
        { label: "Overtime", value: payroll.overtime },
      ],
      deductions: [
        { label: "Other Deductions", value: payroll.deductions },
        { label: "Attendance Deduction", value: payroll.attendanceDeduction },
        { label: "Tax", value: payroll.tax },
      ],
    });

    // Net pay highlight
    doc
      .roundedRect(40, 530, contentWidth, 62, 8)
      .fillColor("#ecfdf5")
      .fill();

    doc
      .roundedRect(40, 530, contentWidth, 62, 8)
      .lineWidth(1)
      .strokeColor("#a7f3d0")
      .stroke();

    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor(THEME.success)
      .text("NET PAY", 56, 554, { width: 170 });

    doc
      .font("Helvetica-Bold")
      .fontSize(24)
      .fillColor(THEME.success)
      .text(formatAmount(payroll.finalSalary), pageWidth - 260, 546, { width: 200, align: "right" });

    // Footer
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(THEME.muted)
      .text(
        "This is a system-generated payslip and does not require a physical signature.",
        40,
        612,
        { width: contentWidth, align: "center" }
      )
      .text(
        `Confidential payroll document | Generated by ${companyName}`,
        40,
        626,
        { width: contentWidth, align: "center" }
      );

    doc.end();
  });
}
