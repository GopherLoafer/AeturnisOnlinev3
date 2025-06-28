// UI Manager for Aeturnis Online MMORPG
class UIManager {
    constructor() {
        this.elements = {};
        this.messageTimeout = 5000; // 5 seconds for messages
        this.init();
    }

    // Initialize UI elements and event listeners
    init() {
        console.log('🎨 Initializing UI Manager');
        this.cacheElements();
        this.setupEventListeners();
        this.initializeConnectionStatus();
    }

    // Cache frequently used DOM elements
    cacheElements() {
        this.elements = {
            // Containers
            loadingScreen: document.getElementById('loading-screen'),
            app: document.getElementById('app'),
            authContainer: document.getElementById('auth-container'),
            gameContainer: document.getElementById('game-container'),
            
            // Forms
            loginForm: document.getElementById('login-form'),
            registerForm: document.getElementById('register-form'),
            
            // Buttons and links
            showRegister: document.getElementById('show-register'),
            showLogin: document.getElementById('show-login'),
            
            // Status elements
            connectionIndicator: document.getElementById('connection-indicator'),
            connectionText: document.getElementById('connection-text'),
            serverInfo: document.getElementById('server-info'),
            
            // Message containers
            errorContainer: document.getElementById('error-container'),
            successContainer: document.getElementById('success-container'),
            errorText: document.querySelector('.error-text'),
            successText: document.querySelector('.success-text'),
            errorClose: document.querySelector('.error-close'),
            successClose: document.querySelector('.success-close')
        };
    }

    // Set up event listeners
    setupEventListeners() {
        // Form switching
        this.elements.showRegister?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });

        this.elements.showLogin?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });

        // Form submissions
        this.elements.loginForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        this.elements.registerForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Message close buttons
        this.elements.errorClose?.addEventListener('click', () => {
            this.hideError();
        });

        this.elements.successClose?.addEventListener('click', () => {
            this.hideSuccess();
        });
    }

    // Show loading screen
    showLoading() {
        this.elements.loadingScreen?.classList.remove('hidden');
        this.elements.app?.classList.add('hidden');
    }

    // Hide loading screen and show app
    hideLoading() {
        this.elements.loadingScreen?.classList.add('hidden');
        this.elements.app?.classList.remove('hidden');
    }

    // Show login form
    showLoginForm() {
        this.elements.loginForm?.classList.remove('hidden');
        this.elements.registerForm?.classList.add('hidden');
    }

    // Show register form
    showRegisterForm() {
        this.elements.registerForm?.classList.remove('hidden');
        this.elements.loginForm?.classList.add('hidden');
    }

    // Show authentication container
    showAuth() {
        this.elements.authContainer?.classList.remove('hidden');
        this.elements.gameContainer?.classList.add('hidden');
        this.showLoginForm(); // Default to login form
    }

    // Show game container
    showGame() {
        this.elements.gameContainer?.classList.remove('hidden');
        this.elements.authContainer?.classList.add('hidden');
    }

    // Handle login form submission
    async handleLogin() {
        const formData = new FormData(this.elements.loginForm);
        const username = formData.get('username');
        const password = formData.get('password');

        if (!username || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        try {
            this.showInfo('Attempting login...');
            await window.api.login(username, password);
            this.showSuccess('Login successful!');
            this.showGame();
        } catch (error) {
            this.showError(error.message);
        }
    }

    // Handle register form submission
    async handleRegister() {
        const formData = new FormData(this.elements.registerForm);
        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword')
        };

        // Basic validation
        if (!userData.username || !userData.email || !userData.password) {
            this.showError('Please fill in all fields');
            return;
        }

        if (userData.password !== userData.confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }

        if (userData.password.length < 6) {
            this.showError('Password must be at least 6 characters');
            return;
        }

        if (!/^[a-zA-Z0-9]+$/.test(userData.username)) {
            this.showError('Username can only contain letters and numbers');
            return;
        }

        try {
            this.showInfo('Creating account...');
            await window.api.register(userData);
            this.showSuccess('Account created successfully!');
            this.showLoginForm();
        } catch (error) {
            this.showError(error.message);
        }
    }

    // Update connection status
    updateConnectionStatus(status) {
        const indicator = this.elements.connectionIndicator;
        const text = this.elements.connectionText;
        
        if (!indicator || !text) return;

        // Remove all status classes
        indicator.classList.remove('connected', 'disconnected', 'connecting');
        
        switch (status) {
            case 'connected':
                indicator.classList.add('connected');
                text.textContent = 'Connected';
                break;
            case 'disconnected':
                indicator.classList.add('disconnected');
                text.textContent = 'Disconnected';
                break;
            case 'connecting':
            default:
                indicator.classList.add('connecting');
                text.textContent = 'Connecting...';
                break;
        }
    }

    // Initialize connection status monitoring
    initializeConnectionStatus() {
        this.updateConnectionStatus('connecting');
        
        // Update status every 30 seconds
        setInterval(() => {
            const status = window.api.getConnectionStatus();
            this.updateConnectionStatus(status.status);
        }, 30000);
    }

    // Show error message
    showError(message) {
        if (this.elements.errorText) {
            this.elements.errorText.textContent = message;
        }
        this.elements.errorContainer?.classList.remove('hidden');
        
        // Auto-hide after timeout
        setTimeout(() => {
            this.hideError();
        }, this.messageTimeout);
        
        console.error('UI Error:', message);
    }

    // Hide error message
    hideError() {
        this.elements.errorContainer?.classList.add('hidden');
    }

    // Show success message
    showSuccess(message) {
        if (this.elements.successText) {
            this.elements.successText.textContent = message;
        }
        this.elements.successContainer?.classList.remove('hidden');
        
        // Auto-hide after timeout
        setTimeout(() => {
            this.hideSuccess();
        }, this.messageTimeout);
        
        console.log('UI Success:', message);
    }

    // Hide success message
    hideSuccess() {
        this.elements.successContainer?.classList.add('hidden');
    }

    // Show info message (using success styling for now)
    showInfo(message) {
        this.showSuccess(message);
    }

    // Update server info display
    updateServerInfo(serverData) {
        if (!this.elements.serverInfo) return;

        const info = document.createElement('pre');
        info.textContent = JSON.stringify(serverData, null, 2);
        
        this.elements.serverInfo.innerHTML = '';
        this.elements.serverInfo.appendChild(info);
    }

    // Clear form data
    clearForms() {
        this.elements.loginForm?.reset();
        this.elements.registerForm?.reset();
    }

    // Disable form inputs
    disableForms() {
        const inputs = document.querySelectorAll('input, button');
        inputs.forEach(input => {
            input.disabled = true;
        });
    }

    // Enable form inputs
    enableForms() {
        const inputs = document.querySelectorAll('input, button');
        inputs.forEach(input => {
            input.disabled = false;
        });
    }

    // Show loading spinner on buttons
    showButtonLoading(buttonElement, originalText) {
        if (!buttonElement) return;
        
        buttonElement.disabled = true;
        buttonElement.innerHTML = `
            <span style="display: inline-block; width: 16px; height: 16px; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px;"></span>
            Loading...
        `;
    }

    // Restore button text
    restoreButton(buttonElement, originalText) {
        if (!buttonElement) return;
        
        buttonElement.disabled = false;
        buttonElement.textContent = originalText;
    }
}

// Create global UI manager instance
window.ui = new UIManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}