import React, { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { apiGet, apiPost, downloadFile } from "../utils/http";
import "../styles/enterprise.css";

export default function PayrollPage() {
  const { user } = useContext(AuthContext);
  const role = String(user?.role || "").toLowerCase();
  const canProcess = ["admin", "hr", "manager"].includes(role);

  const [employees, setEmployees] = useState([]);
  const [payrollRows, setPayrollRows] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    employeeId: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basicSalary: "",
    hra: "0",
    bonus: "0",
    overtime: "0",
    deductions: "0",
    tax: "0",
    status: "Processed",
  });

  const employeeMap = useMemo(() => {
    const map = new Map();
    employees.forEach((emp) => map.set(String(emp._id), emp));
    return map;
  }, [employees]);

  async function loadData() {
    setError("");
    try {
      const [payrollData, employeeData] = await Promise.all([
        apiGet(role === "employee" ? "/api/payroll/my" : "/api/payroll"),
        canProcess ? apiGet(role === "manager" ? `/api/manager-employees/${user?._id}` : "/api/employees") : Promise.resolve([]),
      ]);

      setPayrollRows(Array.isArray(payrollData) ? payrollData : []);
      setEmployees(Array.isArray(employeeData) ? employeeData : []);
    } catch (err) {
      setError(err.message || "Failed to load payroll data");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleProcess(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...form,
        month: Number(form.month),
        year: Number(form.year),
        basicSalary: Number(form.basicSalary),
        hra: Number(form.hra),
        bonus: Number(form.bonus),
        overtime: Number(form.overtime),
        deductions: Number(form.deductions),
        tax: Number(form.tax),
      };

      await apiPost("/api/payroll/process", payload);
      setSuccess("Payroll processed successfully");
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to process payroll");
    }
  }

  async function handleDownload(p) {
    try {
      await downloadFile(`/api/payroll/${p._id}/payslip`, `payslip-${p.month}-${p.year}.pdf`);
    } catch (err) {
      setError(err.message || "Failed to download payslip");
    }
  }

  return (
    <div className="enterprise-page">
      <div className="enterprise-header">
        <h1>Payroll</h1>
        <span className="enterprise-pill">Role: {role}</span>
      </div>

      {error ? <p className="enterprise-error">{error}</p> : null}
      {success ? <p className="enterprise-success">{success}</p> : null}

      {canProcess && (
        <section className="enterprise-section enterprise-card">
          <h2>Process Payroll</h2>
          <form className="enterprise-form" onSubmit={handleProcess}>
            <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required>
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>{emp.name} ({emp.employeeId})</option>
              ))}
            </select>
            <input type="number" placeholder="Month" min="1" max="12" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} required />
            <input type="number" placeholder="Year" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} required />
            <input type="number" placeholder="Basic Salary" value={form.basicSalary} onChange={(e) => setForm({ ...form, basicSalary: e.target.value })} required />
            <input type="number" placeholder="HRA" value={form.hra} onChange={(e) => setForm({ ...form, hra: e.target.value })} />
            <input type="number" placeholder="Bonus" value={form.bonus} onChange={(e) => setForm({ ...form, bonus: e.target.value })} />
            <input type="number" placeholder="Overtime" value={form.overtime} onChange={(e) => setForm({ ...form, overtime: e.target.value })} />
            <input type="number" placeholder="Deductions" value={form.deductions} onChange={(e) => setForm({ ...form, deductions: e.target.value })} />
            <input type="number" placeholder="Tax" value={form.tax} onChange={(e) => setForm({ ...form, tax: e.target.value })} />
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="Processed">Processed</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </select>
            <button type="submit">Save Payroll</button>
          </form>
        </section>
      )}

      <section className="enterprise-section enterprise-card">
        <h2>Salary History</h2>
        <div style={{ overflowX: "auto" }}>
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Month/Year</th>
                <th>Final Salary</th>
                <th>Status</th>
                <th>Paid On</th>
                <th>Payslip</th>
              </tr>
            </thead>
            <tbody>
              {payrollRows.map((row) => {
                const employee = row.employeeId && typeof row.employeeId === "object"
                  ? row.employeeId
                  : employeeMap.get(String(row.employeeId));

                return (
                  <tr key={row._id}>
                    <td>{employee?.name || employee?.employeeId || "-"}</td>
                    <td>{row.month}/{row.year}</td>
                    <td>{Number(row.finalSalary || 0).toLocaleString()}</td>
                    <td>{row.status}</td>
                    <td>{row.paymentDate ? new Date(row.paymentDate).toLocaleDateString() : "-"}</td>
                    <td>
                      <button type="button" className="enterprise-btn secondary" onClick={() => handleDownload(row)}>
                        Download PDF
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!payrollRows.length ? (
                <tr><td colSpan="6">No payroll records found.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
