import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/navbar.css";


function Navbar() {
  const [hoveredLink, setHoveredLink] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinksStyle = {
    textDecoration: "none",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "500",
    padding: "8px 16px",
    borderRadius: "5px",
    transition: "all 0.3s ease",
    display: "inline-block",
    cursor: "pointer"
  };

  const renderNavLinks = () => {
    if (!user) return null;

    const commonLinks = (
      <>
        <Link
          to="/"
          className="nav-link"
          onMouseEnter={() => setHoveredLink("dashboard")}
          onMouseLeave={() => setHoveredLink(null)}
          style={{
            ...navLinksStyle,
            backgroundColor: hoveredLink === "dashboard" ? "rgba(255, 255, 255, 0.2)" : "transparent"
          }}
        >
          Dashboard
        </Link>
      </>
    );

    if (user.role?.toLowerCase() === "admin") {
      return (
        <>
          {commonLinks}
          <Link
            to="/admin"
            className="nav-link admin-link"
            onMouseEnter={() => setHoveredLink("admin")}
            onMouseLeave={() => setHoveredLink(null)}
            style={{
              ...navLinksStyle,
              backgroundColor: hoveredLink === "admin" ? "#ff6b6b" : "#e63946",
              marginLeft: "10px",
              fontWeight: "600"
            }}
          >
            🔐 Admin Panel
          </Link>
          <Link
            to="/hr"
            className="nav-link hr-link"
            onMouseEnter={() => setHoveredLink("hr")}
            onMouseLeave={() => setHoveredLink(null)}
            style={{
              ...navLinksStyle,
              backgroundColor: hoveredLink === "hr" ? "#4ade80" : "#22c55e",
              marginLeft: "5px",
              fontWeight: "600"
            }}
          >
            👔 HR Dashboard
          </Link>
          <Link
            to="/manager"
            className="nav-link manager-link"
            onMouseEnter={() => setHoveredLink("manager")}
            onMouseLeave={() => setHoveredLink(null)}
            style={{
              ...navLinksStyle,
              backgroundColor: hoveredLink === "manager" ? "#60a5fa" : "#3b82f6",
              marginLeft: "5px",
              fontWeight: "600"
            }}
          >
            🎯 Team Dashboard
          </Link>
        </>
      );
    }

    if (user.role === "hr") {
      return (
        <>
          {commonLinks}
          <Link
            to="/hr"
            className="nav-link hr-link"
            onMouseEnter={() => setHoveredLink("hr")}
            onMouseLeave={() => setHoveredLink(null)}
            style={{
              ...navLinksStyle,
              backgroundColor: hoveredLink === "hr" ? "#4ade80" : "#22c55e",
              marginLeft: "10px",
              fontWeight: "600"
            }}
          >
            👔 HR Dashboard
          </Link>
        </>
      );
    }

    if (user.role === "manager") {
      return (
        <>
          {commonLinks}
          <Link
            to="/manager"
            className="nav-link manager-link"
            onMouseEnter={() => setHoveredLink("manager")}
            onMouseLeave={() => setHoveredLink(null)}
            style={{
              ...navLinksStyle,
              backgroundColor: hoveredLink === "manager" ? "#60a5fa" : "#3b82f6",
              marginLeft: "10px",
              fontWeight: "600"
            }}
          >
            🎯 Team
          </Link>
        </>
      );
    }

    return commonLinks;
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <img 
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=50&h=50&fit=crop" 
            alt="Employee Management Logo" 
            className="brand-logo"
          />
          <span className="brand-text">Employee Management</span>
        </Link>
        
        <div className="navbar-links">
          {renderNavLinks()}
          
          {user && (
            <div className="user-menu">
              <button
                className="user-button"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <span className="user-avatar">{user.name?.charAt(0) || "U"}</span>
                <span className="user-name">{user.name}</span>
                <span className="user-role-badge">{user.role}</span>
                <span className="dropdown-icon">▼</span>
              </button>
              
              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <span className="dropdown-name">{user.name}</span>
                    <span className="dropdown-email">{user.email}</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item" onClick={handleLogout}>
                    🚪 Logout
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
