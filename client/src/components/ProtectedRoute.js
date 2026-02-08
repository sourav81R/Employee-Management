// src/components/ProtectedRoute.js
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export function ProtectedRoute({ children, requiredRoles }) {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return (
      <div style={{ textAlign: "center", padding: "100px 20px" }}>
        <h1>Access Denied</h1>
        <p>You don't have permission to access this page.</p>
        <p>Required role: {requiredRoles.join(", ")}</p>
        <a href="/" style={{ color: "#667eea", textDecoration: "none" }}>
          Go to Dashboard
        </a>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
