// API Client for Aeturnis Online MMORPG
class APIClient {
    constructor() {
        this.baseURL = window.location.origin;
        this.token = null;
        this.isConnected = false;
        this.retryAttempts = 3;
        this.retryDelay = 1000;
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        console.log('🔐 Authentication token set');
    }

    // Clear authentication token
    clearToken() {
        this.token = null;
        console.log('🔓 Authentication token cleared');
    }

    // Get headers for requests
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    // Make HTTP request with retry logic
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            method: 'GET',
            ...options,
            headers: {
                ...this.getHeaders(),
                ...options.headers
            }
        };

        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                console.log(`📡 API Request: ${config.method} ${endpoint} (attempt ${attempt})`);
                
                const response = await fetch(url, config);
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                this.isConnected = true;
                console.log(`✅ API Success: ${config.method} ${endpoint}`);
                return data;

            } catch (error) {
                console.error(`❌ API Error (attempt ${attempt}):`, error.message);
                
                if (attempt === this.retryAttempts) {
                    this.isConnected = false;
                    throw error;
                }

                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
            }
        }
    }

    // GET request
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    // POST request
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT request
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // Health check
    async checkHealth() {
        try {
            const health = await this.get('/api/health');
            this.isConnected = true;
            return health;
        } catch (error) {
            this.isConnected = false;
            throw error;
        }
    }

    // Get server status
    async getStatus() {
        return this.get('/api/status');
    }

    // Authentication methods (placeholder for Phase 2)
    async login(username, password) {
        console.log('🔄 Login attempt:', username);
        // Phase 2 implementation will go here
        throw new Error('Authentication system not implemented yet (Phase 2)');
    }

    async register(userData) {
        console.log('🔄 Registration attempt:', userData.username);
        // Phase 2 implementation will go here
        throw new Error('Authentication system not implemented yet (Phase 2)');
    }

    async logout() {
        console.log('🔄 Logout');
        this.clearToken();
        // Phase 2 implementation will go here
    }

    // Get connection status
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            hasToken: !!this.token,
            status: this.isConnected ? 'connected' : 'disconnected'
        };
    }

    // Test API connectivity
    async testConnection() {
        try {
            await this.checkHealth();
            return true;
        } catch (error) {
            console.error('Connection test failed:', error.message);
            return false;
        }
    }
}

// Create global API client instance
window.api = new APIClient();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIClient;
}