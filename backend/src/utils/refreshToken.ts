/**
 * Refresh Token Utility
 * 
 * NOTE: This is a placeholder for future refresh token implementation.
 * Currently, the application uses stateless JWT tokens with long expiration (30 days).
 * 
 * Future Enhancement: Implement refresh token pattern for better security:
 * - Short-lived access tokens (15 minutes)
 * - Long-lived refresh tokens (7-30 days)
 * - Refresh tokens stored in database for revocation capability
 * - Automatic token refresh on frontend
 * 
 * Benefits:
 * - Ability to revoke tokens immediately (logout, security breach)
 * - Shorter access token lifetime reduces risk if token is compromised
 * - Better security for sensitive operations
 * 
 * Implementation Plan:
 * 1. Add refreshToken field to User model
 * 2. Create generateRefreshToken() function
 * 3. Create verifyRefreshToken() function
 * 4. Add /api/v1/auth/refresh endpoint
 * 5. Update frontend to handle token refresh
 * 6. Add token revocation endpoint
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * Generate a refresh token
 * Refresh tokens are longer-lived and stored in database for revocation
 * 
 * @param userId - User ID
 * @returns Refresh token string
 */
export const generateRefreshToken = (userId: string): string => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET or JWT_SECRET is not configured');
  }
  
  // Refresh tokens last longer (7-30 days)
  const expiresIn = process.env.JWT_REFRESH_EXPIRE || '30d';
  
  return jwt.sign(
    { id: userId, type: 'refresh' },
    secret,
    {
      expiresIn: expiresIn,
      algorithm: 'HS256'
    } as jwt.SignOptions
  );
};

/**
 * Verify a refresh token
 * 
 * @param token - Refresh token to verify
 * @returns Decoded token payload or null if invalid
 */
export const verifyRefreshToken = (token: string): { id: string; type: string } | null => {
  try {
    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    if (!secret) {
      return null;
    }
    
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as { id: string; type: string };
    
    // Verify it's a refresh token
    if (decoded.type !== 'refresh') {
      return null;
    }
    
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Generate a cryptographically secure random token for database storage
 * This is hashed before storing in database
 * 
 * @returns Random token string
 */
export const generateSecureToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash a token for database storage
 * 
 * @param token - Token to hash
 * @returns Hashed token
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * ✅ COMPLETED: Refresh token storage in User model
 * - ✅ Added refreshToken field (hashed) to User model
 * - ✅ Added refreshTokenExpires field to User model
 * - ✅ Added setRefreshToken() method to store hashed token
 * - ✅ Added revokeRefreshToken() method to revoke tokens
 * - ✅ Added isRefreshTokenValid() method to validate tokens
 * 
 * Usage:
 * - Call user.setRefreshToken(token, expiresAt) to store a refresh token
 * - Call user.revokeRefreshToken() to revoke the current refresh token
 * - Call user.isRefreshTokenValid(token) to validate a refresh token
 */

