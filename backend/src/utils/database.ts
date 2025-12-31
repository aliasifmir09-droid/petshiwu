import mongoose from 'mongoose';
import { optimizeMongooseSettings, enableQueryLogging, logConnectionPoolStatus } from './databaseOptimization';
import logger from './logger';

export const connectDatabase = async () => {
  try {
    // Force IPv4 connection
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pet-ecommerce';
    
    logger.info('Attempting to connect to MongoDB...');
    // Sanitize URI - remove all credentials
    const sanitizedUri = mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//<credentials>@').replace(/\/\/[^@]+@/, '//<credentials>@');
    logger.info('MongoDB URI:', sanitizedUri);
    
    // Configure buffering based on environment
    // In production: enable buffering for resilience during brief disconnections
    // In development: disable to fail fast and catch connection issues early
    const isProduction = process.env.NODE_ENV === 'production';
    mongoose.set('bufferCommands', isProduction); // Buffer in production, fail fast in development
    
    // Optimized connection pool settings for 10,000+ concurrent users
    // Formula: maxPoolSize = (expected concurrent requests / requests per connection) + buffer
    // For 10k users with ~100 req/sec per connection: 100 + 50 buffer = 150
    // Using 100 as a safe starting point, can scale up based on monitoring
    const maxPoolSize = parseInt(process.env.MONGODB_MAX_POOL_SIZE || '100', 10);
    const minPoolSize = parseInt(process.env.MONGODB_MIN_POOL_SIZE || '10', 10);
    
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000, // How long to try selecting a server
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000, // Connection timeout
      family: 4, // Force IPv4 instead of IPv6
      readPreference: (process.env.MONGODB_READ_PREFERENCE || 'primary') as any, // Can use 'secondaryPreferred' for read scaling
      readConcern: { level: 'majority' }, // Ensure we read committed data
      writeConcern: { w: 'majority', j: true }, // Ensure writes are acknowledged and journaled
      // Optimized connection pooling for high concurrency (10k+ users)
      maxPoolSize: maxPoolSize, // Increased from 10 to 100 for high concurrency
      minPoolSize: minPoolSize, // Increased from 2 to 10 to maintain warm connections
      maxIdleTimeMS: 60000, // Increased from 30s to 60s to reduce connection churn
      heartbeatFrequencyMS: 10000, // How often to check server status
      // Additional performance optimizations
      retryWrites: true, // Retry write operations on transient errors
      retryReads: true, // Retry read operations on transient errors
      // Compression for network efficiency (MongoDB 3.4+)
      compressors: ['zlib'] as any, // Enable compression to reduce network traffic
    });
    
    logger.info(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
    logger.info(`📊 Connection Pool: max=${maxPoolSize}, min=${minPoolSize}`);
    
    // Optimize Mongoose settings for high concurrency
    optimizeMongooseSettings();
    
    // Enable query logging in development if requested
    enableQueryLogging();
    
    // Log connection pool status periodically (every 5 minutes in production)
    if (isProduction) {
      setInterval(() => {
        logConnectionPoolStatus();
      }, 5 * 60 * 1000); // Every 5 minutes
    }
    
    // PERFORMANCE FIX: Enhanced connection monitoring and error handling
    // Handle connection errors after initial connection
    mongoose.connection.on('error', (err) => {
      logger.error('❌ MongoDB connection error:', err.message);
      // Log connection pool status for debugging
      if (isProduction) {
        logConnectionPoolStatus();
      }
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
      // Enable buffering when disconnected so operations can queue
      if (!isProduction) {
        mongoose.set('bufferCommands', true);
      }
      // Log connection pool status
      if (isProduction) {
        logConnectionPoolStatus();
      }
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('✅ MongoDB reconnected successfully');
      // Restore buffering setting after reconnection
      mongoose.set('bufferCommands', isProduction);
      // Log connection pool status after reconnection
      if (isProduction) {
        logConnectionPoolStatus();
      }
    });
    
    // PERFORMANCE: Monitor connection pool usage
    mongoose.connection.on('connected', () => {
      if (isProduction) {
        // Log initial connection pool status
        setTimeout(() => {
          logConnectionPoolStatus();
        }, 5000); // Wait 5 seconds for pool to stabilize
      }
    });
    
  } catch (error: any) {
    logger.error('❌ Error connecting to MongoDB:', error.message);
    logger.error('\n🔧 Troubleshooting tips:');
    logger.error('1. Make sure MongoDB is running:');
    logger.error('   - Windows: Check if MongoDB service is running (services.msc)');
    logger.error('   - Mac/Linux: Run "brew services start mongodb-community" or "sudo systemctl start mongod"');
    logger.error('   - Test connection: Run "mongosh" or "mongo" in terminal');
    logger.error('2. Check your MONGODB_URI in the .env file');
    logger.error('3. For Atlas: Verify network access and credentials');
    logger.error('4. For local: Default URI is mongodb://127.0.0.1:27017/pet-ecommerce\n');
    
    // PERFORMANCE NOTE: Server continues without database for resilience
    // This allows the server to start and handle health checks even if DB is temporarily unavailable
    // The checkDatabase middleware will handle returning proper 503 errors for API requests
    // This is intentional for high availability, but monitoring should alert on DB connection failures
    logger.warn('⚠️  Server starting WITHOUT database connection');
    logger.warn('⚠️  API requests will return 503 errors until DB is connected');
    logger.warn('⚠️  Monitor database connection status and set up alerts for production\n');
  }
};

// Helper function to check if database is connected
export const isDatabaseConnected = (): boolean => {
  return mongoose.connection.readyState === 1; // 1 = connected
};