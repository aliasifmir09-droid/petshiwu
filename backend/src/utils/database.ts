import mongoose from 'mongoose';

export const connectDatabase = async () => {
  try {
    // Force IPv4 connection
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pet-ecommerce';
    
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', mongoUri.replace(/\/\/.*@/, '//<credentials>@')); // Hide credentials in logs
    
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000, // Increased timeout
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4 instead of IPv6
      readPreference: 'primary', // Always read from primary to avoid stale data
      readConcern: { level: 'majority' }, // Ensure we read committed data
      // Connection pooling for better performance
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 2, // Maintain at least 2 socket connections
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      serverSelectionTimeoutMS: 5000, // How long to try selecting a server
      heartbeatFrequencyMS: 10000 // How often to check server status
    });
    
    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
    
    // Handle connection errors after initial connection
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully');
    });
    
  } catch (error: any) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    console.error('\n🔧 Troubleshooting tips:');
    console.error('1. Make sure MongoDB is running (check mongod service)');
    console.error('2. Check your MONGODB_URI in the .env file');
    console.error('3. For Atlas: Verify network access and credentials');
    console.error('4. For local: Try running "mongosh" to test connection\n');
    
    // Don't exit - let server run without database (will use cached data)
    console.warn('⚠️  Server starting WITHOUT database connection');
    console.warn('⚠️  Login and data operations will fail until DB is connected\n');
  }
};