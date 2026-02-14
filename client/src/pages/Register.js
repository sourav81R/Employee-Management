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

  // Fetch employee management image from API
  useEffect(() => {
    const fetchImage = async () => {
      if (!unsplashAccessKey) return;
      try {
        const response = await axios.get(
          "https://api.unsplash.com/search/photos",
          {
            params: {
              query: "employee management team business",
              per_page: 1,
              client_id: unsplashAccessKey,
            },
          }
        );
        if (response.data.results && response.data.results.length > 0) {
          setCircleImage(response.data.results[0].urls.regular);
        }
      } catch (_err) {
        // Keep default image if Unsplash fetch fails
      }
    };
    fetchImage();
  }, [unsplashAccessKey]);

  // Fetch decorative image
  useEffect(() => {
    const fetchDecorativeImage = async () => {
      if (!unsplashAccessKey) return;
      try {
        const response = await axios.get(
          "https://api.unsplash.com/search/photos",
          {
            params: {
              query: "office team meeting collaboration professional",
              per_page: 1,
              client_id: unsplashAccessKey,
            },
          }
        );
        if (response.data.results && response.data.results.length > 0) {
          setDecorativeImage(response.data.results[0].urls.regular);
        }
      } catch (_err) {
        // Use fallback image if API fails
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

      alert("✅ Registration successful, now login!");
      navigate("/login");
    } catch (err) {
      const message =
        err.response?.status === 405
          ? "Wrong API endpoint/method. Check REACT_APP_API_BASE_URL points to your Render backend."
          : err.response?.data?.message || "Registration failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-container">
      <div className="register-wrapper">
        {/* Left Side - Info */}
        <div className="register-info">
          <div className="info-content">
            <div className="logo-circle">
              {circleImage ? (
                <img 
                  src={circleImage} 
                  alt="Employee Management" 
                  className="circle-image"
                />
              ) : (
                <i className="fa-solid fa-user-plus"></i>
              )}
            </div>
            <h1>Join Our Team</h1>
            <p>Create an account and start managing employees</p>
            <div className="info-features">
              <div className="info-item">
                <i className="fa-solid fa-rocket"></i>
                <span>Quick Setup</span>
              </div>
              <div className="info-item">
                <i className="fa-solid fa-shield"></i>
                <span>Secure & Reliable</span>
              </div>
              <div className="info-item">
                <i className="fa-solid fa-headset"></i>
                <span>24/7 Support</span>
              </div>
            </div>
            {decorativeImage && (
              <div className="decorative-image-container">
                <img 
                  src={decorativeImage} 
                  alt="Employee Management" 
                  className="decorative-image"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="register-form-wrapper">
          <div className="register-card">
            <div className="form-header">
              <h2>Create Account</h2>
              <p>Get started in minutes</p>
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
                    placeholder="your@email.com"
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
                    placeholder="••••••••"
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
                <div className="role-info">
                  <p className="role-hint">Choose your role in the organization</p>
                </div>
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
                      <span className="role-icon">👨‍💼</span>
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
                      <span className="role-icon">👔</span>
                      <span className="role-text">Manager</span>
                      <span className="role-desc">Manage team & salary</span>
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
                      <span className="role-icon">👨‍💼</span>
                      <span className="role-text">HR</span>
                      <span className="role-desc">HR operations & reporting</span>
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
                      <span className="role-icon">🔐</span>
                      <span className="role-text">Admin</span>
                      <span className="role-desc">Full system access</span>
                    </span>
                  </label>
                </div>
              </div>

              <button 
                type="submit" 
                className="register-btn" 
                disabled={loading}
              >
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
              <p>Already have an account? <Link to="/login">Sign in here</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
