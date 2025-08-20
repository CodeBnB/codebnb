// Code Marketplace Configuration Template
// ============================================
// 
// SAFE TO COMMIT TO GIT
//
// This template shows the structure of the configuration
// without exposing real credentials.
//
// To set up:
// 1. Copy this file to config.js
// 2. Replace PLACEHOLDER values with real credentials
// 3. Set permissions: chmod 600 config.js
//
// ============================================

module.exports = {
  // Database Configuration
  database: {
    host: 'PLACEHOLDER_DB_HOST',        // e.g., 'localhost' or 'db.example.com'
    name: 'PLACEHOLDER_DB_NAME',        // e.g., 'marketplace'
    user: 'PLACEHOLDER_DB_USER',        // e.g., 'marketplace_app'
    password: 'PLACEHOLDER_DB_PASSWORD', // Strong generated password
    port: 5432,                         // PostgreSQL default port
    ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 30000
    }
  },

  // JWT Authentication
  jwt: {
    secret: 'PLACEHOLDER_JWT_SECRET',    // Generate with: openssl rand -base64 32
    expiresIn: '24h',                   // Token expiration time
    issuer: 'code-marketplace',
    audience: 'marketplace-users'
  },

  // Stripe Payment Configuration
  stripe: {
    publicKey: 'PLACEHOLDER_STRIPE_PUBLIC_KEY',     // pk_test_... or pk_live_...
    secretKey: 'PLACEHOLDER_STRIPE_SECRET_KEY',     // sk_test_... or sk_live_...
    webhookSecret: 'PLACEHOLDER_STRIPE_WEBHOOK_SECRET', // whsec_...
    marketplaceFeePercent: 1.0,         // 1% marketplace fee
    currency: 'usd'
  },

  // Application Settings
  app: {
    name: 'Code Marketplace',
    port: process.env.PORT || 3000,
    environment: process.env.NODE_ENV || 'development',
    baseUrl: process.env.NODE_ENV === 'production' 
      ? 'https://yourmarketplace.com' 
      : 'http://localhost:3000',
    corsOrigin: process.env.NODE_ENV === 'production'
      ? ['https://yourmarketplace.com']
      : '*',
    maxUploadSize: '50mb',              // Maximum file upload size
    sessionSecret: 'PLACEHOLDER_SESSION_SECRET' // For session management
  },

  // Email Configuration
  email: {
    provider: 'sendgrid',               // 'sendgrid', 'smtp', or 'ses'
    apiKey: 'PLACEHOLDER_EMAIL_API_KEY', // SendGrid API key
    fromAddress: 'noreply@yourmarketplace.com',
    fromName: 'Code Marketplace',
    templates: {
      welcome: 'PLACEHOLDER_WELCOME_TEMPLATE_ID',
      purchase: 'PLACEHOLDER_PURCHASE_TEMPLATE_ID',
      sale: 'PLACEHOLDER_SALE_TEMPLATE_ID'
    }
  },

  // File Storage
  storage: {
    type: 'local',                      // 'local', 's3', or 'gcs'
    local: {
      uploadsPath: './uploads',
      maxFileSize: 50 * 1024 * 1024,   // 50MB
      allowedExtensions: ['.zip', '.tar.gz', '.js', '.php', '.html', '.css', '.json']
    },
    s3: {
      bucket: 'PLACEHOLDER_S3_BUCKET',
      region: 'PLACEHOLDER_S3_REGION',
      accessKeyId: 'PLACEHOLDER_S3_ACCESS_KEY',
      secretAccessKey: 'PLACEHOLDER_S3_SECRET_KEY'
    }
  },

  // Security Settings
  security: {
    rateLimiting: {
      windowMs: 15 * 60 * 1000,        // 15 minutes
      maxRequests: process.env.NODE_ENV === 'production' ? 100 : 1000,
      skipSuccessfulRequests: false
    },
    bcryptRounds: 12,                   // Password hashing rounds
    requireEmailVerification: true,
    passwordMinLength: 8,
    sessionTimeout: 24 * 60 * 60 * 1000 // 24 hours
  },

  // Logging Configuration
  logging: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    file: {
      enabled: true,
      filename: 'marketplace.log',
      maxFiles: 5,
      maxSize: '10m'
    },
    console: {
      enabled: process.env.NODE_ENV !== 'production'
    }
  },

  // Redis Configuration (for sessions, caching, queues)
  redis: {
    host: 'PLACEHOLDER_REDIS_HOST',     // e.g., 'localhost'
    port: 6379,
    password: 'PLACEHOLDER_REDIS_PASSWORD',
    db: 0,
    keyPrefix: 'marketplace:'
  },

  // Development/Testing Settings
  development: {
    enableSwagger: true,                // API documentation
    mockPayments: false,                // Use mock Stripe for testing
    seedDatabase: true,                 // Populate with test data
    bypassEmailVerification: false
  }
};

// Security Notes:
// - Never commit the real config.js file
// - Keep config.js permissions at 600 (owner read-only)
// - Rotate JWT secrets regularly
// - Use strong, unique passwords for all services
// - Enable SSL/HTTPS in production
// - Regularly update and patch dependencies
