import React, { useEffect, useState } from "react";
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  paySalary,
} from "../api";
import EmployeeList from "../components/EmployeeList";
import "../App.css";

export default function AdminPanel() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    employeeId: "",
    name: "",
    email: "",
    position: "",
    department: "",
    salary: "",
  });
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("user"); // 👈 Default: user

  // ✅ Load employees on mount
  useEffect(() => {
    loadEmployees();

    // 👇 Check if logged-in user is admin or not (from localStorage)
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setRole(parsed.role); // sets admin/user based on login
    }
  }, []);

  async function loadEmployees() {
    try {
      const data = await fetchEmployees();
      setEmployees(data);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editing) {
        await updateEmployee(form._id, form);
      } else {
        await createEmployee(form);
      }
      resetForm();
      loadEmployees();
    } catch (err) {
      console.error("Error saving employee:", err);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteEmployee(id);
      loadEmployees();
    } catch (err) {
      console.error("Error deleting employee:", err);
    }
  }

  async function handlePay(id) {
    try {
      const response = await paySalary(id);
      alert(response.message);
      loadEmployees();
    } catch (err) {
      console.error("Error paying salary:", err);
    }
  }

  function handleEdit(emp) {
    setEditing(emp._id);
    setForm({
      _id: emp._id,
      employeeId: emp.employeeId || "",
      name: emp.name,
      email: emp.email,
      position: emp.position,
      department: emp.department,
      salary: emp.salary,
    });
  }

  function resetForm() {
    setForm({
      employeeId: "",
      name: "",
      email: "",
      position: "",
      department: "",
      salary: "",
    });
    setEditing(null);
  }

  const filteredEmployees = employees.filter((emp) =>
  (emp.name?.toLowerCase() || "").includes(search.toLowerCase())
);

  return (
    <div className="container">
      <h2>{role === "admin" ? "Admin Dashboard" : "Employee Directory"}</h2>

      {/* 👇 Only admins can add/update/delete employees */}
      {role === "admin" && (
        <form onSubmit={handleSubmit} className="employee-form">
          <input
            type="text"
            name="employeeId"
            placeholder="Employee ID"
            value={form.employeeId}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="name"
            placeholder="Name"
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
          <button type="submit" className="btn btn-primary">
            {editing ? "Update Employee" : "Add Employee"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={resetForm}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          )}
        </form>
      )}

      {/* Search Box (works for both user & admin) */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Search employee by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className="btn btn-primary"
          onClick={() => setSearch(search.trim())}
        >
          Search
        </button>
      </div>

      {/* Employee Table */}
      <EmployeeList
        role={role} // 👈 pass role here
        employees={filteredEmployees}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPay={handlePay}
      />
    </div>
  );
}
