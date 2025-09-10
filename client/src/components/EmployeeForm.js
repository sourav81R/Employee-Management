import React, { useEffect, useState } from 'react';


export default function EmployeeForm({ onCreate, editing, onUpdate, onCancel }) {
const [form, setForm] = useState({ name:'', email:'', position:'', department:'', salary:'' });


useEffect(() => {
if (editing) {
setForm({ ...editing, salary: editing.salary || '' });
}
}, [editing]);


function handleChange(e) {
const { name, value } = e.target;
setForm(prev => ({ ...prev, [name]: value }));
}


async function submit(e) {
e.preventDefault();
const payload = { ...form, salary: Number(form.salary || 0) };
if (editing) {
await onUpdate(editing._id, payload);
} else {
await onCreate(payload);
setForm({ name:'', email:'', position:'', department:'', salary:'' });
}
}


return (
<form className="card form" onSubmit={submit}>
<h3>{editing ? 'Edit Employee' : 'Add Employee'}</h3>
<input required placeholder="Name" name="name" value={form.name} onChange={handleChange} />
<input required placeholder="Email" name="email" value={form.email} onChange={handleChange} />
<input placeholder="Position" name="position" value={form.position} onChange={handleChange} />
<input placeholder="Department" name="department" value={form.department} onChange={handleChange} />
<input placeholder="Salary" name="salary" value={form.salary} onChange={handleChange} />
<div className="actions">
<button type="submit">{editing ? 'Update' : 'Add'}</button>
{editing && <button type="button" onClick={onCancel}>Cancel</button>}
</div>
</form>
);
}