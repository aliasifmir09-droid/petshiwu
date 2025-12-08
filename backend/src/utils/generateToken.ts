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
    expiresIn: expiresIn as any,
    algorithm: 'HS256' // Explicitly use HS256 to prevent algorithm confusion
  });
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

  const options = {
    expires: new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000),
    httpOnly: true, // Cookie not accessible via JavaScript (XSS protection)
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict' as const, // CSRF protection - strict prevents cross-site requests
    path: '/',
  };

  // Phase 1: Dual Support - Set httpOnly cookie AND return token in response body
  // This allows gradual migration: frontend can use cookie (preferred) or localStorage (backward compatibility)
  res.status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token // Still return for backward compatibility during migration
    });
};



