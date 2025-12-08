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

export const sendTokenResponse = (userId: string, statusCode: number, res: Response) => {
  const token = generateToken(userId);

  // Calculate expiration from JWT_EXPIRE or default to 30 days
  const expiresIn = process.env.JWT_EXPIRE || '30d';
  let expiresDays = 30;
  if (expiresIn.endsWith('d')) {
    expiresDays = parseInt(expiresIn.replace('d', ''));
  } else if (expiresIn.endsWith('h')) {
    expiresDays = parseInt(expiresIn.replace('h', '')) / 24;
  }

  // For cross-subdomain cookies (e.g., different Render subdomains), we need sameSite: 'none' with secure: true
  // sameSite: 'strict' blocks cookies across different subdomains (e.g., frontend.onrender.com -> backend.onrender.com)
  // sameSite: 'lax' works for same domain but not for cross-site
  // sameSite: 'none' with secure: true is required for cross-site cookies (different subdomains on Render)
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

  // Phase 2: Cookie-Only - Set httpOnly cookie, token not returned in response body
  // Frontend relies solely on httpOnly cookies (more secure, XSS protection)
  res.status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true
      // Token not returned - frontend uses httpOnly cookie only
    });
};



