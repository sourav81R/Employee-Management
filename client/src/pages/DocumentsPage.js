import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { apiDelete, apiGet, apiPatch, apiPut, apiUpload } from "../utils/http";
import { buildFileUrl } from "../utils/apiBase";
import "../styles/enterprise.css";

const docTypes = ["Aadhar", "PAN", "Resume", "Certificates", "Other"];

export default function DocumentsPage() {
  const { user } = useContext(AuthContext);
  const role = String(user?.role || "").toLowerCase();
  const canReview = ["admin", "hr"].includes(role);
  const canViewAll = ["admin", "hr", "manager"].includes(role);

  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editingType, setEditingType] = useState("Aadhar");
  const [form, setForm] = useState({ documentType: "Aadhar", file: null, employeeId: "" });

  async function loadDocuments() {
    try {
      const data = await apiGet(canViewAll ? "/api/documents" : "/api/documents/my");
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load documents");
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  async function handleUpload(event) {
    event.preventDefault();
    if (!form.file) {
      setError("Select a file first");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const payload = new FormData();
      payload.append("documentType", form.documentType);
      payload.append("file", form.file);
      if (form.employeeId) payload.append("employeeId", form.employeeId);

      await apiUpload("/api/documents/upload", payload);
      setForm({ ...form, file: null });
      await loadDocuments();
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleVerify(id, status) {
    try {
      await apiPatch(`/api/documents/${id}/verify`, { status });
      await loadDocuments();
    } catch (err) {
      setError(err.message || "Failed to update document status");
    }
  }

  function startEditing(doc) {
    setEditingId(doc._id);
    setEditingType(doc.documentType || "Other");
  }

  function cancelEditing() {
    setEditingId("");
    setEditingType("Aadhar");
  }

  async function handleEditSave(id) {
    setSavingId(id);
    setError("");
    try {
      await apiPut(`/api/documents/${id}`, { documentType: editingType });
      cancelEditing();
      await loadDocuments();
    } catch (err) {
      setError(err.message || "Failed to update document");
    } finally {
      setSavingId("");
    }
  }

  async function handleDelete(id) {
    const shouldDelete = window.confirm("Delete this document?");
    if (!shouldDelete) return;

    setSavingId(id);
    setError("");
    try {
      await apiDelete(`/api/documents/${id}`);
      if (editingId === id) cancelEditing();
      await loadDocuments();
    } catch (err) {
      setError(err.message || "Failed to delete document");
    } finally {
      setSavingId("");
    }
  }

  return (
    <div className="enterprise-page">
      <div className="enterprise-header">
        <h1>Document Management</h1>
        <span className="enterprise-pill">{role}</span>
      </div>

      {error ? <p className="enterprise-error">{error}</p> : null}

      <section className="enterprise-card enterprise-section">
        <h2>Upload Document</h2>
        <form className="enterprise-form" onSubmit={handleUpload}>
          <select value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value })}>
            {docTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          {canReview && (
            <input
              placeholder="Employee User ID (optional)"
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
            />
          )}
          <input type="file" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })} required />
          <button type="submit" disabled={uploading}>{uploading ? "Uploading..." : "Upload"}</button>
        </form>
      </section>

      <section className="enterprise-card enterprise-section">
        <h2>{canViewAll ? "All Documents" : "My Documents"}</h2>
        <div className="enterprise-table-wrap documents-table-wrap">
          <table className="enterprise-table documents-table">
            <thead><tr><th>Employee</th><th>Type</th><th>Status</th><th>File</th><th>Actions</th></tr></thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc._id}>
                  <td data-label="Employee">{doc.employeeId?.name || doc.employeeId?.email || "Self"}</td>
                  <td data-label="Type">
                    {editingId === doc._id ? (
                      <select value={editingType} onChange={(e) => setEditingType(e.target.value)}>
                        {docTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                      </select>
                    ) : (
                      doc.documentType
                    )}
                  </td>
                  <td data-label="Status">{doc.status}</td>
                  <td data-label="File">
                    <a href={buildFileUrl(doc.fileUrl)} target="_blank" rel="noreferrer">View</a>
                  </td>
                  <td data-label="Actions">
                    {canReview ? (
                      <div className="documents-actions">
                        <button type="button" className="enterprise-btn" onClick={() => handleVerify(doc._id, "Verified")}>Verify</button>
                        <button type="button" className="enterprise-btn warn" onClick={() => handleVerify(doc._id, "Rejected")}>Reject</button>
                      </div>
                    ) : (
                      (String(doc.employeeId?._id || doc.employeeId) === String(user?._id) || !canViewAll) ? (
                        <div className="documents-actions">
                          {editingId === doc._id ? (
                            <>
                              <button
                                type="button"
                                className="enterprise-btn"
                                onClick={() => handleEditSave(doc._id)}
                                disabled={savingId === doc._id}
                              >
                                {savingId === doc._id ? "Saving..." : "Save"}
                              </button>
                              <button type="button" className="enterprise-btn secondary" onClick={cancelEditing}>
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button type="button" className="enterprise-btn secondary" onClick={() => startEditing(doc)}>
                              Edit
                            </button>
                          )}
                          <button
                            type="button"
                            className="enterprise-btn warn"
                            onClick={() => handleDelete(doc._id)}
                            disabled={savingId === doc._id}
                          >
                            {savingId === doc._id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      ) : "-"
                    )}
                  </td>
                </tr>
              ))}
              {!documents.length ? <tr><td colSpan="5">No documents found.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
