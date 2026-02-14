import React, { useEffect, useState, useContext } from "react";
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  paySalary,
} from "../api";
import { AuthContext } from "../context/AuthContext";
import EmployeeList from "../components/EmployeeList";
import { buildApiUrl } from "../utils/apiBase";
import "../App.css";
import "../styles/adminDashboard.css";

export default function AdminPanel() {
  const { user, token } = useContext(AuthContext);
  const [employees, setEmployees] = useState([]);
  const [hrUsers, setHrUsers] = useState([]);
  const [managerUsers, setManagerUsers] = useState([]);
  const [attendanceLog, setAttendanceLog] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [leaveSummary, setLeaveSummary] = useState([]);
  const [leaveSummaryYear, setLeaveSummaryYear] = useState(new Date().getFullYear());
  const [form, setForm] = useState({
    employeeId: "",
    name: "",
    email: "",
    position: "",
    department: "",
    salary: "",
  });
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const role = user?.role;

  // ✅ Load employees on mount
  useEffect(() => {
    if (!token || !role) return;

    loadEmployees();
    loadUsers();
    if (role?.toLowerCase() === "admin") {
      loadAttendance();
      loadPendingLeaves();
      loadLeaveSummary(leaveSummaryYear);
    }
  }, [role, token, leaveSummaryYear]);

  async function loadEmployees() {
    try {
      const data = await fetchEmployees();
      setEmployees(data);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    }
  }

  async function loadUsers() {
    try {
      const res = await fetch(buildApiUrl("/api/users"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const users = await res.json();
      
      if (Array.isArray(users)) {
        // Filter HR and Manager users
        const hrs = users.filter(u => u.role?.toLowerCase?.() === "hr");
        const managers = users.filter(u => u.role?.toLowerCase?.() === "manager");
        
        setHrUsers(hrs);
        setManagerUsers(managers);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  }

  async function loadAttendance() {
    try {
      const res = await fetch(buildApiUrl("/api/admin/attendance"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setAttendanceLog(data);
      }
    } catch (err) {
      console.error("Failed to fetch attendance:", err);
    }
  }

  async function loadPendingLeaves() {
    try {
      const res = await fetch(buildApiUrl("/api/leave/pending"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        // Admin sees all, but specifically needs to handle HR requests
        setPendingLeaves(data);
      }
    } catch (err) {
      console.error("Failed to fetch pending leaves:", err);
    }
  }

  async function loadLeaveSummary(year) {
    try {
      const res = await fetch(`${buildApiUrl("/api/reports/leave-summary")}?year=${year}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.employees)) {
        setLeaveSummary(data.employees);
      } else {
        setLeaveSummary([]);
      }
    } catch (err) {
      console.error("Failed to fetch leave summary:", err);
      setLeaveSummary([]);
    }
  }

  const DEFAULT_MIN_DAILY_WORK_HOURS = Math.max(
    1,
    Math.min(24, Number(process.env.REACT_APP_MIN_DAILY_WORK_HOURS) || 8)
  );
  const DEFAULT_MIN_DAILY_WORK_MINUTES = DEFAULT_MIN_DAILY_WORK_HOURS * 60;

  const formatTime = (value) => {
    if (!value) return "N/A";
    const parsed = new Date(value);
    if (!Number.isFinite(parsed.getTime())) return "N/A";
    return parsed.toLocaleTimeString();
  };

  const formatMinutes = (minutes) => {
    const total = Number(minutes);
    if (!Number.isFinite(total) || total < 0) return "N/A";
    const hours = Math.floor(total / 60);
    const remainder = total % 60;
    return `${hours}h ${remainder}m`;
  };

  const resolveAttendanceUser = (log) => log?.user || log?.userId || log?.employeeId || null;

  const resolveMinimumMinutes = (log) => {
    const minutesFromLog = Number(log?.minimumRequiredMinutes);
    if (Number.isFinite(minutesFromLog) && minutesFromLog > 0) return minutesFromLog;

    const hoursFromLog = Number(log?.minimumRequiredHours);
    if (Number.isFinite(hoursFromLog) && hoursFromLog > 0) return Math.round(hoursFromLog * 60);

    return DEFAULT_MIN_DAILY_WORK_MINUTES;
  };

  const getWorkedMinutes = (log) => {
    const checkOut = log?.checkOut;
    if (!checkOut) return null;

    const storedWorked = Number(log?.workedMinutes);
    if (Number.isFinite(storedWorked) && storedWorked >= 0) return storedWorked;

    const checkIn = log?.checkIn || log?.timestamp;
    if (!checkIn) return null;

    const inTime = new Date(checkIn);
    const outTime = new Date(checkOut);
    if (!Number.isFinite(inTime.getTime()) || !Number.isFinite(outTime.getTime())) return null;

    return Math.max(0, Math.floor((outTime.getTime() - inTime.getTime()) / (1000 * 60)));
  };

  const getShortByMinutes = (log) => {
    if (!log?.checkOut) return null;
    const worked = getWorkedMinutes(log);
    if (!Number.isFinite(worked)) return null;

    return Math.max(0, resolveMinimumMinutes(log) - worked);
  };

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
        loadPendingLeaves();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to update leave status");
      }
    } catch (err) {
      console.error("Leave action error:", err);
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editing) {
        await updateEmployee(form._id, form);
      } else {
        await createEmployee(form);
      }
      resetForm();
      loadEmployees();
    } catch (err) {
      console.error("Error saving employee:", err);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteEmployee(id);
      loadEmployees();
    } catch (err) {
      console.error("Error deleting employee:", err);
    }
  }

  async function handlePay(id) {
    try {
      const response = await paySalary(id);
      alert(response.message);
      loadEmployees();
    } catch (err) {
      console.error("Error paying salary:", err);
    }
  }

  function handleEdit(emp) {
    setEditing(emp._id);
    setForm({
      _id: emp._id,
      employeeId: emp.employeeId || "",
      name: emp.name,
      email: emp.email,
      position: emp.position,
      department: emp.department,
      salary: emp.salary,
    });
  }

  function resetForm() {
    setForm({
      employeeId: "",
      name: "",
      email: "",
      position: "",
      department: "",
      salary: "",
    });
    setEditing(null);
  }

  const filteredEmployees = employees.filter((emp) =>
  (emp.name?.toLowerCase() || "").includes(search.toLowerCase())
);

  const salaryByEmail = employees.reduce((acc, emp) => {
    const email = (emp?.email || "").toLowerCase().trim();
    const salary = Number(emp?.salary);
    if (email && Number.isFinite(salary) && salary > 0) {
      acc[email] = salary;
    }
    return acc;
  }, {});

  const getEstimatedSalaryCut = (log) => {
    const shortByMinutes = getShortByMinutes(log);
    if (!Number.isFinite(shortByMinutes) || shortByMinutes <= 0) return null;

    const userRef = resolveAttendanceUser(log);
    const email = (userRef?.email || "").toLowerCase().trim();
    const monthlySalary = Number(salaryByEmail[email]);
    if (!email || !Number.isFinite(monthlySalary) || monthlySalary <= 0) return null;

    const dailySalary = monthlySalary / 30;
    const perMinuteSalary = dailySalary / resolveMinimumMinutes(log);
    const cutAmount = perMinuteSalary * shortByMinutes;
    return Number(cutAmount.toFixed(2));
  };

  const minimumRequiredHoursForTable = (() => {
    const fromLog = attendanceLog
      .map((log) => Number(log?.minimumRequiredHours))
      .find((value) => Number.isFinite(value) && value > 0);
    return fromLog || DEFAULT_MIN_DAILY_WORK_HOURS;
  })();

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">
            <span className="title-icon">📊</span>
            {role?.toLowerCase() === "admin" ? "Admin Dashboard" : "Employee Directory"}
          </h1>
          <p className="header-subtitle">Manage employees and salary information</p>
        </div>
      </div>

      {/* 👇 Only admins can add/update/delete employees */}
      {role?.toLowerCase() === "admin" && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="icon">➕</span>
              {editing ? "Update Employee" : "Add New Employee"}
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="employee-form admin-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Employee ID</label>
                <input
                  type="text"
                  name="employeeId"
                  placeholder="Enter employee ID"
                  value={form.employeeId}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter full name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter email address"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Position</label>
                <input
                  type="text"
                  name="position"
                  placeholder="Enter position"
                  value={form.position}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  name="department"
                  placeholder="Enter department"
                  value={form.department}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Salary</label>
                <input
                  type="number"
                  name="salary"
                  placeholder="Enter salary"
                  value={form.salary}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="form-buttons">
              <button type="submit" className="btn btn-primary btn-lg">
                {editing ? "✓ Update Employee" : "✓ Add Employee"}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-secondary btn-lg"
                >
                  ✕ Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Search Box (works for both user & admin) */}
      <div className="dashboard-section">
        <div className="search-container">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search employee by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <button
            className="btn btn-primary btn-search"
            onClick={() => setSearch(search.trim())}
          >
            Search
          </button>
        </div>
      </div>

      {/* HR Users Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="icon">👔</span>
            HR Users ({hrUsers.length})
          </h2>
        </div>
        <div className="users-grid">
          {hrUsers.length > 0 ? (
            hrUsers.map((user) => (
              <div key={user._id} className="user-card hr-user-card">
                <div className="user-header">
                  <span className="user-badge hr-badge">👔 HR</span>
                </div>
                <div className="user-info">
                  <h3 className="user-name">{user.name}</h3>
                  <p className="user-email">📧 {user.email}</p>
                  {user.department && <p className="user-dept">🏢 {user.department}</p>}
                  {user.phoneNumber && <p className="user-phone">📱 {user.phoneNumber}</p>}
                </div>
              </div>
            ))
          ) : (
            <div className="no-data-message">No HR users found</div>
          )}
        </div>
      </div>

      {/* Manager Users Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="icon">🎯</span>
            Manager Users ({managerUsers.length})
          </h2>
        </div>
        <div className="users-grid">
          {managerUsers.length > 0 ? (
            managerUsers.map((user) => (
              <div key={user._id} className="user-card manager-user-card">
                <div className="user-header">
                  <span className="user-badge manager-badge">🎯 Manager</span>
                </div>
                <div className="user-info">
                  <h3 className="user-name">{user.name}</h3>
                  <p className="user-email">📧 {user.email}</p>
                  {user.department && <p className="user-dept">🏢 {user.department}</p>}
                  {user.phoneNumber && <p className="user-phone">📱 {user.phoneNumber}</p>}
                </div>
              </div>
            ))
          ) : (
            <div className="no-data-message">No manager users found</div>
          )}
        </div>
      </div>

      {/* Pending Leave Requests Section (Admin Only) */}
      {role?.toLowerCase() === "admin" && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="icon">📅</span>
              Pending Leave Requests (HR & Staff)
            </h2>
          </div>
          <div className="table-wrapper">
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Requester</th>
                  <th>Role</th>
                  <th>Dates</th>
                  <th>Reason</th>
                  <th>Paid/Unpaid</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingLeaves.map((req) => (
                  <tr key={req._id}>
                    <td>{req.userId?.name}</td>
                    <td><span className={`role-badge role-${req.userId?.role}`}>{req.userId?.role}</span></td>
                    <td>{new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</td>
                    <td>{req.reason}</td>
                    <td>
                      {req.paidDays || 0}/{req.unpaidDays || 0}
                      {req.salaryCut ? <span style={{ color: "#c53030", marginLeft: "6px" }}>(Cut)</span> : null}
                    </td>
                    <td>
                      <button className="btn btn-pay" onClick={() => handleLeaveAction(req._id, "Approved")}>Approve</button>
                      <button className="btn btn-delete" style={{marginLeft: '5px'}} onClick={() => handleLeaveAction(req._id, "Rejected")}>Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {role?.toLowerCase() === "admin" && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="icon">ðŸ“ˆ</span>
              Yearly Leave Summary (Paid/Unpaid)
            </h2>
          </div>
          <div style={{ marginBottom: "12px", display: "flex", gap: "10px", alignItems: "center" }}>
            <label htmlFor="leave-summary-year"><strong>Year:</strong></label>
            <input
              id="leave-summary-year"
              type="number"
              min="2000"
              max="3000"
              value={leaveSummaryYear}
              onChange={(e) => setLeaveSummaryYear(Number(e.target.value) || new Date().getFullYear())}
              style={{ width: "110px", padding: "6px 8px" }}
            />
          </div>
          <div className="table-wrapper">
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Approved Paid</th>
                  <th>Approved Unpaid</th>
                  <th>Pending Paid</th>
                  <th>Pending Unpaid</th>
                </tr>
              </thead>
              <tbody>
                {leaveSummary.length > 0 ? leaveSummary.map((row) => (
                  <tr key={row.userId}>
                    <td>{row.name}</td>
                    <td><span className={`role-badge role-${row.role}`}>{row.role}</span></td>
                    <td>{row.approvedPaidDays || 0}</td>
                    <td>{row.approvedUnpaidDays || 0}</td>
                    <td>{row.pendingPaidDays || 0}</td>
                    <td>{row.pendingUnpaidDays || 0}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6">No leave summary data found for this year.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance Log Section (Admin Only) */}
      {role?.toLowerCase() === "admin" && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="icon">📅</span>
              Organization Attendance Log
            </h2>
          </div>
          <div className="table-wrapper">
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Check-In Time</th>
                  <th>Check-Out Time</th>
                  <th>Duration</th>
                  <th>Salary Cut / Day</th>
                </tr>
              </thead>
              <tbody>
                {attendanceLog.length > 0 ? (
                  attendanceLog.map((log) => {
                    const userRef = resolveAttendanceUser(log);
                    const roleText = userRef?.role || "N/A";
                    const checkIn = log.checkIn || log.timestamp;
                    const checkOut = log.checkOut || null;
                    const workedMinutes = getWorkedMinutes(log);
                    const shortByMinutes = getShortByMinutes(log);
                    const estimatedCut = getEstimatedSalaryCut(log);
                    const dateText = log.date || (checkIn ? new Date(checkIn).toLocaleDateString() : "N/A");
                    const salaryCutText = !checkOut
                      ? "Pending checkout"
                      : shortByMinutes > 0
                        ? "Yes (" + formatMinutes(shortByMinutes) + " short" + (estimatedCut !== null ? ", est. cut " + estimatedCut : "") + ")"
                        : "No";

                    return (
                      <tr key={log._id}>
                        <td>{userRef?.name || "N/A"}</td>
                        <td><span className={"role-badge role-" + String(roleText).toLowerCase()}>{roleText}</span></td>
                        <td>{userRef?.department || "N/A"}</td>
                        <td>{dateText}</td>
                        <td>{formatTime(checkIn)}</td>
                        <td>{formatTime(checkOut)}</td>
                        <td>{workedMinutes === null ? "Pending" : formatMinutes(workedMinutes)}</td>
                        <td>{salaryCutText}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8">No attendance records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p style={{ marginTop: "10px", color: "#475569", fontWeight: 600 }}>
            Minimum required work per day: {minimumRequiredHoursForTable} hour(s)
          </p>
        </div>
      )}

      {/* Employee Table */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="icon">👥</span>
            Employee Records ({filteredEmployees.length})
          </h2>
        </div>
        <EmployeeList
          role={role}
          employees={filteredEmployees}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPay={handlePay}
        />
      </div>
    </div>
  );
}
