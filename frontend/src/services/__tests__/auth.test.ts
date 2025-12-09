/**
 * Auth Service Tests
 * Tests authentication service methods
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { authService } from '../auth';
import api from '../api';

// Mock the API module
vi.mock('../api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn()
  }
}));

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    test('should call API with correct data', async () => {
      const mockResponse = { data: { success: true } };
      (api.post as any).mockResolvedValue(mockResponse);

      const registerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123',
        phone: '+1234567890'
      };

      const result = await authService.register(registerData);

      expect(api.post).toHaveBeenCalledWith('/auth/register', registerData);
      expect(result).toEqual(mockResponse.data);
    });

    test('should handle registration without phone', async () => {
      const mockResponse = { data: { success: true } };
      (api.post as any).mockResolvedValue(mockResponse);

      const registerData = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: 'Password123'
      };

      await authService.register(registerData);

      expect(api.post).toHaveBeenCalledWith('/auth/register', registerData);
    });
  });

  describe('login', () => {
    test('should call API with email and password', async () => {
      const mockResponse = { data: { success: true } };
      (api.post as any).mockResolvedValue(mockResponse);

      const loginData = {
        email: 'user@example.com',
        password: 'Password123'
      };

      const result = await authService.login(loginData);

      expect(api.post).toHaveBeenCalledWith('/auth/login', loginData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('logout', () => {
    test('should call logout endpoint', async () => {
      const mockResponse = { data: { success: true } };
      (api.post as any).mockResolvedValue(mockResponse);

      await authService.logout();

      expect(api.post).toHaveBeenCalledWith('/auth/logout');
    });
  });

  describe('getMe', () => {
    test('should fetch current user', async () => {
      const mockUser = { _id: '123', email: 'user@example.com' };
      const mockResponse = { data: { data: mockUser } };
      (api.get as any).mockResolvedValue(mockResponse);

      const result = await authService.getMe();

      expect(api.get).toHaveBeenCalledWith('/auth/me', { skipAuth: false });
      expect(result).toEqual(mockUser);
    });

    test('should support skipAuth flag', async () => {
      const mockResponse = { data: { data: null } };
      (api.get as any).mockResolvedValue(mockResponse);

      await authService.getMe(true);

      expect(api.get).toHaveBeenCalledWith('/auth/me', { skipAuth: true });
    });
  });

  describe('updateProfile', () => {
    test('should update user profile', async () => {
      const updatedUser = { _id: '123', firstName: 'Updated' };
      const mockResponse = { data: { data: updatedUser } };
      (api.put as any).mockResolvedValue(mockResponse);

      const updateData = { firstName: 'Updated' };
      const result = await authService.updateProfile(updateData);

      expect(api.put).toHaveBeenCalledWith('/auth/updateprofile', updateData);
      expect(result).toEqual(updatedUser);
    });
  });

  describe('updatePassword', () => {
    test('should update password', async () => {
      const mockResponse = { data: { success: true } };
      (api.put as any).mockResolvedValue(mockResponse);

      const result = await authService.updatePassword('oldPass123', 'newPass123');

      expect(api.put).toHaveBeenCalledWith('/auth/updatepassword', {
        currentPassword: 'oldPass123',
        newPassword: 'newPass123'
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('verifyEmail', () => {
    test('should verify email with token', async () => {
      const mockResponse = { data: { success: true } };
      (api.get as any).mockResolvedValue(mockResponse);

      const result = await authService.verifyEmail('token123');

      expect(api.get).toHaveBeenCalledWith('/auth/verify-email', {
        params: { token: 'token123' }
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('resendVerification', () => {
    test('should resend verification email', async () => {
      const mockResponse = { data: { success: true } };
      (api.post as any).mockResolvedValue(mockResponse);

      const result = await authService.resendVerification('user@example.com');

      expect(api.post).toHaveBeenCalledWith('/auth/resend-verification', {
        email: 'user@example.com'
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('forgotPassword', () => {
    test('should send password reset email', async () => {
      const mockResponse = { data: { success: true } };
      (api.post as any).mockResolvedValue(mockResponse);

      const result = await authService.forgotPassword('user@example.com');

      expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', {
        email: 'user@example.com'
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('verifyResetToken', () => {
    test('should verify reset token', async () => {
      const mockResponse = { data: { valid: true } };
      (api.get as any).mockResolvedValue(mockResponse);

      const result = await authService.verifyResetToken('token123');

      expect(api.get).toHaveBeenCalledWith('/auth/verify-reset-token', {
        params: { token: 'token123' }
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('resetPassword', () => {
    test('should reset password with token', async () => {
      const mockResponse = { data: { success: true } };
      (api.post as any).mockResolvedValue(mockResponse);

      const result = await authService.resetPassword('token123', 'newPass123');

      expect(api.post).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'token123',
        password: 'newPass123'
      });
      expect(result).toEqual(mockResponse.data);
    });
  });
});

