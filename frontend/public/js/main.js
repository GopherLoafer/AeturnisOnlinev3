// Main Application Controller for Aeturnis Online MMORPG
class AeturnisOnline {
    constructor() {
        this.initialized = false;
        this.serverData = null;
        this.connectionCheckInterval = null;
    }

    // Initialize the application
    async init() {
        console.log('🚀 Initializing Aeturnis Online MMORPG');
        
        try {
            // Show loading screen
            window.ui.showLoading();
            
            // Initialize database if needed
            await this.initializeDatabase();
            
            // Test server connection
            await this.testServerConnection();
            
            // Load server status
            await this.loadServerStatus();
            
            // Set up periodic connection checks
            this.setupConnectionMonitoring();
            
            // Hide loading and show auth
            window.ui.hideLoading();
            window.ui.showAuth();
            
            this.initialized = true;
            console.log('✅ Aeturnis Online initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            window.ui.hideLoading();
            window.ui.showError(`Failed to connect to server: ${error.message}`);
            
            // Still show the UI even if server is down
            window.ui.showAuth();
        }
    }

    // Initialize database
    async initializeDatabase() {
        try {
            console.log('📁 Initializing database...');
            // The database will be initialized by the server
            // This is a placeholder for future client-side database needs
            console.log('✅ Database initialization complete');
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        }
    }

    // Test server connection
    async testServerConnection() {
        console.log('🔌 Testing server connection...');
        
        try {
            const health = await window.api.checkHealth();
            console.log('✅ Server connection established:', health);
            window.ui.updateConnectionStatus('connected');
            return health;
        } catch (error) {
            console.error('❌ Server connection failed:', error);
            window.ui.updateConnectionStatus('disconnected');
            throw error;
        }
    }

    // Load server status information
    async loadServerStatus() {
        try {
            console.log('📊 Loading server status...');
            const status = await window.api.getStatus();
            this.serverData = status;
            
            // Update UI with server information
            window.ui.updateServerInfo(status);
            
            console.log('✅ Server status loaded:', status);
            return status;
        } catch (error) {
            console.error('❌ Failed to load server status:', error);
            // Don't throw here as this is not critical for app startup
        }
    }

    // Set up periodic connection monitoring
    setupConnectionMonitoring() {
        // Check connection every 30 seconds
        this.connectionCheckInterval = setInterval(async () => {
            try {
                await window.api.testConnection();
                window.ui.updateConnectionStatus('connected');
            } catch (error) {
                window.ui.updateConnectionStatus('disconnected');
                console.log('Connection check failed - server may be down');
            }
        }, 30000);
        
        console.log('🔄 Connection monitoring started');
    }

    // Stop connection monitoring
    stopConnectionMonitoring() {
        if (this.connectionCheckInterval) {
            clearInterval(this.connectionCheckInterval);
            this.connectionCheckInterval = null;
            console.log('⏹️ Connection monitoring stopped');
        }
    }

    // Handle user authentication success
    onAuthenticationSuccess(userData) {
        console.log('🔐 Authentication successful:', userData);
        window.ui.showGame();
        
        // Future: Load user data, character data, etc.
        this.loadUserData(userData);
    }

    // Load user data after authentication
    async loadUserData(userData) {
        try {
            console.log('👤 Loading user data...');
            // Phase 2: Implement user data loading
            console.log('ℹ️ User data loading will be implemented in Phase 2');
        } catch (error) {
            console.error('❌ Failed to load user data:', error);
            window.ui.showError('Failed to load user data');
        }
    }

    // Handle application shutdown
    shutdown() {
        console.log('🛑 Shutting down Aeturnis Online...');
        this.stopConnectionMonitoring();
        window.ui.clearForms();
        this.initialized = false;
    }

    // Get application status
    getStatus() {
        return {
            initialized: this.initialized,
            connected: window.api.isConnected,
            serverData: this.serverData,
            timestamp: new Date().toISOString()
        };
    }

    // Refresh application data
    async refresh() {
        console.log('🔄 Refreshing application data...');
        
        try {
            await this.testServerConnection();
            await this.loadServerStatus();
            window.ui.showSuccess('Application data refreshed');
        } catch (error) {
            console.error('❌ Failed to refresh:', error);
            window.ui.showError('Failed to refresh application data');
        }
    }
}

// Application startup
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 DOM Content Loaded');
    
    // Create global application instance
    window.app = new AeturnisOnline();
    
    // Add global error handler
    window.addEventListener('error', (event) => {
        console.error('💥 Global Error:', event.error);
        window.ui.showError('An unexpected error occurred');
    });
    
    // Add unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
        console.error('💥 Unhandled Promise Rejection:', event.reason);
        window.ui.showError('An unexpected error occurred');
        event.preventDefault();
    });
    
    // Initialize the application
    try {
        await window.app.init();
    } catch (error) {
        console.error('💥 Critical startup error:', error);
    }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.app) {
        window.app.shutdown();
    }
});

// Development helpers (only available in development)
if (window.location.hostname === 'localhost' || window.location.hostname.includes('replit')) {
    window.dev = {
        // Get application status
        status: () => window.app?.getStatus(),
        
        // Force refresh
        refresh: () => window.app?.refresh(),
        
        // Test API endpoints
        testAPI: async () => {
            try {
                const health = await window.api.checkHealth();
                const status = await window.api.getStatus();
                console.log('API Test Results:', { health, status });
                return { health, status };
            } catch (error) {
                console.error('API Test Failed:', error);
                return { error: error.message };
            }
        },
        
        // Clear all data
        reset: () => {
            localStorage.clear();
            sessionStorage.clear();
            window.ui.clearForms();
            window.location.reload();
        },
        
        // Show demo error/success messages
        showError: (msg) => window.ui.showError(msg || 'Demo error message'),
        showSuccess: (msg) => window.ui.showSuccess(msg || 'Demo success message')
    };
    
    console.log('🔧 Development helpers available: window.dev');
}