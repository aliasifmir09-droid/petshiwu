import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  updatePassword,
  logout,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  verifyResetToken
} from '../controllers/authController';
import { protect, optionalAuth } from '../middleware/auth';
import {
  registerValidation,
  loginValidation,
  updatePasswordValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyEmailValidation,
  resendVerificationValidation,
  verifyResetTokenValidation,
  updateProfileValidation
} from '../middleware/validation';

const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/logout', logout);
router.get('/verify-email', verifyEmailValidation, verifyEmail);
router.post('/resend-verification', resendVerificationValidation, resendVerificationEmail);
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);
router.get('/verify-reset-token', verifyResetTokenValidation, verifyResetToken);
router.post('/reset-password', resetPasswordValidation, resetPassword);
router.get('/me', optionalAuth, getMe);
router.put('/updateprofile', protect, updateProfileValidation, updateProfile);
router.put('/updatepassword', protect, updatePasswordValidation, updatePassword);

export default router;



