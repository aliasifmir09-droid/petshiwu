import jwt from 'jsonwebtoken';
import { Response } from 'express';

export const generateToken = (id: string) => {
  const secret: string = process.env.JWT_SECRET || 'fallback-secret-key';
  const expiresIn = process.env.JWT_EXPIRE || '30d';
  return jwt.sign({ id }, secret, { expiresIn: expiresIn as any });
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



