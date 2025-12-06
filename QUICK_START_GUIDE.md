# Quick Start Guide - Testing & Documentation

## 🚀 Quick Commands

### Run Tests
```bash
cd backend
npm test
```

### View API Docs
```bash
# Terminal 1: Start server
cd backend
npm run dev

# Browser: Visit
http://localhost:5000/api-docs
```

### Check CI/CD
- Go to: https://github.com/YOUR_USERNAME/pet-shop/actions
- See test results after each push

---

## 📖 Step-by-Step Tutorial

### Step 1: Run Your First Test

1. **Open terminal** in the project root
2. **Navigate to backend:**
   ```bash
   cd backend
   ```
3. **Run tests:**
   ```bash
   npm test
   ```
4. **What you'll see:**
   ```
   PASS  src/__tests__/unit/utils/validateEnv.test.ts
   PASS  src/__tests__/integration/products.test.ts
   PASS  src/__tests__/integration/auth.test.ts
   
   Test Suites: 3 passed, 3 total
   Tests:       8 passed, 8 total
   ```

**✅ Success!** All tests passed.

---

### Step 2: Explore API Documentation

1. **Start the server** (in a new terminal):
   ```bash
   cd backend
   npm run dev
   ```
   You should see:
   ```
   📚 API Documentation available at /api-docs
   Server running in development mode on port 5000
   ```

2. **Open browser** and go to:
   ```
   http://localhost:5000/api-docs
   ```

3. **Explore the interface:**
   - **Scroll down** to see all API endpoints
   - **Click on "GET /api/products"** to expand it
   - **Click "Try it out"** button
   - **Click "Execute"** to test the endpoint
   - **See the response** below

4. **Test with authentication:**
   - Find **"POST /api/auth/login"**
   - Click "Try it out"
   - Enter test credentials:
     ```json
     {
       "email": "admin@petshiwu.com",
       "password": "your-password"
     }
   - Click "Execute"
   - **Copy the token** from the response
   - Click **"Authorize"** button (top right, lock icon)
   - Enter: `Bearer YOUR_TOKEN_HERE`
   - Click "Authorize"
   - Now test protected endpoints!

---

### Step 3: Write Your First Test

Let's create a simple test for a utility function.

**Create file:** `backend/src/__tests__/unit/utils/example.test.ts`

```typescript
// Simple example test
describe('Math operations', () => {
  it('should add two numbers correctly', () => {
    const result = 2 + 2;
    expect(result).toBe(4);
  });

  it('should multiply numbers', () => {
    const result = 3 * 4;
    expect(result).toBe(12);
  });
});
```

**Run just this test:**
```bash
npm test -- example.test.ts
```

**You should see:**
```
PASS  src/__tests__/unit/utils/example.test.ts
  Math operations
    ✓ should add two numbers correctly
    ✓ should multiply numbers
```

**🎉 Congratulations!** You wrote your first test!

---

### Step 4: Write an Integration Test

Let's test a real API endpoint.

**Create file:** `backend/src/__tests__/integration/categories.test.ts`

```typescript
import request from 'supertest';
import mongoose from 'mongoose';
import { connectDatabase } from '../../utils/database';

let app: any;
beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  app = (await import('../../server')).default;
  await connectDatabase();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Categories API', () => {
  it('should return all categories', async () => {
    const response = await request(app)
      .get('/api/categories')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
```

**Run the test:**
```bash
npm test -- categories.test.ts
```

---

### Step 5: Add Swagger Documentation

Let's document a new endpoint.

**In your controller file** (e.g., `backend/src/controllers/categoryController.ts`):

Add this comment above the function:

```typescript
/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: petType
 *         schema:
 *           type: string
 *         description: Filter by pet type
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 */
export const getAllCategories = async (req: Request, res: Response, next: NextFunction) => {
  // ... your code
};
```

**Restart the server** and check `/api-docs` - your endpoint will appear!

---

### Step 6: Check CI/CD Pipeline

1. **Make a small change** (add a comment, fix formatting)
2. **Commit and push:**
   ```bash
   git add .
   git commit -m "test: Add example test"
   git push
   ```
3. **Go to GitHub:**
   - Visit: `https://github.com/YOUR_USERNAME/pet-shop`
   - Click **"Actions"** tab
   - See your workflow running!
4. **Wait 2-3 minutes** for tests to complete
5. **Check results:**
   - ✅ Green checkmark = All tests passed
   - ❌ Red X = Something failed (click to see details)

---

## 🎯 Common Tasks

### Run Tests in Watch Mode
```bash
npm run test:watch
```
**Use when:** Actively writing tests - they rerun automatically on save

### Generate Coverage Report
```bash
npm run test:coverage
```
**Then open:** `backend/coverage/index.html` in browser

### Run Specific Test File
```bash
npm test -- products.test.ts
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="should return"
```

### Enable Swagger in Production
```bash
ENABLE_SWAGGER=true npm start
```

---

## 🐛 Troubleshooting

### Tests Fail: "MongoDB connection error"
**Solution:** Start MongoDB
```bash
# Windows (if installed as service)
net start MongoDB

# Or use MongoDB Compass/Atlas
```

### Swagger Not Showing
**Check:**
1. Server is running
2. Visit correct URL: `http://localhost:5000/api-docs`
3. Check console for errors

### CI/CD Fails
**Check:**
1. Tests pass locally first: `npm test`
2. All TypeScript compiles: `npm run build`
3. Check GitHub Actions logs for specific error

---

## 📚 Next Steps

1. ✅ Run the existing tests
2. ✅ Explore Swagger UI
3. ✅ Write a simple test
4. ✅ Add Swagger docs to one endpoint
5. ✅ Push and watch CI/CD run

**For detailed explanations, see:** `DEVELOPER_GUIDE.md`

Happy coding! 🚀

