/**
 * Validate required environment variables on startup
 * This prevents the application from starting with missing critical configuration
 */

export const validateEnv = () => {
  const required = [
    'MONGODB_URI',
    'JWT_SECRET'
  ];

  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  // Check JWT_SECRET strength
  if (process.env.JWT_SECRET) {
    if (process.env.JWT_SECRET.length < 32) {
      warnings.push('JWT_SECRET should be at least 32 characters long for security');
    }
    if (process.env.JWT_SECRET === 'fallback-secret-key' || process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-this-to-random-string-min-32-chars') {
      warnings.push('JWT_SECRET appears to be a default/example value. Please change it to a secure random string.');
    }
  }

  // Check optional but recommended variables
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.STRIPE_SECRET_KEY) {
      warnings.push('STRIPE_SECRET_KEY not set - donation payments will not work');
    }
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      warnings.push('PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET not set - PayPal checkout will fail');
    } else if (process.env.PAYPAL_ENV !== 'live') {
      warnings.push('PAYPAL_ENV is not live. Production is using PayPal Sandbox, so real customer PayPal payments will fail. Set PAYPAL_ENV=live with live REST credentials, and rebuild the frontend with VITE_PAYPAL_ENV=live and the live VITE_PAYPAL_CLIENT_ID.');
    }
    if (!process.env.GOOGLE_CLIENT_ID) {
      warnings.push('GOOGLE_CLIENT_ID not set - Continue with Google will stay hidden until you add the OAuth web client id and rebuild the frontend with VITE_GOOGLE_CLIENT_ID');
    }
  }

  if (missing.length > 0) {
    // Use console.error here because logger might not be initialized yet during startup
    console.error('\n❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\nPlease set these variables in your .env file or environment.\n');
    process.exit(1);
  }

  if (warnings.length > 0) {
    // Use console.warn here because logger might not be initialized yet during startup
    console.warn('\n⚠️  Environment variable warnings:');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
    console.warn('');
  }

  if (missing.length === 0 && warnings.length === 0) {
    // Use console.log here because logger might not be initialized yet during startup
    console.log('✅ All environment variables validated successfully\n');
  }
};

