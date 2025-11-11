// src/index.js (or src/main.jsx)
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./App.css"; // Optional: global styles

// ✅ Wrap the entire app inside AuthProvider (only once)
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
