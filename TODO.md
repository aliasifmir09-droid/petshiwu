# TODO / Technical Debt

This file tracks TODO comments and technical debt items found in the codebase.

## High Priority

### 1. PayPal Refund Implementation ✅ **FRAMEWORK COMPLETED**
- **Location:** `backend/src/controllers/orderController.ts:1201`
- **Status:** ✅ **FRAMEWORK COMPLETED**
- **Description:** PayPal refund framework implemented with placeholder for SDK integration
- **Implementation:** 
  - ✅ Refund request logging and tracking
  - ✅ Refund status management
  - ✅ Error handling structure
  - ⚠️ **Note:** PayPal SDK integration pending (structure ready for SDK integration)
- **Current State:** Framework ready, requires PayPal SDK installation and configuration
- **Priority:** Medium (feature enhancement)

## Medium Priority

### 2. Redis Store for Rate Limiting ✅ **COMPLETED**
- **Location:** `backend/src/server.ts:220`
- **Status:** ✅ **COMPLETED**
- **Description:** Custom Redis store implemented for distributed rate limiting
- **Implementation:** Created `backend/src/utils/redisRateLimitStore.ts` with custom Store implementation
- **Result:** Rate limiting now supports multi-instance deployments with Redis

### 3. Refresh Token Storage ✅ **COMPLETED**
- **Location:** `backend/src/utils/refreshToken.ts:103`
- **Status:** ✅ **COMPLETED**
- **Description:** Refresh token storage fully implemented in User model
- **Implementation:**
  - ✅ Added `refreshToken` field (hashed) to User schema
  - ✅ Added `refreshTokenExpires` field to User schema
  - ✅ Added `setRefreshToken()` method to store hashed tokens
  - ✅ Added `revokeRefreshToken()` method to revoke tokens
  - ✅ Added `isRefreshTokenValid()` method to validate tokens
- **Result:** Full refresh token management system ready for use
- **Priority:** Medium (security enhancement)

## Low Priority / Optimization

### 4. Category Query Optimization ✅ **COMPLETED**
- **Location:** `backend/src/controllers/productController.ts:1659`
- **Status:** ✅ **COMPLETED**
- **Description:** Category population optimized to fetch all categories in one query and build hierarchy in memory
- **Implementation:** Frontend requests now fetch all categories in one query, build hierarchy in memory (eliminates N+1 queries)
- **Result:** No N+1 queries, fully optimized category population

---

## Notes

- All TODOs are tracked here for visibility
- Priority levels: High, Medium, Low
- Status: Pending, In Progress, Completed
- Consider moving high-priority items to issue tracker

