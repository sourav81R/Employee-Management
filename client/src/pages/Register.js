import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { buildApiUrl } from "../utils/apiBase";
import "./Register.css";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("employee");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [circleImage, setCircleImage] = useState("https://images.unsplash.com/photo-1552664730-d307ca884978?w=200&q=80");
  const [decorativeImage, setDecorativeImage] = useState("https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80");

  const navigate = useNavigate();
  const unsplashAccessKey = process.env.REACT_APP_UNSPLASH_ACCESS_KEY;

  useEffect(() => {
    const fetchImage = async () => {
      if (!unsplashAccessKey) return;
      try {
        const response = await axios.get("https://api.unsplash.com/search/photos", {
          params: {
            query: "employee management team business",
            per_page: 1,
            client_id: unsplashAccessKey,
          },
        });
        if (response.data.results?.length > 0) {
          setCircleImage(response.data.results[0].urls.regular);
        }
      } catch (_err) {
        // Keep fallback
      }
    };
    fetchImage();
  }, [unsplashAccessKey]);

  useEffect(() => {
    const fetchDecorativeImage = async () => {
      if (!unsplashAccessKey) return;
      try {
        const response = await axios.get("https://api.unsplash.com/search/photos", {
          params: {
            query: "office team meeting collaboration professional",
            per_page: 1,
            client_id: unsplashAccessKey,
          },
        });
        if (response.data.results?.length > 0) {
          setDecorativeImage(response.data.results[0].urls.regular);
        }
      } catch (_err) {
        setDecorativeImage("https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80");
      }
    };
    fetchDecorativeImage();
  }, [unsplashAccessKey]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await axios.post(buildApiUrl("/api/auth/register"), {
        name,
        email,
        password,
        role,
      });

      alert("Registration successful. Please sign in.");
      navigate("/login");
    } catch (err) {
      const message =
        err.response?.status === 405
          ? "Wrong API endpoint or method. Check REACT_APP_API_BASE_URL."
          : err.response?.data?.message || "Registration failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-container">
      <div className="register-wrapper">
        <div className="register-info">
          <div className="info-content">
            <div className="logo-circle">
              {circleImage ? (
                <img src={circleImage} alt="EmployeeHub" className="circle-image" />
              ) : (
                <i className="fa-solid fa-user-plus"></i>
              )}
            </div>
            <h1>Create Your Workspace</h1>
            <p>Set up your account and start managing your team</p>
            <div className="info-features">
              <div className="info-item">
                <i className="fa-solid fa-rocket"></i>
                <span>Fast setup</span>
              </div>
              <div className="info-item">
                <i className="fa-solid fa-shield"></i>
                <span>Secure role-based access</span>
              </div>
              <div className="info-item">
                <i className="fa-solid fa-briefcase"></i>
                <span>HR and team workflows included</span>
              </div>
            </div>
            {decorativeImage && (
              <div className="decorative-image-container">
                <img src={decorativeImage} alt="Team collaboration" className="decorative-image" />
              </div>
            )}
          </div>
        </div>

        <div className="register-form-wrapper">
          <div className="register-card">
            <div className="form-header">
              <h2>Create Account</h2>
              <p>Get started in a minute</p>
            </div>

            {error && (
              <div className="error-alert">
                <i className="fa-solid fa-exclamation-circle"></i>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <div className="input-wrapper">
                  <i className="fa-solid fa-user"></i>
                  <input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <i className="fa-solid fa-envelope"></i>
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
                  <i className="fa-solid fa-lock"></i>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="password-input"
                    placeholder="Choose a password"
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

              <div className="form-group">
                <label htmlFor="role">Select Role</label>
                <p className="role-hint">Choose the right permission scope for this account.</p>
                <div className="role-options">
                  <label className="role-option">
                    <input
                      type="radio"
                      name="role"
                      value="employee"
                      checked={role === "employee"}
                      onChange={(e) => setRole(e.target.value)}
                    />
                    <span className="role-label">
                      <span className="role-icon">EM</span>
                      <span className="role-text">Employee</span>
                      <span className="role-desc">Individual contributor</span>
                    </span>
                  </label>
                  <label className="role-option">
                    <input
                      type="radio"
                      name="role"
                      value="manager"
                      checked={role === "manager"}
                      onChange={(e) => setRole(e.target.value)}
                    />
                    <span className="role-label">
                      <span className="role-icon">MG</span>
                      <span className="role-text">Manager</span>
                      <span className="role-desc">Team and salary approvals</span>
                    </span>
                  </label>
                  <label className="role-option">
                    <input
                      type="radio"
                      name="role"
                      value="hr"
                      checked={role === "hr"}
                      onChange={(e) => setRole(e.target.value)}
                    />
                    <span className="role-label">
                      <span className="role-icon">HR</span>
                      <span className="role-text">HR</span>
                      <span className="role-desc">Workforce operations</span>
                    </span>
                  </label>
                  <label className="role-option">
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={role === "admin"}
                      onChange={(e) => setRole(e.target.value)}
                    />
                    <span className="role-label">
                      <span className="role-icon">AD</span>
                      <span className="role-text">Admin</span>
                      <span className="role-desc">Full platform control</span>
                    </span>
                  </label>
                </div>
              </div>

              <button type="submit" className="register-btn" disabled={loading}>
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check"></i>
                    Create Account
                  </>
                )}
              </button>
            </form>

            <div className="form-footer">
              <p>
                Already have an account? <Link to="/login">Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
