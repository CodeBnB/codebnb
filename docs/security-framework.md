# Security Framework - Code Marketplace

## Overview

This document outlines the security-first approach for the Code Marketplace project, adapted from proven secure deployment practices. Our security framework ensures credentials are never exposed while maintaining development efficiency.

## Core Security Principles

### 1. Credential Separation
- **config.js/config.py** (real credentials) ← NEVER commit to git
- **config.template.js/config.template.py** (safe template) ← Safe to commit
- **CREDENTIAL_BACKUP_SYSTEM.md** ← Secure offline storage

### 2. Git Security
- Automatically excludes sensitive files from git commits
- Uses `git reset` to prevent accidental credential commits
- Template files show structure without exposing secrets

### 3. File Permission Security
- Config files: 600 permissions (owner read-only)
- Separate handling for development vs production permissions
- Web server ownership for web files, restricted ownership for config files

### 4. Environment Isolation
- Development environment (local)
- Staging environment (restricted access)
- Production environment (maximum security)

## Security Architecture

### File Structure
```
code-marketplace/
├── config.template.js          # Safe template (commit to git)
├── config.js                   # Real credentials (NEVER commit)
├── CREDENTIAL_BACKUP_SYSTEM.md # This file (NEVER commit)
├── deploy.sh                   # Secure deployment script
├── .env.template               # Environment template
├── .env                        # Real environment vars (NEVER commit)
└── docs/
    └── security-framework.md   # This documentation
```

### Configuration System

#### Template System (Safe to commit)
```javascript
// config.template.js
module.exports = {
  database: {
    host: 'PLACEHOLDER_DB_HOST',
    name: 'PLACEHOLDER_DB_NAME', 
    user: 'PLACEHOLDER_DB_USER',
    password: 'PLACEHOLDER_DB_PASSWORD',
    port: 5432
  },
  jwt: {
    secret: 'PLACEHOLDER_JWT_SECRET',
    expiresIn: '24h'
  },
  stripe: {
    publicKey: 'PLACEHOLDER_STRIPE_PUBLIC_KEY',
    secretKey: 'PLACEHOLDER_STRIPE_SECRET_KEY',
    webhookSecret: 'PLACEHOLDER_STRIPE_WEBHOOK_SECRET'
  },
  app: {
    port: 3000,
    environment: 'development',
    baseUrl: 'http://localhost:3000',
    corsOrigin: '*'
  },
  email: {
    provider: 'sendgrid', // or 'smtp'
    apiKey: 'PLACEHOLDER_EMAIL_API_KEY',
    fromAddress: 'noreply@yourmarketplace.com'
  }
};
```

#### Environment Template (Safe to commit)
```bash
# .env.template
# Database Configuration
DB_HOST=PLACEHOLDER_DB_HOST
DB_NAME=PLACEHOLDER_DB_NAME
DB_USER=PLACEHOLDER_DB_USER
DB_PASSWORD=PLACEHOLDER_DB_PASSWORD
DB_PORT=5432

# JWT Configuration
JWT_SECRET=PLACEHOLDER_JWT_SECRET

# Stripe Configuration
STRIPE_PUBLIC_KEY=PLACEHOLDER_STRIPE_PUBLIC_KEY
STRIPE_SECRET_KEY=PLACEHOLDER_STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=PLACEHOLDER_STRIPE_WEBHOOK_SECRET

# Application Configuration
NODE_ENV=development
PORT=3000
BASE_URL=http://localhost:3000

# Email Configuration
EMAIL_API_KEY=PLACEHOLDER_EMAIL_API_KEY
EMAIL_FROM=noreply@yourmarketplace.com
```

## Deployment Security

### Secure Deployment Script Structure
```bash
#!/bin/bash
# Secure Code Marketplace Deploy Script
set -e  # Exit on any error

VPS_HOST="marketplace-production"
APP_DIR="/var/apps/code-marketplace"
WEB_DIR="/var/www/marketplace"
BACKUP_DIR="/var/backups/marketplace"

# Security checks before deployment
check_security() {
    # Verify sensitive files exist
    if [[ ! -f "config.js" ]]; then
        echo "❌ ERROR: config.js not found!"
        echo "📝 Create config.js from config.template.js"
        exit 1
    fi
    
    # Verify config.js permissions
    CONFIG_PERMS=$(stat -c "%a" config.js)
    if [[ "$CONFIG_PERMS" != "600" ]]; then
        chmod 600 config.js
        echo "✅ Fixed config.js permissions to 600"
    fi
}

# Git security - never commit sensitive files
secure_git_commit() {
    git add .
    git reset config.js 2>/dev/null || true
    git reset .env 2>/dev/null || true
    git reset CREDENTIAL_BACKUP_SYSTEM.md 2>/dev/null || true
    git reset deploy.sh 2>/dev/null || true
}

# Secure file transfer excluding sensitive files
secure_deploy() {
    rsync -avz --progress --delete --timeout=60 \
      --exclude 'node_modules/' \
      --exclude '.git/' \
      --exclude '*.log' \
      --exclude 'deploy*.sh' \
      --exclude '.env' \
      --exclude 'config.js' \
      --exclude 'CREDENTIAL_BACKUP_SYSTEM.md' \
      --exclude '*SECURITY*' \
      --exclude 'coverage/' \
      --exclude 'test/' \
      --include 'config.template.js' \
      --include '.env.template' \
      . $VPS_HOST:$APP_DIR/
}
```

## Database Security

### Connection Security
- Use connection pooling with maximum connection limits
- Implement connection timeout protection
- Use SSL/TLS for database connections in production
- Separate read-only and read-write database users

### Schema Security
```sql
-- Create marketplace-specific database user
CREATE USER marketplace_app WITH PASSWORD 'STRONG_GENERATED_PASSWORD';

-- Grant minimum necessary permissions
GRANT CONNECT ON DATABASE marketplace TO marketplace_app;
GRANT USAGE ON SCHEMA public TO marketplace_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO marketplace_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO marketplace_app;

-- Create read-only user for reporting/analytics
CREATE USER marketplace_readonly WITH PASSWORD 'ANOTHER_STRONG_PASSWORD';
GRANT CONNECT ON DATABASE marketplace TO marketplace_readonly;
GRANT USAGE ON SCHEMA public TO marketplace_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO marketplace_readonly;
```

## API Security

### Authentication & Authorization
```javascript
// JWT token validation middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Rate limiting
const rateLimit = require('express-rate-limit');
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
```

### Input Validation
```javascript
const { body, validationResult } = require('express-validator');

// Product creation validation
const validateProduct = [
  body('title').trim().isLength({ min: 3, max: 100 }),
  body('description').trim().isLength({ min: 10, max: 5000 }),
  body('price').isFloat({ min: 0.01, max: 10000 }),
  body('category').isIn(['script', 'theme', 'plugin', 'template']),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
```

## Payment Security

### Stripe Integration Security
```javascript
// Webhook signature verification
const verifyStripeSignature = (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    req.stripeEvent = event;
    next();
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send('Webhook signature verification failed');
  }
};

// Never store sensitive payment data
const processPayment = async (paymentIntentId, metadata) => {
  // Only store: payment_intent_id, amount, status, marketplace_fee
  // Never store: card details, full payment method info
  return await db.payments.create({
    payment_intent_id: paymentIntentId,
    seller_id: metadata.seller_id,
    product_id: metadata.product_id,
    amount_cents: metadata.amount_cents,
    marketplace_fee_cents: Math.round(metadata.amount_cents * 0.01), // 1%
    status: 'pending'
  });
};
```

## File Security

### Upload Security
```javascript
const multer = require('multer');
const path = require('path');

// Secure file upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/pending/'); // Quarantine uploads initially
  },
  filename: (req, file, cb) => {
    // Generate secure filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Only allow specific file types
  const allowedTypes = /\.(zip|tar|gz|js|php|html|css|json)$/i;
  const allowed = allowedTypes.test(file.originalname);
  cb(null, allowed);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});
```

## Environment-Specific Security

### Development
- Use weak passwords for local development
- Enable verbose logging
- Disable rate limiting for testing
- Allow CORS from any origin

### Production
- Enforce strong passwords and secrets
- Minimal logging (no sensitive data)
- Strict rate limiting
- Restricted CORS origins
- HTTPS only
- Security headers (HSTS, CSP, etc.)

## Security Checklist

### Pre-Deployment
- [ ] All sensitive files have correct permissions (600)
- [ ] No credentials committed to git
- [ ] Template files are up-to-date
- [ ] Strong passwords generated for all services
- [ ] SSL certificates valid and renewed

### Post-Deployment
- [ ] Database connections working with restricted user
- [ ] API rate limiting active
- [ ] File upload restrictions enforced
- [ ] Payment webhooks verified
- [ ] Security headers present
- [ ] HTTPS redirects working

### Regular Maintenance
- [ ] Rotate JWT secrets monthly
- [ ] Update dependencies for security patches
- [ ] Review access logs for suspicious activity
- [ ] Backup credential documentation securely
- [ ] Test disaster recovery procedures

## Incident Response

### If Credentials Are Compromised
1. **Immediate Actions**
   - Rotate all affected passwords/keys immediately
   - Revoke compromised JWT tokens
   - Check access logs for unauthorized access
   - Notify affected users if data was accessed

2. **Recovery Steps**
   - Generate new secure credentials
   - Update production systems
   - Test all integrations
   - Document incident and lessons learned

### Emergency Contacts
- Database Administrator: [SECURE_CONTACT_INFO]
- Security Team: [SECURE_CONTACT_INFO]
- Hosting Provider Support: [SECURE_CONTACT_INFO]
- Stripe Support: [SECURE_CONTACT_INFO]

---

**This security framework ensures our marketplace starts with security as a foundational requirement, not an afterthought.**
