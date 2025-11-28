# Product Deletion Tracking & Security

## Overview

All product deletions are now tracked with comprehensive logging to ensure products are only deleted through the proper API endpoint (`deleteProduct`).

## ✅ Authorized Deletion Paths

### 1. API Endpoint: `DELETE /api/products/:id`
- **Location**: `backend/src/controllers/productController.ts` → `deleteProduct()`
- **Protection**: 
  - Requires authentication (`protect` middleware)
  - Requires `canManageProducts` permission
  - Validates ObjectId format
- **Logging**: ✅ **FULLY LOGGED**
  - Logs all deletion requests with:
    - Product ID
    - User ID, email, role
    - Timestamp
    - IP address
    - User agent
    - Product name
    - Deletion status

### 2. Seed Scripts (Protected)
- **Location**: `backend/src/utils/seed*.ts`
- **Protection**: ✅ **BLOCKED IN PRODUCTION**
  - Requires `FORCE_SEED=true` environment variable
  - Only runs in development or with explicit flag
- **Status**: Safe - cannot run accidentally in production

### 3. Utility Scripts (Manual Only)
- **Location**: 
  - `backend/src/utils/findAndRemoveDuplicates.ts` - Removes duplicates
  - `backend/src/utils/cleanupPetTypes.ts` - Removes specific pet types
- **Protection**: Manual execution only (not called automatically)
- **Status**: Safe - requires manual `npm run` command

## 🔍 Monitoring Product Deletions

### How to Track Deletions

1. **Check Render Logs**:
   - Go to Render Dashboard → Your Backend Service → Logs
   - Search for: `[DELETE PRODUCT]`
   - You'll see entries like:
     ```
     [DELETE PRODUCT] Request received: { productId: '...', userId: '...', userEmail: '...', ... }
     [DELETE PRODUCT] Product found: ... (Product Name), proceeding with deletion
     [DELETE PRODUCT] ✅ Product successfully deleted: ... (Product Name)
     ```

2. **What to Look For**:
   - ✅ **Expected**: Logs showing `[DELETE PRODUCT]` with user information
   - ❌ **Unexpected**: No logs but products are deleted (indicates other deletion path)
   - ❌ **Unexpected**: Logs from seed scripts in production
   - ❌ **Unexpected**: Bulk deletions without corresponding API calls

### Log Format

Each deletion is logged with:
```javascript
{
  productId: "507f1f77bcf86cd799439011",
  userId: "507f191e810c19729de860ea",
  userEmail: "admin@example.com",
  userRole: "admin",
  timestamp: "2024-01-15T10:30:00.000Z",
  ip: "192.168.1.1",
  userAgent: "Mozilla/5.0..."
}
```

## 🚨 If Products Are Being Deleted Unexpectedly

### Step 1: Check Render Logs
```bash
# In Render Dashboard → Logs
# Search for: [DELETE PRODUCT]
```

**If you see logs:**
- ✅ Deletions are going through the API endpoint
- Check the `userEmail` and `userRole` to see who is deleting
- Verify the deletions are intentional

**If you DON'T see logs:**
- ❌ Products are being deleted through another path
- Check for:
  - Seed scripts running (should see "PRODUCTION SEED BLOCKED")
  - Utility scripts running
  - Direct database access
  - Other code paths

### Step 2: Check Database Directly
```javascript
// In MongoDB Atlas or Compass
// Check if products have been deleted
db.products.countDocuments({})
```

### Step 3: Verify Environment Variables
- ✅ `NODE_ENV=production` (seed scripts blocked)
- ✅ `FORCE_SEED` NOT set (seed scripts blocked)
- ✅ No other deletion-related variables

### Step 4: Check for Other Deletion Paths
- Review all `Product.delete*` calls in codebase
- Verify no scheduled tasks or cron jobs
- Check for any middleware that might delete products
- Verify no database triggers or hooks

## 🔒 Security Measures

### 1. API Endpoint Protection
- ✅ Authentication required (`protect` middleware)
- ✅ Permission check (`canManageProducts`)
- ✅ ObjectId validation
- ✅ Comprehensive logging

### 2. Seed Script Protection
- ✅ Production blocking
- ✅ Requires explicit `FORCE_SEED=true` flag
- ✅ Safety delays and warnings

### 3. Utility Script Protection
- ✅ Manual execution only
- ✅ Not called automatically
- ✅ Not included in build/start commands

## 📊 Expected Behavior

### Normal Deletion Flow
1. Admin clicks "Delete" in admin dashboard
2. Frontend calls: `DELETE /api/products/:id`
3. Backend logs: `[DELETE PRODUCT] Request received`
4. Backend validates user and permissions
5. Backend deletes product from database
6. Backend deletes images from Cloudinary
7. Backend logs: `[DELETE PRODUCT] ✅ Product successfully deleted`
8. Frontend receives success response
9. Frontend updates UI

### Unauthorized Deletion Attempt
1. If seed script tries to run in production:
   - Script exits with: `PRODUCTION SEED BLOCKED`
   - No products are deleted
   - Logs show the blocking message

## 🛠️ Troubleshooting

### Issue: Products deleted but no logs
**Possible causes:**
1. Direct database access
2. Another application/service accessing the database
3. Database corruption or replication issue
4. Logs not being captured (check Render log retention)

**Solution:**
- Check MongoDB Atlas audit logs
- Verify database access controls
- Review all applications with database access
- Enable MongoDB Atlas monitoring

### Issue: Products deleted by unknown user
**Check logs for:**
- `userEmail` and `userRole` in deletion logs
- Verify admin account security
- Check for compromised credentials
- Review user permissions

### Issue: Bulk deletions without API calls
**Possible causes:**
1. Utility script execution
2. Database migration or cleanup
3. Scheduled task

**Solution:**
- Check Render logs for script execution
- Review deployment history
- Check for cron jobs or scheduled tasks
- Verify no automated cleanup processes

## 📝 Summary

**All product deletions should:**
- ✅ Go through `DELETE /api/products/:id` endpoint
- ✅ Be logged with `[DELETE PRODUCT]` prefix
- ✅ Include user information and timestamp
- ✅ Require authentication and permissions

**If products are deleted without logs:**
- ❌ Something is wrong
- ❌ Products are being deleted through an unauthorized path
- ❌ Immediate investigation required

## 🔗 Related Files

- `backend/src/controllers/productController.ts` - Main deletion logic
- `backend/src/routes/products.ts` - API route definition
- `backend/src/middleware/auth.ts` - Authentication middleware
- `backend/src/middleware/permissions.ts` - Permission checks
- `SEED_SCRIPT_PROTECTION.md` - Seed script protection details

