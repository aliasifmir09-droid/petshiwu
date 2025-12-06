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
import { validateEnv } from './utils/validateEnv';
import { isCloudinaryConfigured } from './utils/cloudinary';
import { sanitizeResponse } from './middleware/sanitizeResponse';
import User from './models/User';
import { setupSwagger } from './utils/swagger';

// Load env vars
dotenv.config();

// Validate required environment variables (but don't exit - let server start)
try {
  validateEnv();
} catch (error: any) {
  console.error('⚠️  Environment validation error:', error.message);
  console.warn('⚠️  Server will start but may not function correctly');
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

// Connect to database
connectDatabase();

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
  } catch (error: any) {
    console.error('Error ensuring admin user:', error.message);
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
      imgSrc: ["'self'", "data:", "https:", "http:", "https://res.cloudinary.com"],
      scriptSrc: ["'self'", "https://embed.tawk.to"],
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
  skip: (req) => {
    // Skip rate limiting for successful logins
    return false;
  }
});

// General API rate limiting to prevent DoS attacks
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Maximum 100 requests per 15 minutes per IP
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to auth endpoints
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Apply general rate limiting to all API routes
app.use('/api', apiLimiter);

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
    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return escapeHtml(obj);
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      if (obj && typeof obj === 'object' && obj.constructor === Object) {
        const sanitized: any = {};
        for (const key in obj) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
        return sanitized;
      }
      return obj;
    };
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitize query parameters strings
  if (req.query && typeof req.query === 'object') {
    const sanitizeQuery = (obj: any): any => {
      if (typeof obj === 'string') {
        return escapeHtml(obj);
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitizeQuery);
      }
      if (obj && typeof obj === 'object' && obj.constructor === Object) {
        const sanitized: any = {};
        for (const key in obj) {
          sanitized[key] = sanitizeQuery(obj[key]);
        }
        return sanitized;
      }
      return obj;
    };
    req.query = sanitizeQuery(req.query);
  }
  next();
});

// Response compression - Gzip/Deflate
app.use(compression({
  filter: (req: express.Request, res: express.Response) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6 // Balance between compression and CPU usage
}));

// Cookie parser
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
  'https://www.petshiwu.com', // Frontend production URL
  'https://petshiwu.com', // Frontend production URL (without www)
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or matches a pattern
    const isAllowed = allowedOrigins.includes(origin) || 
                     allowedOrigins.some(allowed => origin?.startsWith(allowed)) ||
                     origin?.includes('petshiwu.com') || // Allow all petshiwu.com subdomains
                     origin?.includes('pet-shop') || // Allow all pet-shop subdomains
                     origin?.includes('onrender.com'); // Allow all Render subdomains
    
    if (isAllowed) {
      callback(null, true);
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`CORS blocked origin: ${origin}`);
      }
      // In production, be more permissive but log it
      if (process.env.NODE_ENV === 'production') {
        console.warn(`CORS: Allowing origin ${origin} (not in allowed list but allowing in production)`);
      }
      callback(null, true); // Allow anyway to avoid blocking legitimate requests
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization']
}));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl || req.url}`);
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

// Set Cache-Control headers for API responses
app.use('/api', (req, res, next) => {
  // Don't cache API responses by default (except for GET requests to static data)
  if (req.method === 'GET' && (req.path?.includes('/products') || req.path?.includes('/categories'))) {
    // Cache product/category data for 5 minutes
    res.setHeader('Cache-Control', 'public, max-age=300');
  } else {
    // No cache for other API endpoints
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
  }
  next();
});

// Setup Swagger documentation
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
  setupSwagger(app);
  console.log('📚 API Documentation available at /api-docs');
}

// Mount routers
app.use('/api/auth', authRoutes);

app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pet-types', petTypeRoutes);
app.use('/api/donations', donationRoutes);

// Root route - API information
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Pet Shop API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      products: '/api/products',
      categories: '/api/categories',
      orders: '/api/orders',
      reviews: '/api/reviews',
      users: '/api/users',
      upload: '/api/upload',
      petTypes: '/api/pet-types',
      donations: '/api/donations'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint (used by Render to verify server is running)
app.get('/api/health', (req, res) => {
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
console.log(`🔑 MongoDB URI: ${process.env.MONGODB_URI ? 'Set' : 'NOT SET'}`);
console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Set' : 'NOT SET'}`);

// Start server - MUST start even if there are errors
let server: any;
try {
  server = app.listen(PORT, HOST, () => {
    console.log(`\n✅✅✅ SERVER SUCCESSFULLY STARTED ✅✅✅`);
    console.log(`✅ Server running in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`✅ Listening on ${HOST}:${PORT}`);
    console.log(`✅ Server is ready to accept connections\n`);
  });

  // Handle server errors
  server.on('error', (error: any) => {
    console.error('❌ Server error event:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use`);
    } else {
      console.error('❌ Server error details:', error.message);
    }
    // Don't exit immediately - let Render see the error
    setTimeout(() => process.exit(1), 1000);
  });

  // Log when server is actually listening
  server.on('listening', () => {
    const addr = server.address();
    console.log(`✅ Server is listening on ${typeof addr === 'string' ? addr : `${addr?.address}:${addr?.port}`}`);
  });

} catch (error: any) {
  console.error('❌ CRITICAL: Failed to start server:', error);
  console.error('Error details:', error.message);
  console.error('Stack:', error.stack);
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



