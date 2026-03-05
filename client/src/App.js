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

import PayrollPage from "./pages/PayrollPage";
import TasksPage from "./pages/TasksPage";
import PerformancePage from "./pages/PerformancePage";
import DepartmentsPage from "./pages/DepartmentsPage";
import DocumentsPage from "./pages/DocumentsPage";
import RecruitmentPage from "./pages/RecruitmentPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import NotificationsPage from "./pages/NotificationsPage";

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
              path="/leave-request"
              element={
                <ProtectedRoute requiredRoles={["employee", "manager", "hr", "admin"]}>
                  <LeaveRequestPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/payroll"
              element={
                <ProtectedRoute requiredRoles={["employee", "manager", "hr", "admin"]}>
                  <PayrollPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute requiredRoles={["employee", "manager", "hr", "admin"]}>
                  <TasksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/performance"
              element={
                <ProtectedRoute requiredRoles={["employee", "manager", "hr", "admin"]}>
                  <PerformancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/departments"
              element={
                <ProtectedRoute requiredRoles={["manager", "hr", "admin"]}>
                  <DepartmentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/documents"
              element={
                <ProtectedRoute requiredRoles={["employee", "manager", "hr", "admin"]}>
                  <DocumentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruitment"
              element={
                <ProtectedRoute requiredRoles={["manager", "hr", "admin"]}>
                  <RecruitmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute requiredRoles={["manager", "hr", "admin"]}>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/announcements"
              element={
                <ProtectedRoute requiredRoles={["employee", "manager", "hr", "admin"]}>
                  <AnnouncementsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute requiredRoles={["employee", "manager", "hr", "admin"]}>
                  <NotificationsPage />
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
              path="/manager"
              element={
                <ProtectedRoute requiredRoles={["manager", "hr", "admin"]}>
                  <ManagerDashboard />
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
