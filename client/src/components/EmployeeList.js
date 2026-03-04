import React from "react";

export default function EmployeeList({ role, employees, onEdit, onDelete, onPay }) {
  if (!employees || employees.length === 0) {
    return <p className="no-data">No employees found.</p>;
  }

  const isAdmin = role?.toLowerCase() === "admin";

  return (
    <div className="table-wrapper">
      <table className="employee-table employee-records-table">
        <thead>
          <tr>
            <th>Employee ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Position</th>
            <th>Department</th>
            {isAdmin && <th>Salary</th>}
            <th>Last Paid</th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>

        <tbody>
          {employees.map((emp) => (
            <tr key={emp._id}>
              <td data-label="Employee ID">{emp.employeeId}</td>
              <td data-label="Name">{emp.name}</td>
              <td data-label="Email">{emp.email}</td>
              <td data-label="Position">{emp.position}</td>
              <td data-label="Department">{emp.department}</td>
              {isAdmin && <td data-label="Salary">Rs {emp.salary ? emp.salary.toLocaleString("en-IN") : "-"}</td>}
              <td data-label="Last Paid">
                {emp.lastPaid
                  ? new Date(emp.lastPaid).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "Not Paid Yet"}
              </td>
              {isAdmin && (
                <td className="action-cell" data-label="Actions">
                  <div className="action-buttons">
                    <div className="action-btn-group">
                      <button onClick={() => onEdit(emp)} className="btn btn-edit action-btn">
                        Edit
                      </button>
                      <button onClick={() => onDelete(emp._id)} className="btn btn-delete action-btn">
                        Delete
                      </button>
                    </div>
                    <button onClick={() => onPay(emp._id)} className="btn btn-pay action-btn action-btn-pay">
                      Pay Salary
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
