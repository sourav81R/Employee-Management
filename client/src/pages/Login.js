import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { buildApiUrl } from "../utils/apiBase";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginCardImage, setShowLoginCardImage] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [circleImage] = useState("https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=300&fit=crop");
  const [decorativeImage] = useState("https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80");
  const loginCardImage = "/employee-management.png";

  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await axios.post(buildApiUrl("/api/auth/login"), { email, password });
      const { token, user } = res.data;

      if (!user || !token) {
        throw new Error("Invalid server response: missing token or user");
      }

      login(user, token);
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      setPassword("");

      const normalizedRole = String(user.role || "").trim().toLowerCase();
      if (normalizedRole === "admin") navigate("/admin");
      else if (normalizedRole === "hr") navigate("/hr");
      else if (normalizedRole === "manager") navigate("/manager");
      else navigate("/");
    } catch (err) {
      const message =
        err.response?.status === 405
          ? "Wrong API endpoint or method. Check REACT_APP_API_BASE_URL."
          : err.response?.data?.message ??
            (err.code === "ERR_NETWORK"
              ? "Server unreachable. Make sure backend is running."
              : "Invalid email or password");

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-branding">
          <div className="branding-content">
            <div className="logo-circle">
              {circleImage ? (
                <img src={circleImage} alt="Employee Management" className="circle-image" />
              ) : (
                <i className="fa-solid fa-building"></i>
              )}
            </div>
            <h1>EmployeeHub</h1>
            <p>Organize workforce operations with precision.</p>
            <div className="features">
              <div className="feature-item">
                <i className="fa-solid fa-check"></i>
                <span>Secure authentication</span>
              </div>
              <div className="feature-item">
                <i className="fa-solid fa-check"></i>
                <span>Unified attendance and leave workflows</span>
              </div>
              <div className="feature-item">
                <i className="fa-solid fa-check"></i>
                <span>Role-based team management</span>
              </div>
            </div>
            {decorativeImage && (
              <div className="decorative-image-container">
                <img src={decorativeImage} alt="Workspace collaboration" className="decorative-image" />
              </div>
            )}
          </div>
        </div>

        <div className="login-form-wrapper">
          <div className="login-card">
            <div className="form-header">
              <h2>Welcome Back</h2>
              <p>Sign in to continue</p>
            </div>

            {error && (
              <div className="error-alert">
                <i className="fa-solid fa-exclamation-circle"></i>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="password-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                  </button>
                </div>
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Signing in...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-arrow-right"></i>
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="form-footer">
              <p>
                Do not have an account? <Link to="/register">Create one</Link>
              </p>
            </div>

            {loginCardImage && showLoginCardImage && (
              <div className="login-card-illustration">
                <img
                  src={loginCardImage}
                  alt="Employee management"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    setShowLoginCardImage(false);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
