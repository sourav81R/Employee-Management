import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { buildApiUrl } from "../utils/apiBase";
import "../styles/attendance.css";

const Attendance = () => {
  const { token: contextToken } = useContext(AuthContext);
  const [attendance, setAttendance] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const getLocalDateString = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;
  };

  const calculateWorkHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return null;
    const diff = new Date(checkOut) - new Date(checkIn);
    const totalMinutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const formatMinutesAsHours = (minutes) => {
    const total = Number(minutes || 0);
    const hours = Math.floor(total / 60);
    const mins = total % 60;
    return `${hours}h ${mins}m`;
  };

  const token =
    contextToken && contextToken !== "undefined" && contextToken !== "null"
      ? contextToken
      : localStorage.getItem("token");

  useEffect(() => {
    if (token && token !== "undefined" && token !== "null") {
      fetchTodayAttendance();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchTodayAttendance = async () => {
    try {
      const todayStr = getLocalDateString();
      const res = await fetch(`${buildApiUrl("/api/attendance/today")}?date=${todayStr}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data && data._id) {
        setAttendance(data);
      } else {
        setAttendance(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!token || token === "undefined" || token === "null") {
      setMessage("Authentication error. Please log out and log in again.");
      return;
    }

    try {
      const res = await fetch(buildApiUrl("/api/attendance/check-in"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ date: getLocalDateString() }),
      });

      if (res.ok) {
        setMessage("Checked in successfully!");
        fetchTodayAttendance();
      } else {
        const data = await res.json();
        setMessage(data.message || "Check-in failed");
      }
    } catch (_err) {
      setMessage("Check-in failed");
    }
  };

  const handleCheckOut = async () => {
    if (!token || token === "undefined" || token === "null") {
      setMessage("Authentication error. Please log out and log in again.");
      return;
    }

    try {
      const res = await fetch(buildApiUrl("/api/attendance/check-out"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ date: getLocalDateString() }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessage(data.workHoursMessage || "Checked out successfully!");
        fetchTodayAttendance();
      } else {
        const data = await res.json();
        setMessage(data.message || "Check-out failed");
      }
    } catch (_err) {
      setMessage("Check-out failed");
    }
  };

  if (loading) {
    return (
      <div className="attendance-container attendance-single-column">
        <p>Verifying attendance status...</p>
      </div>
    );
  }

  return (
    <div className="attendance-container attendance-single-column">
      <div className="attendance-card attendance-single-card">
        <h2>Daily Attendance</h2>
        <p>Today is {new Date().toLocaleDateString()}</p>

        {attendance ? (
          <div className="status-present">
            <p>Status: Checked In</p>
            <p>Check-In Time: {new Date(attendance.checkIn || attendance.timestamp).toLocaleTimeString()}</p>
            {attendance.checkOut ? (
              <>
                <p>Check-Out Time: {new Date(attendance.checkOut).toLocaleTimeString()}</p>
                <p className="attendance-inline-note">
                  Total Duration: {attendance.workedMinutes
                    ? formatMinutesAsHours(attendance.workedMinutes)
                    : calculateWorkHours(attendance.checkIn || attendance.timestamp, attendance.checkOut)}
                </p>
                {attendance.salaryCut && (
                  <p className="attendance-warning">
                    Salary Cut: Worked less than 8 hours today (short by {formatMinutesAsHours(attendance.shortByMinutes)}).
                  </p>
                )}
              </>
            ) : (
              <button
                onClick={handleCheckOut}
                className="btn-checkin btn-warning attendance-checkout-btn"
              >
                Check Out
              </button>
            )}
          </div>
        ) : (
          <button onClick={handleCheckIn} className="btn-checkin">
            Mark Attendance
          </button>
        )}

        {message && <p className="info-msg">{message}</p>}
      </div>
    </div>
  );
};

export default Attendance;
