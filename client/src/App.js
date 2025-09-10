import React, { useEffect, useState } from 'react';
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee
} from './api';
import EmployeeList from './components/EmployeeList';
import EmployeeForm from './components/EmployeeForm';
import './style.css'; // make sure your CSS file is imported

export default function App() {
  const [employees, setEmployees] = useState([]);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const data = await fetchEmployees();
    setEmployees(data);
  }

  async function handleCreate(emp) {
    const res = await createEmployee(emp);
    setEmployees((prev) => [res, ...prev]);
  }

  async function handleUpdate(id, emp) {
    const res = await updateEmployee(id, emp);
    setEmployees((prev) => prev.map((e) => (e._id === id ? res : e)));
    setEditing(null);
  }

  async function handleDelete(id) {
    await deleteEmployee(id);
    setEmployees((prev) => prev.filter((e) => e._id !== id));
  }

  return (
    <div className="app-container">
      <h1 className="app-title">Employee Management</h1>

      <div className="content-box">
        <EmployeeForm
          onCreate={handleCreate}
          editing={editing}
          onUpdate={handleUpdate}
          onCancel={() => setEditing(null)}
        />
      </div>

      <div className="content-box">
        <EmployeeList
          employees={employees}
          onEdit={(e) => setEditing(e)}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
