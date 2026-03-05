import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { apiGet, apiPost } from "../utils/http";
import "../styles/enterprise.css";

export default function DepartmentsPage() {
  const { user } = useContext(AuthContext);
  const role = String(user?.role || "").toLowerCase();
  const canManage = ["admin", "hr"].includes(role);

  const [departments, setDepartments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", managerId: "", description: "" });

  async function loadData() {
    try {
      const [depData, analyticsData] = await Promise.all([
        apiGet("/api/departments"),
        apiGet("/api/departments/analytics"),
      ]);

      setDepartments(Array.isArray(depData) ? depData : []);
      setAnalytics(analyticsData || null);

      if (canManage) {
        const userData = await apiGet("/api/users");
        setUsers(Array.isArray(userData) ? userData : []);
      }
    } catch (err) {
      setError(err.message || "Failed to load departments");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreate(event) {
    event.preventDefault();
    try {
      await apiPost("/api/departments", form);
      setForm({ name: "", managerId: "", description: "" });
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to create department");
    }
  }

  return (
    <div className="enterprise-page">
      <div className="enterprise-header">
        <h1>Departments</h1>
        <span className="enterprise-pill">{role}</span>
      </div>

      {error ? <p className="enterprise-error">{error}</p> : null}

      {canManage && (
        <section className="enterprise-card enterprise-section">
          <h2>Create Department</h2>
          <form className="enterprise-form" onSubmit={handleCreate}>
            <input placeholder="Department Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <select value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })}>
              <option value="">Select Manager (optional)</option>
              {users.filter((u) => u.role === "manager").map((u) => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <button type="submit">Create Department</button>
          </form>
        </section>
      )}

      <section className="enterprise-section enterprise-grid">
        <div className="enterprise-card"><h3>Total Departments</h3><p>{analytics?.totalDepartments ?? departments.length}</p></div>
        <div className="enterprise-card"><h3>Total Assigned Employees</h3><p>{analytics?.totalEmployees ?? 0}</p></div>
      </section>

      <section className="enterprise-card enterprise-section">
        <h2>Department Dashboard</h2>
        <div style={{ overflowX: "auto" }}>
          <table className="enterprise-table">
            <thead><tr><th>Name</th><th>Manager</th><th>Employees</th><th>Description</th></tr></thead>
            <tbody>
              {departments.map((dep) => (
                <tr key={dep._id}>
                  <td>{dep.name}</td>
                  <td>{dep.managerId?.name || "-"}</td>
                  <td>{Array.isArray(dep.employees) ? dep.employees.length : 0}</td>
                  <td>{dep.description || "-"}</td>
                </tr>
              ))}
              {!departments.length ? <tr><td colSpan="4">No departments found.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
