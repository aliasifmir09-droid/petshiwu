# Seed Script Protection - Production Safety

## Problem

Products were being deleted after redeployment. This was caused by seed scripts that delete all existing data before creating new data.

## Solution

All seed scripts now have **production protection** to prevent accidental data deletion:

### Protected Scripts
- `backend/src/utils/seed.ts` - Full database seed (deletes users, products, categories, pet types)
- `backend/src/utils/seedProducts.ts` - Product seed (deletes products and categories)
- `backend/src/utils/seedProductsFixed.ts` - Product seed with fixed images (deletes products and categories)

### How It Works

1. **Production Detection**: Scripts check if `NODE_ENV === 'production'`
2. **Force Flag Required**: In production, scripts require `FORCE_SEED=true` environment variable
3. **Safety Delays**: If force flag is set, scripts wait 5 seconds before starting and 3 seconds before deletion
4. **Data Count Display**: Shows current database state before deletion
5. **Clear Warnings**: Displays prominent warnings about data loss

### Running Seed Scripts

#### Development (Safe)
```bash
cd backend
npm run seed
# or
npm run seed-products
```

#### Production (Protected)
```bash
# This will be BLOCKED and show an error
cd backend
npm run seed

# To run in production, you MUST set FORCE_SEED=true
FORCE_SEED=true npm run seed
```

### Important Notes

⚠️ **WARNING**: Seed scripts are **DESTRUCTIVE** operations:
- `seed.ts` deletes: Users, Products, Categories, Pet Types
- `seedProducts.ts` and `seedProductsFixed.ts` delete: Products, Categories (preserves Users and Pet Types)

### Deployment Configuration

The seed scripts are **NOT** automatically run during deployment:
- `render.yaml` only runs `npm run build` and `npm start`
- No post-deploy hooks are configured
- Scripts must be run manually with explicit `FORCE_SEED=true` flag

### If Products Are Still Being Deleted

1. **Check Render Environment Variables**:
   - Go to Render Dashboard → Your Backend Service → Environment
   - Ensure `FORCE_SEED` is NOT set to `true`
   - Remove it if it exists

2. **Check for Manual Execution**:
   - Review Render logs for seed script execution
   - Check if anyone has access to run scripts manually

3. **Check Database Connection**:
   - Verify `MONGODB_URI` is correct
   - Ensure you're connecting to the right database
   - Check if multiple databases are being used

4. **Check for Other Scripts**:
   - Review any custom deployment scripts
   - Check for cron jobs or scheduled tasks
   - Verify no other code is calling seed functions

### Verification

To verify the protection is working:

```bash
# In production environment (NODE_ENV=production)
cd backend
npm run seed

# Should output:
# ❌❌❌ PRODUCTION SEED BLOCKED ❌❌❌
# ⚠️  WARNING: Seed script is blocked in production...
```

### Database Configuration

The database connection is configured in:
- `backend/src/utils/database.ts`
- Uses `MONGODB_URI` from environment variables
- Connection is established on server startup
- No automatic seeding on connection

### Recommendations

1. **Never set `FORCE_SEED=true` in production environment variables**
2. **Only run seed scripts manually when needed**
3. **Always backup database before running seed scripts**
4. **Use separate development and production databases**
5. **Review Render logs after each deployment to ensure no seed scripts ran**

