import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { apiDelete, apiGet, apiPost } from "../utils/http";
import "../styles/enterprise.css";

export default function AnnouncementsPage() {
  const { user } = useContext(AuthContext);
  const role = String(user?.role || "").toLowerCase();
  const canCreate = ["admin", "hr"].includes(role);

  const [announcements, setAnnouncements] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", message: "", targetRole: "all" });

  async function loadAnnouncements() {
    try {
      const data = await apiGet("/api/announcements");
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load announcements");
    }
  }

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function handleCreate(event) {
    event.preventDefault();
    try {
      await apiPost("/api/announcements", form);
      setForm({ title: "", message: "", targetRole: "all" });
      await loadAnnouncements();
    } catch (err) {
      setError(err.message || "Failed to create announcement");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await apiDelete(`/api/announcements/${id}`);
      await loadAnnouncements();
    } catch (err) {
      setError(err.message || "Failed to delete announcement");
    }
  }

  return (
    <div className="enterprise-page">
      <div className="enterprise-header">
        <h1>Company Announcements</h1>
      </div>

      {error ? <p className="enterprise-error">{error}</p> : null}

      {canCreate && (
        <section className="enterprise-card enterprise-section">
          <h2>Broadcast Announcement</h2>
          <form className="enterprise-form" onSubmit={handleCreate}>
            <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <textarea placeholder="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
            <select value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })}>
              <option value="all">All</option>
              <option value="admin">Admin</option>
              <option value="hr">HR</option>
              <option value="manager">Manager</option>
              <option value="employee">Employee</option>
            </select>
            <button type="submit">Send Announcement</button>
          </form>
        </section>
      )}

      <section className="enterprise-card enterprise-section">
        <h2>Recent Announcements</h2>
        <div style={{ overflowX: "auto" }}>
          <table className="enterprise-table">
            <thead><tr><th>Title</th><th>Message</th><th>Target</th><th>Created By</th><th>Date</th><th>Action</th></tr></thead>
            <tbody>
              {announcements.map((item) => (
                <tr key={item._id}>
                  <td>{item.title}</td>
                  <td>{item.message}</td>
                  <td>{item.targetRole}</td>
                  <td>{item.createdBy?.name || "-"}</td>
                  <td>{new Date(item.createdAt).toLocaleString()}</td>
                  <td>
                    {canCreate ? (
                      <button type="button" className="enterprise-btn warn" onClick={() => handleDelete(item._id)}>Delete</button>
                    ) : "-"}
                  </td>
                </tr>
              ))}
              {!announcements.length ? <tr><td colSpan="6">No announcements found.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
