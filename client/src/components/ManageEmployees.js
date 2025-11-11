import React, { useState, useEffect } from "react";
import axios from "axios";

function ManageEmployees() {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/employees")
      .then(res => setEmployees(res.data))
      .catch(err => console.log(err));
  }, []);

  const deleteEmployee = (id) => {
    axios.delete(`http://localhost:5000/employees/${id}`)
      .then(() => setEmployees(employees.filter(emp => emp._id !== id)))
      .catch(err => console.log(err));
  };

  return (
    <div>
      <h2>Manage Employees</h2>
      <table>
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
              <td>{emp.salary}</td>
              <td>
                <button>Edit</button>
                <button onClick={() => deleteEmployee(emp._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ManageEmployees;
