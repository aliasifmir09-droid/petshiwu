# 🧪 Testing Guide

**Project:** Pet E-Commerce Platform  
**Last Updated:** December 2024

---

## 📋 Overview

This project uses a comprehensive testing strategy with:
- **Backend:** Jest (Unit & Integration Tests)
- **Frontend:** Vitest (Unit & Component Tests)
- **CI/CD:** GitHub Actions (Automated Testing)

---

## 🎯 Testing Strategy

### Test Types

1. **Unit Tests:** Test individual functions/components in isolation
2. **Integration Tests:** Test API endpoints and database interactions
3. **Component Tests:** Test React components with user interactions
4. **E2E Tests:** (Future) End-to-end testing with Playwright/Cypress

---

## 🔧 Backend Testing (Jest)

### Setup

Backend tests use Jest with TypeScript support.

**Configuration:** `backend/jest.config.js`

### Running Tests

```bash
# Run all tests
cd backend
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- products.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="product"
```

### Test Structure

```
backend/src/__tests__/
├── unit/              # Unit tests
│   └── utils/
│       └── validateEnv.test.ts
├── integration/       # Integration tests
│   ├── auth.test.ts
│   ├── products.test.ts
│   ├── orders.test.ts
│   ├── reviews.test.ts
│   └── ...
└── setup.ts          # Test setup file
```

### Writing Backend Tests

#### Example: Unit Test

```typescript
// backend/src/__tests__/unit/utils/validateEnv.test.ts
import { validateEnv } from '../../../utils/validateEnv';

describe('validateEnv', () => {
  it('should throw error if JWT_SECRET is missing', () => {
    const originalSecret = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    
    expect(() => validateEnv()).toThrow('JWT_SECRET is required');
    
    process.env.JWT_SECRET = originalSecret;
  });
});
```

#### Example: Integration Test

```typescript
// backend/src/__tests__/integration/products.test.ts
import request from 'supertest';
import { app } from '../../server';

describe('GET /api/products', () => {
  it('should return paginated products', async () => {
    const response = await request(app)
      .get('/api/products')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.pagination).toHaveProperty('page');
    expect(response.body.pagination).toHaveProperty('total');
  });
  
  it('should filter products by petType', async () => {
    const response = await request(app)
      .get('/api/products?petType=dog')
      .expect(200);
    
    response.body.data.forEach((product: any) => {
      expect(product.petType).toBe('dog');
    });
  });
});
```

### Test Database

Tests use a separate test database:
- **Database:** `pet-ecommerce-test`
- **Connection:** Configured in test setup
- **Cleanup:** Database is cleared between test suites

### Test Helpers

Located in `backend/src/__tests__/helpers/`:
- `testApp.ts`: Test Express app instance
- `testHelpers.ts`: Utility functions for tests
- `fixIndexes.ts`: Database index helpers

---

## ⚛️ Frontend Testing (Vitest)

### Setup

Frontend tests use Vitest with React Testing Library.

**Configuration:** `frontend/vite.config.ts`

### Running Tests

```bash
# Run all tests
cd frontend
npm test

# Run tests once
npm run test:run

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- productUrl.test.ts
```

### Test Structure

```
frontend/src/
├── utils/
│   └── __tests__/
│       ├── productUrl.test.ts
│       ├── imageUtils.test.ts
│       └── ...
└── services/
    └── __tests__/
        ├── api.test.ts
        └── auth.test.ts
```

### Writing Frontend Tests

#### Example: Utility Test

```typescript
// frontend/src/utils/__tests__/productUrl.test.ts
import { describe, it, expect } from 'vitest';
import { generateProductUrl } from '../productUrl';

describe('generateProductUrl', () => {
  it('should generate correct product URL', () => {
    const product = {
      slug: 'premium-dog-food',
      petType: 'dog'
    };
    
    const url = generateProductUrl(product);
    expect(url).toBe('/products/dog/premium-dog-food');
  });
});
```

#### Example: Component Test

```typescript
// frontend/src/components/__tests__/ProductCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProductCard from '../ProductCard';

describe('ProductCard', () => {
  it('should render product name', () => {
    const product = {
      _id: '1',
      name: 'Test Product',
      basePrice: 29.99,
      images: ['test.jpg']
    };
    
    render(<ProductCard product={product} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });
});
```

---

## 📊 Test Coverage

### Coverage Goals

- **Backend:** 80%+ coverage
- **Frontend:** 70%+ coverage
- **Critical Paths:** 100% coverage

### Viewing Coverage

```bash
# Backend coverage
cd backend
npm run test:coverage
# Open: backend/coverage/index.html

# Frontend coverage
cd frontend
npm run test:coverage
# Open: frontend/coverage/index.html
```

---

## 🚀 CI/CD Testing

### GitHub Actions

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests

**Workflow:** `.github/workflows/ci.yml`

### CI Test Steps

1. Install dependencies
2. Build TypeScript
3. Run backend tests
4. Run frontend tests
5. Upload coverage reports

---

## 📝 Best Practices

### 1. Test Naming

Use descriptive test names:
```typescript
// ✅ Good
it('should return 404 when product does not exist', async () => {
  // ...
});

// ❌ Bad
it('test product', async () => {
  // ...
});
```

### 2. Test Isolation

Each test should be independent:
```typescript
// ✅ Good - Clean up after each test
afterEach(async () => {
  await cleanupTestData();
});
```

### 3. Arrange-Act-Assert Pattern

```typescript
it('should create order', async () => {
  // Arrange
  const orderData = {
    items: [...],
    shippingAddress: {...}
  };
  
  // Act
  const response = await request(app)
    .post('/api/orders')
    .send(orderData);
  
  // Assert
  expect(response.status).toBe(201);
  expect(response.body.data.orderNumber).toBeDefined();
});
```

### 4. Mock External Services

```typescript
// Mock Cloudinary
jest.mock('../utils/cloudinary', () => ({
  uploadImage: jest.fn().mockResolvedValue({
    url: 'https://example.com/image.jpg'
  })
}));
```

### 5. Test Error Cases

```typescript
it('should return 400 for invalid data', async () => {
  const response = await request(app)
    .post('/api/products')
    .send({ invalid: 'data' })
    .expect(400);
  
  expect(response.body.success).toBe(false);
  expect(response.body.errors).toBeDefined();
});
```

---

## 🎯 Test Priorities

### High Priority (Must Test)

1. **Authentication & Authorization**
   - Login/Register
   - JWT token validation
   - Role-based access control

2. **Product Management**
   - Product CRUD operations
   - Stock management
   - Product search/filter

3. **Order Processing**
   - Order creation
   - Payment processing
   - Order status updates

4. **Cart Operations**
   - Add/remove items
   - Stock validation
   - Price calculations

### Medium Priority (Should Test)

1. **Reviews & Ratings**
2. **Wishlist Operations**
3. **User Profile Management**
4. **Search Functionality**

### Low Priority (Nice to Have)

1. **Analytics**
2. **Email Templates**
3. **Admin Dashboard UI**

---

## 🐛 Debugging Tests

### Backend

```bash
# Run with verbose output
npm test -- --verbose

# Run specific test with debugging
npm test -- --testNamePattern="product" --verbose

# Run with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Frontend

```bash
# Run with UI
npm test -- --ui

# Run with verbose output
npm test -- --reporter=verbose
```

---

## 📚 Test Examples

### Complete Integration Test Example

```typescript
import request from 'supertest';
import { app } from '../../server';
import User from '../../models/User';
import Product from '../../models/Product';

describe('Order API', () => {
  let authToken: string;
  let userId: string;
  let productId: string;
  
  beforeAll(async () => {
    // Create test user
    const user = await User.create({
      email: 'test@example.com',
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'User'
    });
    userId = user._id.toString();
    
    // Login to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Test123!'
      });
    authToken = loginRes.body.token;
    
    // Create test product
    const product = await Product.create({
      name: 'Test Product',
      basePrice: 29.99,
      stockQuantity: 10
    });
    productId = product._id.toString();
  });
  
  afterAll(async () => {
    await User.deleteMany({ email: 'test@example.com' });
    await Product.deleteMany({ name: 'Test Product' });
  });
  
  it('should create order', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('Cookie', `token=${authToken}`)
      .send({
        items: [{
          product: productId,
          quantity: 2,
          price: 29.99
        }],
        shippingAddress: {
          firstName: 'Test',
          lastName: 'User',
          address: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'US'
        }
      })
      .expect(201);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.orderNumber).toBeDefined();
  });
});
```

---

## ✅ Test Checklist

Before committing code:

- [ ] All existing tests pass
- [ ] New features have tests
- [ ] Bug fixes have regression tests
- [ ] Test coverage maintained/improved
- [ ] No console.log statements in tests
- [ ] Tests are fast (< 30 seconds total)
- [ ] Tests are independent (no shared state)

---

## 🔗 Resources

- **Jest Documentation:** https://jestjs.io/
- **Vitest Documentation:** https://vitest.dev/
- **React Testing Library:** https://testing-library.com/react
- **Supertest:** https://github.com/visionmedia/supertest

---

**Last Updated:** December 2024

