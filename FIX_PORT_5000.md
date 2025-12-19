# 🔧 Fix Port 5000 Already in Use

## Problem
Port 5000 is already in use by another process (PID: 52036).

## Solutions

### Option 1: Kill the Process Using Port 5000 (Recommended)

**Windows PowerShell:**
```powershell
# Kill the process
Stop-Process -Id 52036 -Force

# Or if that doesn't work:
taskkill /PID 52036 /F
```

**Then restart your backend:**
```bash
cd backend
npm run dev
```

### Option 2: Change Backend Port

If you want to keep the other process running, change your backend port:

1. **Edit `backend/.env`:**
   ```env
   PORT=5001
   ```

2. **Update `frontend/.env`:**
   ```env
   VITE_API_URL=http://localhost:5001/api
   ```

3. **Update `admin/.env`:**
   ```env
   VITE_API_URL=http://localhost:5001/api
   ```

4. **Restart backend:**
   ```bash
   cd backend
   npm run dev
   ```

### Option 3: Find and Kill All Node Processes

If it's a leftover Node.js process:

```powershell
# Find all Node processes
Get-Process node -ErrorAction SilentlyContinue

# Kill all Node processes (WARNING: Closes all Node apps)
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

## Quick Fix Command

Run this to kill the process on port 5000:

```powershell
Stop-Process -Id 52036 -Force
```

Then restart:
```bash
npm run dev
```

