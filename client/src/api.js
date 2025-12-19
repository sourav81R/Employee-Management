import axios from "axios";

// ✅ Base API URL
const API_URL = "https://employee-management-4p4a.vercel.app/api/employees";

// ====== Fetch all employees ======
export async function fetchEmployees() {
  try {
    const res = await axios.get(API_URL);
    return res.data;
  } catch (error) {
    console.error("❌ Error fetching employees:", error.response?.data || error.message);
    throw error;
  }
}

// ====== Create new employee ======
export async function createEmployee(employeeData) {
  try {
    const res = await axios.post(API_URL, employeeData);
    console.log("✅ Employee created:", res.data);
    return res.data;
  } catch (error) {
    console.error("❌ Error creating employee:", error.response?.data || error.message);
    throw error;
  }
}

// ====== Update employee ======
export async function updateEmployee(id, employeeData) {
  try {
    const res = await axios.put(`${API_URL}/${id}`, employeeData);
    console.log("✅ Employee updated:", res.data);
    return res.data;
  } catch (error) {
    console.error("❌ Error updating employee:", error.response?.data || error.message);
    throw error;
  }
}

// ====== Delete employee ======
export async function deleteEmployee(id) {
  try {
    const res = await axios.delete(`${API_URL}/${id}`);
    console.log("🗑️ Employee deleted:", res.data);
    return res.data;
  } catch (error) {
    console.error("❌ Error deleting employee:", error.response?.data || error.message);
    throw error;
  }
}

// ====== Pay salary ======
export async function paySalary(id) {
  try {
    console.log(`💰 Sending salary payment request for employee ID: ${id}`);
    const res = await axios.post(`${API_URL}/pay/${id}`);
    console.log("✅ Salary payment response:", res.data);
    return res.data;
  } catch (error) {
    console.error("❌ Error paying salary:", error.response?.data || error.message);
    throw error;
  }
}
