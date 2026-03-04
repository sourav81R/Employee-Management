import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/Adminpanel";
import HRDashboard from "./pages/HRDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AttendanceCapture from "./components/AttendanceCapture";
import AttendanceHistory from "./components/AttendanceHistory";
import LeaveRequestPage from "./pages/LeaveRequestPage";
import CompanyInfoPage from "./pages/CompanyInfoPage";
import Navbar from "./components/navbar";
import Footer from "./components/Footer";
import { ProtectedRoute } from "./components/ProtectedRoute";
import "./App.css";

export default function App() {
  return (
    <Router>
      <div className="app-shell">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <ProtectedRoute requiredRoles={["employee", "manager", "hr", "admin"]}>
                  <AttendanceCapture />
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance-history"
              element={
                <ProtectedRoute requiredRoles={["employee", "manager", "hr", "admin"]}>
                  <AttendanceHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRoles={["admin"]}>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hr"
              element={
                <ProtectedRoute requiredRoles={["hr", "admin"]}>
                  <HRDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leave-request"
              element={
                <ProtectedRoute requiredRoles={["employee", "manager", "hr", "admin"]}>
                  <LeaveRequestPage />
                </ProtectedRoute>
              }
            />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/about-us" element={<CompanyInfoPage />} />
            <Route path="/careers" element={<CompanyInfoPage />} />
            <Route path="/privacy-policy" element={<CompanyInfoPage />} />
            <Route path="/terms-of-service" element={<CompanyInfoPage />} />

            <Route
              path="/manager"
              element={
                <ProtectedRoute requiredRoles={["manager", "hr", "admin"]}>
                  <ManagerDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="*"
              element={
                <div className="not-found">
                  <h2>404 - Page Not Found</h2>
                  <p>The page you are looking for does not exist.</p>
                  <Link to="/">Go Back to Dashboard</Link>
                </div>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
