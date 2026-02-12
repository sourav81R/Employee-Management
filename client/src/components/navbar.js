import React, { useMemo, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/navbar.css";

function Navbar() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleLower = (user?.role || "").toLowerCase();

  const roleClass = useMemo(() => {
    if (roleLower === "admin") return "role-admin";
    if (roleLower === "hr") return "role-hr";
    if (roleLower === "manager") return "role-manager";
    return "role-employee";
  }, [roleLower]);

  const commonLinks = (
    <>
      <Link to="/" className="nav-link">Dashboard</Link>
      <Link to="/attendance" className="nav-link">Mark Attendance</Link>
      <Link to="/attendance-history" className="nav-link">Attendance History</Link>
      {roleLower !== "admin" && (
        <Link to="/leave-request" className="nav-link">Apply Leave</Link>
      )}
    </>
  );

  const roleLinks = (() => {
    if (roleLower === "admin") {
      return (
        <>
          <Link to="/admin" className="nav-link nav-link-emphasis nav-admin">Admin Panel</Link>
          <Link to="/hr" className="nav-link nav-link-emphasis nav-hr">HR Dashboard</Link>
          <Link to="/manager" className="nav-link nav-link-emphasis nav-manager">Team Dashboard</Link>
        </>
      );
    }

    if (roleLower === "hr") {
      return (
        <>
          <Link to="/hr" className="nav-link nav-link-emphasis nav-hr">HR Dashboard</Link>
          <Link to="/manager" className="nav-link nav-link-emphasis nav-manager">Team Dashboard</Link>
        </>
      );
    }

    if (roleLower === "manager") {
      return (
        <Link to="/manager" className="nav-link nav-link-emphasis nav-manager">Team Dashboard</Link>
      );
    }

    return null;
  })();

  return (
    <nav className="navbar">
      <div className="navbar-glow" aria-hidden="true"></div>
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <img
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=50&h=50&fit=crop"
            alt="Employee Management Logo"
            className="brand-logo"
          />
          <div className="brand-copy">
            <span className="brand-title">Employee Management</span>
            <span className="brand-subtitle">People. Payroll. Performance.</span>
          </div>
        </Link>

        <div className="navbar-links">
          {user && (
            <>
              {commonLinks}
              {roleLinks}
            </>
          )}

          {user && (
            <div className="user-menu">
              <button
                className="user-button"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <span className="user-avatar">{user.name?.charAt(0) || "U"}</span>
                <span className="user-details">
                  <span className="user-name">{user.name}</span>
                  <span className={`user-role-badge ${roleClass}`}>{user.role}</span>
                </span>
                <span className="dropdown-icon">▾</span>
              </button>

              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <span className="dropdown-name">{user.name}</span>
                    <span className="dropdown-email">{user.email}</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
