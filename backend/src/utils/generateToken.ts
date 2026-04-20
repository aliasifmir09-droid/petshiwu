import jwt from 'jsonwebtoken';
import { Response } from 'express';

export const generateToken = (id: string) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured. Please set JWT_SECRET in your environment variables.');
  }
  const expiresIn = process.env.JWT_EXPIRE || '30d';
  return jwt.sign({ id }, secret, { 
    expiresIn: expiresIn,
    algorithm: 'HS256'
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
  return adminUrls.some(url => origin.includes(url) || origin.includes('5174') || origin.includes('dashboard'));
};

export const sendTokenResponse = (userId: string, statusCode: number, res: Response, req?: any) => {
  try {
    const token = generateToken(userId);

    const expiresIn = process.env.JWT_EXPIRE || '30d';
    let expiresDays = 30;
    if (expiresIn.endsWith('d')) {
      expiresDays = parseInt(expiresIn.replace('d', ''));
    } else if (expiresIn.endsWith('h')) {
      expiresDays = parseInt(expiresIn.replace('h', '')) / 24;
    }

    const isProduction = process.env.NODE_ENV === 'production';

    // FIX: Do NOT set cookie domain when frontend and backend are on different domains.
    // Setting COOKIE_DOMAIN to .petshiwu.com causes browsers to REJECT the cookie
    // because the backend is on onrender.com, not petshiwu.com.
    // Solution: Remove domain attribute entirely so cookie is scoped to the backend domain.
    const options: {
      expires: Date;
      httpOnly: boolean;
      secure: boolean;
      sameSite: 'strict' | 'lax' | 'none';
      path: string;
      domain?: string;
    } = {
      expires: new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: isProduction,
      sameSite: (isProduction ? 'none' : 'lax') as 'strict' | 'lax' | 'none',
      path: '/',
      // NOTE: domain intentionally NOT set - fixes cross-domain cookie rejection
    };

    const isAdmin = req ? isAdminRequest(req) : false;
    const cookieName = isAdmin ? 'admin_token' : 'frontend_token';

    // FIX: Also return token in response body so frontend can store it
    // This handles cases where cookies are blocked cross-domain (e.g. petshiwu.com -> onrender.com)
    res.status(statusCode)
      .cookie(cookieName, token, options)
      .json({
        success: true,
        token: token, // FIX: Return token in body so frontend can use it as fallback
        expiresIn: expiresDays * 24 * 60 * 60 // seconds
      });
  } catch (error: any) {
    throw new Error(`Failed to generate token: ${error.message}`);
  }
};
