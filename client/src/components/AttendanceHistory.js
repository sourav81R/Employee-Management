// c:\Employee-Management\client\src\components\AttendanceHistory.js
import React, { useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import AttendanceMap from "./AttendanceMap";
import { buildApiUrl } from "../utils/apiBase";
import "../styles/AttendanceHistory.css";

// Helper functions moved outside the component to avoid re-creation on every render
// and to be accessible by the component's render logic.
const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleString();
};

const formatCoord = (value) => {
  const num = Number(value);
  return isNaN(num) ? "N/A" : num.toFixed(4);
};


export default function AttendanceHistory() {
  const { user, logout } = useContext(AuthContext); // Destructure logout here

  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isClearing, setIsClearing] = useState(false);

  const isAdminOrHr =
    user?.role?.toLowerCase() === "admin" || user?.role?.toLowerCase() === "hr";
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

    const endpoint = isAdminOrHr
      ? buildApiUrl("/api/attendance/all")
      : buildApiUrl("/api/attendance/my");

    try {
      console.log("Fetching attendance from:", endpoint); // Debug log
      const res = await axios.get(endpoint, getAuthHeader());
      setAttendanceRecords(Array.isArray(res.data) ? res.data : []);
      setError(null);
    } catch (err) {
      console.error(
        "Error fetching attendance records:", // Log the full error object for debugging
        err
      );
      let errorMessage = "Failed to fetch attendance records. Please try again.";
      if (err?.response) {
        let serverMessage = err.response.data?.message;
        if (!serverMessage && typeof err.response.data === "string") {
          if (err.response.data.trim().startsWith("<")) {
            serverMessage = `Endpoint not found (404). Check server console. URL: ${endpoint}`;
          } else {
            serverMessage = err.response.data;
          }
        }

        if (err.response.status === 401) {
          errorMessage = `Unauthorized: ${serverMessage || "Your session may have expired. Please log in again."}`;
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
      } else {
        errorMessage = `An unexpected error occurred: ${err}`;
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
        ? "Are you sure you want to delete all attendance history? This action cannot be undone."
        : "Are you sure you want to delete your attendance history? This action cannot be undone."
    );
    if (!shouldClear) return;

    try {
      setIsClearing(true);
      const deleteEndpoint = isAdminOrHr ? "/api/attendance/all" : "/api/attendance/my";
      const postFallbackEndpoint = isAdminOrHr
        ? "/api/attendance/all/clear"
        : "/api/attendance/my/clear";

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
      if (status === 404) {
        setError("Clear endpoint not found. Restart backend server and try again.");
      } else {
        setError(serverMessage || "Failed to clear attendance history. Please try again.");
      }
      if (err?.response?.status === 401) logout();
    } finally {
      setIsClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="attendance-history-container">
        Loading attendance history...
      </div>
    );
  }

  if (error) {
    return (
      <div className="attendance-history-container error-message">
        {error}
      </div>
    );
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
        <p>No attendance records found.</p>
      ) : (
        <div className="attendance-list" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {attendanceRecords.map((record) => {
            // Handle both employeeId and userId fields for compatibility
            const empData = record.employeeId || record.userId;
            const employee =
              typeof empData === "object" && empData !== null
                ? empData.name || "N/A"
                : "N/A";
            const checkInTime = record.checkIn || record.timestamp;
            const checkOutTime = record.checkOut;

            return (
              <div key={record._id || record.id} className="attendance-card" style={{ height: "100%" }}>
                <div className="attendance-details">
                  <p>
                    <strong>Employee:</strong> {employee}
                  </p>
                  <p>
                    <strong>Check-In Time:</strong> {formatDate(checkInTime)}
                  </p>
                  <p>
                    <strong>Check-Out Time:</strong> {checkOutTime ? formatDate(checkOutTime) : "Not checked out yet"}
                  </p>
                  <p>
                    <strong>Location:</strong> Lat: {formatCoord(record.latitude)}
                    , Lng: {formatCoord(record.longitude)}
                  </p>
                  <p>
                    <strong>Place:</strong> {record.locationName || "N/A"}
                  </p>
                  <p>
                    <strong>Device:</strong> {record.deviceType || "N/A"}
                  </p>
                </div>

                <div className="attendance-media">
                  {record.photoUrl ? (
                    <img
                      src={record.photoUrl}
                      alt="Attendance"
                      className="attendance-photo"
                      style={{ maxWidth: "100%", height: "auto", borderRadius: "4px" }}
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  ) : (
                    <p>No photo</p>
                  )}

                  <button
                    className="btn btn-view-map"
                    onClick={() => setSelectedRecord(record)}
                  >
                    View on Map
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedRecord && (
        <div
          className="map-modal-overlay"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="map-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ width: "95%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" }}
          >
            <h3>
              Attendance Location for{" "}
              {(selectedRecord.employeeId?.name || selectedRecord.userId?.name) || "N/A"}
            </h3>

            <AttendanceMap
              latitude={Number(selectedRecord.latitude)}
              longitude={Number(selectedRecord.longitude)}
              popupText={`Check-In: ${formatDate(
                selectedRecord.checkIn || selectedRecord.timestamp
              )} | Check-Out: ${selectedRecord.checkOut ? formatDate(selectedRecord.checkOut) : "Not checked out yet"}`}
            />

            <button
              className="btn btn-close-modal"
              onClick={() => setSelectedRecord(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
