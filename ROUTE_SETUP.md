// Route Configuration Example for App.js
// Add these routes to your existing App.js

import HRDashboard from "./pages/HRDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

// In your BrowserRouter Routes section, add:

<Routes>
  {/* Existing routes */}
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  
  {/* Public route */}
  <Route path="/" element={<Dashboard />} />
  
  {/* Protected routes - Admin only */}
  <Route
    path="/admin"
    element={
      <ProtectedRoute requiredRoles={["admin"]}>
        <AdminPanel />
      </ProtectedRoute>
    }
  />
  <Route
    path="/manage"
    element={
      <ProtectedRoute requiredRoles={["admin"]}>
        <ManageEmployees />
      </ProtectedRoute>
    }
  />
  <Route
    path="/salary"
    element={
      <ProtectedRoute requiredRoles={["admin"]}>
        <SalaryManagement />
      </ProtectedRoute>
    }
  />
  <Route
    path="/employees"
    element={
      <ProtectedRoute requiredRoles={["admin"]}>
        <EmployeeList />
      </ProtectedRoute>
    }
  />

  {/* HR Dashboard - HR and Admin */}
  <Route
    path="/hr"
    element={
      <ProtectedRoute requiredRoles={["hr", "admin"]}>
        <HRDashboard />
      </ProtectedRoute>
    }
  />

  {/* Manager Dashboard - Manager and Admin */}
  <Route
    path="/manager"
    element={
      <ProtectedRoute requiredRoles={["manager", "admin"]}>
        <ManagerDashboard />
      </ProtectedRoute>
    }
  />
</Routes>
