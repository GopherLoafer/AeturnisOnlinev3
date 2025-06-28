/**
 * Configuration Manager for Aeturnis Online MMORPG
 * Handles environment variables and application settings
 */
class Config {
  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.loadConfiguration();
    this.validateConfiguration();
  }

  loadConfiguration() {
    // Core server settings
    this.port = parseInt(process.env.PORT) || 3000;
    this.host = process.env.HOST || '0.0.0.0';
    
    // Security settings
    this.jwtSecret = process.env.JWT_SECRET || this.generateDevelopmentSecret();
    this.sessionSecret = process.env.SESSION_SECRET || this.generateDevelopmentSecret();
    
    // Database settings
    this.databasePath = process.env.DATABASE_PATH || './backend/data';
    this.enableBackups = process.env.ENABLE_BACKUPS !== 'false';
    this.backupInterval = parseInt(process.env.BACKUP_INTERVAL) || 3600000; // 1 hour
    
    // API settings
    this.apiRateLimit = parseInt(process.env.API_RATE_LIMIT) || 100;
    this.apiTimeWindow = parseInt(process.env.API_TIME_WINDOW) || 900000; // 15 minutes
    
    // Frontend settings
    this.frontendUrl = process.env.FRONTEND_URL || `http://localhost:${this.port}`;
    this.corsOrigins = process.env.CORS_ORIGINS ? 
      process.env.CORS_ORIGINS.split(',') : 
      [this.frontendUrl];
    
    // Game settings
    this.maxPlayersPerServer = parseInt(process.env.MAX_PLAYERS_PER_SERVER) || 1000;
    this.sessionTimeout = parseInt(process.env.SESSION_TIMEOUT) || 7200000; // 2 hours
    this.gameTickRate = parseInt(process.env.GAME_TICK_RATE) || 1000; // 1 second
    
    // Admin settings
    this.adminEmails = process.env.ADMIN_EMAILS ? 
      process.env.ADMIN_EMAILS.split(',') : 
      [];
    this.adminLogLevel = process.env.ADMIN_LOG_LEVEL || 'info';
    
    // Performance settings
    this.enableCompression = process.env.ENABLE_COMPRESSION !== 'false';
    this.enableCaching = process.env.ENABLE_CACHING !== 'false';
    this.cacheMaxAge = parseInt(process.env.CACHE_MAX_AGE) || 3600; // 1 hour
    
    // WebSocket settings (for future phases)
    this.wsEnabled = process.env.WS_ENABLED !== 'false';
    this.wsPort = parseInt(process.env.WS_PORT) || (this.port + 1);
    
    console.log(`🔧 Configuration loaded for ${this.environment} environment`);
  }

  // Generate a random secret for development (warns about production)
  generateDevelopmentSecret() {
    if (this.environment === 'production') {
      throw new Error('JWT_SECRET and SESSION_SECRET must be set in production environment');
    }
    
    const crypto = require('crypto');
    const secret = crypto.randomBytes(32).toString('hex');
    console.warn(`⚠️ Using generated secret for ${this.environment}. Set proper secrets for production!`);
    return secret;
  }

  // Validate configuration
  validateConfiguration() {
    const errors = [];

    // Production-specific validations
    if (this.environment === 'production') {
      if (!process.env.JWT_SECRET) {
        errors.push('JWT_SECRET is required in production');
      }
      if (!process.env.SESSION_SECRET) {
        errors.push('SESSION_SECRET is required in production');
      }
      if (this.jwtSecret.length < 32) {
        errors.push('JWT_SECRET must be at least 32 characters in production');
      }
    }

    // General validations
    if (this.port < 1 || this.port > 65535) {
      errors.push('PORT must be between 1 and 65535');
    }

    if (this.apiRateLimit < 1) {
      errors.push('API_RATE_LIMIT must be positive');
    }

    if (this.maxPlayersPerServer < 1) {
      errors.push('MAX_PLAYERS_PER_SERVER must be positive');
    }

    if (errors.length > 0) {
      console.error('❌ Configuration validation failed:');
      errors.forEach(error => console.error(`  - ${error}`));
      throw new Error('Invalid configuration');
    }

    console.log('✅ Configuration validation passed');
    return true;
  }

  // Get database configuration
  getDatabaseConfig() {
    return {
      path: this.databasePath,
      enableBackups: this.enableBackups,
      backupInterval: this.backupInterval
    };
  }

  // Get security configuration
  getSecurityConfig() {
    return {
      jwtSecret: this.jwtSecret,
      sessionSecret: this.sessionSecret,
      corsOrigins: this.corsOrigins
    };
  }

  // Get server configuration
  getServerConfig() {
    return {
      port: this.port,
      host: this.host,
      environment: this.environment,
      frontendUrl: this.frontendUrl
    };
  }

  // Get API configuration
  getAPIConfig() {
    return {
      rateLimit: this.apiRateLimit,
      timeWindow: this.apiTimeWindow,
      enableCompression: this.enableCompression,
      enableCaching: this.enableCaching,
      cacheMaxAge: this.cacheMaxAge
    };
  }

  // Get game configuration
  getGameConfig() {
    return {
      maxPlayersPerServer: this.maxPlayersPerServer,
      sessionTimeout: this.sessionTimeout,
      gameTickRate: this.gameTickRate
    };
  }

  // Get WebSocket configuration
  getWebSocketConfig() {
    return {
      enabled: this.wsEnabled,
      port: this.wsPort
    };
  }

  // Get admin configuration
  getAdminConfig() {
    return {
      adminEmails: this.adminEmails,
      logLevel: this.adminLogLevel
    };
  }

  // Get all configuration as object (safe for API responses)
  getSafeConfig() {
    return {
      environment: this.environment,
      server: {
        version: '1.0.0',
        phase: '1A - Replit Setup'
      },
      game: this.getGameConfig(),
      api: {
        rateLimit: this.apiRateLimit,
        enableCaching: this.enableCaching
      },
      features: {
        websockets: this.wsEnabled,
        compression: this.enableCompression,
        backups: this.enableBackups
      }
    };
  }

  // Get full configuration (includes secrets - for internal use only)
  getAll() {
    return {
      environment: this.environment,
      server: this.getServerConfig(),
      security: this.getSecurityConfig(),
      database: this.getDatabaseConfig(),
      api: this.getAPIConfig(),
      game: this.getGameConfig(),
      websocket: this.getWebSocketConfig(),
      admin: this.getAdminConfig()
    };
  }

  // Environment checks
  isProduction() {
    return this.environment === 'production';
  }

  isDevelopment() {
    return this.environment === 'development';
  }

  isTest() {
    return this.environment === 'test';
  }

  // Dynamic configuration updates (for admin use)
  updateGameConfig(updates) {
    Object.assign(this, updates);
    console.log('🔄 Game configuration updated:', updates);
  }
}

// Create singleton instance
const config = new Config();

module.exports = config;