// src/App.js
import React, { useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard"; // ensure file is src/pages/Dashboard.js
import AdminPanel from "./pages/Adminpanel"; // ensure file is src/pages/AdminPanel.js (case-sensitive)
import HRDashboard from "./pages/HRDashboard"; // HR dashboard
import ManagerDashboard from "./pages/ManagerDashboard"; // Manager dashboard
import Login from "./pages/Login"; // ensure file is src/pages/Login.js
import Register from "./pages/Register"; // ensure file is src/pages/Register.js
import Attendance from "./pages/Attendance"; // Attendance page
import LeaveRequestPage from "./pages/LeaveRequestPage"; // Leave Request page

import { AuthProvider, AuthContext } from "./context/AuthContext";

import "./App.css";


// ================================
// Navbar Component
// ================================

function Navbar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img 
          src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=50&h=50&fit=crop" 
          alt="Employee Management Logo" 
          className="brand-logo"
          style={{ width: 45, height: 45, borderRadius: '50%', marginRight: 12, objectFit: 'cover', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
        />
        Employee Management
      </div>

      <ul className="navbar-links">
        <li>
          <Link to="/">Dashboard</Link>
        </li>

        {/* Attendance link (visible to all logged-in users) */}
        {user && (
          <li>
            <Link to="/attendance">Attendance</Link>
          </li>
        )}

        {/* Apply Leave link (hidden for admins) */}
        {user && user.role?.toLowerCase?.() !== "admin" && (
          <li>
            <Link to="/leave-request">Apply Leave</Link>
          </li>
        )}

        {/* Admin link (visible only to admins) */}
        {user && user.role?.toLowerCase?.() === "admin" && (
          <li>
            <Link to="/admin">Admin Panel</Link>
          </li>
        )}

        {/* HR link (visible only to HR and admins) */}
        {user && (user.role?.toLowerCase?.() === "hr" || user.role?.toLowerCase?.() === "admin") && (
          <li>
            <Link to="/hr">HR Dashboard</Link>
          </li>
        )}

        {/* Manager link (visible only to managers and admins) */}
        {user && (user.role?.toLowerCase?.() === "manager" || user.role?.toLowerCase?.() === "admin") && (
          <li>
            <Link to="/manager">Team Dashboard</Link>
          </li>
        )}

        {/* Login & Register links for non-authenticated users */}
        {!user && (
          <>
            <li>
              <Link to="/login">Login</Link>
            </li>
            <li>
              <Link to="/register">Register</Link>
            </li>
          </>
        )}

        {/* Logout for authenticated users */}
        {user && (
          <li>
            <button
              onClick={logout}
              style={{
                background: "transparent",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
                padding: "6px 10px",
              }}
            >
              Logout
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}

// ================================
// Protected Admin Route
// ================================
function RequireAdmin({ children }) {
  const { user } = useContext(AuthContext);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role?.toLowerCase?.() !== "admin") {
    return (
      <div style={{ textAlign: "center", marginTop: 80 }}>
        <h2>🚫 Access Denied</h2>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  return children;
}

// ================================
// Protected HR Route (Authenticated HRs)
// ================================
function RequireHR({ children }) {
  const { user } = useContext(AuthContext);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role?.toLowerCase?.() !== "hr" && user.role?.toLowerCase?.() !== "admin") {
    return (
      <div style={{ textAlign: "center", marginTop: 80 }}>
        <h2>🚫 Access Denied</h2>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  return children;
}

// ================================
// Protected Manager Route
// ================================
function RequireManager({ children }) {
  const { user } = useContext(AuthContext);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role?.toLowerCase?.() !== "manager" && user.role?.toLowerCase?.() !== "admin") {
    return (
      <div style={{ textAlign: "center", marginTop: 80 }}>
        <h2>🚫 Access Denied</h2>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  return children;
}

// ================================
// Protected Route (Authenticated Users)
// ================================
function RequireAuth({ children }) {
  const { user } = useContext(AuthContext);

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// ================================
// Main App Component
// ================================
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          {/* Dashboard (All logged-in users) */}
          <Route
            path="/"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />

          {/* Attendance (All logged-in users) */}
          <Route
            path="/attendance"
            element={
              <RequireAuth>
                <Attendance />
              </RequireAuth>
            }
          />

          {/* Leave Request (All logged-in users) */}
          <Route
            path="/leave-request"
            element={
              <RequireAuth>
                <LeaveRequestPage />
              </RequireAuth>
            }
          />

          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

        {/* Admin Panel */}
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminPanel />
              </RequireAdmin>
            }
          />

          {/* HR Dashboard */}
          <Route
            path="/hr"
            element={
              <RequireHR>
                <HRDashboard />
              </RequireHR>
            }
          />

          {/* Manager Dashboard */}
          <Route
            path="/manager"
            element={
              <RequireManager>
                <ManagerDashboard />
              </RequireManager>
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
    </AuthProvider>
  );
}
