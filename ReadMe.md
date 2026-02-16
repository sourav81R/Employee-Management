# Employee Management System

A full-stack employee management platform with role-based access control (Admin, HR, Manager, Employee), attendance tracking with photo and geolocation, leave workflows, and salary processing.

## Tech Stack

- Frontend: React 18, React Router, Axios, React Leaflet
- Backend: Node.js, Express, Mongoose, JWT, bcryptjs
- Database: MongoDB
- Security/Middleware: helmet, cors, express-rate-limit
- Notifications: nodemailer

## Core Features

- Authentication and authorization
  - Register and login with JWT
  - Role-based protected UI routes and API access
- Employee management
  - Create, list, update, delete employees
  - Salary payment tracking (`lastPaid`)
- HR operations
  - View users and managers
  - Assign manager to user
  - Approve/reject leave requests (except HR leave, which Admin must approve)
- Manager operations
  - Team summary and team member listing
  - Salary payments for team
- Attendance
  - Daily check-in/check-out
  - Optional photo + location capture (lat/lng, place name, device type)
  - Work duration calculation and short-hours salary-cut flag
  - Attendance history with map view
  - Clear my history (user) / clear all history (Admin/HR)
- Leave management
  - Submit, edit (pending only), delete (not approved)
  - Duplicate/overlap prevention
  - Yearly paid leave policy with paid/unpaid day split
  - Leave summary report by year

## Role Access Summary

- Admin
  - Full access, including `/admin`, `/hr`, `/manager`
  - Can approve HR leave requests
- HR
  - Access to `/hr` and `/manager`
  - Can approve non-HR leave requests
- Manager
  - Access to `/manager`
  - Can process salary payments
- Employee
  - Access to dashboard, attendance, leave request

## Project Structure

```text
Employee-Management/
|-- client/                 # React frontend
|   |-- src/
|   |   |-- pages/          # Login, Register, Dashboard, Admin/HR/Manager, Leave
|   |   |-- components/     # ProtectedRoute, Navbar, Attendance components
|   |   |-- context/        # AuthContext
|   |   `-- utils/apiBase.js
|   `-- package.json
|-- server/                 # Express API
|   |-- server.js           # Main server and most route handlers
|   |-- Attendance.js       # Attendance schema
|   |-- LeaveRequest.js     # Leave schema
|   `-- package.json
|-- *.md                    # Existing project notes/fix docs
`-- .gitignore
```

## Prerequisites

- Node.js 18+
- MongoDB connection string
- npm

## Setup and Run

### 1. Backend

```bash
cd server
npm install
```

Create `server/.env`:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=8000
FRONTEND_ORIGIN=http://localhost:3000

# Optional
JWT_EXPIRE=7d
MIN_DAILY_WORK_HOURS=8
EMAIL_SERVICE=gmail
EMAIL_USER=your_email
EMAIL_PASS=your_app_password
```

Start backend:

```bash
npm start
```

### 2. Frontend

```bash
cd client
npm install
```

Optional `client/.env`:

```env
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_UNSPLASH_ACCESS_KEY=optional_unsplash_key
REACT_APP_MIN_DAILY_WORK_HOURS=8
```

Start frontend:

```bash
npm start
```

## Default Local URLs

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

## Main API Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/profile`

### Employees

- `GET /api/employees`
- `POST /api/employees` (Admin/HR)
- `PUT /api/employees/:id` (Admin/HR)
- `DELETE /api/employees/:id` (Admin/HR)
- `POST /api/employees/pay/:id` (Manager/Admin)

### Users and Org

- `GET /api/users` (Admin/HR)
- `GET /api/managers` (Admin/HR/Manager)
- `POST /api/assign-manager` (Admin/HR)
- `GET /api/hr/stats` (Admin/HR)
- `GET /api/manager/team` (Manager/Admin/HR)
- `GET /api/manager-employees/:managerId` (Manager/Admin/HR)

### Attendance

- `POST /api/attendance/check-in`
- `POST /api/attendance/check-out`
- `GET /api/attendance/today`
- `GET /api/attendance/my`
- `GET /api/attendance/all` (Admin/HR)
- `DELETE /api/attendance/my`
- `DELETE /api/attendance/all` (Admin/HR)
- `POST /api/attendance/my/clear`
- `POST /api/attendance/all/clear` (Admin/HR)
- `GET /api/admin/attendance` (Admin)

### Leave

- `POST /api/leave/request`
- `PUT /api/leave/request/:id`
- `DELETE /api/leave/request/:id`
- `GET /api/leave/my-requests`
- `DELETE /api/leave/my-requests`
- `POST /api/leave/my-requests/clear`
- `GET /api/leave/pending` (HR/Admin)
- `PUT /api/leave/approve/:id` (HR/Admin)
- `GET /api/reports/leave-summary?year=YYYY` (Admin/HR)
- `GET /api/admin/leaves` (Admin)

## Notes from Current Codebase

- `server/server.js` is the active backend entrypoint and contains most business logic.
- `client/src/components/ProtectedRoute.js` enforces frontend route protection.
- API base URL resolution is centralized in `client/src/utils/apiBase.js`.
- Some folders under `client/` (`routes/`, `models/`, `controllers/`, `middleware/`) appear to be legacy/unused in the current runtime flow.
- Root-level `Attendance.js` and `LeaveRequest.js` files are present but empty.
- No automated test suite is currently configured.

## Recommended Next Steps

- Add `.env.example` files for client and server.
- Add API and UI tests (Jest/Vitest + Supertest/Cypress).
- Split `server/server.js` into modular routes/controllers/services for maintainability.
