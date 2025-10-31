# How to Run Seed Command

## Step-by-Step Instructions

### Step 1: Open Terminal/Command Prompt

- **Windows**: Press `Win + R`, type `cmd`, press Enter
- **Or**: Open PowerShell
- **Or**: Use your code editor's terminal (VS Code, etc.)

### Step 2: Navigate to Backend Directory

```bash
cd C:\Users\mmurt\Desktop\web\backend
```

### Step 3: Check Your .env File

Before running seed, you need to make sure your `backend/.env` file has the **production MongoDB URI**.

1. Check if `backend/.env` exists
2. If it doesn't exist, create it:
   ```bash
   # In backend directory
   notepad .env
   ```

3. Add this content (use YOUR production MongoDB URI from Render):
   ```env
   MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xejhsy6.mongodb.net/petshop?retryWrites=true&w=majority
   NODE_ENV=production
   JWT_SECRET=your-secret-key-here
   ```

**Important:** Get the exact `MONGODB_URI` from:
- Render Dashboard → Backend Service → Environment Variables
- Copy the `MONGODB_URI` value exactly as it appears in Render

### Step 4: Run the Seed Command

In the backend directory, run:

```bash
npm run seed
```

You should see output like:
```
Attempting to connect to MongoDB...
✅ MongoDB Connected Successfully
Existing data cleared
Pet types created (3 total)
Users created
Categories created (100 total)
Products created (20 total)
=== Seed Data Summary ===
...
✅ Navigation menu will now display Dog, Cat, and Other Animals
```

### Step 5: Verify

1. Refresh your admin dashboard
2. Go to Categories page - you should see all categories
3. Check Dashboard - category chart should now show data

---

## Quick Command Summary

```bash
# Navigate to backend
cd C:\Users\mmurt\Desktop\web\backend

# Run seed (make sure .env has production MONGODB_URI first!)
npm run seed
```

---

## Troubleshooting

### Error: "Cannot find module 'dotenv'"
**Solution:** Install dependencies first
```bash
cd C:\Users\mmurt\Desktop\web\backend
npm install
```

### Error: "MongoDB connection failed"
**Solution:** 
1. Check your `MONGODB_URI` in `.env` file
2. Make sure it includes database name (e.g., `/petshop`)
3. Verify the URI is correct from Render

### Error: "Cannot find module 'ts-node'"
**Solution:** Install dev dependencies
```bash
npm install --include=dev
```

---

## Current Directory Check

If you're not sure where you are, run:
```bash
pwd    # Mac/Linux
cd     # Windows (shows current directory)
dir    # Windows (lists files)
```

You should be in: `C:\Users\mmurt\Desktop\web\backend`

Then run: `npm run seed`

