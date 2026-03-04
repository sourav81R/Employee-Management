import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { buildApiUrl } from "../utils/apiBase";
import "../styles/attendance.css";

const LeaveRequestPage = () => {
  const { user, token: contextToken } = useContext(AuthContext);
  const [leaveReason, setLeaveReason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [message, setMessage] = useState("");
  const [myRequests, setMyRequests] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [isClearingLeaveStatus, setIsClearingLeaveStatus] = useState(false);

  const token = (contextToken && contextToken !== "undefined" && contextToken !== "null")
    ? contextToken
    : localStorage.getItem("token");

  useEffect(() => {
    if (token) fetchMyRequests();
  }, [token]);

  const fetchMyRequests = async () => {
    try {
      const res = await fetch(buildApiUrl("/api/leave/my-requests"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setMyRequests(data);
    } catch (err) {
      console.error("Error fetching requests:", err);
    }
  };

  const handleEditClick = (req) => {
    setEditingId(req._id);
    setStartDate(new Date(req.startDate).toISOString().split("T")[0]);
    setEndDate(new Date(req.endDate).toISOString().split("T")[0]);
    setLeaveReason(req.reason);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm("Delete this leave request?")) return;

    try {
      const res = await fetch(buildApiUrl(`/api/leave/request/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Leave request deleted successfully.");
        fetchMyRequests();
      } else {
        setMessage(data.message || "Delete failed");
      }
    } catch (err) {
      console.error("Error deleting request:", err);
      setMessage("Delete failed. Please check if the server is running.");
    }
  };

  const handleClearAllLeaveStatus = async () => {
    if (!token || token === "undefined" || token === "null" || token === "") {
      setMessage("You must be logged in to clear leave status.");
      return;
    }
    if (!myRequests.length || isClearingLeaveStatus) return;
    if (!window.confirm("Clear all leave status records? This cannot be undone.")) return;

    setIsClearingLeaveStatus(true);
    try {
      let res = await fetch(buildApiUrl("/api/leave/my-requests"), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok && res.status !== 401 && res.status !== 403) {
        res = await fetch(buildApiUrl("/api/leave/my-requests/clear"), {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMyRequests([]);
        setStatusFilter("All");
        setMessage(data.message || "All leave status records cleared successfully.");
      } else {
        setMessage(data.message || "Failed to clear leave status.");
      }
    } catch (err) {
      console.error("Error clearing leave status:", err);
      setMessage("Failed to clear leave status. Please check if the server is running.");
    } finally {
      setIsClearingLeaveStatus(false);
    }
  };

  const handleLeaveRequest = async (e) => {
    e.preventDefault();
    if (!token || token === "undefined" || token === "null" || token === "") {
      setMessage("You must be logged in to submit a request.");
      return;
    }

    try {
      const url = editingId ? buildApiUrl(`/api/leave/request/${editingId}`) : buildApiUrl("/api/leave/request");

      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ startDate, endDate, reason: leaveReason }),
      });

      const data = await res.json();
      if (res.ok) {
        if (editingId) {
          setMessage(data.policyMessage || "Leave request updated successfully.");
        } else {
          setMessage(
            data.policyMessage ||
              (user?.role === "hr" ? "Leave request submitted to Admin." : "Leave request submitted to HR.")
          );
        }
        setLeaveReason("");
        setStartDate("");
        setEndDate("");
        setEditingId(null);
        fetchMyRequests();
      } else {
        setMessage(data.message || "Request failed");
      }
    } catch (err) {
      console.error(err);
      setMessage("Request failed. Please check if the server is running.");
    }
  };

  const getDisplayStatus = (status) => {
    const normalized = (status || "").toLowerCase();
    if (normalized === "approved") return "Approved";
    if (normalized === "rejected") return "Rejected";
    return "Pending";
  };

  const getCalculatedDays = (startDateValue, endDateValue) => {
    const start = new Date(startDateValue);
    const end = new Date(endDateValue);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    const startOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    if (endOnly < startOnly) return 0;
    return Math.floor((endOnly - startOnly) / (1000 * 60 * 60 * 24)) + 1;
  };

  const filteredRequests = myRequests.filter((req) => {
    if (statusFilter === "All") return true;
    return getDisplayStatus(req.status) === statusFilter;
  });

  const messageClass = message.toLowerCase().includes("success") || message.toLowerCase().includes("submitted")
    ? "message-success"
    : "message-error";

  return (
    <div className="attendance-container leave-page">
      <div className="leave-card leave-form-card">
        <h2>Request Leave</h2>

        <form onSubmit={handleLeaveRequest}>
          <div className="form-group">
            <label>Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Reason</label>
            <textarea
              placeholder="Explain your reason for leave..."
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              required
            />
          </div>
          <div className="leave-form-actions">
            <button type="submit" className="btn-leave">
              {editingId ? "Update Request" : user?.role === "hr" ? "Submit to Admin" : "Submit to HR"}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn-leave btn-muted"
                onClick={() => {
                  setEditingId(null);
                  setLeaveReason("");
                  setStartDate("");
                  setEndDate("");
                }}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        {message && <p className={`info-msg ${messageClass}`}>{message}</p>}
      </div>

      <div className="leave-card leave-status-card">
        <div className="leave-status-header">
          <h2>My Leave Status</h2>
          <button
            type="button"
            className="btn-clear-leave-status"
            onClick={handleClearAllLeaveStatus}
            disabled={isClearingLeaveStatus || myRequests.length === 0}
          >
            {isClearingLeaveStatus ? "Clearing..." : "Clear All"}
          </button>
        </div>

        <div className="leave-filter-row">
          <label>Filter:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {myRequests.length > 0 ? (
          <div className="requests-list">
            {filteredRequests.map((req) => {
              const displayStatus = getDisplayStatus(req.status);
              const canEdit = displayStatus === "Pending";
              const canDelete = displayStatus !== "Approved";
              const calculatedTotalDays = getCalculatedDays(req.startDate, req.endDate);
              const totalDays = Number(req.totalDays) > 0 ? Number(req.totalDays) : calculatedTotalDays;
              const paidDays = Number(req.paidDays) > 0
                ? Number(req.paidDays)
                : (Number(req.unpaidDays) > 0 ? Math.max(0, totalDays - Number(req.unpaidDays)) : totalDays);
              const unpaidDays = Number(req.unpaidDays) > 0 ? Number(req.unpaidDays) : Math.max(0, totalDays - paidDays);

              return (
                <div key={req._id} className="leave-request-item">
                  <p><strong>Dates:</strong> {new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()}</p>
                  <p>
                    <strong>Status:</strong>
                    <span className={`role-badge role-${displayStatus.toLowerCase()} leave-status-badge`}>{displayStatus}</span>
                  </p>
                  <p><strong>Total Days:</strong> {totalDays}</p>
                  <p><strong>Paid Days:</strong> {paidDays}</p>
                  <p><strong>Unpaid Days:</strong> {unpaidDays}</p>

                  {(req.salaryCut || unpaidDays > 0) && (
                    <p className="salary-cut-alert">
                      Salary cut applies: {unpaidDays} day(s) exceed yearly paid leave allowance.
                    </p>
                  )}

                  {displayStatus === "Approved" ? (
                    <div className="leave-status-message leave-approved">
                      {user?.role === "hr" ? "Your request was approved by Admin." : "Your request was approved by HR."}
                    </div>
                  ) : displayStatus === "Rejected" ? (
                    <div className="leave-status-message leave-rejected">
                      {user?.role === "hr" ? "Your request was rejected by Admin." : "Your request was rejected by HR."}
                    </div>
                  ) : (
                    <p className="leave-status-message leave-pending">
                      {user?.role === "hr"
                        ? "Request pending (waiting for Admin review)."
                        : "Request pending (waiting for HR review)."}
                    </p>
                  )}

                  {(canEdit || canDelete) && (
                    <div className="leave-request-actions">
                      {canEdit && (
                        <button className="request-action-btn edit-btn" onClick={() => handleEditClick(req)}>
                          Edit Request
                        </button>
                      )}
                      {canDelete && (
                        <button className="request-action-btn delete-btn" onClick={() => handleDeleteClick(req._id)}>
                          Delete Request
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {filteredRequests.length === 0 && <p>No leave requests found for selected filter.</p>}
          </div>
        ) : (
          <p>No leave requests found.</p>
        )}
      </div>
    </div>
  );
};

export default LeaveRequestPage;
