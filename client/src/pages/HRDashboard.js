// src/pages/HRDashboard.js
import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { buildApiUrl } from "../utils/apiBase";
import "../styles/hrDashboard.css";

export default function HRDashboard() {
  const { user, token: contextToken } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [managers, setManagers] = useState([]);
  const [users, setUsers] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedManager, setSelectedManager] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignData, setAssignData] = useState({ userId: "", managerId: "" });

  // Fallback to localStorage if context token is missing or invalid
  const token = (contextToken && contextToken !== "undefined" && contextToken !== "null") 
    ? contextToken 
    : localStorage.getItem("token");

  useEffect(() => {
    if (user?.role?.toLowerCase?.() !== "hr" && user?.role?.toLowerCase?.() !== "admin") {
      alert("Access Denied!");
      return;
    }
    loadData();
  }, [user, token]);

  async function loadData() {
    try {
      // Fetch stats
      const statsRes = await fetch(buildApiUrl("/api/hr/stats"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch managers
      const managersRes = await fetch(buildApiUrl("/api/managers"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const managersData = await managersRes.json();
      if (Array.isArray(managersData)) {
        setManagers(managersData);
      }

      // Fetch all users
      const usersRes = await fetch(buildApiUrl("/api/users"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const usersData = await usersRes.json();
      if (Array.isArray(usersData)) {
        setUsers(usersData);
      }

      // Fetch pending leave requests
      const leaveRes = await fetch(buildApiUrl("/api/leave/pending"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const leaveData = await leaveRes.json();
      if (Array.isArray(leaveData)) {
        const isHrUser = user?.role?.toLowerCase?.() === "hr";
        // HR should not act on HR leave requests; admin can.
        setLeaveRequests(isHrUser ? leaveData.filter((req) => req.userId?.role !== "hr") : leaveData);
      }
    } catch (err) {
      console.error("Load data error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAssignManager(e) {
    e.preventDefault();
    try {
      const res = await fetch(buildApiUrl("/api/assign-manager"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(assignData),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Manager assigned successfully!");
        loadData();
        setShowAssignModal(false);
        setAssignData({ userId: "", managerId: "" });
      } else {
        alert(data.message || "Failed to assign manager");
      }
    } catch (err) {
      console.error("Assign error:", err);
      alert("Error assigning manager");
    }
  }

  async function handleLeaveAction(id, status) {
    try {
      const res = await fetch(buildApiUrl(`/api/leave/approve/${id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        alert(`Leave ${status.toLowerCase()} successfully!`);
        loadData();
      } else {
        alert("Failed to update leave status");
      }
    } catch (err) {
      console.error("Leave action error:", err);
    }
  }

  async function handleToggleUserStatus(targetUser) {
    try {
      const nextIsActive = !(targetUser?.isActive !== false);
      const res = await fetch(buildApiUrl(`/api/users/${targetUser._id}/status`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: nextIsActive }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to update user status");
        return;
      }

      setUsers((prev) => prev.map((u) => (u._id === targetUser._id ? data.user : u)));
      alert(data.message || "User status updated");
    } catch (err) {
      console.error("Toggle user status error:", err);
      alert("Failed to update user status");
    }
  }

  if (loading) {
    return (
      <div className="hr-dashboard">
        <div className="loading-container">
          <div className="loader"></div>
          <p>Loading HR Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hr-dashboard">
      {/* Header */}
      <div className="hr-header">
        <h1 className="hr-title">
          <span className="hr-icon">👔</span> HR Management Dashboard
        </h1>
        <p className="hr-subtitle">Manage managers, employees, and organizational structure</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">👥</span>
            <div className="stat-content">
              <p className="stat-label">Total Users</p>
              <p className="stat-value">{stats.totalUsers}</p>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">👔</span>
            <div className="stat-content">
              <p className="stat-label">Managers</p>
              <p className="stat-value">{stats.managers}</p>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">📊</span>
            <div className="stat-content">
              <p className="stat-label">Employees</p>
              <p className="stat-value">{stats.employees}</p>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🏢</span>
            <div className="stat-content">
              <p className="stat-label">Departments</p>
              <p className="stat-value">{stats.departments}</p>
            </div>
          </div>
        </div>
      )}

      <div className="hr-content">
        {/* Leave Requests Section */}
        <div className="section">
          <div className="section-header">
            <h2>📅 Pending Leave Requests</h2>
          </div>
          <div className="leave-requests-list">
            {leaveRequests.length > 0 ? (
              <div className="users-table-wrapper">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Dates</th>
                      <th>Reason</th>
                      <th>Paid/Unpaid</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveRequests.map((req) => (
                      <tr key={req._id}>
                        <td>{req.userId?.name} ({req.userId?.email})</td>
                        <td>{new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</td>
                        <td>{req.reason}</td>
                        <td>
                          {req.paidDays || 0}/{req.unpaidDays || 0}
                          {req.salaryCut ? <span style={{ color: "#c53030", marginLeft: "6px" }}>(Cut)</span> : null}
                        </td>
                        <td>
                          <button className="btn btn-primary" onClick={() => handleLeaveAction(req._id, "Approved")}>Approve</button>
                          <button className="btn btn-secondary" style={{marginLeft: '5px'}} onClick={() => handleLeaveAction(req._id, "Rejected")}>Reject</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-data">No pending leave requests</p>
            )}
          </div>
        </div>

        {/* Managers Section */}
        <div className="section">
          <div className="section-header">
            <h2>👔 Managers</h2>
            <button className="btn btn-primary" onClick={() => setShowAssignModal(true)}>
              ➕ Assign Manager
            </button>
          </div>
          <div className="managers-grid">
            {managers.length > 0 ? (
              managers.map((manager) => (
                <div key={manager._id} className="manager-card">
                  <div className="manager-avatar">{manager.name?.charAt(0) || "M"}</div>
                  <h3>{manager.name}</h3>
                  <p className="manager-email">{manager.email}</p>
                  <p className="manager-dept">{manager.department || "No department"}</p>
                  <button className="btn btn-secondary" onClick={() => setSelectedManager(manager._id)}>
                    View Team
                  </button>
                </div>
              ))
            ) : (
              <p className="no-data">No managers assigned</p>
            )}
          </div>
        </div>

        {/* Users Section */}
        <div className="section">
          <div className="section-header">
            <h2>👥 All Users</h2>
          </div>
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Manager</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td className="user-name">
                      <span className="user-avatar">{u.name?.charAt(0) || "U"}</span>
                      {u.name}
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`role-badge role-${u.role}`}>{u.role}</span>
                    </td>
                    <td>{u.managerId?.name || "—"}</td>
                    <td>{u.department || "—"}</td>
                    <td>
                      <span className={`status-badge ${u.isActive === false ? "status-inactive" : "status-active"}`}>
                        {u.isActive === false ? "Inactive" : "Active"}
                      </span>
                    </td>
                    <td>
                      {(user?.role === "admin" || u.role !== "admin") ? (
                        <button
                          className={`btn status-action-btn ${u.isActive === false ? "btn-primary" : "btn-secondary"}`}
                          onClick={() => handleToggleUserStatus(u)}
                        >
                          {u.isActive === false ? "Activate" : "Deactivate"}
                        </button>
                      ) : (
                        <span style={{ color: "#64748b" }}>Restricted</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Assign Manager Modal */}
      {showAssignModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Assign Manager to User</h2>
              <button className="modal-close" onClick={() => setShowAssignModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAssignManager} className="modal-form">
              <div className="form-group">
                <label>Select User</label>
                <select
                  value={assignData.userId}
                  onChange={(e) => setAssignData({ ...assignData, userId: e.target.value })}
                  required
                >
                  <option value="">Choose a user...</option>
                  {users.filter(u => u.role !== "admin").map((u) => (
                    <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Select Manager</label>
                <select
                  value={assignData.managerId}
                  onChange={(e) => setAssignData({ ...assignData, managerId: e.target.value })}
                  required
                >
                  <option value="">Choose a manager...</option>
                  {managers.map((m) => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="modal-buttons">
                <button type="submit" className="btn btn-primary">Assign</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
