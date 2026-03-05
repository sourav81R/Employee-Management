import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { apiGet, apiPost } from "../utils/http";
import "../styles/enterprise.css";

export default function PerformancePage() {
  const { user } = useContext(AuthContext);
  const role = String(user?.role || "").toLowerCase();
  const canReview = ["admin", "hr", "manager"].includes(role);

  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    employeeId: "",
    period: "Q1",
    communication: 3,
    technicalSkill: 3,
    teamwork: 3,
    problemSolving: 3,
    feedback: "",
  });

  async function loadData() {
    try {
      const [myReviews, statData] = await Promise.all([
        apiGet("/api/performance/my"),
        canReview ? apiGet("/api/performance/analytics") : Promise.resolve([]),
      ]);

      setReviews(Array.isArray(myReviews) ? myReviews : []);
      setAnalytics(Array.isArray(statData) ? statData : []);

      if (canReview) {
        const reviewerTargets = role === "manager"
          ? await apiGet(`/api/manager-employees/${user?._id}`)
          : await apiGet("/api/users");

        if (role === "manager") {
          const normalized = (Array.isArray(reviewerTargets) ? reviewerTargets : [])
            .filter((emp) => emp.userId)
            .map((emp) => ({
              _id: emp.userId,
              name: emp.name,
              role: "employee",
              email: emp.email,
            }));
          setUsers(normalized);
        } else {
          setUsers(Array.isArray(reviewerTargets) ? reviewerTargets.filter((u) => u.role !== "admin") : []);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load performance data");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await apiPost("/api/performance", {
        ...form,
        communication: Number(form.communication),
        technicalSkill: Number(form.technicalSkill),
        teamwork: Number(form.teamwork),
        problemSolving: Number(form.problemSolving),
      });
      setForm({ ...form, feedback: "" });
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to submit review");
    }
  }

  return (
    <div className="enterprise-page">
      <div className="enterprise-header">
        <h1>Performance Management</h1>
        <span className="enterprise-pill">{role}</span>
      </div>

      {error ? <p className="enterprise-error">{error}</p> : null}

      {canReview && (
        <section className="enterprise-card enterprise-section">
          <h2>Add Performance Review</h2>
          <form className="enterprise-form" onSubmit={handleSubmit}>
            <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required>
              <option value="">Select employee</option>
              {users.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
            </select>
            <input placeholder="Period (e.g., Q1-2026)" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} required />
            <input type="number" min="1" max="5" value={form.communication} onChange={(e) => setForm({ ...form, communication: e.target.value })} placeholder="Communication" required />
            <input type="number" min="1" max="5" value={form.technicalSkill} onChange={(e) => setForm({ ...form, technicalSkill: e.target.value })} placeholder="Technical Skill" required />
            <input type="number" min="1" max="5" value={form.teamwork} onChange={(e) => setForm({ ...form, teamwork: e.target.value })} placeholder="Teamwork" required />
            <input type="number" min="1" max="5" value={form.problemSolving} onChange={(e) => setForm({ ...form, problemSolving: e.target.value })} placeholder="Problem Solving" required />
            <textarea placeholder="Feedback" value={form.feedback} onChange={(e) => setForm({ ...form, feedback: e.target.value })} />
            <button type="submit">Submit Review</button>
          </form>
        </section>
      )}

      {canReview && (
        <section className="enterprise-card enterprise-section">
          <h2>Performance Analytics</h2>
          <div style={{ overflowX: "auto" }}>
            <table className="enterprise-table">
              <thead><tr><th>Employee</th><th>Email</th><th>Avg Score</th><th>Reviews</th></tr></thead>
              <tbody>
                {analytics.map((item) => (
                  <tr key={item.employeeId}>
                    <td>{item.name}</td>
                    <td>{item.email}</td>
                    <td>{item.avgScore}</td>
                    <td>{item.reviews}</td>
                  </tr>
                ))}
                {!analytics.length ? <tr><td colSpan="4">No analytics yet.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="enterprise-card enterprise-section">
        <h2>My Reviews</h2>
        <div style={{ overflowX: "auto" }}>
          <table className="enterprise-table">
            <thead><tr><th>Period</th><th>Score</th><th>Feedback</th><th>Reviewer</th></tr></thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review._id}>
                  <td>{review.period}</td>
                  <td>{review.overallScore || review.ratings}</td>
                  <td>{review.feedback || "-"}</td>
                  <td>{review.reviewerId?.name || "-"}</td>
                </tr>
              ))}
              {!reviews.length ? <tr><td colSpan="4">No performance reviews available.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
