import React, { useEffect, useState } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "../utils/http";
import "../styles/enterprise.css";

const statusOptions = ["Applied", "Screening", "Interview", "Offer", "Hired"];

export default function RecruitmentPage() {
  const [candidates, setCandidates] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    position: "",
    resume: "",
    status: "Applied",
    interviewDate: "",
    notes: "",
  });

  async function loadCandidates() {
    try {
      const data = await apiGet("/api/recruitment");
      setCandidates(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load candidates");
    }
  }

  useEffect(() => {
    loadCandidates();
  }, []);

  async function handleCreate(event) {
    event.preventDefault();
    try {
      await apiPost("/api/recruitment", {
        ...form,
        interviewDate: form.interviewDate ? new Date(form.interviewDate).toISOString() : null,
      });
      setForm({ name: "", email: "", position: "", resume: "", status: "Applied", interviewDate: "", notes: "" });
      await loadCandidates();
    } catch (err) {
      setError(err.message || "Failed to create candidate");
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await apiPut(`/api/recruitment/${id}`, { status });
      await loadCandidates();
    } catch (err) {
      setError(err.message || "Failed to update status");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this candidate?")) return;
    try {
      await apiDelete(`/api/recruitment/${id}`);
      await loadCandidates();
    } catch (err) {
      setError(err.message || "Failed to delete candidate");
    }
  }

  return (
    <div className="enterprise-page">
      <div className="enterprise-header">
        <h1>Recruitment</h1>
      </div>

      {error ? <p className="enterprise-error">{error}</p> : null}

      <section className="enterprise-card enterprise-section">
        <h2>Add Candidate</h2>
        <form className="enterprise-form" onSubmit={handleCreate}>
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input placeholder="Position" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} required />
          <input placeholder="Resume URL" value={form.resume} onChange={(e) => setForm({ ...form, resume: e.target.value })} />
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <input type="datetime-local" value={form.interviewDate} onChange={(e) => setForm({ ...form, interviewDate: e.target.value })} />
          <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <button type="submit">Create Candidate</button>
        </form>
      </section>

      <section className="enterprise-card enterprise-section">
        <h2>Applicant Tracking</h2>
        <div style={{ overflowX: "auto" }}>
          <table className="enterprise-table">
            <thead><tr><th>Name</th><th>Email</th><th>Position</th><th>Status</th><th>Interview</th><th>Actions</th></tr></thead>
            <tbody>
              {candidates.map((candidate) => (
                <tr key={candidate._id}>
                  <td>{candidate.name}</td>
                  <td>{candidate.email}</td>
                  <td>{candidate.position}</td>
                  <td>
                    <select value={candidate.status} onChange={(e) => handleStatusChange(candidate._id, e.target.value)}>
                      {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </td>
                  <td>{candidate.interviewDate ? new Date(candidate.interviewDate).toLocaleString() : "-"}</td>
                  <td>
                    <button type="button" className="enterprise-btn warn" onClick={() => handleDelete(candidate._id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!candidates.length ? <tr><td colSpan="6">No candidates found.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
