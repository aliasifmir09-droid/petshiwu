import mongoose from 'mongoose';
import { optimizeMongooseSettings, enableQueryLogging, logConnectionPoolStatus } from './databaseOptimization';

export const connectDatabase = async () => {
  try {
    // Force IPv4 connection
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pet-ecommerce';
    
    console.log('Attempting to connect to MongoDB...');
    // Sanitize URI - remove all credentials
    const sanitizedUri = mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//<credentials>@').replace(/\/\/[^@]+@/, '//<credentials>@');
    console.log('MongoDB URI:', sanitizedUri);
    
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
    
    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
    console.log(`📊 Connection Pool: max=${maxPoolSize}, min=${minPoolSize}`);
    
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
    
    // Handle connection errors after initial connection
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
      // Enable buffering when disconnected so operations can queue
      if (!isProduction) {
        mongoose.set('bufferCommands', true);
      }
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully');
      // Restore buffering setting after reconnection
      mongoose.set('bufferCommands', isProduction);
    });
    
  } catch (error: any) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    console.error('\n🔧 Troubleshooting tips:');
    console.error('1. Make sure MongoDB is running:');
    console.error('   - Windows: Check if MongoDB service is running (services.msc)');
    console.error('   - Mac/Linux: Run "brew services start mongodb-community" or "sudo systemctl start mongod"');
    console.error('   - Test connection: Run "mongosh" or "mongo" in terminal');
    console.error('2. Check your MONGODB_URI in the .env file');
    console.error('3. For Atlas: Verify network access and credentials');
    console.error('4. For local: Default URI is mongodb://127.0.0.1:27017/pet-ecommerce\n');
    
    // Don't exit - let server run without database
    // The checkDatabase middleware will handle returning proper errors
    console.warn('⚠️  Server starting WITHOUT database connection');
    console.warn('⚠️  API requests will return 503 errors until DB is connected\n');
  }
};

// Helper function to check if database is connected
export const isDatabaseConnected = (): boolean => {
  return mongoose.connection.readyState === 1; // 1 = connected
};