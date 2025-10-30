# Security Measures

## Overview
This document outlines the comprehensive security measures implemented in the Pet E-Commerce Platform to protect against XSS, NoSQL Injection, and other common web vulnerabilities.

---

## 🛡️ Security Features Implemented

### 1. **XSS (Cross-Site Scripting) Protection**

#### Backend Protection:
- ✅ **XSS-Clean Middleware**: Sanitizes all user inputs to prevent malicious scripts
- ✅ **Content Security Policy (CSP)**: Strict CSP headers via Helmet.js
- ✅ **Input Validation**: All user inputs are validated and sanitized using express-validator
- ✅ **Output Encoding**: Mongoose automatically escapes data

#### Frontend Protection:
- ✅ **React Default Protection**: React automatically escapes all JSX content
- ✅ **No dangerouslySetInnerHTML**: Avoided throughout the application
- ✅ **No innerHTML/outerHTML**: No direct DOM manipulation

### 2. **NoSQL Injection Protection**

#### Implemented Safeguards:
- ✅ **express-mongo-sanitize**: Removes `$` and `.` characters from user input
- ✅ **Mongoose Schema Validation**: Strict type checking and validation
- ✅ **Input Validation**: All MongoDB ObjectIDs validated before queries
- ✅ **No $where Operators**: Avoided dangerous query operators
- ✅ **Parameterized Queries**: All queries use Mongoose methods (no raw queries)

#### Protected Endpoints:
```javascript
// Example: All user inputs are sanitized
query.category = req.query.category; // Sanitized by express-mongo-sanitize
query.petType = req.query.petType;   // Validated by express-validator
```

### 3. **Authentication & Authorization**

#### Security Measures:
- ✅ **JWT Tokens**: Secure authentication with expiration
- ✅ **Password Hashing**: bcrypt with salt rounds (10)
- ✅ **Password Strength**: Minimum 6 characters, requires uppercase, lowercase, and numbers
- ✅ **Role-Based Access Control (RBAC)**: Admin, Staff, Customer roles
- ✅ **Permission-Based Access**: Granular permissions for staff users
- ✅ **Token Expiration**: 30-day expiration for security

#### Password Requirements:
```
- Minimum 6 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
```

### 4. **Rate Limiting**

#### DDoS Protection:
- ✅ **Express Rate Limit**: 100 requests per 10 minutes per IP
- ✅ **Applied to all API routes**: `/api/*`
- ✅ **Custom Error Messages**: User-friendly rate limit messages

```javascript
// Rate Limiter Configuration
windowMs: 10 * 60 * 1000  // 10 minutes
max: 100                   // 100 requests per window
```

### 5. **HTTP Security Headers (Helmet.js)**

#### Implemented Headers:
- ✅ **X-Frame-Options**: Prevents clickjacking
- ✅ **X-Content-Type-Options**: Prevents MIME sniffing
- ✅ **X-XSS-Protection**: Browser XSS filter
- ✅ **Strict-Transport-Security**: Forces HTTPS
- ✅ **Content-Security-Policy**: Controls resource loading
- ✅ **Cross-Origin-Resource-Policy**: Prevents cross-origin attacks

### 6. **Input Validation**

#### Validation Rules:

**Authentication:**
- Email: Valid email format, normalized
- Password: Strength requirements enforced
- Name: Letters only, 2-50 characters
- Phone: Valid phone number format

**Products:**
- Name: 3-200 characters, alphanumeric
- Price: 0-1,000,000, numeric validation
- Brand: 2-100 characters, alphanumeric with hyphens
- Pet Type: Enum validation (dog, cat, bird, fish, small-pet, reptile)

**Orders:**
- Items: Array validation, minimum 1 item
- Quantity: 1-100 per item
- Address: 5-200 characters
- ZIP Code: Valid US ZIP format (12345 or 12345-6789)
- Phone: Valid phone format

**Reviews:**
- Rating: 1-5 stars
- Comment: Maximum 1000 characters
- Product/Order ID: Valid MongoDB ObjectId

### 7. **Data Sanitization**

#### Input Sanitization:
```javascript
// All text inputs are:
- Trimmed (removes whitespace)
- Escaped (HTML entities)
- Validated (regex patterns)
- Type-checked (proper data types)
```

#### NoSQL Injection Prevention:
```javascript
// Characters removed/replaced:
- $ (dollar sign) → replaced with '_'
- . (dot) → replaced with '_'
```

### 8. **CORS (Cross-Origin Resource Sharing)**

#### Configuration:
- ✅ **Whitelist Origins**: Only frontend and admin URLs allowed
- ✅ **Credentials Enabled**: Secure cookie transmission
- ✅ **No Wildcard**: Specific origins only

```javascript
origin: [
  'http://localhost:5173',  // Frontend
  'http://localhost:5174'   // Admin
]
```

### 9. **File Upload Security**

#### Multer Configuration:
- ✅ **File Type Validation**: Only images allowed (jpg, jpeg, png, gif, webp)
- ✅ **File Size Limit**: Maximum 5MB per file
- ✅ **Filename Sanitization**: Unique filenames with timestamp
- ✅ **Storage Location**: Separate uploads directory

### 10. **Error Handling**

#### Security Best Practices:
- ✅ **No Stack Traces in Production**: Detailed errors only in development
- ✅ **Generic Error Messages**: Don't expose internal details
- ✅ **Centralized Error Handler**: Consistent error responses
- ✅ **No Console Logs in Production**: Removed sensitive data logging

---

## 🔒 Security Checklist

### Backend Security:
- [x] XSS protection (xss-clean)
- [x] NoSQL injection protection (express-mongo-sanitize)
- [x] HTTP security headers (Helmet.js)
- [x] Rate limiting (express-rate-limit)
- [x] Input validation (express-validator)
- [x] CORS configuration
- [x] JWT authentication
- [x] Password hashing (bcrypt)
- [x] File upload security (Multer)
- [x] Error handling
- [x] No sensitive data in logs
- [x] Body parser limits (10MB max)
- [x] MongoDB connection security

### Frontend Security:
- [x] No dangerouslySetInnerHTML
- [x] No innerHTML/outerHTML
- [x] React default XSS protection
- [x] Client-side validation
- [x] Secure token storage (localStorage)
- [x] HTTPS enforcement (production)
- [x] No sensitive data in console

### Database Security:
- [x] Mongoose schema validation
- [x] Required field enforcement
- [x] Type validation
- [x] Unique constraints
- [x] Password field hidden by default
- [x] No raw MongoDB queries

---

## 🚨 Security Best Practices

### For Developers:

1. **Never Trust User Input**
   - Always validate on both client and server
   - Sanitize all inputs before processing
   - Use parameterized queries

2. **Keep Dependencies Updated**
   ```bash
   npm audit
   npm audit fix
   ```

3. **Environment Variables**
   - Never commit `.env` files
   - Use strong JWT secrets (minimum 32 characters)
   - Rotate secrets regularly

4. **Password Security**
   - Enforce strong password policies
   - Use bcrypt with adequate salt rounds
   - Never log or display passwords

5. **API Security**
   - Implement rate limiting
   - Use HTTPS in production
   - Validate all ObjectIds
   - Check user permissions

6. **Error Messages**
   - Don't expose stack traces
   - Don't reveal database structure
   - Use generic error messages for failed authentication

---

## 📋 Testing Security

### Manual Testing:

1. **XSS Attempts:**
   ```javascript
   // Try injecting scripts in inputs
   <script>alert('XSS')</script>
   <img src=x onerror=alert('XSS')>
   ```

2. **NoSQL Injection Attempts:**
   ```javascript
   // Try injecting operators
   { "$ne": null }
   { "$gt": "" }
   ```

3. **Authentication:**
   - Test with expired tokens
   - Test with invalid tokens
   - Test role-based access

4. **Rate Limiting:**
   - Send 100+ requests rapidly
   - Verify 429 error response

### Automated Security Scanning:

```bash
# Install security audit tools
npm install -g snyk

# Run security audit
npm audit
snyk test

# Check for vulnerabilities
npm audit fix
```

---

## 🔐 Production Deployment Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS only
- [ ] Set strong JWT_SECRET (32+ characters)
- [ ] Enable MongoDB authentication
- [ ] Use environment variables for all secrets
- [ ] Disable CORS for unauthorized origins
- [ ] Set up monitoring and logging
- [ ] Enable rate limiting
- [ ] Test all security measures
- [ ] Remove all console.log statements
- [ ] Set up automated backups
- [ ] Implement SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Set up DDoS protection

---

## 📞 Reporting Security Issues

If you discover a security vulnerability, please email:
**security@petshiwu.com**

Do not open public issues for security vulnerabilities.

---

## 📚 References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP NoSQL Injection](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/05.6-Testing_for_NoSQL_Injection)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)

---

**Last Updated:** October 28, 2025  
**Version:** 1.0.0

