import React from 'react';
import EmployeeItem from './EmployeeItem';


export default function EmployeeList({ employees, onEdit, onDelete }) {
if (!employees || employees.length === 0) return <p>No employees yet.</p>;
return (
<div className="list">
{employees.map(emp => (
<EmployeeItem key={emp._id} emp={emp} onEdit={() => onEdit(emp)} onDelete={() => onDelete(emp._id)} />
))}
</div>
);
}