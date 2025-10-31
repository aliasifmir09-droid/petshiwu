# How to Seed Production Database

Your production database (on Render) doesn't have categories yet. You need to run the seed script against your production MongoDB database.

## Quick Solution: Run Seed Script Locally Against Production DB

The seed script will use your `MONGODB_URI` from your `.env` file, so you can run it locally but it will seed your production database.

### Step 1: Update Your Local .env File

In `backend/.env`, make sure `MONGODB_URI` points to your **production MongoDB database** (the same one Render is using):

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xejhsy6.mongodb.net/petshop?retryWrites=true&w=majority
NODE_ENV=production
JWT_SECRET=your-secret-key
```

**Important:** 
- Get the exact `MONGODB_URI` from your Render backend service → Environment variables
- Make sure it includes the database name (e.g., `/petshop` or `/pet-shop`)
- This should be the SAME URI that Render is using

### Step 2: Run Seed Script

```bash
cd backend
npm run seed
```

This will:
- Connect to your production MongoDB
- Create pet types (Dog, Cat, Other Animals)
- Create all categories and subcategories from navigation menu
- Create products
- Create admin and customer users

### Step 3: Verify

After seeding:
1. Refresh your admin dashboard
2. Go to Categories page - you should see all categories
3. Check Dashboard - category chart should show data
4. Check Navigation Menu Categories section - should show categories grouped by pet type

---

## Alternative: Seed via Render Shell (Advanced)

If you have SSH access to Render:

1. Go to Render Dashboard → Your Backend Service
2. Click on "Shell" tab (if available)
3. Run:
   ```bash
   npm run seed
   ```

---

## What the Seed Script Creates

- **Pet Types**: 3 (Dog 🐕, Cat 🐱, Other Animals 🐾)
- **Main Categories**: 14 (Food, Treats, Health & Pharmacy, Supplies, Toys, etc.)
- **Subcategories**: 86 (Dry Food, Wet Food, Dental Treats, etc.)
- **Products**: 20 (10 dog, 10 cat)
- **Users**: Admin and Customer accounts

---

## Important Notes

⚠️ **Warning**: The seed script will **DELETE** all existing data before creating new data!

If you already have:
- Products you want to keep
- Customers/orders
- Custom categories

**Backup first** or modify the seed script to not delete existing data.

---

## Verify Database Connection

Before running seed, test your connection:

```bash
cd backend
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => console.log('✅ Connected')).catch(e => console.error('❌ Error:', e.message))"
```

If you see "✅ Connected", you're ready to seed!

