// Main API Routes for Aeturnis Online MMORPG
const express = require('express');
const router = express.Router();
const database = require('../utils/database');
const config = require('../utils/config');

// Health check endpoint
router.get('/health', async (req, res) => {
    try {
        // Basic health check
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: config.environment,
            version: '1.0.0',
            phase: '1A - Replit Setup Complete'
        };

        // Test database connectivity
        try {
            const dbStats = await database.getStats();
            health.database = {
                status: 'connected',
                collections: Object.keys(dbStats.collections).length,
                totalSize: dbStats.totalSize
            };
        } catch (error) {
            health.database = {
                status: 'error',
                error: error.message
            };
        }

        // Add memory usage
        const memUsage = process.memoryUsage();
        health.memory = {
            used: Math.round(memUsage.heapUsed / 1024 / 1024),
            total: Math.round(memUsage.heapTotal / 1024 / 1024),
            external: Math.round(memUsage.external / 1024 / 1024)
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

// Server status endpoint
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
                nodeVersion: process.version
            },
            features: {
                authentication: false, // Phase 2
                characters: false,     // Phase 3
                gameWorld: false,      // Phase 4
                combat: false,         // Phase 5
                economy: false,        // Phase 6
                social: false,         // Phase 7
                adminPanel: false      // Phase 8
            },
            nextPhase: {
                phase: '2A',
                name: 'JWT Authentication',
                description: 'Implement user registration and login system'
            }
        };

        // Add database information
        try {
            const dbStats = await database.getStats();
            status.database = {
                initialized: true,
                collections: dbStats.collections,
                lastBackup: dbStats.lastBackup
            };
        } catch (error) {
            status.database = {
                initialized: false,
                error: error.message
            };
        }

        res.json(status);
    } catch (error) {
        console.error('Status check failed:', error);
        res.status(500).json({
            error: {
                message: 'Failed to get server status',
                details: error.message
            }
        });
    }
});

// Database initialization endpoint
router.post('/init', async (req, res) => {
    try {
        console.log('🔄 Initializing database collections...');
        
        await database.initializeCollections();
        
        // Create initial configuration
        const initialConfig = {
            gameVersion: '1.0.0',
            phase: '1A',
            initialized: new Date().toISOString(),
            settings: {
                maxPlayers: config.getGameConfig().maxPlayersPerServer,
                sessionTimeout: config.getGameConfig().sessionTimeout
            }
        };
        
        await database.set('config', 'server', initialConfig);
        
        console.log('✅ Database initialization complete');
        
        res.json({
            success: true,
            message: 'Database initialized successfully',
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

// Configuration endpoint
router.get('/config', (req, res) => {
    try {
        // Return safe configuration (no secrets)
        const safeConfig = {
            environment: config.environment,
            server: {
                version: '1.0.0',
                phase: '1A'
            },
            game: config.getGameConfig(),
            api: {
                rateLimit: config.getAPIConfig().rateLimit,
                enableCaching: config.getAPIConfig().enableCaching
            }
        };
        
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

// Placeholder endpoints for future phases
router.get('/auth/*', (req, res) => {
    res.status(501).json({
        error: {
            message: 'Authentication endpoints not implemented yet',
            phase: 'Phase 2: Authentication & Users',
            status: 'coming_soon'
        }
    });
});

router.get('/characters/*', (req, res) => {
    res.status(501).json({
        error: {
            message: 'Character endpoints not implemented yet',
            phase: 'Phase 3: Character System',
            status: 'coming_soon'
        }
    });
});

router.get('/game/*', (req, res) => {
    res.status(501).json({
        error: {
            message: 'Game endpoints not implemented yet',
            phase: 'Phase 4+: Game Features',
            status: 'coming_soon'
        }
    });
});

module.exports = router;