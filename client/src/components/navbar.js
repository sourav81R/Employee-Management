import React, { useMemo, useState, useContext, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { apiGet } from "../utils/http";
import "../styles/navbar.css";

function Navbar() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const roleLower = (user?.role || "").trim().toLowerCase();

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    setShowUserMenu(false);
    navigate("/login");
  };

  const closeMenus = () => {
    setMobileMenuOpen(false);
    setShowUserMenu(false);
  };

  useEffect(() => {
    closeMenus();
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return undefined;
    }

    let active = true;

    const loadCount = async () => {
      try {
        const data = await apiGet("/api/notifications/unread-count");
        if (active) setUnreadCount(Number(data?.unread || 0));
      } catch (_err) {
        if (active) setUnreadCount(0);
      }
    };

    loadCount();
    const timer = setInterval(loadCount, 30000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [user]);

  const roleClass = useMemo(() => {
    if (roleLower === "admin") return "role-admin";
    if (roleLower === "hr") return "role-hr";
    if (roleLower === "manager") return "role-manager";
    return "role-employee";
  }, [roleLower]);

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const navLinkClass = (path, extraClasses = "") =>
    `nav-link ${isActive(path) ? "is-active" : ""} ${extraClasses}`.trim();

  const commonLinks = (
    <>
      <Link to="/" className={navLinkClass("/")}>Dashboard</Link>
      <Link to="/attendance" className={navLinkClass("/attendance")}>Attendance</Link>
      <Link to="/attendance-history" className={navLinkClass("/attendance-history")}>History</Link>
      {roleLower !== "admin" && (
        <Link to="/leave-request" className={navLinkClass("/leave-request")}>Leave</Link>
      )}
      <Link to="/payroll" className={navLinkClass("/payroll")}>Payroll</Link>
      <Link to="/tasks" className={navLinkClass("/tasks")}>Tasks</Link>
      <Link to="/performance" className={navLinkClass("/performance")}>Performance</Link>
      <Link to="/announcements" className={navLinkClass("/announcements")}>Announcements</Link>
      <Link to="/documents" className={navLinkClass("/documents")}>Documents</Link>
    </>
  );

  const roleLinks = (() => {
    if (roleLower === "admin") {
      return (
        <>
          <Link to="/admin" className={navLinkClass("/admin", "nav-link-emphasis nav-admin")}>Admin</Link>
          <Link to="/hr" className={navLinkClass("/hr", "nav-link-emphasis nav-hr")}>HR</Link>
          <Link to="/manager" className={navLinkClass("/manager", "nav-link-emphasis nav-manager")}>Team</Link>
          <Link to="/departments" className={navLinkClass("/departments")}>Departments</Link>
          <Link to="/recruitment" className={navLinkClass("/recruitment")}>Recruitment</Link>
          <Link to="/analytics" className={navLinkClass("/analytics")}>Analytics</Link>
        </>
      );
    }

    if (roleLower === "hr") {
      return (
        <>
          <Link to="/hr" className={navLinkClass("/hr", "nav-link-emphasis nav-hr")}>HR</Link>
          <Link to="/manager" className={navLinkClass("/manager", "nav-link-emphasis nav-manager")}>Team</Link>
          <Link to="/departments" className={navLinkClass("/departments")}>Departments</Link>
          <Link to="/recruitment" className={navLinkClass("/recruitment")}>Recruitment</Link>
          <Link to="/analytics" className={navLinkClass("/analytics")}>Analytics</Link>
        </>
      );
    }

    if (roleLower === "manager") {
      return (
        <>
          <Link to="/manager" className={navLinkClass("/manager", "nav-link-emphasis nav-manager")}>Team</Link>
          <Link to="/departments" className={navLinkClass("/departments")}>Departments</Link>
          <Link to="/recruitment" className={navLinkClass("/recruitment")}>Recruitment</Link>
          <Link to="/analytics" className={navLinkClass("/analytics")}>Analytics</Link>
        </>
      );
    }

    return null;
  })();

  return (
    <nav className="navbar app-navbar">
      <div className="navbar-glow" aria-hidden="true"></div>
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={closeMenus}>
          <img
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=50&h=50&fit=crop"
            alt="Employee Management Logo"
            className="brand-logo"
          />
          <div className="brand-copy">
            <span className="brand-title">EmployeeHub</span>
            <span className="brand-subtitle">People. Payroll. Performance.</span>
          </div>
        </Link>

        {user && (
          <button
            type="button"
            className={`mobile-nav-toggle ${mobileMenuOpen ? "is-active" : ""}`}
            onClick={() => {
              setMobileMenuOpen((prev) => {
                const next = !prev;
                if (!next) setShowUserMenu(false);
                return next;
              });
            }}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="app-navbar-links"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        )}

        <div
          id="app-navbar-links"
          className={`navbar-links ${mobileMenuOpen ? "is-open" : ""}`}
        >
          {user && (
            <>
              <div className="navbar-link-group" onClick={closeMenus}>{commonLinks}</div>
              <div className="navbar-link-group" onClick={closeMenus}>{roleLinks}</div>
            </>
          )}

          {user && (
            <div className="user-menu">
              <Link to="/notifications" className="notification-link" onClick={() => setShowUserMenu(false)}>
                <span>Notifications</span>
                {unreadCount > 0 ? <span className="notification-count">{unreadCount}</span> : null}
              </Link>

              <button
                type="button"
                className="user-button"
                onClick={() => setShowUserMenu((prev) => !prev)}
              >
                <span className="user-avatar">{user.name?.charAt(0) || "U"}</span>
                <span className="user-details">
                  <span className="user-name">{user.name}</span>
                  <span className={`user-role-badge ${roleClass}`}>{user.role}</span>
                </span>
                <span className="dropdown-icon" aria-hidden="true">v</span>
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
