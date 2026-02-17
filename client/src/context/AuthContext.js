// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import { buildApiUrl } from "../utils/apiBase";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const normalizeUser = (userData) => {
    if (!userData || typeof userData !== "object") return null;
    return {
      ...userData,
      _id: userData._id || userData.id,
      id: userData.id || userData._id,
      role: String(userData.role || "").trim().toLowerCase(),
    };
  };

  useEffect(() => {
    const restoreAndRefreshAuth = async () => {
      let restoredUser = null;
      try {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");

        if (!storedToken || storedToken === "undefined" || storedToken === "null") {
          return;
        }

        setToken(storedToken);
        axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;

        if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
          const parsedUser = normalizeUser(JSON.parse(storedUser));
          if (parsedUser) {
            restoredUser = parsedUser;
            setUser(parsedUser);
          }
        }

        // Refresh user profile so role changes (e.g. employee -> manager) reflect immediately.
        try {
          const profileRes = await axios.get(buildApiUrl("/api/auth/profile"));
          const refreshedUser = normalizeUser(profileRes.data);
          if (refreshedUser) {
            setUser(refreshedUser);
            localStorage.setItem("user", JSON.stringify(refreshedUser));
          }
        } catch (profileErr) {
          const profileStatus = profileErr?.response?.status;
          if (profileStatus === 401 || profileStatus === 403) {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            setUser(null);
            setToken(null);
          } else if (!restoredUser) {
            console.warn("Profile refresh failed and no cached user found:", profileErr);
          }
        }
      } catch (err) {
        console.error("Failed to restore auth data:", err);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setUser(null);
        setToken(null);
      } finally {
        setAuthLoading(false);
      }
    };

    restoreAndRefreshAuth();
  }, []);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  const login = (userData, tokenData) => {
    if (!userData || !tokenData) return;
    const normalizedUser = normalizeUser(userData);
    localStorage.setItem("user", JSON.stringify(normalizedUser));
    localStorage.setItem("token", tokenData);
    setUser(normalizedUser);
    setToken(tokenData);
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
  };

  const value = {
    user,
    token,
    setUser,
    setToken,
    login,
    logout,
    authLoading,
    isLoggedIn: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
