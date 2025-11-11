// src/App.js
import React, { useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard.js"; // User dashboard
import AdminPanel from "./pages/Adminpanel"; // ✅ Ensure file name matches case
import Login from "./pages/Login";
import Register from "./pages/Register.js";
import { AuthProvider, AuthContext } from "./context/AuthContext.js";

import "./App.css";

// ================================
// ✅ Navbar Component
// ================================
function Navbar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <i className="fa-solid fa-users" style={{ marginRight: "8px" }}></i>
        Employee Management
      </div>

      <ul className="navbar-links">
        <li>
          <Link to="/">Dashboard</Link>
        </li>

        {/* 👑 Admin link (visible only to admins) */}
        {user && user.role === "admin" && (
          <li>
            <Link to="/admin">Admin Panel</Link>
          </li>
        )}

        {/* 🔐 Login & Register links for non-authenticated users */}
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

        {/* 🚪 Logout for authenticated users */}
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
// ✅ Protected Admin Route
// ================================
function RequireAdmin({ children }) {
  const { user } = useContext(AuthContext);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") {
    return (
      <div style={{ textAlign: "center", marginTop: "80px" }}>
        <h2>🚫 Access Denied</h2>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  return children;
}

// ================================
// ✅ Protected Route (Authenticated Users)
// ================================
function RequireAuth({ children }) {
  const { user } = useContext(AuthContext);

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// ================================
// ✅ Main App Component
// ================================
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          {/* 👤 Dashboard (All logged-in users) */}
          <Route
            path="/"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />

          {/* 🔑 Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* 👑 Admin Panel */}
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminPanel />
              </RequireAdmin>
            }
          />

          {/* 🚫 404 Fallback */}
          <Route
            path="*"
            element={
              <div
                style={{
                  textAlign: "center",
                  marginTop: "100px",
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
