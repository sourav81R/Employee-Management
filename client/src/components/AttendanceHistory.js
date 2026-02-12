// c:\Employee-Management\client\src\components\AttendanceHistory.js
import React, { useState, useEffect, useContext } from "react";
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

  useEffect(() => {
    const fetchAttendance = async () => {
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

      const endpoint =
        user.role?.toLowerCase() === "admin" ||
        user.role?.toLowerCase() === "hr"
          ? buildApiUrl("/api/attendance/all")
          : buildApiUrl("/api/attendance/my");

      try {
        console.log("Fetching attendance from:", endpoint); // Debug log
        const res = await axios.get(endpoint, getAuthHeader());
        // Ensure res.data is an array, or default to an empty array if it's not or is null/undefined
        setAttendanceRecords(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(
          "Error fetching attendance records:", // Log the full error object for debugging
          err
        );
        let errorMessage = "Failed to fetch attendance records. Please try again.";
        if (err?.response) {
          // Attempt to get a more specific message from the server response data
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
            logout(); // Call logout function
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
          // Fallback for unexpected error structures (e.g., if 'err' is not an object or has no 'message')
          errorMessage = `An unexpected error occurred: ${err}`;
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [user, logout]); // Added logout to dependency array

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

  if (!attendanceRecords.length) {
    return (
      <div className="attendance-history-container">
        <p>No attendance records found.</p>
      </div>
    );
  }

  return (
    <div className="attendance-history-container">
      <h2>Attendance History</h2>

      <div className="attendance-list">
        {attendanceRecords.map((record) => {
          // Handle both employeeId and userId fields for compatibility
          const empData = record.employeeId || record.userId;
          const employee =
            typeof empData === "object" && empData !== null
              ? empData.name || "N/A"
              : "N/A";

          return (
            <div key={record._id || record.id} className="attendance-card">
              <div className="attendance-details">
                <p>
                  <strong>Employee:</strong> {employee}
                </p>
                <p>
                  <strong>Time:</strong> {formatDate(record.timestamp)}
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

      {selectedRecord && (
        <div
          className="map-modal-overlay"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="map-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>
              Attendance Location for{" "}
              {(selectedRecord.employeeId?.name || selectedRecord.userId?.name) || "N/A"}
            </h3>

            <AttendanceMap
              latitude={Number(selectedRecord.latitude)}
              longitude={Number(selectedRecord.longitude)}
              popupText={`Attendance at ${formatDate(
                selectedRecord.timestamp
              )}`}
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
