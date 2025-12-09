/**
 * Input validation and sanitization utilities
 * Prevents XSS and validates user inputs before sending to API
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize string input - removes HTML tags and dangerous content
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }
  // Remove all HTML tags and attributes
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [] 
  }).trim();
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate phone number (basic validation)
 */
export const validatePhone = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  // Check if it's all digits and has reasonable length (10-15 digits)
  return /^\d{10,15}$/.test(cleaned);
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (password.length > 128) {
    return { valid: false, message: 'Password must be less than 128 characters' };
  }
  
  // Check for at least one letter and one number
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  if (!hasLetter || !hasNumber) {
    return { valid: false, message: 'Password must contain at least one letter and one number' };
  }
  
  return { valid: true };
};

/**
 * Validate name (first name, last name, etc.)
 */
export const validateName = (name: string): { valid: boolean; message?: string } => {
  if (!name || typeof name !== 'string') {
    return { valid: false, message: 'Name is required' };
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length < 1) {
    return { valid: false, message: 'Name cannot be empty' };
  }
  
  if (trimmed.length > 100) {
    return { valid: false, message: 'Name must be less than 100 characters' };
  }
  
  // Allow letters, spaces, hyphens, apostrophes (common in names)
  if (!/^[a-zA-Z\s\-'\.]+$/.test(trimmed)) {
    return { valid: false, message: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }
  
  return { valid: true };
};

/**
 * Validate URL
 */
export const validateUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Sanitize and validate text input (for comments, descriptions, etc.)
 */
export const sanitizeTextInput = (text: string, maxLength?: number): { sanitized: string; valid: boolean; message?: string } => {
  if (typeof text !== 'string') {
    return { sanitized: '', valid: false, message: 'Invalid input type' };
  }
  
  const sanitized = sanitizeInput(text);
  
  if (maxLength && sanitized.length > maxLength) {
    return { 
      sanitized: sanitized.substring(0, maxLength), 
      valid: false, 
      message: `Text must be less than ${maxLength} characters` 
    };
  }
  
  return { sanitized, valid: true };
};

/**
 * Validate numeric input
 */
export const validateNumber = (value: string | number, min?: number, max?: number): { valid: boolean; message?: string; value?: number } => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return { valid: false, message: 'Invalid number' };
  }
  
  if (min !== undefined && num < min) {
    return { valid: false, message: `Value must be at least ${min}` };
  }
  
  if (max !== undefined && num > max) {
    return { valid: false, message: `Value must be at most ${max}` };
  }
  
  return { valid: true, value: num };
};

/**
 * Sanitize object with string values (for form data)
 */
export const sanitizeFormData = <T extends Record<string, any>>(data: T): T => {
  const sanitized = { ...data };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeInput(sanitized[key]) as any;
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeFormData(sanitized[key]) as any;
    }
  }
  
  return sanitized;
};

