# 🔧 Registration Issue - FIXED!

## ✅ Problem Identified & Resolved

**Root Cause**: CORS (Cross-Origin Resource Sharing) was blocking requests from localhost development environment.

The server was only configured to accept requests from production Vercel URL, but your frontend is running on localhost.

## ✅ What Was Fixed

Updated `server/server.js` line 18-22 to allow:
- ✅ `http://localhost:3000` (React default port)
- ✅ `http://localhost:5173` (Vite default port)
- ✅ `https://employee-management-ivory-mu.vercel.app` (Production)

## 🚀 How to Test Registration Now

### Step 1: Start the Backend Server

```bash
cd server
npm start
```

You should see:
```
✅ MongoDB connected
🚀 Employee Management API is running
=== ENV DIAGNOSTICS ===
PORT: 8000
MONGO_URI set?: true
JWT_SECRET set?: true
========================
```

### Step 2: Start the Frontend

In a new terminal:
```bash
cd client
npm start
```

Frontend should load on `http://localhost:3000`

### Step 3: Register as Different Roles

**Test Registering as HR:**
1. Click "Sign up" on login page
2. Fill in details:
   - **Name**: John HR
   - **Email**: hr@test.com
   - **Password**: hr123
   - **Role**: Select "HR" (👨‍💼)
3. Click "Create Account"
4. ✅ Should see success message and redirect to login

**Test Registering as Manager:**
1. Fill in details:
   - **Name**: Jane Manager
   - **Email**: manager@test.com
   - **Password**: manager123
   - **Role**: Select "Manager" (👔)
2. Click "Create Account"
3. ✅ Should see success message and redirect to login

**Test Registering as Employee:**
1. Fill in details:
   - **Name**: Bob Employee
   - **Email**: emp@test.com
   - **Password**: emp123
   - **Role**: Select "Employee" (👨‍💼)
2. Click "Create Account"
3. ✅ Should see success message and redirect to login

**Test Registering as Admin:**
1. Fill in details:
   - **Name**: Admin User
   - **Email**: admin@test.com
   - **Password**: admin123
   - **Role**: Select "Admin" (🔐)
2. Click "Create Account"
3. ✅ Should see success message and redirect to login

### Step 4: Login with Your New Accounts

After registration succeeds, go back to login and use:
- Email: hr@test.com (or manager, emp, admin)
- Password: (your password)

✅ You should be able to login to each role

## 📋 Troubleshooting

### Issue: Still Can't Register?

**Problem**: Backend not running
- **Solution**: Run `cd server && npm start` first

**Problem**: Database not connected
- **Solution**: Check `.env` file has `MONGO_URI` and `JWT_SECRET`
- **Fix**: Create `.env` in server folder with:
  ```
  MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/employee_db?retryWrites=true&w=majority
  JWT_SECRET=your-secret-key-here-make-it-long-and-random
  PORT=8000
  ```

**Problem**: "User already exists" error
- **Solution**: That email is already registered, use a different email

**Problem**: CORS error in browser console
- **Solution**: Make sure backend is running on port 8000
- **Fix**: Check no other service is using port 8000

### Check Browser Console for Errors

1. Open browser DevTools (F12)
2. Go to "Console" tab
3. Try registering again
4. Look for any error messages
5. Share the error in console

## ✅ Expected Flow After Fix

1. **Registration Page** loads ✅
2. Select role (Employee/Manager/HR/Admin) ✅
3. Fill form with name, email, password ✅
4. Click "Create Account" ✅
5. API call to backend succeeds ✅
6. See "Registration successful" alert ✅
7. Redirect to login page ✅
8. Login with new credentials ✅
9. See dashboard for your role ✅

## 📊 Backend API Response

When registration succeeds, backend returns:
```json
{
  "message": "Registered",
  "user": {
    "id": "ObjectId",
    "name": "Your Name",
    "email": "your@email.com",
    "role": "hr" (or manager, employee, admin)
  }
}
```

## 🔍 Files Changed

- ✅ `server/server.js` - Updated CORS origin whitelist (line 18-22)

**No other files needed to be modified** - The issue was pure configuration!

## ✨ Next Steps

After successful registration:

1. **Login** with your new account
2. **Check navbar** - Should show role-specific links
3. **Access dashboard** - Click on your role dashboard
4. **Test features** - Try the features for your role:
   - **HR**: Assign managers
   - **Manager**: View team & pay salaries
   - **Employee**: View directory
   - **Admin**: Manage everything

## 🎯 Success Indicators

✅ Can fill role selection form without errors
✅ Can click "Create Account" button
✅ Get success alert after registration
✅ Redirected to login page
✅ Can login with new credentials
✅ Dashboard loads for your role

---

**If it still doesn't work:**
1. Check backend console for errors
2. Check browser DevTools console (F12)
3. Make sure MongoDB is connected
4. Make sure both frontend and backend are running
5. Clear browser cache (Ctrl+Shift+Delete)
6. Try a different browser
7. Use incognito mode to bypass cache
