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
import xss from 'xss-clean';
import compression from 'compression';
import mongoose from 'mongoose';
import { connectDatabase } from './utils/database';
import { errorHandler, notFound } from './middleware/errorHandler';
import { validateEnv } from './utils/validateEnv';
import User from './models/User';

// Load env vars
dotenv.config();

// Validate required environment variables
validateEnv();

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
const ensureAdminUser = async () => {
  try {
    // Wait for MongoDB connection to be ready
    if (mongoose.connection.readyState !== 1) {
      // Connection not ready yet, wait a bit and retry
      setTimeout(ensureAdminUser, 1000);
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
    // Retry after a delay if error occurred
    setTimeout(ensureAdminUser, 2000);
  }
};

// Run after a short delay to ensure DB connection is ready
setTimeout(() => {
  ensureAdminUser();
}, 2000);

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
      imgSrc: ["'self'", "data:", "https:", "http:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"]
    }
  }
}));

// Rate limiting - Prevent brute force attacks
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parser with size limits to prevent DoS attacks
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize({
  replaceWith: '_'
}));

// Data sanitization against XSS attacks
app.use(xss());

// Response compression - Gzip/Deflate
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6 // Balance between compression and CPU usage
}));

// Cookie parser
app.use(cookieParser());

// Enable CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  process.env.ADMIN_URL || 'http://localhost:5174',
  'https://pet-shop-1-d7ec.onrender.com', // Frontend production URL
  'https://pet-shop-2-r3ed.onrender.com', // Admin production URL
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
      if (allowedOrigins.includes(origin) || allowedOrigins.some(allowed => origin?.startsWith(allowed))) {
        callback(null, true);
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`CORS blocked origin: ${origin}`);
        }
        callback(null, true); // Allow anyway in production to avoid blocking
      }
  },
  credentials: true
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

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Start server
let server: any;
try {
  server = app.listen(PORT, HOST, () => {
    console.log(`✅ Server running in ${process.env.NODE_ENV} mode on ${HOST}:${PORT}`);
    console.log(`✅ Server is ready to accept connections`);
  });

  // Handle server errors
  server.on('error', (error: any) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use`);
    } else {
      console.error('❌ Server error:', error);
    }
    process.exit(1);
  });
} catch (error: any) {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
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



