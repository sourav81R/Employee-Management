import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav style={{ background: "#000", padding: "10px", color: "#fff" }}>
      <h2 style={{ display: "inline", marginRight: "20px" }}>👥 Employee Management</h2>
      <Link to="/" style={{ marginRight: "15px", color: "white" }}>Dashboard</Link>
      <Link to="/employees" style={{ marginRight: "15px", color: "white" }}>Employees</Link>
      <Link to="/manage" style={{ marginRight: "15px", color: "white" }}>Manage</Link>
      <Link to="/salary" style={{ marginRight: "15px", color: "white" }}>Salary</Link>
      <Link to="/admin" style={{ color: "white", fontWeight: "bold" }}>Admin</Link>
    </nav>
  );
}

export default Navbar;
