# 🚀 Quick Start Guide - Role-Based Employee Management

## ⚡ 5-Minute Setup

### 1. Start Backend
```bash
cd server
npm start
```
✅ Server running on http://localhost:8000

### 2. Start Frontend
```bash
cd client
npm start
```
✅ App running on http://localhost:3000

### 3. Register Test Users
Go to http://localhost:3000/register and create accounts:

**User 1: Admin**
- Name: Admin User
- Email: admin@test.com
- Password: admin123
- Role: 🔐 Admin

**User 2: HR Manager**
- Name: HR Manager
- Email: hr@test.com
- Password: hr123
- Role: 👔 HR

**User 3: Team Manager**
- Name: Team Manager
- Email: manager@test.com
- Password: manager123
- Role: 🎯 Manager

**User 4: Employee**
- Name: Regular Employee
- Email: emp@test.com
- Password: emp123
- Role: 👨‍💼 Employee

---

## 🎯 Test Each Role

### 1. **Test as Admin** (admin@test.com)
Login → See "🔐 Admin" link in navbar
- Click it to see Admin Dashboard
- Create/manage employees
- View salary info
- Full system access

### 2. **Test as HR** (hr@test.com)
Login → See "👔 HR Dashboard" link
- View all users
- See all managers
- Assign managers to employees
  - Click "Assign Manager"
  - Select employee + manager
  - Save

### 3. **Test as Manager** (manager@test.com)
Login → See "🎯 Team" link
- View team statistics
- See team members (after HR assigns)
- Process salary payments
  - Click "💰 Pay Salary"
  - Confirm payment

### 4. **Test as Employee** (emp@test.com)
Login → Regular dashboard
- View company directory
- See employee list
- Basic read-only access

---

## 🎨 UI Features to Try

### Navbar
- Click user avatar → See dropdown menu
- Menu shows:
  - User name
  - Email
  - Logout button
- Role-specific dashboard links
  - Admin: "🔐 Admin"
  - HR: "👔 HR Dashboard"
  - Manager: "🎯 Team"

### HR Dashboard
1. View statistics at top
   - Total Users
   - Managers
   - Employees
   - Departments

2. Manager cards section
   - Shows all managers
   - Click "View Team" button

3. Users table
   - All users listed
   - Roles color-coded
   - Manager assignments visible

4. Assign Manager Modal
   - Select user from dropdown
   - Select manager from dropdown
   - Click "Assign"

### Manager Dashboard
1. Team statistics cards
   - Team Size
   - Paid employees
   - Unpaid employees
   - Total salary pool

2. Search bar
   - Search by employee name
   - Real-time filtering

3. Team member cards
   - Employee details
   - Position & department
   - Salary information
   - Payment status (green/red)
   - "💰 Pay Salary" button

---

## 📊 Database Setup

### MongoDB Connection String
Update `.env` in server:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
```

### Collections Created Automatically
- `users` - Stores admin, HR, managers, employees
- `employees` - Stores employee records

---

## 🔑 API Testing with Curl

### Register
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@test.com",
    "password": "password123",
    "role": "employee"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@test.com",
    "password": "password123"
  }'
```

### Get Users (Admin/HR only)
```bash
curl -H "Authorization: Bearer TOKEN_HERE" \
  http://localhost:8000/api/users
```

### Get Managers
```bash
curl -H "Authorization: Bearer TOKEN_HERE" \
  http://localhost:8000/api/managers
```

### Assign Manager
```bash
curl -X POST http://localhost:8000/api/assign-manager \
  -H "Authorization: Bearer TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_id_here",
    "managerId": "manager_id_here"
  }'
```

### Get HR Stats
```bash
curl -H "Authorization: Bearer TOKEN_HERE" \
  http://localhost:8000/api/hr/stats
```

### Get Manager Team
```bash
curl -H "Authorization: Bearer TOKEN_HERE" \
  http://localhost:8000/api/manager/team
```

### Pay Salary
```bash
curl -X POST http://localhost:8000/api/employees/pay/employee_id \
  -H "Authorization: Bearer TOKEN_HERE"
```

---

## 🎯 Common Tasks

### Task 1: Assign Manager to Employee
1. Login as **HR** (hr@test.com)
2. Go to HR Dashboard
3. Click "➕ Assign Manager" button
4. Select:
   - User: Regular Employee
   - Manager: Team Manager
5. Click "Assign"
6. ✅ Done! Manager can now see this employee

### Task 2: Process Salary Payment
1. Login as **Manager** (manager@test.com)
2. Go to Team Dashboard
3. If no team appears:
   - HR needs to assign employees to this manager
4. Find employee in list
5. Click "💰 Pay Salary"
6. Status changes from "Not paid" → "Paid date"

### Task 3: View Organization Structure
1. Login as **HR** (hr@test.com)
2. Go to HR Dashboard
3. See statistics at top
4. Scroll to "All Users" table
5. See all roles and manager assignments

### Task 4: Manage Employees (Admin)
1. Login as **Admin** (admin@test.com)
2. Click "🔐 Admin" link
3. Add/Edit/Delete employees
4. Process salary payments
5. View all data

---

## ❌ Troubleshooting Quick Fixes

| Issue | Solution |
|-------|----------|
| Can't see HR Dashboard | Login as HR, check navbar for link |
| Team Dashboard empty | HR must assign employees to this manager |
| Can't assign manager | Login as HR/Admin with proper permissions |
| Salary payment fails | Check if user is a manager |
| 401 error on API | Token expired, login again |
| Page shows "Access Denied" | Your role doesn't have permission |

---

## 📱 Mobile Testing

All dashboards work on mobile:
- Resize browser to mobile size
- Menu becomes simplified
- Cards stack vertically
- Touch-friendly buttons

---

## 🎓 Learning Path

1. **Start**: Login as Employee
   - See basic dashboard

2. **Progress**: Login as Manager
   - Process salary payments
   - Manage team

3. **Advanced**: Login as HR
   - Assign managers
   - Structure organization

4. **Master**: Login as Admin
   - Full system control
   - All features access

---

## ✅ Verification Checklist

- [x] Backend server running (port 8000)
- [x] Frontend app running (port 3000)
- [x] Can register with roles
- [x] Can login with different roles
- [x] Navbar shows role-specific links
- [x] HR Dashboard appears for HR users
- [x] Manager Dashboard appears for managers
- [x] Can assign managers (HR)
- [x] Can process salary (Manager)
- [x] Access control works
- [x] User menu shows dropdown
- [x] Logout functionality works

---

## 🚀 Next Steps

1. **Customize**: Update company name, colors
2. **Deploy**: Deploy to Vercel/Heroku
3. **Extend**: Add more features
4. **Integrate**: Connect with other systems
5. **Monitor**: Set up logging/monitoring

---

## 💬 Tips

- Use same browser for all tests (for localStorage)
- Clear cache if UI doesn't update
- Check browser console (F12) for errors
- Check server console for API logs
- Use browser's Application tab to see localStorage

---

## 🎉 You're Ready!

Your corporate role-based employee management system is now:
- ✅ Running
- ✅ Tested
- ✅ Ready to use
- ✅ Fully functional

**Enjoy your new system!** 🚀

For detailed documentation, see: `COMPLETE_GUIDE.md`
