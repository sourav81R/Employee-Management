// src/App.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
} from "react-router-dom";
import Dashboard from "./pages/Dashboard"; // ensure file is src/pages/Dashboard.js
import AdminPanel from "./pages/Adminpanel"; // ensure file is src/pages/AdminPanel.js (case-sensitive)
import HRDashboard from "./pages/HRDashboard"; // HR dashboard
import ManagerDashboard from "./pages/ManagerDashboard"; // Manager dashboard
import Login from "./pages/Login"; // ensure file is src/pages/Login.js
import Register from "./pages/Register"; // ensure file is src/pages/Register.js
import AttendanceCapture from "./components/AttendanceCapture"; // New Attendance Capture component
import AttendanceHistory from "./components/AttendanceHistory"; // New Attendance History component
import LeaveRequestPage from "./pages/LeaveRequestPage"; // Leave Request page
import Navbar from "./components/navbar"; // Import the Navbar from its dedicated file
import "./App.css";
import { ProtectedRoute } from "./components/ProtectedRoute"; // Import the generic ProtectedRoute

// ================================
// Navbar Component - This definition is redundant as Navbar is imported from its own file.
// Removing this local definition to avoid confusion and ensure the correct Navbar is used.

// ================================
// Main App Component
// ================================
export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
          {/* Dashboard (All logged-in users) */}
          <Route
            path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
          />

          {/* Mark Attendance (All logged-in users) */}
          <Route
            path="/attendance"
            element={<ProtectedRoute requiredRoles={["employee", "manager", "hr", "admin"]}><AttendanceCapture /></ProtectedRoute>}
          />

          {/* Attendance History (All logged-in users, with role-based data fetching) */}
          <Route
            path="/attendance-history"
            element={<ProtectedRoute requiredRoles={["employee", "manager", "hr", "admin"]}><AttendanceHistory /></ProtectedRoute>}
          />

          {/* Admin Panel */}
          <Route
            path="/admin"
            element={<ProtectedRoute requiredRoles={["admin"]}><AdminPanel /></ProtectedRoute>}
          />

          {/* HR Dashboard */}
          <Route
            path="/hr" element={<ProtectedRoute requiredRoles={["hr", "admin"]}><HRDashboard /></ProtectedRoute>}
          />

          {/* Leave Request (All logged-in users) */}
          <Route
            path="/leave-request"
            // Using ProtectedRoute for consistency
            element={<ProtectedRoute requiredRoles={["employee", "manager", "hr", "admin"]}><LeaveRequestPage /></ProtectedRoute>}
          />

          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Manager Dashboard */}
          <Route
            path="/manager"
            element={
              // Managers, HR and Admins can access the Manager Dashboard
              <ProtectedRoute requiredRoles={["manager", "hr", "admin"]}><ManagerDashboard /></ProtectedRoute>
            }
          />

          {/* 404 Fallback */}
          <Route
            path="*"
            element={
              <div
                style={{
                  textAlign: "center",
                  marginTop: 100,
                  color: "#555",
                }}
              >
                <h2>404 - Page Not Found</h2>
                <p>The page you’re looking for doesn’t exist.</p>
                <Link
                  to="/"
                  style={{
                    color: "#2563eb",
                    textDecoration: "underline",
                    fontWeight: "bold",
                  }}
                >
                  Go Back to Dashboard
                </Link>
              </div>
            }
          />
      </Routes>
    </Router>
  );
}
