import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { sendTokenResponse } from '../utils/generateToken';
import { AuthRequest } from '../middleware/auth';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/emailService';
import crypto from 'crypto';
import logger from '../utils/logger';
import { safeToString } from '../utils/types';
import { PASSWORD_RESET_EXPIRY_HOURS } from '../config/constants';

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: User already exists or validation error
 */
// Register user
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      emailVerified: false // New users need to verify email
    });

    // Generate verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    try {
      // Send verification email
      await sendVerificationEmail(user.email, verificationToken, user.firstName);
      
      res.status(201).json({
        success: true,
        message: 'Registration successful! Please check your email to verify your account.',
        data: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          emailVerified: user.emailVerified
        }
      });
    } catch (emailError: unknown) {
      // If email sending fails, still create user but log error
      logger.error('Error sending verification email:', emailError);
      // Don't fail registration if email fails - user can request resend
      res.status(201).json({
        success: true,
        message: 'Registration successful! However, we could not send the verification email. Please use the resend verification email feature.',
        data: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          emailVerified: user.emailVerified
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials or email not verified
 */
// Login user
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email }).select('+password +emailVerificationToken +emailVerificationExpires');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if email is verified (only for customers, admin/staff are auto-verified)
    // For backward compatibility: auto-verify existing users who don't have emailVerificationToken
    // (users created before email verification was required)
    if (user.role === 'customer') {
      // Check if verification token exists and is not expired
      const hasValidToken = user.emailVerificationToken && 
                            user.emailVerificationExpires && 
                            new Date(user.emailVerificationExpires) > new Date();
      
      // If user doesn't have a valid verification token, they're an existing user - auto-verify them
      if (!hasValidToken) {
        // Existing user created before email verification or token expired - auto-verify
        if (user.emailVerified === undefined || user.emailVerified === null || !user.emailVerified) {
          user.emailVerified = true;
          // Clear any expired tokens
          user.emailVerificationToken = undefined;
          user.emailVerificationExpires = undefined;
          await user.save({ validateBeforeSave: false });
        }
      } else if (user.emailVerified === false) {
        // New user who has a valid verification token but hasn't verified yet - require verification
        return res.status(403).json({
          success: false,
          message: 'Please verify your email address before logging in. Check your email for the verification link.',
          requiresVerification: true
        });
      }
    }

    sendTokenResponse(safeToString(user._id), 200, res);
  } catch (error: unknown) {
    logger.error('Login error:', error);
    next(error);
  }
};

// Get current user
// Uses optionalAuth middleware - returns user if authenticated, null if not
// Never returns 401 - always returns 200 with data or null
export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // If no user (not authenticated), return success with null data
    if (!req.user) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'User not authenticated'
      });
    }

    // User is authenticated - fetch fresh user data
    const user = await User.findById(req.user._id);

    if (!user) {
      // User was in token but not found in DB - return null
      return res.status(200).json({
        success: true,
        data: null,
        message: 'User not found'
      });
    }

    // Include password expiry info for admin and staff
    const responseData = user.toObject() as unknown as Record<string, unknown>;
    if (user.role === 'admin' || user.role === 'staff') {
      try {
        responseData.passwordExpired = user.isPasswordExpired();
        responseData.daysUntilPasswordExpires = user.getDaysUntilPasswordExpires();
      } catch (methodError: any) {
        // If password expiry methods fail, set defaults
        logger.warn('Error calling password expiry methods:', methodError);
        responseData.passwordExpired = false;
        responseData.daysUntilPasswordExpires = 30;
      }
    }

    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error: unknown) {
    logger.error('getMe error:', error);
    next(error);
  }
};

// Update user profile
export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const fieldsToUpdate = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone
    };

    const user = await User.findByIdAndUpdate(req.user?._id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Update password
export const updatePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isPasswordMatch = await user.comparePassword(currentPassword);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(safeToString(user._id), 200, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify user email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
// Verify email
export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with this token and check if it's not expired
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() }
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Verify the email
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now log in.'
    });
  } catch (error) {
    next(error);
  }
};

// Resend verification email
export const resendVerificationEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      // Don't reveal if user exists or not (security best practice)
      return res.status(200).json({
        success: true,
        message: 'If an account with this email exists and is not verified, a verification email has been sent.'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate new verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    try {
      await sendVerificationEmail(user.email, verificationToken, user.firstName);
      res.status(200).json({
        success: true,
        message: 'Verification email sent successfully. Please check your email.'
      });
    } catch (emailError: any) {
      logger.error('Error sending verification email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Error sending verification email. Please try again later.'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Logout user
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Clear httpOnly cookie with same settings as when it was set
    // Must match the cookie settings from generateToken.ts exactly
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieDomain = process.env.COOKIE_DOMAIN || undefined;
    
    // Clear the cookie by setting it to expire in the past
    // Use same options as login to ensure proper clearing
    const clearOptions: {
      expires: Date;
      httpOnly: boolean;
      secure: boolean;
      sameSite: 'strict' | 'lax' | 'none';
      path: string;
      domain?: string;
    } = {
      expires: new Date(0), // Expire immediately (past date)
      httpOnly: true,
      secure: isProduction, // Must match login cookie settings
      sameSite: (isProduction ? 'none' : 'lax') as 'strict' | 'lax' | 'none', // Must match login cookie settings
      path: '/',
    };
    
    // Only set domain if it was set during login
    if (cookieDomain) {
      clearOptions.domain = cookieDomain;
    }
    
    res.cookie('token', '', clearOptions);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent (if user exists)
 *       400:
 *         description: Email is required
 */
// Forgot password - send reset email
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    logger.info(`Password reset requested for email: ${email}`);

    // Find user by email
    const user = await User.findOne({ email }).select('+passwordResetToken +passwordResetExpires');

    // Don't reveal if user exists or not (security best practice)
    // Always return success message
    if (!user) {
      logger.info(`User not found for email: ${email}`);
      return res.status(200).json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.'
      });
    }

    logger.info(`User found, generating reset token for: ${email}`);

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    logger.info(`Reset token generated, attempting to send email to: ${email}`);

    // Send email asynchronously (don't wait for it to complete)
    // This improves response time - email will be sent in background
    sendPasswordResetEmail(user.email, resetToken, user.firstName)
      .then(() => {
        logger.info(`✅ Password reset email sent successfully to ${email}`);
      })
      .catch((emailError: unknown) => {
        const errorMessage = emailError instanceof Error ? emailError.message : String(emailError);
        logger.error(`❌ Error sending password reset email to ${email}:`, errorMessage);
        // Don't fail the request if email fails - user can request again
      });

    // Return success immediately (email is being sent in background)
    return res.status(200).json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.'
    });
  } catch (error: unknown) {
    const errorObj = error instanceof Error ? error : { message: String(error), stack: undefined, name: 'Error' };
    logger.error('Unexpected error in forgotPassword:', {
      message: errorObj.message,
      stack: errorObj.stack,
      name: errorObj.name
    });
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired token, or validation error
 */
// Reset password with token
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required'
      });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with this token and check if it's not expired
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() }
    }).select('+passwordResetToken +passwordResetExpires +password +email');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token. Please request a new password reset link.'
      });
    }

    // SECURITY: Check if a different user is logged in
    // If someone is logged in, verify they're the same user requesting the reset
    const authReq = req as AuthRequest;
    if (authReq.user && authReq.user._id) {
      const loggedInUserId = safeToString(authReq.user._id);
      const resetUserId = safeToString(user._id);
      
      if (loggedInUserId !== resetUserId) {
        logger.warn(`Security: User ${loggedInUserId} (${authReq.user.email}) attempted to reset password for user ${resetUserId} (${user.email})`);
        return res.status(403).json({
          success: false,
          message: `You cannot reset another user's password. You are logged in as ${authReq.user.email}, but this reset link is for ${user.email}. Please log out first or use the correct reset link for your account.`
        });
      }
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Set new password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = new Date();
    await user.save();

    logger.info(`Password reset successful for user: ${user.email} (ID: ${user._id})`);

    // Send token response (auto-login after reset)
    sendTokenResponse(safeToString(user._id), 200, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/verify-reset-token:
 *   get:
 *     summary: Verify password reset token and get user email
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Token is valid, returns user email
 *       400:
 *         description: Invalid or expired token
 */
export const verifyResetToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with this token and check if it's not expired
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() }
    }).select('email firstName');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token'
      });
    }

    res.status(200).json({
      success: true,
      email: user.email,
      firstName: user.firstName
    });
  } catch (error: any) {
    logger.error('Error verifying reset token:', error);
    next(error);
  }
};

