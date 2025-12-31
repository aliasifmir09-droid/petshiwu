import jwt from 'jsonwebtoken';
import { Response } from 'express';

export const generateToken = (id: string) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured. Please set JWT_SECRET in your environment variables.');
  }
  const expiresIn = process.env.JWT_EXPIRE || '30d';
  // Explicitly specify algorithm to prevent algorithm confusion attacks
  return jwt.sign({ id }, secret, { 
    expiresIn: expiresIn,
    algorithm: 'HS256' // Explicitly use HS256 to prevent algorithm confusion
  } as jwt.SignOptions);
};

// Helper function to detect if request is from admin dashboard
const isAdminRequest = (req: any): boolean => {
  const origin = req.headers?.origin || req.headers?.referer || '';
  const adminUrls = [
    process.env.ADMIN_URL || 'http://localhost:5174',
    'https://pet-shop-2-r3ed.onrender.com',
    'https://dashboard.petshiwu.com',
  ];
  
  // Check if origin matches admin URLs
  return adminUrls.some(url => origin.includes(url) || origin.includes('5174') || origin.includes('dashboard'));
};

export const sendTokenResponse = (userId: string, statusCode: number, res: Response, req?: any) => {
  try {
    const token = generateToken(userId);

  // Calculate expiration from JWT_EXPIRE or default to 30 days
  const expiresIn = process.env.JWT_EXPIRE || '30d';
  let expiresDays = 30;
  if (expiresIn.endsWith('d')) {
    expiresDays = parseInt(expiresIn.replace('d', ''));
  } else if (expiresIn.endsWith('h')) {
    expiresDays = parseInt(expiresIn.replace('h', '')) / 24;
  }

  // SECURITY NOTE: sameSite: 'none' is required for cross-subdomain cookies on Render.com
  // This is necessary because frontend and backend are on different subdomains (e.g., frontend.onrender.com -> backend.onrender.com)
  // Security considerations:
  // - sameSite: 'strict' blocks cookies across different subdomains (would break authentication)
  // - sameSite: 'lax' works for same domain but not for cross-subdomain requests
  // - sameSite: 'none' with secure: true is required for cross-subdomain cookies
  // Risk mitigation: 
  // - secure flag is always true in production (HTTPS only)
  // - httpOnly flag prevents JavaScript access (XSS protection)
  // - Cookies are only sent to whitelisted origins (CORS protection)
  // Alternative: Use same domain for frontend/backend if possible (would allow sameSite: 'lax')
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Get cookie domain from environment or leave undefined (browser will use current domain)
  // For cross-subdomain cookies on Render, we don't set domain (browser handles it)
  // Setting domain explicitly can cause issues, so we let the browser handle it
  const cookieDomain = process.env.COOKIE_DOMAIN || undefined;
  
  const options: {
    expires: Date;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    path: string;
    domain?: string;
  } = {
    expires: new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000),
    httpOnly: true, // Cookie not accessible via JavaScript (XSS protection)
    secure: isProduction, // HTTPS only in production (required for sameSite: 'none')
    sameSite: (isProduction ? 'none' : 'lax') as 'strict' | 'lax' | 'none', // 'none' for cross-subdomain cookies on Render
    path: '/',
  };
  
  // Only set domain if explicitly configured (usually not needed for cross-subdomain)
  if (cookieDomain) {
    options.domain = cookieDomain;
  }

  // Determine cookie name based on request origin
  // Use separate cookies for frontend and admin to prevent cross-contamination
  const isAdmin = req ? isAdminRequest(req) : false;
  const cookieName = isAdmin ? 'admin_token' : 'frontend_token';

    // Phase 2: Cookie-Only - Set httpOnly cookie, token not returned in response body
    // Frontend relies solely on httpOnly cookies (more secure, XSS protection)
    // Use separate cookie names for frontend and admin to prevent cross-contamination
    res.status(statusCode)
      .cookie(cookieName, token, options)
      .json({
        success: true
        // Token not returned - frontend uses httpOnly cookie only
      });
  } catch (error: any) {
    // Re-throw with more context for better error handling
    throw new Error(`Failed to generate token: ${error.message}`);
  }
};



