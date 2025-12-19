import mongoose from 'mongoose';

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
    
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000, // How long to try selecting a server
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000, // Connection timeout
      family: 4, // Force IPv4 instead of IPv6
      readPreference: 'primary', // Always read from primary to avoid stale data
      readConcern: { level: 'majority' }, // Ensure we read committed data
      // Connection pooling for better performance
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 2, // Maintain at least 2 socket connections
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      heartbeatFrequencyMS: 10000 // How often to check server status
    });
    
    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
    
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