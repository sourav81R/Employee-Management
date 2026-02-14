import React from "react";

export default function EmployeeList({ role, employees, onEdit, onDelete, onPay }) {
  if (!employees || employees.length === 0) {
    return <p className="no-data">No employees found.</p>;
  }

  const isAdmin = role?.toLowerCase() === "admin";

  return (
    <div className="table-wrapper" style={{ overflowX: "auto" }}>
      <table className="employee-table" style={{ width: "100%", minWidth: "800px", borderCollapse: "collapse" }}>
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
              <td>{emp.employeeId}</td>
              <td>{emp.name}</td>
              <td>{emp.email}</td>
              <td>{emp.position}</td>
              <td>{emp.department}</td>
              {isAdmin && <td>Rs {emp.salary ? emp.salary.toLocaleString("en-IN") : "-"}</td>}
              <td>
                {emp.lastPaid
                  ? new Date(emp.lastPaid).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "Not Paid Yet"}
              </td>
              {isAdmin && (
                <td className="action-cell">
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
