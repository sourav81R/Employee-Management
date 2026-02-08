// src/pages/ManagerDashboard.js
import React, { useEffect, useState, useContext } from "react";
import { fetchEmployees } from "../api";
import { AuthContext } from "../context/AuthContext";
import "../styles/managerDashboard.css";

export default function ManagerDashboard() {
  const { user, token: contextToken } = useContext(AuthContext);
  const [teamInfo, setTeamInfo] = useState(null);
  const [teamEmployees, setTeamEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const API_BASE = "http://localhost:8000";

  // Fallback to localStorage if context token is missing or invalid
  const token = (contextToken && contextToken !== "undefined" && contextToken !== "null") 
    ? contextToken 
    : localStorage.getItem("token");

  useEffect(() => {
    if (user?.role?.toLowerCase?.() !== "manager" && user?.role?.toLowerCase?.() !== "admin") {
      alert("Access Denied! Only managers can access this.");
      return;
    }
    loadManagerData();
  }, [user, token]);

  async function loadManagerData() {
    try {
      // Get team info
      const infoRes = await fetch(`${API_BASE}/api/manager/team`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const infoData = await infoRes.json();
      setTeamInfo(infoData);

      // Get all employees and filter by manager ID
      const empRes = await fetch(`${API_BASE}/api/manager-employees/` + user._id, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const empData = await empRes.json();
      if (Array.isArray(empData)) {
        setTeamEmployees(empData);
      }
    } catch (err) {
      console.error("Load data error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePay(empId) {
    try {
      const res = await fetch(`${API_BASE}/api/employees/pay/${empId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        loadManagerData();
      } else {
        alert(data.message || "Payment failed");
      }
    } catch (err) {
      console.error("Payment error:", err);
    }
  }

  const filteredEmployees = teamEmployees.filter((emp) =>
    emp.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="manager-dashboard">
        <div className="loading-container">
          <div className="loader"></div>
          <p>Loading Team Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manager-dashboard">
      {/* Header */}
      <div className="manager-header">
        <h1 className="manager-title">
          <span className="manager-icon">🎯</span> Team Management Dashboard
        </h1>
        <p className="manager-subtitle">Manage your team members and their salary</p>
      </div>

      {/* Team Stats */}
      {teamInfo && (
        <div className="team-stats">
          <div className="stat-card">
            <span className="stat-icon">👥</span>
            <div className="stat-content">
              <p className="stat-label">Team Size</p>
              <p className="stat-value">{teamInfo.teamSize}</p>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">✅</span>
            <div className="stat-content">
              <p className="stat-label">Paid</p>
              <p className="stat-value">{teamInfo.paid}</p>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">❌</span>
            <div className="stat-content">
              <p className="stat-label">Unpaid</p>
              <p className="stat-value">{teamInfo.unpaid}</p>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">💰</span>
            <div className="stat-content">
              <p className="stat-label">Total Salary</p>
              <p className="stat-value">${(teamInfo.totalSalary || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="manager-content">
        {/* Search Section */}
        <div className="search-section">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search team member by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Team Members Section */}
        <div className="team-section">
          <div className="section-header">
            <h2>👥 Team Members ({filteredEmployees.length})</h2>
          </div>

          {filteredEmployees.length > 0 ? (
            <div className="team-cards-grid">
              {filteredEmployees.map((emp) => (
                <div key={emp._id} className="team-member-card">
                  <div className="card-header">
                    <div className="member-avatar">{emp.name.charAt(0)}</div>
                    <div className="member-info">
                      <h3>{emp.name}</h3>
                      <p className="member-id">ID: {emp.employeeId}</p>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="info-row">
                      <span className="info-label">Email:</span>
                      <span className="info-value">{emp.email}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Position:</span>
                      <span className="info-value">{emp.position || "—"}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Department:</span>
                      <span className="info-value">{emp.department || "—"}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Salary:</span>
                      <span className="info-value">${(emp.salary || 0).toLocaleString()}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Last Paid:</span>
                      <span className={`info-value ${emp.lastPaid ? "paid" : "unpaid"}`}>
                        {emp.lastPaid ? new Date(emp.lastPaid).toLocaleDateString() : "Not paid"}
                      </span>
                    </div>
                  </div>
                  <div className="card-footer">
                    <button className="btn btn-pay" onClick={() => handlePay(emp._id)}>
                      💰 Pay Salary
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data-container">
              <p className="no-data-icon">👥</p>
              <p className="no-data-text">No team members found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
