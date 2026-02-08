import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../styles/attendance.css';

const Attendance = () => {
    const { user, token: contextToken } = useContext(AuthContext);
    const [attendance, setAttendance] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);

    const API_BASE = "http://localhost:8000";
    
    // Helper to get YYYY-MM-DD in local time
    const getLocalDateString = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    };

    // Helper to calculate duration
    const calculateWorkHours = (checkIn, checkOut) => {
        if (!checkIn || !checkOut) return null;
        const diff = new Date(checkOut) - new Date(checkIn);
        const totalMinutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}h ${minutes}m`;
    };

    // Fallback to localStorage if context token is missing or invalid
    const token = (contextToken && contextToken !== "undefined" && contextToken !== "null") 
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
            const res = await fetch(`${API_BASE}/api/attendance/today?date=${todayStr}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data && data._id) {
                setAttendance(data);
            } else {
                setAttendance(null);
            }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const handleCheckIn = async () => {
        if (!token || token === "undefined" || token === "null") {
            setMessage("Authentication error. Please log out and log in again.");
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/attendance/check-in`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ date: getLocalDateString() }) 
            });
            if (res.ok) {
                setMessage("Checked in successfully!");
                fetchTodayAttendance();
            } else {
                const data = await res.json();
                setMessage(data.message || "Check-in failed");
            }
        } catch (err) { setMessage("Check-in failed"); }
    };

    const handleCheckOut = async () => {
        if (!token || token === "undefined" || token === "null") {
            setMessage("Authentication error. Please log out and log in again.");
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/attendance/check-out`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ date: getLocalDateString() }) 
            });
            if (res.ok) {
                setMessage("Checked out successfully!");
                fetchTodayAttendance();
            } else {
                const data = await res.json();
                setMessage(data.message || "Check-out failed");
            }
        } catch (err) { setMessage("Check-out failed"); }
    };

    if (loading) {
        return (
            <div className="attendance-container" style={{ display: 'flex', justifyContent: 'center' }}>
                <p>Verifying attendance status...</p>
            </div>
        );
    }

    return (
        <div className="attendance-container" style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="attendance-card" style={{ width: '100%', maxWidth: '500px' }}>
                <h2>Daily Attendance</h2>
                <p>Today is {new Date().toLocaleDateString()}</p>
                
                {attendance ? (
                    <div className="status-present">
                        <p>✅ Status: Checked In</p>
                        <p>Check-In Time: {new Date(attendance.checkIn).toLocaleTimeString()}</p>
                        {attendance.checkOut ? (
                            <>
                                <p>Check-Out Time: {new Date(attendance.checkOut).toLocaleTimeString()}</p>
                                <p style={{ fontWeight: 'bold', marginTop: '10px', color: '#4a5568' }}>Total Duration: {calculateWorkHours(attendance.checkIn, attendance.checkOut)}</p>
                            </>
                        ) : (
                            <button onClick={handleCheckOut} className="btn-checkin" style={{ marginTop: '15px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                                Check Out
                            </button>
                        )}
                    </div>
                ) : (
                    <button onClick={handleCheckIn} className="btn-checkin">Mark Attendance</button>
                )}
                {message && <p className="info-msg">{message}</p>}
            </div>
        </div>
    );
};

export default Attendance;