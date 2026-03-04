import React, { useEffect, useState, useContext } from "react";
import { fetchEmployees } from "../api";
import { AuthContext } from "../context/AuthContext";
import HomeAssistant from "../components/HomeAssistant";
import "../App.css";
import "../styles/dashboard.css";

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmployees();
  }, []);

  async function loadEmployees() {
    try {
      const data = await fetchEmployees();
      setEmployees(data);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <div className="dashboard-hero">
        <div className="hero-content">
          <span className="hero-pill">EmployeeHub Workspace</span>
          <h1 className="hero-title">
            Welcome back, <span className="user-name">{user?.name || "User"}</span>
          </h1>
          <p className="hero-subtitle">
            Monitor your workforce, attendance status, and organizational records in one place.
          </p>
        </div>
        <div className="hero-stats">
          <div className="stat-card">
            <p className="stat-label">Total Employees</p>
            <p className="stat-value">{employees.length}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Directory Results</p>
            <p className="stat-value">{filteredEmployees.length}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <HomeAssistant userName={user?.name || "User"} />

        <div className="search-section">
          <div className="search-header">
            <h2 className="section-title">Employee Search</h2>
          </div>
          <div className="search-wrapper">
            <input
              type="text"
              placeholder="Search employee by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <button className="btn btn-primary btn-search" type="button">
              Search
            </button>
          </div>
        </div>

        <div className="employees-section">
          <div className="section-header">
            <h2 className="section-title">Employee Directory</h2>
            <div className="result-badge">{filteredEmployees.length} results</div>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="loader"></div>
              <p>Loading employees...</p>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="no-data-container">
              <p className="no-data-text">No employees found</p>
            </div>
          ) : (
            <div className="table-wrapper">
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
                    <tr key={emp._id} className="table-row">
                      <td className="id-cell" data-label="Employee ID">{emp.employeeId}</td>
                      <td className="name-cell" data-label="Name">
                        <span className="employee-avatar">{emp.name.charAt(0)}</span>
                        {emp.name}
                      </td>
                      <td className="email-cell" data-label="Email">{emp.email}</td>
                      <td className="position-cell" data-label="Position">{emp.position || "-"}</td>
                      <td className="department-cell" data-label="Department">{emp.department || "-"}</td>
                      <td className="date-cell" data-label="Last Paid">
                        <span className={`date-badge ${emp.lastPaid ? "paid" : "unpaid"}`}>
                          {emp.lastPaid ? new Date(emp.lastPaid).toLocaleDateString() : "Unpaid"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
