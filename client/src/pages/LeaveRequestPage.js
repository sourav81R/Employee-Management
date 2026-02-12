import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { buildApiUrl } from "../utils/apiBase";
import '../styles/attendance.css';

const LeaveRequestPage = () => {
    const { user, token: contextToken } = useContext(AuthContext);
    const [leaveReason, setLeaveReason] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [message, setMessage] = useState('');
    const [myRequests, setMyRequests] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [statusFilter, setStatusFilter] = useState('All');

    const token = (contextToken && contextToken !== 'undefined' && contextToken !== 'null')
        ? contextToken
        : localStorage.getItem('token');

    useEffect(() => {
        if (token) {
            fetchMyRequests();
        }
    }, [token]);

    const fetchMyRequests = async () => {
        try {
            const res = await fetch(buildApiUrl("/api/leave/my-requests"), {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setMyRequests(data);
        } catch (err) {
            console.error('Error fetching requests:', err);
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
        if (!window.confirm('Are you sure you want to delete this leave request?')) return;

        try {
            const res = await fetch(buildApiUrl(`/api/leave/request/${id}`), {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setMessage('Leave request deleted successfully!');
                fetchMyRequests();
            } else {
                setMessage(data.message || 'Delete failed');
            }
        } catch (err) {
            console.error('Error deleting request:', err);
            setMessage('Delete failed. Please check if the server is running.');
        }
    };

    const handleLeaveRequest = async (e) => {
        e.preventDefault();
        if (!token || token === 'undefined' || token === 'null' || token === '') {
            setMessage('You must be logged in to submit a request.');
            return;
        }

        try {
            const url = editingId
                ? buildApiUrl(`/api/leave/request/${editingId}`)
                : buildApiUrl("/api/leave/request");

            const res = await fetch(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ startDate, endDate, reason: leaveReason })
            });

            const data = await res.json();
            if (res.ok) {
                if (editingId) {
                    setMessage(data.policyMessage || 'Leave request updated successfully!');
                } else {
                    setMessage(data.policyMessage || (user?.role === 'hr' ? 'Leave request submitted to Admin!' : 'Leave request submitted to HR!'));
                }
                setLeaveReason('');
                setStartDate('');
                setEndDate('');
                setEditingId(null);
                fetchMyRequests();
            } else {
                setMessage(data.message || 'Request failed');
            }
        } catch (err) {
            console.error(err);
            setMessage('Request failed. Please check if the server is running.');
        }
    };

    const getDisplayStatus = (status) => {
        const normalized = (status || '').toLowerCase();
        if (normalized === 'approved') return 'Approved';
        if (normalized === 'rejected') return 'Rejected';
        return 'Pending';
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
        if (statusFilter === 'All') return true;
        return getDisplayStatus(req.status) === statusFilter;
    });

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
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button type="submit" className="btn-leave">
                            {editingId ? 'Update Request' : (user?.role === 'hr' ? 'Submit to Admin' : 'Submit to HR')}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                className="btn-leave"
                                style={{ backgroundColor: '#718096' }}
                                onClick={() => {
                                    setEditingId(null);
                                    setLeaveReason('');
                                    setStartDate('');
                                    setEndDate('');
                                }}
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>
                </form>

                {message && (
                    <p className="info-msg" style={{ marginTop: '15px', color: message.toLowerCase().includes('success') ? '#2f855a' : '#e63946' }}>
                        {message}
                    </p>
                )}
            </div>

            <div className="leave-card" style={{ width: '100%', maxWidth: '600px' }}>
                <h2>My Leave Status</h2>
                <div style={{ marginBottom: '12px' }}>
                    <label style={{ marginRight: '8px', fontWeight: '600' }}>Filter:</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e0' }}
                    >
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
                            const canEdit = displayStatus === 'Pending';
                            const canDelete = displayStatus !== 'Approved';
                            const calculatedTotalDays = getCalculatedDays(req.startDate, req.endDate);
                            const totalDays = Number(req.totalDays) > 0 ? Number(req.totalDays) : calculatedTotalDays;
                            const paidDays = Number(req.paidDays) > 0
                                ? Number(req.paidDays)
                                : (Number(req.unpaidDays) > 0 ? Math.max(0, totalDays - Number(req.unpaidDays)) : totalDays);
                            const unpaidDays = Number(req.unpaidDays) > 0 ? Number(req.unpaidDays) : Math.max(0, totalDays - paidDays);

                            return (
                                <div key={req._id} style={{ padding: '15px', borderBottom: '1px solid #eee', marginBottom: '10px' }}>
                                    <p><strong>Dates:</strong> {new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()}</p>
                                    <p>
                                        <strong>Status:</strong>
                                        <span className={`role-badge role-${displayStatus.toLowerCase()}`} style={{ marginLeft: '10px' }}>
                                            {displayStatus}
                                        </span>
                                    </p>
                                    <p><strong>Total Days:</strong> {totalDays}</p>
                                    <p><strong>Paid Days:</strong> {paidDays}</p>
                                    <p><strong>Unpaid Days:</strong> {unpaidDays}</p>

                                    {(req.salaryCut || unpaidDays > 0) && (
                                        <p style={{ color: '#c53030', fontWeight: '600' }}>
                                            Salary Cut Applicable: {unpaidDays} day(s) exceed yearly 18 paid leave days.
                                        </p>
                                    )}

                                    {displayStatus === 'Approved' ? (
                                        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0fff4', border: '1px solid #c6f6d5', borderRadius: '8px', color: '#2f855a', fontWeight: '500' }}>
                                            <p>{user?.role === 'hr' ? 'Your request was approved by Admin.' : 'Your request was approved by HR.'}</p>
                                        </div>
                                    ) : displayStatus === 'Rejected' ? (
                                        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '8px', color: '#c53030', fontWeight: '500' }}>
                                            <p>{user?.role === 'hr' ? 'Your request was rejected by Admin.' : 'Your request was rejected by HR.'}</p>
                                        </div>
                                    ) : (
                                        <p style={{ marginTop: '10px', color: '#718096', fontStyle: 'italic' }}>
                                            {user?.role === 'hr' ? 'Request Pending (waiting for Admin review)...' : 'Request Pending (waiting for HR review)...'}
                                        </p>
                                    )}

                                    {(canEdit || canDelete) && (
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                                            {canEdit && (
                                                <button onClick={() => handleEditClick(req)} style={{ padding: '5px 12px', cursor: 'pointer', backgroundColor: '#edf2f7', border: '1px solid #cbd5e0', borderRadius: '4px' }}>
                                                    Edit Request
                                                </button>
                                            )}
                                            {canDelete && (
                                                <button onClick={() => handleDeleteClick(req._id)} style={{ padding: '5px 12px', cursor: 'pointer', backgroundColor: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '4px', color: '#c53030' }}>
                                                    Delete Request
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {filteredRequests.length === 0 && (
                            <p>No leave requests found for selected filter.</p>
                        )}
                    </div>
                ) : (
                    <p>No leave requests found.</p>
                )}
            </div>
        </div>
    );
};

export default LeaveRequestPage;
