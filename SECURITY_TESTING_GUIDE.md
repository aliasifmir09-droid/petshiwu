# 🧪 Security Testing Guide

This guide provides step-by-step instructions to test the security fixes implemented for XSS protection and HTTPS enforcement.

---

## Prerequisites

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Login as a customer:**
   - Email: `customer@example.com`
   - Password: `password123`

3. **Have at least one delivered order** (to submit reviews)

---

## Test 1: XSS Protection in Review Comments ✅

### Objective
Verify that HTML and script tags in review comments are sanitized and cannot execute.

### Steps

1. **Navigate to an order detail page** with a delivered order
2. **Click "Write a Review"** for a product
3. **Submit a review with malicious content:**

   **Test Case 1.1: Script Tag**
   ```
   Comment: <script>alert('XSS Attack!')</script>This is a test review
   ```
   
   **Expected Result:**
   - ✅ Script tag should be removed
   - ✅ Only "This is a test review" should be displayed
   - ✅ No alert popup should appear
   - ✅ Check browser console - no errors

   **Test Case 1.2: Image with onerror**
   ```
   Comment: <img src=x onerror="alert('XSS')">Nice product!
   ```
   
   **Expected Result:**
   - ✅ Image tag should be removed
   - ✅ Only "Nice product!" should be displayed
   - ✅ No alert popup

   **Test Case 1.3: SVG with onload**
   ```
   Comment: <svg onload="alert('XSS')">Great quality
   ```
   
   **Expected Result:**
   - ✅ SVG tag should be removed
   - ✅ Only "Great quality" should be displayed

   **Test Case 1.4: Safe HTML (should be allowed)**
   ```
   Comment: <p>This is <strong>bold</strong> text</p>
   ```
   
   **Expected Result:**
   - ✅ Safe HTML tags (p, strong, em, u, ul, ol, li) should be preserved
   - ✅ Text should render with formatting

### Verification

After submitting each review:
1. **Check the review display** on the product detail page
2. **Inspect the HTML** (Right-click → Inspect Element)
3. **Verify:**
   - No `<script>` tags in the DOM
   - No `onerror`, `onload`, or other event handlers
   - Malicious content is stripped, safe content remains

---

## Test 2: XSS Protection in Review Titles ✅

### Steps

1. **Submit a review with malicious title:**

   **Test Case 2.1: Script in Title**
   ```
   Title: <script>alert('XSS')</script>Great Product
   ```
   
   **Expected Result:**
   - ✅ Script tag removed
   - ✅ Only "Great Product" displayed

   **Test Case 2.2: HTML in Title**
   ```
   Title: <h1>My Review</h1>
   ```
   
   **Expected Result:**
   - ✅ HTML tags removed
   - ✅ Only "My Review" displayed

### Verification

Check the review title on the product page - should be plain text only.

---

## Test 3: XSS Protection in User Names ✅

### Steps

1. **Update your profile** with malicious content (if possible)
2. **Or check existing reviews** - user names should be sanitized

### Verification

User names in reviews should never contain HTML tags.

---

## Test 4: Product Description Sanitization ✅

### Objective
Verify that product descriptions with HTML are sanitized.

### Steps

1. **Login as Admin:**
   - Email: `admin@petshiwu.com`
   - Password: `admin123`

2. **Navigate to Products → Edit a product**

3. **Update product description with malicious content:**

   **Test Case 4.1: Script Tag**
   ```
   Description: 
   This is a great product.
   <script>alert('XSS')</script>
   Buy now!
   ```
   
   **Expected Result:**
   - ✅ Script tag removed
   - ✅ Only text content displayed
   - ✅ No alert popup

   **Test Case 4.2: HTML Tags**
   ```
   Description:
   <div>Content</div>
   <img src=x onerror="alert(1)">
   ```
   
   **Expected Result:**
   - ✅ All HTML tags removed
   - ✅ Only text content displayed

4. **Save the product**

5. **View the product** on the customer website

### Verification

- Product description should display as plain text
- No HTML tags should be rendered
- Markdown-style `**bold**` formatting should still work

---

## Test 5: HTTPS-Only Images in Production ✅

### Objective
Verify that HTTP image URLs are rejected in production mode.

### Prerequisites

**Set production mode:**
```bash
# In frontend/.env or set environment variable
NODE_ENV=production
# or
VITE_MODE=production
```

### Steps

1. **Login as Admin**

2. **Try to add a product with HTTP image URL:**

   **Test Case 5.1: HTTP Image URL**
   ```
   Image URL: http://example.com/image.jpg
   ```
   
   **Expected Result (Production):**
   - ✅ HTTP URL should be rejected
   - ✅ Placeholder image should be used instead
   - ✅ Console warning: "HTTP image URL rejected in production"

   **Test Case 5.2: HTTPS Image URL**
   ```
   Image URL: https://example.com/image.jpg
   ```
   
   **Expected Result:**
   - ✅ HTTPS URL should be accepted
   - ✅ Image should load normally

3. **Test in Development Mode:**
   - Set `NODE_ENV=development`
   - HTTP URLs should work (for local testing)

### Verification

**Check Browser Console:**
- Production: Should see warning for HTTP URLs
- Development: HTTP URLs should work without warnings

**Check Network Tab:**
- Production: HTTP image requests should not be made
- HTTPS requests should work normally

---

## Test 6: CSP Headers (Backend) ✅

### Objective
Verify Content Security Policy headers prevent HTTP images in production.

### Steps

1. **Start backend in production mode:**
   ```bash
   cd backend
   NODE_ENV=production npm start
   ```

2. **Check response headers:**
   ```bash
   curl -I http://localhost:5000/api/health
   ```

3. **Look for `Content-Security-Policy` header**

### Expected Result

**Production CSP:**
```
img-src 'self' data: https: https://res.cloudinary.com
```

**Development CSP:**
```
img-src 'self' data: https: http: https://res.cloudinary.com
```

### Verification

- Production CSP should NOT include `http:`
- Development CSP should include `http:` for local testing

---

## Automated Tests

Run the automated test suite:

```bash
# Frontend tests (if Jest is configured)
cd frontend
npm test

# Or run specific security tests
npm test -- security.test.ts
npm test -- imageUtils.test.ts
```

---

## Test Results Checklist

After completing all tests, verify:

- [ ] ✅ Review comments with `<script>` tags are sanitized
- [ ] ✅ Review comments with `<img onerror>` are sanitized
- [ ] ✅ Review titles with HTML are sanitized
- [ ] ✅ User names are sanitized
- [ ] ✅ Product descriptions with HTML are sanitized
- [ ] ✅ HTTP images rejected in production mode
- [ ] ✅ HTTPS images work in production mode
- [ ] ✅ HTTP images work in development mode
- [ ] ✅ CSP headers configured correctly
- [ ] ✅ No JavaScript alerts/errors in browser console
- [ ] ✅ No XSS attacks successful

---

## Common Issues & Troubleshooting

### Issue: Scripts still executing
**Solution:** 
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Verify DOMPurify is installed: `npm list dompurify`

### Issue: HTTP images not being rejected
**Solution:**
- Verify `NODE_ENV=production` is set
- Check browser console for warnings
- Verify `import.meta.env.PROD` is true

### Issue: Tests failing
**Solution:**
- Ensure DOMPurify is installed: `npm install`
- Check test environment setup
- Verify TypeScript compilation

---

## Security Verification Commands

### Quick Security Check
```bash
# Check if DOMPurify is installed
cd frontend
npm list dompurify

# Check for XSS vulnerabilities in code
grep -r "dangerouslySetInnerHTML" frontend/src
grep -r "innerHTML" frontend/src
```

### Expected Results:
- ✅ DOMPurify should be listed
- ✅ No `dangerouslySetInnerHTML` found (except with DOMPurify)
- ✅ No direct `innerHTML` assignments

---

## Reporting Issues

If you find any security vulnerabilities:

1. **Document the issue:**
   - What you tested
   - What happened
   - What should have happened

2. **Check the code:**
   - Verify DOMPurify is being used
   - Check environment variables
   - Review browser console errors

3. **Report:**
   - Create an issue with detailed steps
   - Include browser console logs
   - Include network requests (if relevant)

---

**Last Updated:** December 2024  
**Security Status:** ✅ All Critical Fixes Implemented

