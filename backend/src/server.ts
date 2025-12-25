/// <reference types="node" />
import express, { Application } from 'express';
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
import { initRedis } from './utils/cache';
import type { SanitizedObject } from './types/common';
import logger from './utils/logger';

// Load env vars
dotenv.config();

// Validate required environment variables (but don't exit - let server start)
try {
  validateEnv();
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.error('⚠️  Environment validation error:', errorMessage);
  logger.warn('⚠️  Server will start but may not function correctly');
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
import healthRoutes from './routes/health';
import notificationRoutes from './routes/notifications';
import { generateSitemap } from './controllers/sitemapController';

// Connect to database
connectDatabase();

// Initialize Redis cache (non-blocking, app works without Redis)
initRedis();

// Auto-create admin user if it doesn't exist
let adminUserCheckAttempts = 0;
const MAX_ADMIN_CHECK_ATTEMPTS = 5;

const ensureAdminUser = async () => {
  try {
    // Prevent infinite retries
    if (adminUserCheckAttempts >= MAX_ADMIN_CHECK_ATTEMPTS) {
      console.warn('⚠️  Max attempts reached for admin user creation. Skipping.');
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
    const adminPassword = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === 'development' ? 'admin123' : undefined);
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      if (!adminPassword) {
        console.warn('\n⚠️  ADMIN_PASSWORD not set. Skipping auto-creation of admin user.');
        console.warn('   Please create an admin user manually or set ADMIN_PASSWORD in environment variables.\n');
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
      if (process.env.NODE_ENV === 'development') {
        console.log('\n✅ Admin user created automatically');
        console.log(`   Email: ${adminEmail}`);
        console.log('   ⚠️  Please change the default password after first login!\n');
      }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error ensuring admin user:', errorMessage);
    // Retry after a delay if error occurred (but limit attempts)
    if (adminUserCheckAttempts < MAX_ADMIN_CHECK_ATTEMPTS) {
      setTimeout(ensureAdminUser, 3000);
    }
  }
};

// Run after a short delay to ensure DB connection is ready
setTimeout(() => {
  ensureAdminUser();
}, 3000);

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
      // Allow scripts from self, Tawk.to, and inline scripts (needed for Tawk.to and font loading)
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

// Rate limiting for auth endpoints to prevent brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 attempts per 15 minutes
  message: 'Too many login attempts from this IP, please try again after 15 minutes.',
  skipSuccessfulRequests: true, // Don't count successful requests
  standardHeaders: true,
  legacyHeaders: false,
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
});

// Rate limiting for password update to prevent brute force
const passwordUpdateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 password update attempts per 15 minutes
  message: 'Too many password update attempts from this IP, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for password reset (forgot password) to prevent abuse and email spam
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Maximum 3 password reset requests per hour per IP
  message: 'Too many password reset requests from this IP, please try again after 1 hour.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests (even successful ones) to prevent email spam
});

// Rate limiting for password reset (reset password) to prevent brute force
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 password reset attempts per 15 minutes per IP
  message: 'Too many password reset attempts from this IP, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful resets
});

// Rate limiting for order creation to prevent abuse (POST only)
const orderCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Maximum 10 orders per 15 minutes per IP
  message: 'Too many order creation attempts from this IP, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for donation endpoints to prevent abuse
const donationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Maximum 10 donation attempts per 15 minutes per IP
  message: 'Too many donation attempts from this IP, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for file uploads to prevent DoS
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Maximum 20 uploads per 15 minutes per IP
  message: 'Too many file upload attempts from this IP, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for auth status check (/me) - more lenient since it's called frequently
const authStatusLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Maximum 30 requests per minute per IP (allows frequent checks during development)
  message: 'Too many auth status checks from this IP, please try again in a moment.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
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
});

if (isDevelopment) {
  console.log('🔓 Development mode: Rate limiting is more lenient (1000 req/15min for general API, 200 req/min for public data)');
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
app.use(compression({
  level: 6, // Optimal balance (1-9, default is 6)
  threshold: 1024, // Only compress responses > 1KB
  filter: (req: express.Request, res: express.Response) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

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
    
    // Check if origin is in allowed list
    const isExactMatch = allowedOrigins.includes(normalizedOrigin) || allowedOrigins.includes(origin);
    
    // Check if origin matches patterns
    const matchesPattern = 
      normalizedOrigin.includes('petshiwu.com') || // Allow all petshiwu.com subdomains
      normalizedOrigin.includes('pet-shop') || // Allow all pet-shop subdomains
      normalizedOrigin.includes('onrender.com'); // Allow all Render subdomains
    
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
    console.log(`[${new Date().toISOString()}] ${req.method} ${sanitizedUrl}`);
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
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
  setupSwagger(app);
  console.log('📚 API Documentation available at /api-docs');
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

// Legacy routes (without version) - redirect to v1 for backward compatibility
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pet-types', petTypeRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/bulk', bulkOperationsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/email-templates', emailTemplateRoutes);
app.use('/api/test', testEmailRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/care-guides', careGuideRoutes); // Legacy route
app.use('/api/faqs', faqRoutes); // Legacy route
app.use('/api/slideshow', slideshowRoutes); // Legacy route
app.use('/api/notifications', notificationRoutes); // Legacy route
app.use('/api/health', healthRoutes);

// Sitemap route (no API prefix for SEO)
app.get('/sitemap.xml', generateSitemap);

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

// Health check endpoint (used by Render to verify server is running)
// Note: More detailed health check is available at /api/health (via healthRoutes)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Additional health check at root for Render
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Catch-all for debugging unmatched routes (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log('Unmatched route:', {
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
  console.error(`❌ Invalid PORT: ${process.env.PORT}. Using default 5000`);
  PORT = 5000;
}

console.log(`🚀 Starting server on ${HOST}:${PORT}...`);
console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
// Don't log sensitive environment variables
console.log(`🔑 MongoDB URI: ${process.env.MONGODB_URI ? 'Set' : 'NOT SET'}`);
console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Set' : 'NOT SET'}`);

// Start server - MUST start even if there are errors
import { Server } from 'http';

let server: Server | null = null;
try {
  server = app.listen(PORT, HOST, () => {
    console.log(`\n✅✅✅ SERVER SUCCESSFULLY STARTED ✅✅✅`);
    console.log(`✅ Server running in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`✅ Listening on ${HOST}:${PORT}`);
    console.log(`✅ Server is ready to accept connections\n`);
  });

  // Handle server errors
  if (server) {
    server.on('error', (error: NodeJS.ErrnoException) => {
      console.error('❌ Server error event:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        console.error(`💡 This usually happens during nodemon restarts. Wait a moment and nodemon will retry.`);
        // In development, wait longer before exiting to allow nodemon to retry
        const waitTime = process.env.NODE_ENV === 'production' ? 1000 : 2000;
        setTimeout(() => process.exit(1), waitTime);
      } else {
        console.error('❌ Server error details:', error.message);
        setTimeout(() => process.exit(1), 1000);
      }
    });

    // Log when server is actually listening
    const currentServer = server;
    if (currentServer) {
      currentServer.on('listening', () => {
        const addr = currentServer.address();
        console.log(`✅ Server is listening on ${typeof addr === 'string' ? addr : `${addr?.address}:${addr?.port}`}`);
      });
    }
  }

} catch (error: unknown) {
  const errorObj = error instanceof Error ? error : { message: String(error), stack: undefined };
  console.error('❌ CRITICAL: Failed to start server:', error);
  console.error('Error details:', errorObj.message);
  if (errorObj.stack) {
    console.error('Stack:', errorObj.stack);
  }
  // Exit after a delay to allow logging
  setTimeout(() => process.exit(1), 2000);
}

// Handle unhandled promise rejections (don't exit immediately, log first)
process.on('unhandledRejection', (err: Error) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  console.error('Stack:', err.stack);
  // Don't exit immediately - let the server continue running
  // Only exit if it's a critical error
  if (err.message.includes('MongoDB') || err.message.includes('Database')) {
    console.warn('⚠️  Database error - server will continue but database operations may fail');
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('❌ Uncaught Exception:', err.message);
  console.error('Stack:', err.stack);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

export default app;



