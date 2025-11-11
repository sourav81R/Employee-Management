// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from "react";

// Create Context
export const AuthContext = createContext();

// Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Load user and token safely from localStorage on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");

      if (storedUser && storedUser !== "undefined") {
        setUser(JSON.parse(storedUser));
      }

      if (storedToken && storedToken !== "undefined") {
        setToken(storedToken);
      }
    } catch (err) {
      console.error("⚠️ Failed to parse localStorage data:", err);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  }, []);

  // ✅ Login function — saves both user & token
  const login = (userData, tokenData) => {
    if (!userData || !tokenData) return;
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", tokenData);
    setUser(userData);
    setToken(tokenData);
  };

  // ✅ Logout function — clears session
  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
  };

  // Context value to be shared globally
  const value = {
    user,
    token,
    setUser,
    setToken,
    login,
    logout,
    isLoggedIn: !!token, // ✅ quick check for authentication
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
