/// <reference types="node" />
import express, { Application, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
// Using express-validator's built-in sanitization instead of DOMPurify
// This avoids the complexity of isomorphic-dompurify in Node.js
import compression from 'compression';
import mongoose from 'mongoose';
import { connectDatabase } from './utils/database';
import { errorHandler, notFound } from './middleware/errorHandler';
import { checkDatabase } from './middleware/checkDatabase';
import { validateEnv } from './utils/validateEnv';
import { isCloudinaryConfigured } from './utils/cloudinary';
import { sanitizeResponse } from './middleware/sanitizeResponse';
import { setCacheHeaders } from './middleware/cacheHeaders';
import User from './models/User';
import { setupSwagger } from './utils/swagger';
import { initRedis, getRedisClient } from './utils/cache';
import type { SanitizedObject } from './types/common';
import logger from './utils/logger';
import { initializeJobQueues } from './utils/jobQueue';
import { startEmailWorker } from './workers/emailWorker';
import { startCartAbandonmentWorker } from './workers/cartAbandonmentWorker';
import { responseTimeMiddleware } from './middleware/responseTime';
import { initializeAPM } from './utils/apm';

// Load env vars
dotenv.config();

// CRITICAL FIX: Register uncaught exception handler as early as possible
// This must be before any other code that might throw
process.on('uncaughtException', (err: unknown) => {
  // Always use console.error first (logger might not be initialized)
  console.error('❌❌❌ UNCAUGHT EXCEPTION ❌❌❌');
  
  // Try to extract error information
  let errorMessage = 'Unknown error';
  let errorStack = 'No stack trace available';
  let errorName = 'Error';
  let errorDetails: any = null;
  
  if (err instanceof Error) {
    errorMessage = err.message || 'Error without message';
    errorStack = err.stack || 'No stack trace available';
    errorName = err.name || 'Error';
    errorDetails = {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
  } else if (typeof err === 'string') {
    errorMessage = err;
    errorDetails = { type: 'string', value: err };
  } else if (err && typeof err === 'object') {
    try {
      errorMessage = JSON.stringify(err);
      errorDetails = err;
    } catch {
      errorMessage = String(err);
      errorDetails = { type: 'object', value: String(err) };
    }
  } else {
    errorMessage = String(err);
    errorDetails = { type: 'primitive', value: err };
  }
  
  // Log to console (always works)
  console.error('Error Name:', errorName);
  console.error('Error Message:', errorMessage);
  console.error('Error Stack:', errorStack);
  console.error('Error Details:', errorDetails);
  console.error('Error Type:', typeof err);
  console.error('Error Constructor:', (err as any)?.constructor?.name || 'Unknown');
  
  // Try to use logger if available
  try {
    if (logger && typeof logger.error === 'function') {
      logger.error('❌ Uncaught Exception:', errorMessage);
      logger.error('Error Name:', errorName);
      logger.error('Error Stack:', errorStack);
      if (errorDetails) {
        logger.error('Error Details:', errorDetails);
      }
    }
  } catch (loggerError) {
    console.error('Logger also failed:', loggerError);
  }
  
  // Exit immediately - don't try to close server as it might not be initialized
  console.error('Exiting due to uncaught exception...');
  process.exit(1);
});

// Validate required environment variables
// SECURITY FIX: Fail fast in production if critical vars missing
// Only allow graceful degradation for optional services (Redis, Cloudinary)
try {
  validateEnv();
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.error('⚠️  Environment validation error:', errorMessage);
  
  // In production, exit if critical variables are missing
  if (process.env.NODE_ENV === 'production') {
    logger.error('❌ CRITICAL: Missing required environment variables in production. Server will not start.');
    logger.error('   Required variables: MONGODB_URI, JWT_SECRET');
    logger.error('   Please set these variables before starting the server.');
    process.exit(1);
  } else {
    // In development, warn but allow server to start (for development flexibility)
    logger.warn('⚠️  Server will start but may not function correctly');
    logger.warn('   This is allowed in development mode only.');
  }
}

// Import routes
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import orderRoutes from './routes/orders';
import reviewRoutes from './routes/reviews';
import uploadRoutes from './routes/upload';
import userRoutes from './routes/users';
import petTypeRoutes from './routes/petTypes';
import donationRoutes from './routes/donations';
import analyticsRoutes from './routes/analytics';
import bulkOperationsRoutes from './routes/bulkOperations';
import exportRoutes from './routes/exports';
import emailTemplateRoutes from './routes/emailTemplates';
import testEmailRoutes from './routes/testEmail';
import blogRoutes from './routes/blogs';
import careGuideRoutes from './routes/careGuides';
import faqRoutes from './routes/faqs';
import slideshowRoutes from './routes/slideshow';
import paymentMethodRoutes from './routes/paymentMethods';
import healthRoutes from './routes/health';
import notificationRoutes from './routes/notifications';
import recommendationAnalyticsRoutes from './routes/recommendationAnalytics';
import searchHistoryRoutes from './routes/searchHistory';
import reorderSuggestionsRoutes from './routes/reorderSuggestions';
import searchAnalyticsRoutes from './routes/searchAnalytics';
import cartRoutes from './routes/cart';
import { generateSitemap } from './controllers/sitemapController';

// Connect to database (non-blocking - errors handled internally)
// CRITICAL FIX: Wrap async operations in try-catch to prevent uncaught exceptions
connectDatabase().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  try {
    logger.error('❌ Database connection error (non-fatal):', errorMessage);
  } catch {
    console.error('❌ Database connection error (non-fatal):', errorMessage);
  }
  // Don't exit - server can start without database (will fail on first request)
});

// Initialize Redis cache (non-blocking, app works without Redis)
try {
  initRedis();
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  try {
    logger.warn('⚠️  Redis initialization error (non-fatal):', errorMessage);
  } catch {
    console.warn('⚠️  Redis initialization error (non-fatal):', errorMessage);
  }
  // Don't exit - app works without Redis
}

// Initialize APM (Application Performance Monitoring)
// CRITICAL FIX: Initialize APM before other services
initializeAPM().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  try {
    logger.warn('⚠️  APM initialization error (non-fatal):', errorMessage);
  } catch {
    console.warn('⚠️  APM initialization error (non-fatal):', errorMessage);
  }
  // Don't exit - app works without APM (uses built-in logging)
});

// Initialize job queues (requires Redis, falls back gracefully if unavailable)
// CRITICAL FIX: Wrap in try-catch to prevent uncaught exceptions
try {
  initializeJobQueues();
  startEmailWorker();
  startCartAbandonmentWorker(); // Start cart abandonment recovery worker
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  try {
    logger.warn('⚠️  Job queue initialization error (non-fatal):', errorMessage);
  } catch {
    console.warn('⚠️  Job queue initialization error (non-fatal):', errorMessage);
  }
  // Don't exit - app works without job queues (emails will be sent synchronously)
}

// Auto-create admin user if it doesn't exist
// SECURITY FIX: Disabled in production, only enabled in development or when explicitly enabled
const AUTO_CREATE_ADMIN = process.env.AUTO_CREATE_ADMIN === 'true' || 
                          (process.env.AUTO_CREATE_ADMIN !== 'false' && process.env.NODE_ENV === 'development');

let adminUserCheckAttempts = 0;
const MAX_ADMIN_CHECK_ATTEMPTS = 5;

const ensureAdminUser = async () => {
  // SECURITY: Never auto-create admin in production unless explicitly enabled
  if (process.env.NODE_ENV === 'production' && !process.env.AUTO_CREATE_ADMIN) {
    logger.info('ℹ️  Admin auto-creation is disabled in production for security.');
    logger.info('   Create admin user manually using: npm run create-admin');
    return;
  }

  // Check if auto-creation is explicitly disabled
  if (!AUTO_CREATE_ADMIN) {
    logger.info('ℹ️  Admin auto-creation is disabled (AUTO_CREATE_ADMIN=false).');
    return;
  }

  try {
    // Prevent infinite retries
    if (adminUserCheckAttempts >= MAX_ADMIN_CHECK_ATTEMPTS) {
      logger.warn('⚠️  Max attempts reached for admin user creation. Skipping.');
      return;
    }
    
    adminUserCheckAttempts++;
    
    // Wait for MongoDB connection to be ready
    if (mongoose.connection.readyState !== 1) {
      // Connection not ready yet, wait a bit and retry
      if (adminUserCheckAttempts < MAX_ADMIN_CHECK_ATTEMPTS) {
        setTimeout(ensureAdminUser, 2000);
      }
      return;
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@petshiwu.com';
    // SECURITY: Only use default password in development, require ADMIN_PASSWORD in production
    const adminPassword = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === 'development' ? 'admin123' : undefined);
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      if (!adminPassword) {
        logger.warn('\n⚠️  ADMIN_PASSWORD not set. Skipping auto-creation of admin user.');
        logger.warn('   Please create an admin user manually or set ADMIN_PASSWORD in environment variables.\n');
        return;
      }
      
      await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        phone: '+1234567890'
      });
      logger.info('\n✅ Admin user created automatically');
      logger.info(`   Email: ${adminEmail}`);
      logger.warn('   ⚠️  Please change the default password after first login!\n');
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error ensuring admin user:', errorMessage);
    // Retry after a delay if error occurred (but limit attempts)
    if (adminUserCheckAttempts < MAX_ADMIN_CHECK_ATTEMPTS) {
      setTimeout(ensureAdminUser, 3000);
    }
  }
};

// Run after a short delay to ensure DB connection is ready (only if enabled)
if (AUTO_CREATE_ADMIN) {
  setTimeout(() => {
    ensureAdminUser();
  }, 3000);
}

const app: Application = express();

// Trust proxy - Required for Render.com (uses reverse proxy)
// This allows Express to correctly identify client IPs behind proxy
app.set('trust proxy', 1);

// Security middleware - Helmet for secure headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: process.env.NODE_ENV === 'production' 
        ? ["'self'", "data:", "https:", "https://res.cloudinary.com"]
        : ["'self'", "data:", "https:", "http:", "https://res.cloudinary.com"], // Allow HTTP in development only
      // SECURITY NOTE: 'unsafe-inline' is required for Tawk.to chat widget integration
      // Tawk.to requires inline scripts that cannot use nonces due to third-party limitations
      // Alternatives considered but not viable:
      // - Nonce-based CSP: Tawk.to scripts are loaded dynamically and cannot include nonces
      // - strict-dynamic: Would break Tawk.to functionality
      // - Self-hosted chat: Not feasible for this project
      // Risk mitigation: Tawk.to is a trusted third-party service, and other CSP directives provide XSS protection
      // 'unsafe-inline' is needed for: 1) Tawk.to inline script, 2) onload event handler on font link
      scriptSrc: ["'self'", "https://embed.tawk.to", "'unsafe-inline'"],
      // Allow service workers (needed for PWA functionality)
      workerSrc: ["'self'"],
      connectSrc: ["'self'", "https://embed.tawk.to", "https://api.tawk.to"],
      frameSrc: ["'self'", "https://embed.tawk.to"],
      frameAncestors: ["'self'"], // Replaces X-Frame-Options
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null // Force HTTPS in production
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true, // Sets x-content-type-options: nosniff
  xssFilter: false, // Disable deprecated X-XSS-Protection header (CSP handles this)
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  frameguard: false, // Disable X-Frame-Options (using CSP frame-ancestors instead)
  permittedCrossDomainPolicies: false // Disable Flash/Adobe cross-domain policies
}));

// Rate limiting - Disabled or very lenient to avoid blocking legitimate requests
// Note: Rate limiting is disabled for now. Re-enable with appropriate limits if needed for security.

// SECURITY FIX: Create Redis store for rate limiting (for multi-instance deployments)
// Falls back to in-memory store if Redis is not available
import { createRedisRateLimitStore } from './utils/redisRateLimitStore';

const createRateLimiterStore = (windowMs?: number) => {
  const redisStore = createRedisRateLimitStore(windowMs);
  if (redisStore) {
    logger.info('✅ Rate limiting: Using Redis store for distributed rate limiting');
    return redisStore;
  } else {
    logger.warn('⚠️  Rate limiting: Using in-memory store (per-instance only)');
    logger.warn('   For multi-instance deployments, set REDIS_URL to enable distributed rate limiting');
    return undefined; // Use default in-memory store
  }
};

// Rate limiting for auth endpoints to prevent brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 attempts per 15 minutes
  message: 'Too many login attempts from this IP, please try again after 15 minutes.',
  skipSuccessfulRequests: true, // Don't count successful requests
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimiterStore(15 * 60 * 1000), // Use Redis store if available, fallback to in-memory
});

// Apply rate limiters to both versioned and legacy routes
const applyRateLimiters = (path: string) => {
  app.use(path, authLimiter);
};

// Rate limiting for registration to prevent spam accounts
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Maximum 3 registrations per hour per IP
  message: 'Too many registration attempts from this IP, please try again after 1 hour.',
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimiterStore(60 * 60 * 1000),
});

// Rate limiting for password update to prevent brute force
const passwordUpdateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 password update attempts per 15 minutes
  message: 'Too many password update attempts from this IP, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimiterStore(15 * 60 * 1000),
});

// Rate limiting for password reset (forgot password) to prevent abuse and email spam
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Maximum 3 password reset requests per hour per IP
  message: 'Too many password reset requests from this IP, please try again after 1 hour.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests (even successful ones) to prevent email spam
  store: createRateLimiterStore(60 * 60 * 1000),
});

// Rate limiting for password reset (reset password) to prevent brute force
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 password reset attempts per 15 minutes per IP
  message: 'Too many password reset attempts from this IP, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful resets
  store: createRateLimiterStore(15 * 60 * 1000),
});

// Rate limiting for order creation to prevent abuse (POST only)
const orderCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Maximum 10 orders per 15 minutes per IP
  message: 'Too many order creation attempts from this IP, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimiterStore(15 * 60 * 1000),
});

// Rate limiting for donation endpoints to prevent abuse
const donationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Maximum 10 donation attempts per 15 minutes per IP
  message: 'Too many donation attempts from this IP, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimiterStore(15 * 60 * 1000),
});

// Rate limiting for file uploads to prevent DoS
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Maximum 20 uploads per 15 minutes per IP
  message: 'Too many file upload attempts from this IP, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimiterStore(15 * 60 * 1000),
});

// Rate limiting for auth status check (/me) - more lenient since it's called frequently
const authStatusLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Maximum 30 requests per minute per IP (allows frequent checks during development)
  message: 'Too many auth status checks from this IP, please try again in a moment.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  store: createRateLimiterStore(1 * 60 * 1000),
});

// General API rate limiting to prevent DoS attacks
// Much more lenient in development to allow hot reloading and frequent requests
const isDevelopment = process.env.NODE_ENV !== 'production';
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // Much higher limit in development (1000 vs 100)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: isDevelopment, // In development, don't count successful GET requests
  store: createRateLimiterStore(15 * 60 * 1000),
});

if (isDevelopment) {
  logger.info('🔓 Development mode: Rate limiting is more lenient (1000 req/15min for general API, 200 req/min for public data)');
}

// Lenient limiter for frequently-called GET endpoints (pet-types, categories, products)
// These are safe to call frequently and are needed for navigation/menus
const publicDataLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: isDevelopment ? 200 : 100, // Very high limit in development
  message: 'Too many requests from this IP, please try again in a moment.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  store: createRateLimiterStore(1 * 60 * 1000),
});

// Apply rate limiting to specific critical endpoints BEFORE general API limiter
// Order matters: specific limiters should be applied before general limiter

// Auth endpoints - strict limits
// Apply rate limiters to both versioned and legacy routes
app.use(['/api/v1/auth/login', '/api/auth/login'], authLimiter);
app.use(['/api/v1/auth/register', '/api/auth/register'], registerLimiter);
app.use(['/api/v1/auth/updatepassword', '/api/auth/updatepassword'], passwordUpdateLimiter);

// Auth status check (/me) - more lenient limiter (called frequently for auth checks)
// Use middleware that only applies to GET requests
app.use(['/api/v1/auth/me', '/api/auth/me'], (req, res, next) => {
  if (req.method === 'GET') {
    return authStatusLimiter(req, res, next);
  }
  next();
});
// Password reset endpoints - prevent abuse and email spam
app.post(['/api/v1/auth/forgot-password', '/api/auth/forgot-password'], forgotPasswordLimiter);
app.post(['/api/v1/auth/reset-password', '/api/auth/reset-password'], resetPasswordLimiter);

// Frequently-called GET endpoints - very lenient limits (safe, read-only)
// Apply only to GET requests to avoid interfering with POST/PUT/DELETE
app.use(['/api/v1/pet-types', '/api/pet-types'], (req, res, next) => {
  if (req.method === 'GET') {
    return publicDataLimiter(req, res, next);
  }
  next();
});
app.use(['/api/v1/categories', '/api/categories'], (req, res, next) => {
  if (req.method === 'GET') {
    return publicDataLimiter(req, res, next);
  }
  next();
});
app.use(['/api/v1/products', '/api/products'], (req, res, next) => {
  if (req.method === 'GET') {
    return publicDataLimiter(req, res, next);
  }
  next();
});

// Order creation - prevent abuse (only POST requests)
app.post(['/api/v1/orders', '/api/orders'], orderCreationLimiter);

// Donation endpoints - prevent abuse
app.use(['/api/v1/donations/create-intent', '/api/donations/create-intent'], donationLimiter);
app.use(['/api/v1/donations/confirm', '/api/donations/confirm'], donationLimiter);

// File upload endpoints - prevent DoS
app.use('/api/upload', uploadLimiter);

// Apply general rate limiting to all other API routes (after specific limiters)
// Note: GET endpoints for pet-types, categories, and products are handled above
app.use('/api', apiLimiter);

// Check database connection before processing API requests (except health check)
app.use('/api', (req, res, next) => {
  // Skip database check for health check endpoints
  if (req.path === '/health' || req.path === '/status') {
    return next();
  }
  return checkDatabase(req, res, next);
});

// Body parser with size limits to prevent DoS attacks
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize({
  replaceWith: '_'
}));

// Data sanitization against XSS attacks
// Using a simple HTML entity encoding approach for XSS protection
// express-mongo-sanitize already handles NoSQL injection
// express-validator handles input validation and sanitization on specific routes
// This middleware provides additional XSS protection for all inputs
app.use((req, res, next) => {
  // Simple HTML entity encoding function
  const escapeHtml = (text: string): string => {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  };

  // Sanitize request body strings
  if (req.body && typeof req.body === 'object') {
    const sanitizeObject = (obj: unknown): SanitizedObject => {
      if (typeof obj === 'string') {
        return escapeHtml(obj);
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      if (obj && typeof obj === 'object' && obj.constructor === Object) {
        const sanitized: { [key: string]: SanitizedObject } = {};
        for (const key in obj) {
          sanitized[key] = sanitizeObject((obj as Record<string, unknown>)[key]);
        }
        return sanitized;
      }
      return obj as SanitizedObject;
    };
    req.body = sanitizeObject(req.body) as typeof req.body;
  }
  
  // Sanitize query parameters strings
  if (req.query && typeof req.query === 'object') {
    const sanitizeQuery = (obj: unknown): SanitizedObject => {
      if (typeof obj === 'string') {
        return escapeHtml(obj);
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitizeQuery);
      }
      if (obj && typeof obj === 'object' && obj.constructor === Object) {
        const sanitized: { [key: string]: SanitizedObject } = {};
        for (const key in obj) {
          sanitized[key] = sanitizeQuery((obj as Record<string, unknown>)[key]);
        }
        return sanitized;
      }
      return obj as SanitizedObject;
    };
    req.query = sanitizeQuery(req.query) as typeof req.query;
  }
  next();
});

// Response compression - Gzip/Deflate (Optimized)
// PERFORMANCE FIX: Enhanced compression with better settings
app.use(compression({
  level: 6, // Optimal balance (1-9, default is 6) - good compression without high CPU
  threshold: 1024, // Only compress responses > 1KB (reduces CPU for small responses)
  filter: (req: express.Request, res: express.Response) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Don't compress already compressed content (images, videos, etc.)
    const contentType = res.getHeader('content-type') as string;
    if (contentType && (
      contentType.includes('image/') ||
      contentType.includes('video/') ||
      contentType.includes('application/zip') ||
      contentType.includes('application/gzip')
    )) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Verify compression is working (log in development)
if (process.env.NODE_ENV === 'development' && process.env.VERIFY_COMPRESSION === 'true') {
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any) {
      const contentEncoding = res.getHeader('content-encoding');
      const contentLength = res.getHeader('content-length');
      if (contentEncoding && contentLength) {
        logger.debug(`Response compressed: ${contentEncoding}, size: ${contentLength} bytes`);
      }
      return originalEnd.call(this, chunk, encoding);
    };
    next();
  });
}

// PERFORMANCE FIX: Response time monitoring
// Track API response times for performance analysis
app.use(responseTimeMiddleware);

// Cookie parser - Must be before CORS to parse cookies correctly
app.use(cookieParser());

// Response sanitization - Remove sensitive data from responses
app.use(sanitizeResponse);

// Enable CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  process.env.ADMIN_URL || 'http://localhost:5174',
  'https://pet-shop-1-d7ec.onrender.com', // Frontend production URL
  'https://pet-shop-2-r3ed.onrender.com', // Admin production URL
  'https://dashboard.petshiwu.com', // Admin dashboard production URL
  'https://www.petshiwu.com', // Frontend production URL (with www)
  'https://petshiwu.com', // Frontend production URL (without www)
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      logger.debug('CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    // Normalize origin (remove trailing slash)
    const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
    
    // Check if origin is in allowed list (exact match)
    const isExactMatch = allowedOrigins.includes(normalizedOrigin) || allowedOrigins.includes(origin);
    
    // SECURITY FIX: Use proper regex patterns instead of includes() to prevent subdomain hijacking
    // Only allow specific subdomain patterns, not any string containing the domain
    const petshiwuPattern = /^https:\/\/([a-z0-9-]+\.)?petshiwu\.com$/;
    const petShopPattern = /^https:\/\/pet-shop-[0-9]+-[a-z0-9]+\.onrender\.com$/;
    const onrenderPattern = /^https:\/\/[a-z0-9-]+\.onrender\.com$/;
    
    // Check if origin matches secure patterns
    const matchesPattern = 
      petshiwuPattern.test(normalizedOrigin) || // Allow petshiwu.com and subdomains (e.g., www.petshiwu.com, api.petshiwu.com)
      petShopPattern.test(normalizedOrigin) || // Allow specific pet-shop Render subdomains
      onrenderPattern.test(normalizedOrigin); // Allow Render subdomains (for development/staging)
    
    const isAllowed = isExactMatch || matchesPattern;
    
    if (isAllowed) {
      logger.debug(`CORS: Allowing origin: ${normalizedOrigin}`);
      callback(null, true);
    } else {
      // SECURITY FIX: Block unauthorized origins in production
      if (process.env.NODE_ENV === 'production') {
        logger.warn(`CORS: Blocking unauthorized origin: ${normalizedOrigin}`);
        logger.warn(`CORS: Allowed origins: ${allowedOrigins.join(', ')}`);
        return callback(new Error('Not allowed by CORS'), false);
      }
      // In development, allow but log warning
      if (process.env.NODE_ENV === 'development') {
        logger.warn(`CORS: Allowing origin ${normalizedOrigin} in development mode`);
        callback(null, true);
      } else {
        // Default: block unknown origins
        logger.warn(`CORS: Blocking origin: ${normalizedOrigin}`);
        callback(new Error('Not allowed by CORS'), false);
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization'],
  maxAge: 86400 // Cache preflight requests for 24 hours
}));

// Request logging middleware (development only) - sanitize URLs
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    // Sanitize URL - remove query params and sensitive data
    const sanitizedUrl = (req.originalUrl || req.url || '').split('?')[0];
    logger.debug(`[${new Date().toISOString()}] ${req.method} ${sanitizedUrl}`);
    next();
  });
}

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve static files (fallback for local storage - Cloudinary is preferred)
// This is kept for backward compatibility with existing local uploads
if (!isCloudinaryConfigured()) {
  app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
    maxAge: '1d', // Cache static files for 1 day
    etag: true,
    lastModified: true
  }));
}

// Set proper content-type with charset for all responses
app.use((req, res, next) => {
  // Skip content-type setting for sitemap.xml (handled by its own route)
  if (req.path === '/sitemap.xml') {
    return next();
  }
  
  // Set charset=utf-8 for text/html and application/json
  const contentType = res.getHeader('content-type');
  if (!contentType || typeof contentType === 'string') {
    if (req.path?.endsWith('.html') || !contentType) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    } else if (contentType && typeof contentType === 'string' && contentType.includes('application/json')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
  }
  next();
});

// Enhanced Cache-Control headers with ETag support
app.use(['/api', '/api/v1'], setCacheHeaders);

// Setup Swagger documentation
// SECURITY: Swagger is disabled in production by default for security
// Only enable if explicitly needed via ENABLE_SWAGGER=true
const isSwaggerEnabled = process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true';
if (isSwaggerEnabled) {
  setupSwagger(app);
  logger.info('📚 API Documentation available at /api-docs');
  if (process.env.NODE_ENV === 'production') {
    logger.warn('⚠️  Swagger is enabled in production. Consider disabling for security.');
  }
} else {
  logger.info('ℹ️  Swagger documentation is disabled (production mode). Set ENABLE_SWAGGER=true to enable.');
}

// API Versioning - Mount routers with version prefix
const API_VERSION = process.env.API_VERSION || 'v1';
const API_PREFIX = `/api/${API_VERSION}`;

// Mount routers with version prefix
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/categories`, categoryRoutes);
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/reviews`, reviewRoutes);
app.use(`${API_PREFIX}/upload`, uploadRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/pet-types`, petTypeRoutes);
app.use(`${API_PREFIX}/donations`, donationRoutes);
app.use(`${API_PREFIX}/blogs`, blogRoutes);
app.use(`${API_PREFIX}/care-guides`, careGuideRoutes);
app.use(`${API_PREFIX}/faqs`, faqRoutes);
app.use(`${API_PREFIX}/slideshow`, slideshowRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/recommendations`, recommendationAnalyticsRoutes);
app.use(`${API_PREFIX}/reorder-suggestions`, reorderSuggestionsRoutes);

// Legacy routes (without version) - for backward compatibility
// DEPRECATION NOTICE: Legacy routes are maintained for backward compatibility
// Plan: Legacy routes will be deprecated in a future version (target: Q2 2025)
// Recommendation: Migrate to versioned routes (/api/v1/*) for future compatibility
// Legacy routes will log deprecation warnings in production after deprecation date
const DEPRECATION_DATE = new Date('2025-06-01'); // Target deprecation date
const isAfterDeprecation = new Date() >= DEPRECATION_DATE;

// Middleware to add deprecation warning to legacy routes
const legacyRouteDeprecation = (req: Request, res: Response, next: NextFunction) => {
  if (isAfterDeprecation && process.env.NODE_ENV === 'production') {
    // Add deprecation warning header
    res.setHeader('X-API-Deprecation', 'true');
    res.setHeader('X-API-Deprecation-Date', DEPRECATION_DATE.toISOString());
    res.setHeader('X-API-Deprecation-Message', 'This endpoint is deprecated. Please migrate to /api/v1/* endpoints.');
    logger.warn(`Deprecated API endpoint accessed: ${req.method} ${req.originalUrl}`);
  }
  next();
};

app.use('/api/auth', legacyRouteDeprecation, authRoutes);
app.use('/api/products', legacyRouteDeprecation, productRoutes);
app.use('/api/categories', legacyRouteDeprecation, categoryRoutes);
app.use('/api/orders', legacyRouteDeprecation, orderRoutes);
app.use('/api/reviews', legacyRouteDeprecation, reviewRoutes);
app.use('/api/upload', legacyRouteDeprecation, uploadRoutes);
app.use('/api/users', legacyRouteDeprecation, userRoutes);
app.use('/api/pet-types', legacyRouteDeprecation, petTypeRoutes);
app.use('/api/donations', legacyRouteDeprecation, donationRoutes);
app.use('/api/analytics', legacyRouteDeprecation, analyticsRoutes);
app.use('/api/bulk', legacyRouteDeprecation, bulkOperationsRoutes);
app.use('/api/export', legacyRouteDeprecation, exportRoutes);
app.use('/api/email-templates', legacyRouteDeprecation, emailTemplateRoutes);
app.use('/api/test', legacyRouteDeprecation, testEmailRoutes);
app.use('/api/blogs', legacyRouteDeprecation, blogRoutes);
app.use('/api/care-guides', legacyRouteDeprecation, careGuideRoutes);
app.use('/api/faqs', legacyRouteDeprecation, faqRoutes);
app.use('/api/slideshow', legacyRouteDeprecation, slideshowRoutes);
app.use('/api/notifications', legacyRouteDeprecation, notificationRoutes);
app.use('/api/health', healthRoutes); // Health check doesn't need deprecation warning
app.use('/api/search-history', searchHistoryRoutes); // Routes handle authentication internally
app.use('/api/search-analytics', searchAnalyticsRoutes); // Routes handle authentication and authorization internally
app.use('/api/cart', cartRoutes);
app.use('/api/payment-methods', legacyRouteDeprecation, paymentMethodRoutes);
app.use('/api/recommendations', legacyRouteDeprecation, recommendationAnalyticsRoutes);
app.use('/api/reorder-suggestions', legacyRouteDeprecation, reorderSuggestionsRoutes);

// Sitemap route (no API prefix for SEO) - must be before content-type middleware
// This ensures it returns XML, not HTML
app.get('/sitemap.xml', (req, res) => {
  // Set XML content type before calling generateSitemap
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  generateSitemap(req, res);
});

// Root route - API information
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Pet Shop API Server',
    version: API_VERSION,
    endpoints: {
        health: '/api/health',
        auth: [`${API_PREFIX}/auth`, '/api/auth'],
        products: [`${API_PREFIX}/products`, '/api/products'],
        categories: [`${API_PREFIX}/categories`, '/api/categories'],
        orders: [`${API_PREFIX}/orders`, '/api/orders'],
        reviews: [`${API_PREFIX}/reviews`, '/api/reviews'],
        users: [`${API_PREFIX}/users`, '/api/users'],
        upload: [`${API_PREFIX}/upload`, '/api/upload'],
      petTypes: '/api/pet-types',
      donations: '/api/donations'
    },
    timestamp: new Date().toISOString()
  });
});

// CODE QUALITY FIX: Removed duplicate /health route
// Health check endpoint is now only available at /api/health (via healthRoutes)
// This provides comprehensive health information including database and Redis status
// For Render.com monitoring, use /api/health endpoint
// The previous /health endpoint was redundant and has been removed

// Catch-all for debugging unmatched routes (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    logger.debug('Unmatched route:', {
      method: req.method,
      originalUrl: req.originalUrl,
      url: req.url,
      path: req.path,
      baseUrl: req.baseUrl
    });
    next();
  });
}

// Error handler (must be last)
app.use(notFound);
app.use(errorHandler);

let PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Ensure PORT is valid
if (!PORT || isNaN(PORT) || PORT < 1 || PORT > 65535) {
  logger.error(`❌ Invalid PORT: ${process.env.PORT}. Using default 5000`);
  PORT = 5000;
}

logger.info(`🚀 Starting server on ${HOST}:${PORT}...`);
logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
// Don't log sensitive environment variables
logger.info(`🔑 MongoDB URI: ${process.env.MONGODB_URI ? 'Set' : 'NOT SET'}`);
logger.info(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Set' : 'NOT SET'}`);

// Start server - MUST start even if there are errors
import { Server } from 'http';

let server: Server | null = null;
try {
  server = app.listen(PORT, HOST, () => {
    logger.info(`\n✅✅✅ SERVER SUCCESSFULLY STARTED ✅✅✅`);
    logger.info(`✅ Server running in ${process.env.NODE_ENV || 'development'} mode`);
    logger.info(`✅ Listening on ${HOST}:${PORT}`);
    logger.info(`✅ Server is ready to accept connections\n`);
  });

  // Handle server errors
  if (server) {
    server.on('error', (error: NodeJS.ErrnoException) => {
      logger.error('❌ Server error event:', error);
      if (error.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${PORT} is already in use`);
        logger.error(`💡 This usually happens during nodemon restarts. Wait a moment and nodemon will retry.`);
        // In development, wait longer before exiting to allow nodemon to retry
        const waitTime = process.env.NODE_ENV === 'production' ? 1000 : 2000;
        setTimeout(() => process.exit(1), waitTime);
      } else {
        logger.error('❌ Server error details:', error.message);
        setTimeout(() => process.exit(1), 1000);
      }
    });

    // Log when server is actually listening
    const currentServer = server;
    if (currentServer) {
      currentServer.on('listening', () => {
        const addr = currentServer.address();
        logger.info(`✅ Server is listening on ${typeof addr === 'string' ? addr : `${addr?.address}:${addr?.port}`}`);
      });
    }
  }

} catch (error: unknown) {
  const errorObj = error instanceof Error ? error : { message: String(error), stack: undefined };
  logger.error('❌ CRITICAL: Failed to start server:', error);
  logger.error('Error details:', errorObj.message);
  if (errorObj.stack) {
    logger.error('Stack:', errorObj.stack);
  }
  // Exit after a delay to allow logging
  setTimeout(() => process.exit(1), 2000);
}

// Handle unhandled promise rejections (don't exit immediately, log first)
process.on('unhandledRejection', (reason: unknown, promise: Promise<any>) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  const errorMessage = error.message || String(reason);
  const errorStack = error.stack || 'No stack trace available';
  
  // Use both logger and console for critical errors (logger might not be ready)
  try {
    logger.error('❌ Unhandled Promise Rejection:', errorMessage);
    logger.error('Stack:', errorStack);
  } catch {
    console.error('❌ Unhandled Promise Rejection:', errorMessage);
    console.error('Stack:', errorStack);
  }
  
  // Don't exit immediately - let the server continue running
  // Only exit if it's a critical error
  if (errorMessage.includes('MongoDB') || errorMessage.includes('Database')) {
    try {
      logger.warn('⚠️  Database error - server will continue but database operations may fail');
    } catch {
      console.warn('⚠️  Database error - server will continue but database operations may fail');
    }
  }
});

// Note: Uncaught exception handler is registered at the top of the file (after imports and dotenv.config)
// This ensures it's available before any code runs that might throw

export default app;



