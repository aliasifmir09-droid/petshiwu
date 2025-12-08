# JWT Token Storage Migration Plan

## Current Implementation

**Status:** ⚠️ Tokens stored in `localStorage` (XSS vulnerability)

**Location:** `frontend/src/stores/authStore.ts`

**Current Code:**
```typescript
logout: () => {
  localStorage.removeItem('token');
  set({ user: null, isAuthenticated: false });
}
```

## Security Risk

- **XSS Vulnerability:** If malicious JavaScript runs, it can access `localStorage` and steal tokens
- **No httpOnly Protection:** Tokens accessible via JavaScript
- **Session Hijacking:** Stolen tokens can be used to impersonate users

## Recommended Solution: httpOnly Cookies

### Benefits
- ✅ Tokens not accessible via JavaScript (XSS protection)
- ✅ Automatic cookie handling by browser
- ✅ Can use SameSite attribute for CSRF protection
- ✅ More secure than localStorage

### Migration Steps

#### 1. Backend Changes

**Update `backend/src/utils/generateToken.ts`:**

```typescript
// Instead of returning token in response body, set httpOnly cookie
export const sendTokenResponse = (userId: string, statusCode: number, res: Response) => {
  const token = generateToken(userId);
  
  const options = {
    expires: new Date(Date.now() + process.env.JWT_EXPIRE ? parseInt(process.env.JWT_EXPIRE) * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000),
    httpOnly: true, // Cookie not accessible via JavaScript
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict' as const, // CSRF protection
    path: '/',
  };

  res.status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token, // Still return for backward compatibility during migration
      data: { userId }
    });
};
```

**Update `backend/src/middleware/auth.ts`:**

```typescript
// Extract token from cookie instead of header
const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
```

**Update CORS configuration:**

```typescript
app.use(cors({
  origin: (origin, callback) => { /* ... */ },
  credentials: true, // Already set - required for cookies
  // ...
}));
```

#### 2. Frontend Changes

**Update `frontend/src/stores/authStore.ts`:**

```typescript
// Remove localStorage usage
// Tokens will be automatically sent with requests via cookies

logout: async () => {
  try {
    // Call logout endpoint to clear cookie
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  }
  set({ user: null, isAuthenticated: false });
  window.location.href = '/';
}
```

**Update API service (`frontend/src/services/api.ts`):**

```typescript
// Ensure credentials are sent with requests
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});
```

**Remove token from request headers:**

```typescript
// Remove manual token setting - cookies are sent automatically
// api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

#### 3. Backend Logout Endpoint

**Update `backend/src/controllers/authController.ts`:**

```typescript
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // Expire immediately
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};
```

## Migration Strategy

### Phase 1: Dual Support (Recommended)
1. Backend accepts tokens from both cookies AND Authorization header
2. Backend sets httpOnly cookie on login/register
3. Frontend continues using localStorage during transition
4. Test thoroughly

### Phase 2: Cookie-Only
1. Remove Authorization header support
2. Remove localStorage token storage
3. Update all frontend code to use cookie-based auth
4. Test and deploy

### Phase 3: Cleanup
1. Remove token from response body (optional)
2. Remove localStorage cleanup code
3. Update documentation

## Testing Checklist

- [ ] Login sets httpOnly cookie
- [ ] Cookie sent with API requests automatically
- [ ] Logout clears cookie
- [ ] Token refresh works (if implemented)
- [ ] CORS allows credentials
- [ ] SameSite prevents CSRF
- [ ] Secure flag set in production
- [ ] Works across subdomains (if needed)

## Security Improvements

1. **XSS Protection:** Tokens not accessible via JavaScript
2. **CSRF Protection:** SameSite='strict' prevents cross-site requests
3. **Secure Transport:** Secure flag ensures HTTPS-only in production
4. **Automatic Expiration:** Cookie expiration matches token expiration

## Rollback Plan

If issues arise:
1. Revert backend to accept Authorization header
2. Revert frontend to use localStorage
3. Remove cookie setting code
4. Test and redeploy

## Timeline Estimate

- **Phase 1 (Dual Support):** 2-3 days
- **Phase 2 (Cookie-Only):** 1-2 days
- **Phase 3 (Cleanup):** 1 day
- **Total:** 4-6 days

## Notes

- Current XSS protections (React, input sanitization) reduce risk
- Migration can be done gradually
- Test in staging environment first
- Monitor for authentication issues after deployment

