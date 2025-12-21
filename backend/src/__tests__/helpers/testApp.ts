/**
 * Test helper to get the Express app without starting the server
 * This prevents port conflicts and server startup issues in tests
 */
import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import { errorHandler, notFound } from '../../middleware/errorHandler';
import { sanitizeResponse } from '../../middleware/sanitizeResponse';
import { setupSwagger } from '../../utils/swagger';

// Load env vars
dotenv.config();

// Set test environment
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

// Import routes
import authRoutes from '../../routes/auth';
import productRoutes from '../../routes/products';
import categoryRoutes from '../../routes/categories';
import orderRoutes from '../../routes/orders';
import reviewRoutes from '../../routes/reviews';
import uploadRoutes from '../../routes/upload';
import userRoutes from '../../routes/users';
import petTypeRoutes from '../../routes/petTypes';
import donationRoutes from '../../routes/donations';
import analyticsRoutes from '../../routes/analytics';
import bulkOperationsRoutes from '../../routes/bulkOperations';
import exportRoutes from '../../routes/exports';
import emailTemplateRoutes from '../../routes/emailTemplates';

// Create Express app
const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging (only in non-test or verbose test mode)
if (process.env.NODE_ENV !== 'test' || process.env.VERBOSE_TESTS === 'true') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Limit auth endpoints to 5 requests per windowMs
  message: 'Too many login attempts, please try again later.'
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Data sanitization
app.use(mongoSanitize());
app.use(sanitizeResponse);

// Compression
app.use(compression({
  filter: (req: express.Request, res: express.Response) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6
}));

// Setup Swagger (disabled in test by default)
if (process.env.NODE_ENV !== 'test' || process.env.ENABLE_SWAGGER === 'true') {
  setupSwagger(app);
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
app.use('/api/analytics', analyticsRoutes);
app.use('/api/bulk-operations', bulkOperationsRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/email-templates', emailTemplateRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;

