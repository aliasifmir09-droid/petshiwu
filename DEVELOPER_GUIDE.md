# Developer Guide - Testing & Documentation

This guide explains how to use the testing framework, API documentation, and CI/CD pipeline that we've set up.

## 📋 Table of Contents

1. [Running Tests Locally](#running-tests-locally)
2. [Viewing API Documentation](#viewing-api-documentation)
3. [Adding More Tests](#adding-more-tests)
4. [Understanding CI/CD Pipeline](#understanding-cicd-pipeline)

---

## 🧪 Running Tests Locally

### Prerequisites

Before running tests, make sure you have:
- MongoDB running locally (or use a test database)
- All dependencies installed: `npm install` (from root directory)

### Basic Test Commands

Navigate to the backend directory and run:

```bash
cd backend
npm test
```

This will:
- Run all tests (unit + integration)
- Show test results in the terminal
- Exit with code 0 if all tests pass, or 1 if any fail

### Test Modes

#### 1. Run All Tests Once
```bash
npm test
```

#### 2. Watch Mode (Auto-rerun on file changes)
```bash
npm run test:watch
```
**Use this when:** You're actively writing tests and want them to rerun automatically when you save files.

#### 3. Generate Coverage Report
```bash
npm run test:coverage
```
**What it does:**
- Runs all tests
- Generates a coverage report showing which code is tested
- Creates an HTML report in `backend/coverage/index.html`
- Shows percentage of code covered by tests

**Example output:**
```
File      | % Stmts | % Branch | % Funcs | % Lines
----------|---------|----------|---------|--------
All files |   45.23 |    38.90 |   42.10 |   45.67
```

### Understanding Test Output

When you run `npm test`, you'll see:

```
PASS  src/__tests__/unit/utils/validateEnv.test.ts
  validateEnv
    ✓ should throw error if MONGODB_URI is missing (5ms)
    ✓ should throw error if JWT_SECRET is missing (3ms)
    ✓ should pass validation with required variables (2ms)

PASS  src/__tests__/integration/products.test.ts
  Products API
    GET /api/products
      ✓ should return products list (234ms)
      ✓ should support pagination (156ms)
      ✓ should filter by petType (189ms)

Test Suites: 2 passed, 2 total
Tests:       6 passed, 6 total
```

**What this means:**
- ✅ **PASS** = All tests in this file passed
- ✓ = Individual test passed
- **Test Suites** = Number of test files
- **Tests** = Total number of test cases

### Test Environment Setup

Tests use a separate test database. The test setup file (`src/__tests__/setup.ts`) automatically:
- Sets `NODE_ENV=test`
- Uses test database: `mongodb://127.0.0.1:27017/pet-ecommerce-test`
- Sets a test JWT secret

**Important:** Make sure MongoDB is running before running tests!

### Troubleshooting Tests

**Problem:** Tests fail with "MongoDB connection error"
- **Solution:** Start MongoDB: `mongod` (or use MongoDB service)

**Problem:** Tests are slow
- **Solution:** This is normal for integration tests. They connect to a real database.

**Problem:** Tests pass locally but fail in CI
- **Solution:** Check that all environment variables are set in CI configuration

---

## 📚 Viewing API Documentation

### Starting the Server

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```
   Or in production mode:
   ```bash
   npm run build
   npm start
   ```

3. **Check the console output:**
   You should see:
   ```
   📚 API Documentation available at /api-docs
   Server running in development mode on port 5000
   ```

### Accessing Swagger UI

Once the server is running:

1. **Open your browser**
2. **Navigate to:** `http://localhost:5000/api-docs`
3. **You'll see:** A beautiful Swagger UI interface with all API endpoints

### Using Swagger UI

#### Viewing Endpoints
- **Expand sections** to see all endpoints
- **Click on an endpoint** to see details:
  - Request parameters
  - Request body schema
  - Response examples
  - Authentication requirements

#### Testing Endpoints

1. **Click "Try it out"** on any endpoint
2. **Fill in parameters** (if required)
3. **Click "Execute"**
4. **See the response** with status code and body

#### Authentication in Swagger

For protected endpoints:

1. **First, get a JWT token:**
   - Use `/api/auth/login` endpoint
   - Copy the token from the response

2. **Authorize in Swagger:**
   - Click the **"Authorize"** button (top right)
   - Enter: `Bearer YOUR_TOKEN_HERE`
   - Click "Authorize"
   - Now you can test protected endpoints!

### Enabling Swagger in Production

By default, Swagger is disabled in production. To enable:

**Option 1: Environment Variable**
```bash
ENABLE_SWAGGER=true npm start
```

**Option 2: Modify server.ts**
Change the condition in `backend/src/server.ts`:
```typescript
// Change from:
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true')

// To:
if (true) // Always enable (not recommended for production)
```

---

## ➕ Adding More Tests

### Test File Structure

```
backend/src/__tests__/
├── setup.ts                    # Test configuration
├── unit/                       # Unit tests (isolated functions)
│   └── utils/
│       └── validateEnv.test.ts
└── integration/                # Integration tests (API endpoints)
    ├── products.test.ts
    └── auth.test.ts
```

### Writing Unit Tests

**Unit tests** test individual functions in isolation (no database, no HTTP).

**Example:** Testing a utility function

Create: `backend/src/__tests__/unit/utils/formatPrice.test.ts`

```typescript
import { formatPrice } from '../../../utils/formatPrice';

describe('formatPrice', () => {
  it('should format price with 2 decimal places', () => {
    expect(formatPrice(10.5)).toBe('$10.50');
  });

  it('should handle zero', () => {
    expect(formatPrice(0)).toBe('$0.00');
  });

  it('should handle large numbers', () => {
    expect(formatPrice(1000.99)).toBe('$1,000.99');
  });
});
```

**Key points:**
- Import the function you're testing
- Use `describe()` to group related tests
- Use `it()` or `test()` for individual test cases
- Use `expect()` to make assertions

### Writing Integration Tests

**Integration tests** test API endpoints with a real database.

**Example:** Testing a new endpoint

Create: `backend/src/__tests__/integration/categories.test.ts`

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
  describe('GET /api/categories', () => {
    it('should return all categories', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by petType', async () => {
      const response = await request(app)
        .get('/api/categories?petType=dog')
        .expect(200);

      expect(response.body.success).toBe(true);
      // Verify all returned categories are for dogs
      response.body.data.forEach((cat: any) => {
        expect(cat.petType).toBe('dog');
      });
    });
  });

  describe('POST /api/categories', () => {
    it('should require authentication', async () => {
      await request(app)
        .post('/api/categories')
        .send({ name: 'Test Category' })
        .expect(401); // Unauthorized
    });

    it('should create category with valid token', async () => {
      // First, login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@petshiwu.com',
          password: 'your-admin-password'
        });

      const token = loginResponse.body.data.token;

      // Then create category
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Category',
          petType: 'dog',
          level: 1
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Category');

      // Cleanup: delete the test category
      await request(app)
        .delete(`/api/categories/${response.body.data._id}`)
        .set('Authorization', `Bearer ${token}`);
    });
  });
});
```

**Key points:**
- Use `supertest`'s `request(app)` to make HTTP requests
- Use `.expect()` to check status codes
- Use `expect()` from Jest to check response body
- Always clean up test data after tests

### Test Best Practices

1. **Test one thing at a time** - Each test should verify one behavior
2. **Use descriptive names** - Test names should explain what they test
3. **Arrange-Act-Assert pattern:**
   ```typescript
   it('should calculate total correctly', () => {
     // Arrange: Set up test data
     const items = [{ price: 10 }, { price: 20 }];
     
     // Act: Execute the function
     const total = calculateTotal(items);
     
     // Assert: Verify the result
     expect(total).toBe(30);
   });
   ```
4. **Clean up after tests** - Delete test data to avoid conflicts
5. **Test edge cases** - Test with empty arrays, null values, etc.

### Running Specific Tests

**Run only unit tests:**
```bash
npm test -- unit
```

**Run only integration tests:**
```bash
npm test -- integration
```

**Run a specific test file:**
```bash
npm test -- categories.test.ts
```

**Run tests matching a pattern:**
```bash
npm test -- --testNamePattern="should return products"
```

---

## 🔄 Understanding CI/CD Pipeline

### What is CI/CD?

- **CI (Continuous Integration):** Automatically runs tests when code is pushed
- **CD (Continuous Deployment):** Automatically deploys code after tests pass

### Our GitHub Actions Workflow

Location: `.github/workflows/ci.yml`

### When Does It Run?

The pipeline automatically runs when:
1. ✅ You push code to `main` or `develop` branches
2. ✅ Someone opens a Pull Request to `main` or `develop`
3. ✅ You manually trigger it (GitHub Actions tab → "Run workflow")

### What Does It Do?

#### Step 1: Setup
- Checks out your code
- Sets up Node.js (versions 18.x and 20.x)
- Installs dependencies

#### Step 2: Build
- Compiles TypeScript to JavaScript
- Verifies the code builds without errors

#### Step 3: Test
- Starts a MongoDB container
- Runs all tests
- Generates coverage reports

#### Step 4: Lint
- Checks TypeScript compilation for all projects
- Verifies frontend and admin build successfully

### Viewing CI/CD Results

1. **Go to your GitHub repository**
2. **Click "Actions" tab** (top navigation)
3. **See workflow runs:**
   - ✅ Green checkmark = All tests passed
   - ❌ Red X = Tests failed
   - 🟡 Yellow circle = In progress

4. **Click on a run** to see details:
   - Which tests passed/failed
   - Build logs
   - Error messages

### Understanding Test Results

**Example successful run:**
```
✓ Build backend
✓ Run backend tests
  ✓ validateEnv tests (3 passed)
  ✓ Products API tests (3 passed)
  ✓ Auth API tests (2 passed)
✓ Build frontend
✓ Build admin
```

**Example failed run:**
```
✓ Build backend
✗ Run backend tests
  ✗ Products API - should return products list
    Error: Expected 200, got 500
    at Object.<anonymous> (products.test.ts:18:25)
```

### Fixing Failed Tests

1. **Click on the failed test** to see the error
2. **Read the error message** - it tells you what went wrong
3. **Fix the issue locally:**
   ```bash
   cd backend
   npm test  # Run tests locally
   ```
4. **Commit and push** the fix
5. **CI will run again** automatically

### CI/CD Best Practices

1. **Always run tests locally before pushing:**
   ```bash
   npm test
   ```

2. **Don't push broken code** - Fix tests before pushing

3. **Write tests for new features** - Add tests when adding functionality

4. **Check CI before merging PRs** - Wait for green checkmark

5. **Read error messages** - CI errors tell you exactly what's wrong

### Environment Variables in CI

The CI pipeline uses these environment variables (set in `.github/workflows/ci.yml`):

```yaml
NODE_ENV: test
MONGODB_URI: mongodb://localhost:27017/pet-ecommerce-test
JWT_SECRET: test-jwt-secret-key-minimum-32-characters-long-for-testing
```

These are automatically set - you don't need to configure them.

---

## 📝 Quick Reference

### Test Commands
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

### API Documentation
```bash
npm run dev           # Start server
# Then visit: http://localhost:5000/api-docs
```

### CI/CD
- Automatically runs on push/PR
- View results in GitHub → Actions tab
- Green = Pass, Red = Fail

---

## 🎯 Next Steps

1. **Run the existing tests** to see them in action
2. **Explore the Swagger UI** to understand API structure
3. **Write a simple test** for a function you use often
4. **Check GitHub Actions** after your next push

Happy testing! 🚀

