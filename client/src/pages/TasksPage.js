import React, { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { apiGet, apiPost, apiPut } from "../utils/http";
import "../styles/enterprise.css";

const statuses = ["Pending", "In Progress", "Completed", "Overdue"];

export default function TasksPage() {
  const { user } = useContext(AuthContext);
  const role = String(user?.role || "").toLowerCase();
  const canAssign = ["admin", "hr", "manager"].includes(role);

  const [dashboard, setDashboard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    deadline: "",
    priority: "Medium",
  });

  const statusCount = useMemo(() => {
    const summary = { Pending: 0, "In Progress": 0, Completed: 0, Overdue: 0 };
    tasks.forEach((task) => {
      if (summary[task.status] !== undefined) summary[task.status] += 1;
    });
    return summary;
  }, [tasks]);

  async function loadData() {
    try {
      const [taskData, statsData] = await Promise.all([
        apiGet("/api/tasks"),
        apiGet("/api/tasks/dashboard"),
      ]);

      setTasks(Array.isArray(taskData) ? taskData : []);
      setDashboard(statsData || null);

      if (canAssign) {
        let users = [];
        if (role === "manager") {
          users = await apiGet(`/api/manager-employees/${user?._id}`);
        } else {
          users = await apiGet("/api/users");
        }

        setAssignees(Array.isArray(users) ? users : []);
      }
    } catch (err) {
      setError(err.message || "Failed to load tasks");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAssign(event) {
    event.preventDefault();
    try {
      await apiPost("/api/tasks", {
        ...form,
        deadline: new Date(form.deadline).toISOString(),
      });

      setForm({ title: "", description: "", assignedTo: "", deadline: "", priority: "Medium" });
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to create task");
    }
  }

  async function handleStatus(taskId, status) {
    try {
      await apiPut(`/api/tasks/${taskId}`, { status });
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to update task");
    }
  }

  async function handleComment(taskId) {
    const text = window.prompt("Add comment");
    if (!text) return;

    try {
      await apiPost(`/api/tasks/${taskId}/comments`, { text });
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to add comment");
    }
  }

  return (
    <div className="enterprise-page">
      <div className="enterprise-header">
        <h1>Task Management</h1>
        <span className="enterprise-pill">{role}</span>
      </div>

      {error ? <p className="enterprise-error">{error}</p> : null}

      <section className="enterprise-grid enterprise-section">
        <div className="enterprise-card"><h3>Total</h3><p>{dashboard?.total ?? tasks.length}</p></div>
        <div className="enterprise-card"><h3>Pending</h3><p>{dashboard?.Pending ?? statusCount.Pending}</p></div>
        <div className="enterprise-card"><h3>In Progress</h3><p>{dashboard?.["In Progress"] ?? statusCount["In Progress"]}</p></div>
        <div className="enterprise-card"><h3>Completed</h3><p>{dashboard?.Completed ?? statusCount.Completed}</p></div>
      </section>

      {canAssign && (
        <section className="enterprise-section enterprise-card">
          <h2>Assign Task</h2>
          <form className="enterprise-form" onSubmit={handleAssign}>
            <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} required>
              <option value="">Select assignee</option>
              {assignees.map((assignee) => (
                <option key={assignee._id} value={assignee._id}>{assignee.name || assignee.email}</option>
              ))}
            </select>
            <input type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} required />
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
            <button type="submit">Assign Task</button>
          </form>
        </section>
      )}

      <section className="enterprise-section enterprise-card">
        <h2>Task Board</h2>
        <div style={{ overflowX: "auto" }}>
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Assigned To</th>
                <th>Deadline</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task._id}>
                  <td>{task.title}</td>
                  <td>{task.assignedTo?.name || task.assignedTo?.email || "-"}</td>
                  <td>{new Date(task.deadline).toLocaleString()}</td>
                  <td>{task.priority}</td>
                  <td>{task.status}</td>
                  <td>
                    <select value={task.status} onChange={(e) => handleStatus(task._id, e.target.value)}>
                      {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    <button type="button" className="enterprise-btn secondary" onClick={() => handleComment(task._id)}>
                      Comment
                    </button>
                  </td>
                </tr>
              ))}
              {!tasks.length ? <tr><td colSpan="6">No tasks found.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
