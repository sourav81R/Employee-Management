import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { apiGet } from "../utils/http";
import "../styles/enterprise.css";

const COLORS = ["#0f766e", "#1d4ed8", "#d97706", "#7c3aed", "#dc2626", "#475569"];

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet("/api/analytics/dashboard")
      .then((payload) => setData(payload || null))
      .catch((err) => setError(err.message || "Failed to load analytics"));
  }, []);

  const leaveData = useMemo(() => {
    const stats = data?.leaveStats || {};
    return Object.keys(stats).map((key) => ({ name: key, value: stats[key] || 0 }));
  }, [data]);

  const departmentData = data?.departmentDistribution || [];
  const salaryData = (data?.salaryExpenses || []).map((item) => ({
    name: `${item._id.month}/${item._id.year}`,
    expense: item.totalExpense,
  })).reverse();

  return (
    <div className="enterprise-page">
      <div className="enterprise-header">
        <h1>Analytics Dashboard</h1>
      </div>

      {error ? <p className="enterprise-error">{error}</p> : null}

      <section className="enterprise-grid enterprise-section">
        <div className="enterprise-card"><h3>Total Employees</h3><p>{data?.totalEmployees ?? 0}</p></div>
        <div className="enterprise-card"><h3>Today's Attendance</h3><p>{data?.todayAttendance ?? 0}</p></div>
        <div className="enterprise-card"><h3>Attendance Rate</h3><p>{data?.attendanceRate ?? 0}%</p></div>
      </section>

      <section className="enterprise-grid">
        <div className="enterprise-card" style={{ minHeight: 320 }}>
          <h3>Leave Statistics</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={leaveData} dataKey="value" nameKey="name" outerRadius={90}>
                {leaveData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="enterprise-card" style={{ minHeight: 320 }}>
          <h3>Department Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={departmentData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="employeeCount" fill="#1d4ed8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="enterprise-card enterprise-section" style={{ minHeight: 320 }}>
        <h3>Salary Expenses (Last 12 Months)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={salaryData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="expense" fill="#0f766e" />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
