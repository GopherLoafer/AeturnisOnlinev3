const express = require('express');
const router = express.Router();
const database = require('../utils/database');
const config = require('../utils/config');

/**
 * Main API Routes for Aeturnis Online MMORPG
 * Phase 1A: Basic server endpoints and health monitoring
 */

// Health check endpoint - comprehensive server status
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: config.environment,
      version: '1.0.0',
      phase: '1A - Replit Setup Complete',
      server: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };

    // Test database connectivity
    try {
      const dbStats = await database.getStats();
      health.database = {
        status: 'connected',
        collections: Object.keys(dbStats.collections).length,
        totalItems: dbStats.totalItems,
        totalSize: `${Math.round(dbStats.totalSize / 1024)}KB`
      };
    } catch (error) {
      health.database = {
        status: 'error',
        error: error.message
      };
      health.status = 'degraded';
    }

    // Memory usage information
    const memUsage = process.memoryUsage();
    health.memory = {
      used: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`
    };

    res.json(health);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Server status endpoint - detailed game server information
router.get('/status', async (req, res) => {
  try {
    const status = {
      message: 'Aeturnis Online MMORPG Server',
      status: 'running',
      phase: '1A - Replit Setup Complete',
      timestamp: new Date().toISOString(),
      server: {
        environment: config.environment,
        version: '1.0.0',
        uptime: Math.floor(process.uptime()),
        nodeVersion: process.version,
        startTime: new Date(Date.now() - process.uptime() * 1000).toISOString()
      },
      features: {
        authentication: false,    // Phase 2
        characters: false,        // Phase 3
        gameWorld: false,         // Phase 4
        combat: false,            // Phase 5
        economy: false,           // Phase 6
        social: false,            // Phase 7
        adminPanel: false,        // Phase 8
        websockets: config.getWebSocketConfig().enabled
      },
      nextPhase: {
        phase: '2A',
        name: 'User Registration',
        description: 'Implement user registration and JWT authentication system',
        estimatedCompletion: 'Phase 2A-2C'
      },
      endpoints: {
        health: '/api/health',
        status: '/api/status',
        config: '/api/config',
        database: '/api/database/stats'
      }
    };

    // Add database information
    try {
      const dbStats = await database.getStats();
      status.database = {
        initialized: true,
        collections: dbStats.collections,
        lastBackup: dbStats.lastBackup,
        status: 'operational'
      };
    } catch (error) {
      status.database = {
        initialized: false,
        error: error.message,
        status: 'error'
      };
    }

    res.json(status);
  } catch (error) {
    console.error('Status check failed:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get server status',
        details: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Configuration endpoint - safe configuration for frontend
router.get('/config', (req, res) => {
  try {
    const safeConfig = config.getSafeConfig();
    res.json(safeConfig);
  } catch (error) {
    console.error('Config endpoint failed:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get configuration',
        details: error.message
      }
    });
  }
});

// Database statistics endpoint
router.get('/database/stats', async (req, res) => {
  try {
    const stats = await database.getStats();
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      statistics: stats
    });
  } catch (error) {
    console.error('Database stats failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Database initialization endpoint
router.post('/database/init', async (req, res) => {
  try {
    console.log('🔄 Manual database initialization requested...');
    
    await database.initializeCollections();
    
    res.json({
      success: true,
      message: 'Database reinitialized successfully',
      timestamp: new Date().toISOString(),
      collections: await database.list('config')
    });
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoint for database operations
router.get('/test/database', async (req, res) => {
  try {
    const testData = {
      testId: 'test_' + Date.now(),
      message: 'Database test successful',
      timestamp: new Date().toISOString()
    };
    
    // Test write
    await database.set('logs', testData.testId, testData);
    
    // Test read
    const retrieved = await database.get('logs', testData.testId);
    
    // Test search
    const searchResults = await database.search('logs', { testId: testData.testId });
    
    // Clean up test data
    await database.delete('logs', testData.testId);
    
    res.json({
      success: true,
      message: 'Database operations test passed',
      operations: {
        write: 'success',
        read: retrieved ? 'success' : 'failed',
        search: searchResults.length > 0 ? 'success' : 'failed',
        delete: 'success'
      }
    });
    
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Placeholder endpoints for future phases with helpful information
router.all('/auth/*', (req, res) => {
  res.status(501).json({
    error: {
      message: 'Authentication endpoints not implemented yet',
      phase: 'Phase 2: Authentication & Users',
      status: 'coming_soon',
      expectedEndpoints: [
        'POST /api/auth/register',
        'POST /api/auth/login',
        'POST /api/auth/logout',
        'POST /api/auth/refresh'
      ]
    }
  });
});

router.all('/characters/*', (req, res) => {
  res.status(501).json({
    error: {
      message: 'Character endpoints not implemented yet',
      phase: 'Phase 3: Character System',
      status: 'coming_soon',
      expectedEndpoints: [
        'GET /api/characters',
        'POST /api/characters/create',
        'PUT /api/characters/:id',
        'DELETE /api/characters/:id'
      ]
    }
  });
});

router.all('/game/*', (req, res) => {
  res.status(501).json({
    error: {
      message: 'Game endpoints not implemented yet',
      phase: 'Phase 4+: Game Features',
      status: 'coming_soon',
      expectedEndpoints: [
        'GET /api/game/zones',
        'POST /api/game/move',
        'GET /api/game/inventory',
        'POST /api/game/combat'
      ]
    }
  });
});

router.all('/admin/*', (req, res) => {
  res.status(501).json({
    error: {
      message: 'Admin endpoints not implemented yet',
      phase: 'Phase 8: Admin Panel',
      status: 'coming_soon',
      note: 'Admin tools will be built alongside each phase'
    }
  });
});

// Catch-all for undefined API routes
router.all('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'API endpoint not found',
      path: req.path,
      method: req.method,
      availableEndpoints: [
        'GET /api/health',
        'GET /api/status',
        'GET /api/config',
        'GET /api/database/stats',
        'POST /api/database/init',
        'GET /api/test/database'
      ]
    }
  });
});

module.exports = router;