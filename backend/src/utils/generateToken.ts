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

  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const
  };

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token
  });
};



