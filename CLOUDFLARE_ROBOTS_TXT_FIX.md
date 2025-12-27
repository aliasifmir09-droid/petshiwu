# Fix robots.txt "Content-signal" Error

## Problem

Google Search Console reports:
```
robots.txt is not valid 1 error found
Line 29: Content-signal: search=yes,ai-train=no
Unknown directive
```

## Root Cause

The `Content-signal` directive is **not** in your source code. It's being automatically added by **Cloudflare's "Managed robots.txt" feature**.

This is a Cloudflare-specific extension that's not part of the standard robots.txt specification, which is why Google Search Console flags it as an error.

## Solution

### Option 1: Disable Cloudflare's Managed robots.txt (Recommended)

1. Log in to your Cloudflare dashboard
2. Go to your domain (petshiwu.com)
3. Navigate to **Security** → **Bots**
4. Find **"Managed robots.txt"** feature
5. **Disable** it
6. Save changes

This will prevent Cloudflare from automatically injecting the `Content-signal` directive.

### Option 2: Use Meta Tags Instead (Alternative)

If you want to control AI training without the robots.txt directive, add meta tags to your HTML:

**In `frontend/index.html` or via SEO component:**
```html
<meta name="robots" content="noai, noimageai">
```

Or via HTTP headers (in your hosting/CDN configuration):
```
X-Robots-Tag: noai, noimageai
```

## Verification

After disabling Cloudflare's Managed robots.txt:
1. Wait a few minutes for changes to propagate
2. Visit `https://www.petshiwu.com/robots.txt` in your browser
3. Verify the `Content-signal` line is no longer present
4. Re-test in Google Search Console

## Current robots.txt Status

✅ Your `frontend/public/robots.txt` file is **correct** and uses only standard directives:
- User-agent
- Allow
- Disallow
- Sitemap
- Crawl-delay

The error is caused by Cloudflare's automatic injection, not your source code.

