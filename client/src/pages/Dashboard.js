// src/pages/Dashboard.js
import React, { useEffect, useState, useContext } from "react";
import { fetchEmployees } from "../api";
import { AuthContext } from "../context/AuthContext";
import "../App.css";

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ Fetch employees on mount
  useEffect(() => {
    loadEmployees();
  }, []);

  async function loadEmployees() {
    try {
      const data = await fetchEmployees();
      setEmployees(data);
    } catch (err) {
      console.error("❌ Failed to fetch employees:", err);
    } finally {
      setLoading(false);
    }
  }

  // ✅ Filter employees by search
  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container">
      {/* ✅ Welcome Message */}
      <h2 className="title">
        Welcome, <span>{user?.name || "User"}</span> 👋
      </h2>
      <p style={{ textAlign: "center", color: "#555", marginTop: "-10px" }}>
        Here’s the list of employees. (Salary details are hidden for users.)
      </p>

      {/* 🔍 Search Box */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Search employee by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-primary">Search</button>
      </div>

      {/* 📋 Employee Table */}
      {loading ? (
        <p style={{ textAlign: "center" }}>Loading employees...</p>
      ) : filteredEmployees.length === 0 ? (
        <p className="no-data">No employees found</p>
      ) : (
        <table className="employee-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Position</th>
              <th>Department</th>
              <th>Last Paid</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((emp) => (
              <tr key={emp._id}>
                <td>{emp.employeeId}</td>
                <td>{emp.name}</td>
                <td>{emp.email}</td>
                <td>{emp.position || "—"}</td>
                <td>{emp.department || "—"}</td>
                <td>
                  {emp.lastPaid
                    ? new Date(emp.lastPaid).toLocaleDateString()
                    : "Unpaid"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Footer */}
      <footer>
        <p>Employee Management System © 2025</p>
      </footer>
    </div>
  );
}
