import React from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const PrivateRoute = ({ children, roles }) => {
  const { user } = React.useContext(AuthContext);

  // If not logged in → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If roles are defined and user role is not allowed → redirect to dashboard
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // Otherwise → render the page
  return children;
};

export default PrivateRoute;
