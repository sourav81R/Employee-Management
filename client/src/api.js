const BASE = '/api';

export async function fetchEmployees() {
  const res = await fetch(`${BASE}/employees`);
  return res.json();
}

export async function createEmployee(data) {
  const res = await fetch(`${BASE}/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateEmployee(id, data) {
  const res = await fetch(`${BASE}/employees/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteEmployee(id) {
  const res = await fetch(`${BASE}/employees/${id}`, {
    method: 'DELETE',
  });
  return res.json();
}
