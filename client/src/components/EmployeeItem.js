import React from 'react';


export default function EmployeeItem({ emp, onEdit, onDelete }) {
return (
<div className="card item">
<div>
<h4>{emp.name}</h4>
<p>{emp.position} — {emp.department}</p>
<p>{emp.email}</p>
<p>Salary: ₹{emp.salary?.toLocaleString?.() ?? emp.salary}</p>
</div>
<div className="buttons">
<button onClick={onEdit}>Edit</button>
<button onClick={onDelete}>Delete</button>
</div>
</div>
);
}