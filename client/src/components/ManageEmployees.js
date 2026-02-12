import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { buildApiUrl } from "../utils/apiBase";

function ManageEmployees() {
  const [employees, setEmployees] = useState([]);
  const { user } = useContext(AuthContext);
  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  useEffect(() => {
    axios.get(buildApiUrl("/api/employees"), getAuthHeader())
      .then(res => setEmployees(res.data))
      .catch(err => console.log(err));
  }, [user]);

  const deleteEmployee = (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;

    axios.delete(buildApiUrl(`/api/employees/${id}`), getAuthHeader())
      .then(() => setEmployees(employees.filter(emp => emp._id !== id)))
      .catch(err => console.log(err));
  };

  return (
    <div>
      <h2>Manage Employees</h2>
      <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", minWidth: "600px", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Position</th>
            <th>Department</th>
            <th>Salary</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => (
            <tr key={emp._id}>
              <td>{emp.name}</td>
              <td>{emp.position}</td>
              <td>{emp.department}</td>
              <td>₹{emp.salary?.toLocaleString("en-IN")}</td>
              <td>
                <button>Edit</button>
                <button onClick={() => deleteEmployee(emp._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

export default ManageEmployees;
