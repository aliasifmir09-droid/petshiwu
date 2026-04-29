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

process.on('uncaughtException', (err: unknown) => {
  console.error('❌❌❌ UNCAUGHT EXCEPTION ❌❌❌');
  let errorMessage = 'Unknown error';
  let errorStack = 'No stack trace available';
  let errorName = 'Error';
  let errorDetails: any = null;
  if (err instanceof Error) {
    errorMessage = err.message || 'Error without message';
    errorStack = err.stack || 'No stack trace available';
    errorName = err.name || 'Error';
    errorDetails = { name: err.name, message: err.message, stack: err.stack };
  } else if (typeof err === 'string') {
    errorMessage = err;
    errorDetails = { type: 'string', value: err };
  } else if (err && typeof err === 'object') {
    try { errorMessage = JSON.stringify(err); errorDetails = err; }
    catch { errorMessage = String(err); errorDetails = { type: 'object', value: String(err) }; }
  } else {
    errorMessage = String(err);
    errorDetails = { type: 'primitive', value: err };
  }
  console.error('Error Name:', errorName);
  console.error('Error Message:', errorMessage);
  console.error('Error Stack:', errorStack);
  console.error('Error Details:', errorDetails);
  try {
    if (logger && typeof logger.error === 'function') {
      logger.error('❌ Uncaught Exception:', errorMessage);
    }
  } catch (loggerError) {
    console.error('Logger also failed:', loggerError);
  }
  process.exit(1);
});

try {
  validateEnv();
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.error('⚠️  Environment validation error:', errorMessage);
  if (process.env.NODE_ENV === 'production') {
    logger.error('❌ CRITICAL: Missing required environment variables in production.');
    process.exit(1);
  } else {
    logger.warn('⚠️  Server will start but may not function correctly');
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

connectDatabase().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  try { logger.error('❌ Database connection error (non-fatal):', errorMessage); }
  catch { console.error('❌ Database connection error (non-fatal):', errorMessage); }
});

try { initRedis(); }
catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  try { logger.warn('⚠️  Redis initialization error (non-fatal):', errorMessage); }
  catch { console.warn('⚠️  Redis initialization error (non-fatal):', errorMessage); }
}

initializeAPM().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  try { logger.warn('⚠️  APM initialization error (non-fatal):', errorMessage); }
  catch { console.warn('⚠️  APM initialization error (non-fatal):', errorMessage); }
});

try {
  initializeJobQueues();
  startEmailWorker();
  startCartAbandonmentWorker();
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  try { logger.warn('⚠️  Job queue initialization error (non-fatal):', errorMessage); }
  catch { console.warn('⚠️  Job queue initialization error (non-fatal):', errorMessage); }
}

const AUTO_CREATE_ADMIN = process.env.AUTO_CREATE_ADMIN === 'true' ||
  (process.env.AUTO_CREATE_ADMIN !== 'false' && process.env.NODE_ENV === 'development');

let adminUserCheckAttempts = 0;
const MAX_ADMIN_CHECK_ATTEMPTS = 5;

const ensureAdminUser = async () => {
  if (process.env.NODE_ENV === 'production' && !process.env.AUTO_CREATE_ADMIN) {
    logger.info('ℹ️  Admin auto-creation is disabled in production for security.');
    return;
  }
  if (!AUTO_CREATE_ADMIN) { return; }
  try {
    if (adminUserCheckAttempts >= MAX_ADMIN_CHECK_ATTEMPTS) { return; }
    adminUserCheckAttempts++;
    if (mongoose.connection.readyState !== 1) {
      if (adminUserCheckAttempts < MAX_ADMIN_CHECK_ATTEMPTS) { setTimeout(ensureAdminUser, 2000); }
      return;
    }
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@petshiwu.com';
    const adminPassword = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === 'development' ? 'admin123' : undefined);
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      if (!adminPassword) {
        logger.warn('\n⚠️  ADMIN_PASSWORD not set. Skipping auto-creation of admin user.\n');
        return;
      }
      await User.create({ firstName: 'Admin', lastName: 'User', email: adminEmail, password: adminPassword, role: 'admin', phone: '+1234567890' });
      logger.info('\n✅ Admin user created automatically');
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error ensuring admin user:', errorMessage);
    if (adminUserCheckAttempts < MAX_ADMIN_CHECK_ATTEMPTS) { setTimeout(ensureAdminUser, 3000); }
  }
};

if (AUTO_CREATE_ADMIN) { setTimeout(() => { ensureAdminUser(); }, 3000); }

const app: Application = express();
app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: process.env.NODE_ENV === 'production'
        ? ["'self'", "data:", "https:", "https://res.cloudinary.com"]
        : ["'self'", "data:", "https:", "http:", "https://res.cloudinary.com"],
      scriptSrc: ["'self'", "https://embed.tawk.to", "'unsafe-inline'"],
      workerSrc: ["'self'"],
      connectSrc: ["'self'", "https://embed.tawk.to", "https://api.tawk.to"],
      frameSrc: ["'self'", "https://embed.tawk.to"],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  noSniff: true,
  xssFilter: false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  frameguard: false,
  permittedCrossDomainPolicies: false
}));

import { createRedisRateLimitStore } from './utils/redisRateLimitStore';

const createRateLimiterStore = (windowMs?: number) => {
  const redisStore = createRedisRateLimitStore(windowMs);
  if (redisStore) { return redisStore; }
  return undefined;
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 15,
  message: { error: 'Too many login attempts', message: 'Too many login attempts from this IP. Please try again after 15 minutes.', retryAfter: 15 * 60 },
  skipSuccessfulRequests: true, standardHeaders: true, legacyHeaders: false,
  store: createRateLimiterStore(15 * 60 * 1000),
  handler: (req, res) => { res.status(429).json({ success: false, error: 'Too many login attempts', message: 'Too many login attempts from this IP. Please try again after 15 minutes.', retryAfter: 15 * 60 }); }
});

const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 3, message: 'Too many registration attempts from this IP, please try again after 1 hour.', standardHeaders: true, legacyHeaders: false, store: createRateLimiterStore(60 * 60 * 1000) });
const passwordUpdateLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: 'Too many password update attempts from this IP, please try again after 15 minutes.', standardHeaders: true, legacyHeaders: false, store: createRateLimiterStore(15 * 60 * 1000) });
const forgotPasswordLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 3, message: 'Too many password reset requests from this IP, please try again after 1 hour.', standardHeaders: true, legacyHeaders: false, skipSuccessfulRequests: false, store: createRateLimiterStore(60 * 60 * 1000) });
const resetPasswordLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: 'Too many password reset attempts from this IP, please try again after 15 minutes.', standardHeaders: true, legacyHeaders: false, skipSuccessfulRequests: true, store: createRateLimiterStore(15 * 60 * 1000) });
const orderCreationLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many order creation attempts from this IP, please try again after 15 minutes.', standardHeaders: true, legacyHeaders: false, store: createRateLimiterStore(15 * 60 * 1000) });
const donationLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many donation attempts from this IP, please try again after 15 minutes.', standardHeaders: true, legacyHeaders: false, store: createRateLimiterStore(15 * 60 * 1000) });
const uploadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many file upload attempts from this IP, please try again after 15 minutes.', standardHeaders: true, legacyHeaders: false, store: createRateLimiterStore(15 * 60 * 1000) });
const authStatusLimiter = rateLimit({ windowMs: 1 * 60 * 1000, max: 100, message: 'Too many auth status checks from this IP, please try again in a moment.', standardHeaders: true, legacyHeaders: false, skipSuccessfulRequests: true, store: createRateLimiterStore(1 * 60 * 1000) });
const isDevelopment = process.env.NODE_ENV !== 'production';
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: isDevelopment ? 1000 : 100, message: 'Too many requests from this IP, please try again later.', standardHeaders: true, legacyHeaders: false, skipSuccessfulRequests: isDevelopment, store: createRateLimiterStore(15 * 60 * 1000) });
const publicDataLimiter = rateLimit({ windowMs: 1 * 60 * 1000, max: isDevelopment ? 200 : 100, message: 'Too many requests from this IP, please try again in a moment.', standardHeaders: true, legacyHeaders: false, skipSuccessfulRequests: true, store: createRateLimiterStore(1 * 60 * 1000) });

app.use(['/api/v1/auth/login', '/api/auth/login'], authLimiter);
app.use(['/api/v1/auth/register', '/api/auth/register'], registerLimiter);
app.use(['/api/v1/auth/updatepassword', '/api/auth/updatepassword'], passwordUpdateLimiter);
app.use(['/api/v1/auth/me', '/api/auth/me'], (req, res, next) => { if (req.method === 'GET') { return authStatusLimiter(req, res, next); } next(); });
app.post(['/api/v1/auth/forgot-password', '/api/auth/forgot-password'], forgotPasswordLimiter);
app.post(['/api/v1/auth/reset-password', '/api/auth/reset-password'], resetPasswordLimiter);
app.use(['/api/v1/pet-types', '/api/pet-types'], (req, res, next) => { if (req.method === 'GET') { return publicDataLimiter(req, res, next); } next(); });
app.use(['/api/v1/categories', '/api/categories'], (req, res, next) => { if (req.method === 'GET') { return publicDataLimiter(req, res, next); } next(); });
app.use(['/api/v1/products', '/api/products'], (req, res, next) => { if (req.method === 'GET') { return publicDataLimiter(req, res, next); } next(); });
app.post(['/api/v1/orders', '/api/orders'], orderCreationLimiter);
app.use(['/api/v1/donations/create-intent', '/api/donations/create-intent'], donationLimiter);
app.use(['/api/v1/donations/confirm', '/api/donations/confirm'], donationLimiter);
app.use('/api/upload', uploadLimiter);
app.use('/api', (req, res, next) => {
  if (req.path === '/v1/auth/me' || req.path === '/auth/me') { return next(); }
  return apiLimiter(req, res, next);
});
app.use('/api', (req, res, next) => {
  if (req.path === '/health' || req.path === '/status') { return next(); }
  return checkDatabase(req, res, next);
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize({ replaceWith: '_' }));

app.use((req, res, next) => {
  const escapeHtml = (text: string): string => {
    const map: { [key: string]: string } = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  };
  const htmlContentFields = ['content', 'body', 'description'];
  const isHtmlContentRoute = req.path.includes('/blogs') || req.path.includes('/care-guides');
  if (req.body && typeof req.body === 'object') {
    const sanitizeObject = (obj: unknown, isInHtmlField: boolean = false): SanitizedObject => {
      if (typeof obj === 'string') { if (isInHtmlField && isHtmlContentRoute) { return obj; } return escapeHtml(obj); }
      if (Array.isArray(obj)) { return obj.map(item => sanitizeObject(item, isInHtmlField)); }
      if (obj && typeof obj === 'object' && obj.constructor === Object) {
        const sanitized: { [key: string]: SanitizedObject } = {};
        for (const key in obj) { const isHtmlField = htmlContentFields.includes(key.toLowerCase()); sanitized[key] = sanitizeObject((obj as Record<string, unknown>)[key], isHtmlField); }
        return sanitized;
      }
      return obj as SanitizedObject;
    };
    req.body = sanitizeObject(req.body) as typeof req.body;
  }
  if (req.query && typeof req.query === 'object') {
    const sanitizeQuery = (obj: unknown): SanitizedObject => {
      if (typeof obj === 'string') { return escapeHtml(obj); }
      if (Array.isArray(obj)) { return obj.map(sanitizeQuery); }
      if (obj && typeof obj === 'object' && obj.constructor === Object) {
        const sanitized: { [key: string]: SanitizedObject } = {};
        for (const key in obj) { sanitized[key] = sanitizeQuery((obj as Record<string, unknown>)[key]); }
        return sanitized;
      }
      return obj as SanitizedObject;
    };
    req.query = sanitizeQuery(req.query) as typeof req.query;
  }
  next();
});

app.use(compression({
  level: 6, threshold: 1024,
  filter: (req: express.Request, res: express.Response) => {
    if (req.headers['x-no-compression']) { return false; }
    const contentType = res.getHeader('content-type') as string;
    if (contentType && (contentType.includes('image/') || contentType.includes('video/') || contentType.includes('application/zip') || contentType.includes('application/gzip'))) { return false; }
    return compression.filter(req, res);
  }
}));

app.use(responseTimeMiddleware);
app.use(cookieParser());
app.use(sanitizeResponse);

const corsOriginEnv = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()).filter(Boolean) : [];
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  process.env.ADMIN_URL || 'http://localhost:5174',
  ...corsOriginEnv,
  'https://pet-shop-1-d7ec.onrender.com',
  'https://pet-shop-2-r3ed.onrender.com',
  'https://dashboard.petshiwu.com',
  'https://www.petshiwu.com',
  'https://petshiwu.com',
];

app.use(cors({
  origin: (origin, callback) => {
    try {
      if (!origin) { return callback(null, true); }
      const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
      const normalizedAllowedOrigins = allowedOrigins.map(o => o.toLowerCase());
      const isExactMatch = normalizedAllowedOrigins.includes(normalizedOrigin.toLowerCase()) || allowedOrigins.includes(normalizedOrigin) || allowedOrigins.includes(origin);
      const petshiwuPattern = /^https:\/\/([a-z0-9-]+\.)?petshiwu\.com$/i;
      const petShopPattern = /^https:\/\/pet-shop-[0-9]+-[a-z0-9]+\.onrender\.com$/i;
      const onrenderPattern = /^https:\/\/[a-z0-9-]+\.onrender\.com$/i;
      const matchesPattern = petshiwuPattern.test(normalizedOrigin) || petShopPattern.test(normalizedOrigin) || onrenderPattern.test(normalizedOrigin);
      const isAllowed = isExactMatch || matchesPattern;
      if (isAllowed) { return callback(null, true); }
      else {
        if (process.env.NODE_ENV === 'production') { return callback(new Error('Not allowed by CORS'), false); }
        if (process.env.NODE_ENV === 'development') { return callback(null, true); }
        else { return callback(new Error('Not allowed by CORS'), false); }
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') { return callback(null, true); }
      return callback(error, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
  exposedHeaders: ['Authorization'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => { const sanitizedUrl = (req.originalUrl || req.url || '').split('?')[0]; logger.debug(`[${new Date().toISOString()}] ${req.method} ${sanitizedUrl}`); next(); });
  app.use(morgan('dev'));
}

if (!isCloudinaryConfigured()) {
  app.use('/uploads', express.static(path.join(__dirname, '../uploads'), { maxAge: '1d', etag: true, lastModified: true }));
}

app.use((req, res, next) => {
  if (req.path === '/sitemap.xml') { return next(); }
  const contentType = res.getHeader('content-type');
  if (!contentType || typeof contentType === 'string') {
    if (req.path?.endsWith('.html') || !contentType) { res.setHeader('Content-Type', 'text/html; charset=utf-8'); }
    else if (contentType && typeof contentType === 'string' && contentType.includes('application/json')) { res.setHeader('Content-Type', 'application/json; charset=utf-8'); }
  }
  next();
});

app.use(['/api', '/api/v1'], setCacheHeaders);

const isSwaggerEnabled = process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true';
if (isSwaggerEnabled) { setupSwagger(app); }

const API_VERSION = process.env.API_VERSION || 'v1';
const API_PREFIX = `/api/${API_VERSION}`;

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

const legacyRouteDeprecation = (req: Request, res: Response, next: NextFunction) => { next(); };

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
app.use('/api/health', healthRoutes);
app.use('/api/search-history', searchHistoryRoutes);
app.use('/api/search-analytics', searchAnalyticsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payment-methods', legacyRouteDeprecation, paymentMethodRoutes);
app.use('/api/recommendations', legacyRouteDeprecation, recommendationAnalyticsRoutes);
app.use('/api/reorder-suggestions', legacyRouteDeprecation, reorderSuggestionsRoutes);

app.get('/sitemap.xml', (req, res) => {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  generateSitemap(req, res);
});

app.get('/api', (req, res) => {
  res.status(200).json({ success: true, message: 'PetShiwu API', version: API_VERSION, docs: '/api-docs', health: '/api/health', timestamp: new Date().toISOString() });
});

// ✅ SPA FALLBACK FIX — Serves React app for all non-API routes
// This fixes 404 errors on /cart, /checkout, /profile etc when page is refreshed
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath, { maxAge: '1d', etag: true }));
app.get('*', (req: Request, res: Response, next: NextFunction) => {
  // Skip API routes — let them fall through to error handler
  if (req.path.startsWith('/api')) return next();
  // Serve React index.html for all other routes
  res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
    if (err) next(); // If file not found, continue to error handler
  });
});

// Error handler (must be last)
app.use(notFound);
app.use(errorHandler);

let PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';

if (!PORT || isNaN(PORT) || PORT < 1 || PORT > 65535) { PORT = 5000; }

logger.info(`🚀 Starting server on ${HOST}:${PORT}...`);
logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);

import { Server } from 'http';

let server: Server | null = null;
try {
  server = app.listen(PORT, HOST, () => {
    logger.info(`\n✅✅✅ SERVER SUCCESSFULLY STARTED ✅✅✅`);
    logger.info(`✅ Server running in ${process.env.NODE_ENV || 'development'} mode`);
    logger.info(`✅ Listening on ${HOST}:${PORT}`);
  });
  if (server) {
    server.on('error', (error: NodeJS.ErrnoException) => {
      logger.error('❌ Server error event:', error);
      if (error.code === 'EADDRINUSE') {
        const waitTime = process.env.NODE_ENV === 'production' ? 1000 : 2000;
        setTimeout(() => process.exit(1), waitTime);
      } else {
        setTimeout(() => process.exit(1), 1000);
      }
    });
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
  setTimeout(() => process.exit(1), 2000);
}

process.on('unhandledRejection', (reason: unknown, promise: Promise<any>) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  const errorMessage = error.message || String(reason);
  try { logger.error('❌ Unhandled Promise Rejection:', errorMessage); }
  catch { console.error('❌ Unhandled Promise Rejection:', errorMessage); }
});

export default app;
