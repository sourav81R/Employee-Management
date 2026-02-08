import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../styles/attendance.css';

const LeaveRequestPage = () => {
    const { user, token: contextToken } = useContext(AuthContext);
    const [leaveReason, setLeaveReason] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [message, setMessage] = useState('');
    const [myRequests, setMyRequests] = useState([]);
    const [editingId, setEditingId] = useState(null);

    const API_BASE = "http://localhost:8000";
    
    // Fallback to localStorage if context token is missing or invalid
    const token = (contextToken && contextToken !== "undefined" && contextToken !== "null") 
        ? contextToken 
        : localStorage.getItem("token");

    useEffect(() => {
        if (token) {
            fetchMyRequests();
        }
    }, [token]);

    const fetchMyRequests = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/leave/my-requests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setMyRequests(data);
        } catch (err) {
            console.error("Error fetching requests:", err);
        }
    };

    const handleEditClick = (req) => {
        setEditingId(req._id);
        setStartDate(new Date(req.startDate).toISOString().split('T')[0]);
        setEndDate(new Date(req.endDate).toISOString().split('T')[0]);
        setLeaveReason(req.reason);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteClick = async (id) => {
        if (!window.confirm("Are you sure you want to delete this leave request?")) return;

        try {
            const res = await fetch(`${API_BASE}/api/leave/request/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setMessage("Leave request deleted successfully!");
                fetchMyRequests();
            } else {
                setMessage(data.message || "Delete failed");
            }
        } catch (err) {
            console.error("Error deleting request:", err);
            setMessage("Delete failed. Please check if the server is running.");
        }
    };

    const handleLeaveRequest = async (e) => {
        e.preventDefault();
        if (!token || token === "undefined" || token === "null" || token === "") {
            setMessage("You must be logged in to submit a request.");
            return;
        }

        try {
            const url = editingId 
                ? `${API_BASE}/api/leave/request/${editingId}` 
                : `${API_BASE}/api/leave/request`;
            const res = await fetch(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ startDate, endDate, reason: leaveReason })
            });
            const data = await res.json();
            if (res.ok) {
                if (editingId) {
                    setMessage("Leave request updated successfully!");
                } else {
                    setMessage(user?.role === 'hr' ? "Leave request submitted to Admin!" : "Leave request submitted to HR!");
                }
                setLeaveReason('');
                setStartDate('');
                setEndDate('');
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

    // Get the most recent request to show the status message
    const latestRequest = myRequests.length > 0 ? myRequests[0] : null;

    return (
        <div className="attendance-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div className="leave-card" style={{ width: '100%', maxWidth: '600px' }}>
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
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" className="btn-leave">
                            {editingId ? "Update Request" : (user?.role === 'hr' ? "Submit to Admin" : "Submit to HR")}
                        </button>
                        {editingId && (
                            <button type="button" className="btn-leave" style={{ backgroundColor: '#718096' }} onClick={() => {
                                setEditingId(null);
                                setLeaveReason('');
                                setStartDate('');
                                setEndDate('');
                            }}>Cancel Edit</button>
                        )}
                    </div>
                </form>
                {message && (
                    <p className="info-msg" style={{ marginTop: '15px', color: message.includes('success') ? '#2f855a' : '#e63946' }}>
                        {message}
                    </p>
                )}
            </div>

            <div className="leave-card" style={{ width: '100%', maxWidth: '600px' }}>
                <h2>My Leave Status</h2>
                {myRequests.length > 0 ? (
                    <div className="requests-list">
                        {myRequests.map((req) => (
                            <div key={req._id} style={{ padding: '15px', borderBottom: '1px solid #eee', marginBottom: '10px' }}>
                                <p><strong>Dates:</strong> {new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()}</p>
                                <p><strong>Status:</strong> 
                                    <span className={`role-badge role-${req.status.toLowerCase()}`} style={{ marginLeft: '10px' }}>
                                        {req.status}
                                    </span>
                                </p>
                                
                                {req.status === 'Approved' ? (
                                    <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0fff4', border: '1px solid #c6f6d5', borderRadius: '8px', color: '#2f855a', fontWeight: '500' }}>
                                        <p>{user?.role === 'hr' ? "you request Approved by Admin, now you can leave from office in this days then join immediately as soon as possible" : "your leave request Approved by HR, now you can leave from office in those days, then join immediateley as soon as possible"}</p>
                                    </div>
                                ) : req.status === 'Rejected' ? (
                                    <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '8px', color: '#c53030', fontWeight: '500' }}>
                                        <p>{user?.role === 'hr' ? "Your request reject by Admin Due to Metting" : "hr reject your request due to project does not completed"}</p>
                                    </div>
                                ) : (
                                    <p style={{ marginTop: '10px', color: '#718096', fontStyle: 'italic' }}>
                                        {user?.role === 'hr' ? "Waiting for Admin review..." : "Waiting for HR review..."}
                                    </p>
                                )}
                                {req.status === 'Pending' && (
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                        <button onClick={() => handleEditClick(req)} style={{ padding: '5px 12px', cursor: 'pointer', backgroundColor: '#edf2f7', border: '1px solid #cbd5e0', borderRadius: '4px' }}>
                                            ✏️ Edit Request
                                        </button>
                                        <button onClick={() => handleDeleteClick(req._id)} style={{ padding: '5px 12px', cursor: 'pointer', backgroundColor: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '4px', color: '#c53030' }}>
                                            🗑️ Delete Request
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>No leave requests found.</p>
                )}
            </div>
        </div>
    );
};

export default LeaveRequestPage;