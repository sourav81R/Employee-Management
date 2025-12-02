// src/pages/Login.js
import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../App.css";

// Optional: set a base URL centrally (you can also do this in a separate api client file)
axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await axios.post("/api/auth/login", { email, password });

      const { token, user } = res.data;

      if (!user || !token) {
        throw new Error("Invalid server response — missing token or user");
      }

      // Save token + user
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Set default Authorization header for future axios requests
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Update global auth context
      setUser(user);

      // Clear sensitive data from state
      setPassword("");

      // Redirect depending on role
      if (user.role === "admin") navigate("/admin");
      else navigate("/");

    } catch (err) {
      console.error("Login error:", err);

      const message =
        err.response?.data?.message ??
        (err.code === "ERR_NETWORK"
          ? "Server unreachable — make sure the backend is running"
          : "Invalid email or password");

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Login</h2>

      {error && <p className="error-text">{error}</p>}

      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email:</label>
        <input
          id="email"
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label htmlFor="password">Password:</label>
        <input
          id="password"
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
