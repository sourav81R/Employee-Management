// EmployeeForm.js
import React, { useState, useEffect } from "react";

export default function EmployeeForm({ onAdd, onUpdate, editing, setEditing }) {
  const [form, setForm] = useState({
    employeeId: "",
    name: "",
    email: "",
    position: "",
    department: "",
    salary: "",
    salaryPaid: false,
  });

  useEffect(() => {
    if (editing) {
      // copy only known fields in case the editing object has extra properties
      setForm({
        employeeId: editing.employeeId ?? "",
        name: editing.name ?? "",
        email: editing.email ?? "",
        position: editing.position ?? "",
        department: editing.department ?? "",
        salary: editing.salary ?? "",
        salaryPaid: editing.salaryPaid ?? false,
      });
    } else {
      setForm({
        employeeId: "",
        name: "",
        email: "",
        position: "",
        department: "",
        salary: "",
        salaryPaid: false,
      });
    }
  }, [editing]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (editing) {
      // update using the DB _id from editing object
      onUpdate(editing._id, form);
    } else {
      onAdd(form);
    }
    // reset
    setEditing(null);
    setForm({
      employeeId: "",
      name: "",
      email: "",
      position: "",
      department: "",
      salary: "",
      salaryPaid: false,
    });
  }

  return (
    <form className="employee-form employee-form-compact" onSubmit={handleSubmit}>
      <input
        type="text"
        name="employeeId"
        placeholder="Employee ID (custom)"
        value={form.employeeId}
        onChange={handleChange}
      />

      <input
        type="text"
        name="name"
        placeholder="Full Name"
        value={form.name}
        onChange={handleChange}
        required
      />

      <input
        type="email"
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        required
      />

      <input
        type="text"
        name="position"
        placeholder="Position"
        value={form.position}
        onChange={handleChange}
      />

      <input
        type="text"
        name="department"
        placeholder="Department"
        value={form.department}
        onChange={handleChange}
      />

      <input
        type="number"
        name="salary"
        placeholder="Salary"
        value={form.salary}
        onChange={handleChange}
      />

      <label className="salary-paid-toggle">
        <input
          type="checkbox"
          name="salaryPaid"
          checked={!!form.salaryPaid}
          onChange={handleChange}
        />{" "}
        Salary Paid
      </label>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {editing ? "Update Employee" : "Add Employee"}
        </button>

        {editing && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setEditing(null)}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
