import React, { useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import AttendanceMap from "./AttendanceMap";
import { buildApiUrl } from "../utils/apiBase";
import "../styles/AttendanceHistory.css";

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? "N/A" : d.toLocaleString();
};

const formatCoord = (value) => {
  const num = Number(value);
  return Number.isNaN(num) ? "N/A" : num.toFixed(4);
};

export default function AttendanceHistory() {
  const { user, logout } = useContext(AuthContext);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isClearing, setIsClearing] = useState(false);

  const isAdminOrHr = user?.role?.toLowerCase() === "admin" || user?.role?.toLowerCase() === "hr";
  const clearButtonLabel = isAdminOrHr ? "Clear All History" : "Clear My History";

  const fetchAttendance = useCallback(async () => {
    if (!user) {
      setError("You must be logged in to view attendance history.");
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authentication token missing. Please log in again.");
      setLoading(false);
      return;
    }

    const endpoint = isAdminOrHr ? buildApiUrl("/api/attendance/all") : buildApiUrl("/api/attendance/my");

    try {
      const res = await axios.get(endpoint, getAuthHeader());
      setAttendanceRecords(Array.isArray(res.data) ? res.data : []);
      setError(null);
    } catch (err) {
      let errorMessage = "Failed to fetch attendance records. Please try again.";
      if (err?.response) {
        let serverMessage = err.response.data?.message;
        if (!serverMessage && typeof err.response.data === "string") {
          serverMessage = err.response.data.trim().startsWith("<")
            ? `Endpoint not found (404). URL: ${endpoint}`
            : err.response.data;
        }

        if (err.response.status === 401) {
          errorMessage = `Unauthorized: ${serverMessage || "Please log in again."}`;
          logout();
        } else if (err.response.status === 403) {
          errorMessage = `Forbidden: ${serverMessage || "You do not have permission to view this data."}`;
        } else if (serverMessage) {
          errorMessage = `Error: ${serverMessage}`;
        } else {
          errorMessage = `Server error (${err.response.status}): ${err.message}`;
        }
      } else if (err?.message) {
        errorMessage = `Network error: ${err.message}`;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isAdminOrHr, logout, user]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleClearAll = async () => {
    if (isClearing) return;

    const shouldClear = window.confirm(
      isAdminOrHr
        ? "Delete all attendance history? This cannot be undone."
        : "Delete your attendance history? This cannot be undone."
    );
    if (!shouldClear) return;

    try {
      setIsClearing(true);
      const deleteEndpoint = isAdminOrHr ? "/api/attendance/all" : "/api/attendance/my";
      const postFallbackEndpoint = isAdminOrHr ? "/api/attendance/all/clear" : "/api/attendance/my/clear";

      try {
        await axios.delete(buildApiUrl(deleteEndpoint), getAuthHeader());
      } catch (deleteErr) {
        const status = deleteErr?.response?.status;
        if (status === 401 || status === 403) throw deleteErr;
        await axios.post(buildApiUrl(postFallbackEndpoint), {}, getAuthHeader());
      }

      setAttendanceRecords([]);
      setSelectedRecord(null);
      setError(null);
    } catch (err) {
      const serverMessage = err?.response?.data?.message;
      const status = err?.response?.status;
      setError(
        status === 404
          ? "Clear endpoint not found. Restart backend server and try again."
          : serverMessage || "Failed to clear attendance history. Please try again."
      );
      if (err?.response?.status === 401) logout();
    } finally {
      setIsClearing(false);
    }
  };

  if (loading) {
    return <div className="attendance-history-container">Loading attendance history...</div>;
  }

  if (error) {
    return <div className="attendance-history-container error-message">{error}</div>;
  }

  return (
    <div className="attendance-history-container">
      <div className="attendance-history-header">
        <h2>Attendance History</h2>
        <div className="attendance-history-actions">
          <button
            type="button"
            className="btn clear-all-btn"
            onClick={handleClearAll}
            disabled={isClearing || !attendanceRecords.length}
          >
            {isClearing ? "Clearing..." : clearButtonLabel}
          </button>
        </div>
      </div>

      {!attendanceRecords.length ? (
        <p className="empty-history">No attendance records found.</p>
      ) : (
        <div className="attendance-list">
          {attendanceRecords.map((record) => {
            const empData = record.employeeId || record.userId;
            const employee = typeof empData === "object" && empData !== null ? empData.name || "N/A" : "N/A";
            const checkInTime = record.checkIn || record.timestamp;
            const checkOutTime = record.checkOut;

            return (
              <div key={record._id || record.id} className="attendance-card">
                <div className="attendance-details">
                  <p><strong>Employee:</strong> {employee}</p>
                  <p><strong>Check-In Time:</strong> {formatDate(checkInTime)}</p>
                  <p><strong>Check-Out Time:</strong> {checkOutTime ? formatDate(checkOutTime) : "Not checked out yet"}</p>
                  <p><strong>Location:</strong> Lat: {formatCoord(record.latitude)}, Lng: {formatCoord(record.longitude)}</p>
                  <p><strong>Place:</strong> {record.locationName || "N/A"}</p>
                  <p><strong>Device:</strong> {record.deviceType || "N/A"}</p>
                </div>

                <div className="attendance-media">
                  {record.photoUrl ? (
                    <img
                      src={record.photoUrl}
                      alt="Attendance"
                      className="attendance-photo"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <p className="no-photo">No photo</p>
                  )}

                  <button className="btn btn-view-map" onClick={() => setSelectedRecord(record)}>
                    View on Map
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedRecord && (
        <div className="map-modal-overlay" onClick={() => setSelectedRecord(null)}>
          <div className="map-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>
              Attendance Location for {(selectedRecord.employeeId?.name || selectedRecord.userId?.name) || "N/A"}
            </h3>

            <AttendanceMap
              latitude={Number(selectedRecord.latitude)}
              longitude={Number(selectedRecord.longitude)}
              popupText={`Check-In: ${formatDate(
                selectedRecord.checkIn || selectedRecord.timestamp
              )} | Check-Out: ${selectedRecord.checkOut ? formatDate(selectedRecord.checkOut) : "Not checked out yet"}`}
            />

            <button className="btn btn-close-modal" onClick={() => setSelectedRecord(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
