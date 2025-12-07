import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { sendTokenResponse } from '../utils/generateToken';
import { AuthRequest } from '../middleware/auth';
import { sendVerificationEmail } from '../utils/emailService';
import crypto from 'crypto';
import logger from '../utils/logger';
import { safeToString } from '../utils/types';

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
    } catch (emailError: any) {
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

    const user = await User.findOne({ email }).select('+password');

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
    // For backward compatibility: auto-verify existing users who don't have emailVerified set
    if (user.role === 'customer') {
      // If emailVerified is undefined/null (existing users before email verification was added), auto-verify them
      if (user.emailVerified === undefined || user.emailVerified === null) {
        user.emailVerified = true;
        await user.save({ validateBeforeSave: false });
      } else if (user.emailVerified === false) {
        // Only block login if emailVerified is explicitly false
        return res.status(403).json({
          success: false,
          message: 'Please verify your email address before logging in. Check your email for the verification link.',
          requiresVerification: true
        });
      }
    }

    sendTokenResponse(safeToString(user._id), 200, res);
  } catch (error: any) {
    next(error);
  }
};

// Get current user
export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Include password expiry info for admin and staff
    const responseData: any = user.toObject();
    if (user.role === 'admin' || user.role === 'staff') {
      responseData.passwordExpired = user.isPasswordExpired();
      responseData.daysUntilPasswordExpires = user.getDaysUntilPasswordExpires();
    }

    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
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
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};



