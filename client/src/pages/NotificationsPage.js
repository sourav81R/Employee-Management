import React, { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { apiGet, apiPatch } from "../utils/http";
import { resolveApiBaseUrl } from "../utils/apiBase";
import "../styles/enterprise.css";

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  const unread = useMemo(() => items.filter((item) => !item.read).length, [items]);

  async function loadNotifications() {
    try {
      const data = await apiGet("/api/notifications");
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load notifications");
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return undefined;

    const base = resolveApiBaseUrl() || window.location.origin;
    const socket = io(base, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("notification:new", (notification) => {
      setItems((prev) => [notification, ...prev]);
    });

    return () => socket.disconnect();
  }, []);

  async function markRead(id) {
    try {
      const updated = await apiPatch(`/api/notifications/${id}/read`, {});
      setItems((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
    } catch (err) {
      setError(err.message || "Failed to mark as read");
    }
  }

  async function markAll() {
    try {
      await apiPatch("/api/notifications/read-all", {});
      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    } catch (err) {
      setError(err.message || "Failed to mark all as read");
    }
  }

  return (
    <div className="enterprise-page">
      <div className="enterprise-header">
        <h1>Notifications</h1>
        <span className="enterprise-pill">Unread: {unread}</span>
      </div>

      {error ? <p className="enterprise-error">{error}</p> : null}

      <section className="enterprise-card enterprise-section">
        <button type="button" className="enterprise-btn" onClick={markAll}>Mark All Read</button>
      </section>

      <section className="enterprise-card enterprise-section">
        <h2>Recent Notifications</h2>
        <div style={{ overflowX: "auto" }}>
          <table className="enterprise-table">
            <thead><tr><th>Title</th><th>Message</th><th>Type</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
                  <td>{item.title}</td>
                  <td>{item.message}</td>
                  <td>{item.type}</td>
                  <td>{new Date(item.createdAt).toLocaleString()}</td>
                  <td>{item.read ? "Read" : "Unread"}</td>
                  <td>
                    {!item.read ? (
                      <button type="button" className="enterprise-btn secondary" onClick={() => markRead(item._id)}>Mark Read</button>
                    ) : "-"}
                  </td>
                </tr>
              ))}
              {!items.length ? <tr><td colSpan="6">No notifications found.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
