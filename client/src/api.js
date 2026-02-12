import axios from "axios";
import { buildApiUrl } from "./utils/apiBase";

const API_URL = buildApiUrl("/api/employees");

export async function fetchEmployees() {
  try {
    const res = await axios.get(API_URL);
    return res.data;
  } catch (error) {
    console.error("Error fetching employees:", error.response?.data || error.message);
    throw error;
  }
}

export async function createEmployee(employeeData) {
  try {
    const res = await axios.post(API_URL, employeeData);
    return res.data;
  } catch (error) {
    console.error("Error creating employee:", error.response?.data || error.message);
    throw error;
  }
}

export async function updateEmployee(id, employeeData) {
  try {
    const res = await axios.put(`${API_URL}/${id}`, employeeData);
    return res.data;
  } catch (error) {
    console.error("Error updating employee:", error.response?.data || error.message);
    throw error;
  }
}

export async function deleteEmployee(id) {
  try {
    const res = await axios.delete(`${API_URL}/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error deleting employee:", error.response?.data || error.message);
    throw error;
  }
}

export async function paySalary(id) {
  try {
    const res = await axios.post(`${API_URL}/pay/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error paying salary:", error.response?.data || error.message);
    throw error;
  }
}
