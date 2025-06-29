/**
 * Character Creation Wizard JavaScript
 * Handles wizard navigation, validation, and interactions
 */

class CharacterCreationWizard {
    constructor() {
        this.currentStep = window.currentStep || 1;
        this.sessionData = window.sessionData || {};
        this.validationCache = new Map();
        this.performanceOptimized = false;
        this.init();
    }

    init() {
        // Initialize performance optimizations if available
        if (window.PerformanceUtils) {
            this.initializePerformanceOptimizations();
        }
        
        this.setupEventListeners();
        this.setupKeyboardNavigation();
        this.loadStepData();
    }
    
    initializePerformanceOptimizations() {
        // Initialize performance monitoring
        window.PerformanceUtils.initPerformanceOptimizations();
        
        // Create optimized function references
        this.optimizedAutoSave = window.PerformanceUtils.debounce(
            this.performAutoSave.bind(this), 
            1000
        );
        
        this.optimizedValidation = window.PerformanceUtils.debounce(
            this.performValidation.bind(this), 
            500
        );
        
        this.performanceOptimized = true;
    }

    setupEventListeners() {
        // Auto-save form data on input changes
        document.addEventListener('input', this.debounce((e) => {
            if (e.target.matches('input, select, textarea')) {
                if (this.performanceOptimized && this.optimizedAutoSave) {
                    this.optimizedAutoSave();
                } else {
                    this.autoSaveStep();
                }
            }
        }, 1000));

        // Prevent form submission
        document.addEventListener('submit', (e) => {
            e.preventDefault();
        });

        // Step indicator navigation
        document.querySelectorAll('.step-indicator-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                const stepNumber = index + 1;
                if (stepNumber < this.currentStep) {
                    this.navigateToStep(stepNumber);
                }
            });
        });
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Tab navigation
            if (e.ctrlKey && e.key === 'ArrowLeft') {
                e.preventDefault();
                this.goToPreviousStep();
            }
            
            if (e.ctrlKey && e.key === 'ArrowRight') {
                e.preventDefault();
                const nextBtn = document.getElementById('next-step-btn');
                if (nextBtn && !nextBtn.disabled) {
                    nextBtn.click();
                }
            }

            // Enter to proceed (if valid)
            if (e.key === 'Enter' && e.target.matches('input')) {
                e.preventDefault();
                const nextBtn = document.getElementById('next-step-btn');
                if (nextBtn && !nextBtn.disabled) {
                    nextBtn.click();
                }
            }
        });
    }

    loadStepData() {
        // Load any persisted step data
        const stepKey = `wizard_step_${this.currentStep}`;
        const savedData = localStorage.getItem(stepKey);
        
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.populateFormData(data);
            } catch (error) {
                console.warn('Failed to load saved step data:', error);
            }
        }
    }

    populateFormData(data) {
        Object.entries(data).forEach(([key, value]) => {
            const input = document.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'radio' || input.type === 'checkbox') {
                    const option = document.querySelector(`[name="${key}"][value="${value}"]`);
                    if (option) {
                        option.checked = true;
                        option.dispatchEvent(new Event('change'));
                    }
                } else {
                    input.value = value;
                    input.dispatchEvent(new Event('input'));
                }
            }
        });
    }

    autoSaveStep() {
        if (this.performanceOptimized && this.optimizedAutoSave) {
            this.optimizedAutoSave();
        } else {
            this.performAutoSave();
        }
    }
    
    performAutoSave() {
        const formData = this.collectStepData();
        const stepKey = `wizard_step_${this.currentStep}`;
        
        try {
            localStorage.setItem(stepKey, JSON.stringify(formData));
        } catch (error) {
            console.warn('Failed to auto-save step data:', error);
        }
    }
    
    async performValidation(name, force = false) {
        return await this.validateNameInternal(name, force);
    }

    collectStepData() {
        const data = {};
        const inputs = document.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            if (input.name) {
                if (input.type === 'radio' || input.type === 'checkbox') {
                    if (input.checked) {
                        data[input.name] = input.value;
                    }
                } else if (input.value) {
                    data[input.name] = input.value;
                }
            }
        });
        
        return data;
    }

    navigateToStep(stepNumber) {
        if (stepNumber < 1 || stepNumber > 5) return;
        
        this.showLoading();
        window.location.href = `/game/character-creation-wizard?step=${stepNumber}`;
    }

    goToPreviousStep() {
        if (this.currentStep > 1) {
            this.navigateToStep(this.currentStep - 1);
        }
    }

    async proceedToNextStep(stepData) {
        this.showLoading();
        
        try {
            const response = await fetch('/api/character-creation/step', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    step: this.currentStep,
                    data: stepData || this.collectStepData()
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Clear saved data for this step
                localStorage.removeItem(`wizard_step_${this.currentStep}`);
                
                // Navigate to next step
                this.navigateToStep(this.currentStep + 1);
            } else {
                this.hideLoading();
                this.showError(result.error || 'An error occurred');
            }
        } catch (error) {
            this.hideLoading();
            console.error('Step error:', error);
            this.showError('Network error. Please try again.');
        }
    }

    // Name validation with caching
    async validateName(name, force = false) {
        if (this.performanceOptimized && this.optimizedValidation) {
            return this.optimizedValidation(name, force);
        } else {
            return this.validateNameInternal(name, force);
        }
    }
    
    async validateNameInternal(name, force = false) {
        if (!name || name.length < 3) {
            return { valid: false, errors: ['Name must be at least 3 characters'] };
        }

        // Check cache first
        if (!force && this.validationCache.has(name)) {
            return this.validationCache.get(name);
        }

        try {
            const response = await fetch('/api/character-creation/validate-name', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            
            const result = await response.json();
            
            // Cache result
            this.validationCache.set(name, result);
            
            return result;
        } catch (error) {
            console.error('Name validation error:', error);
            return { valid: false, errors: ['Unable to validate name'] };
        }
    }

    // Progress tracking
    updateProgress() {
        const progressPercent = (this.currentStep / 5) * 100;
        const progressBar = document.querySelector('.progress-bar');
        
        if (progressBar) {
            progressBar.style.width = `${progressPercent}%`;
        }
    }

    // UI Helper methods
    showLoading() {
        document.body.classList.add('loading');
        
        // Show loading overlay if it exists
        const loadingOverlay = document.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
    }

    hideLoading() {
        document.body.classList.remove('loading');
        
        // Hide loading overlay
        const loadingOverlay = document.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    showError(message) {
        // Create or update error message
        let errorDiv = document.querySelector('.error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            const wizardContent = document.querySelector('.wizard-content');
            wizardContent.insertBefore(errorDiv, wizardContent.firstChild);
        }
        
        errorDiv.textContent = message;
        errorDiv.scrollIntoView({ behavior: 'smooth' });
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    showSuccess(message) {
        // Create success message
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        
        const wizardContent = document.querySelector('.wizard-content');
        wizardContent.insertBefore(successDiv, wizardContent.firstChild);
        
        successDiv.scrollIntoView({ behavior: 'smooth' });
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 3000);
    }

    // Utility methods
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    // Animation helpers
    animateValue(element, start, end, duration = 1000) {
        // Use performance-optimized animation if available
        if (window.PerformanceUtils && window.PerformanceUtils.DOMOptimizer) {
            const domOptimizer = new window.PerformanceUtils.DOMOptimizer();
            domOptimizer.batchUpdate(() => {
                this.performAnimation(element, start, end, duration);
            });
        } else {
            this.performAnimation(element, start, end, duration);
        }
    }
    
    performAnimation(element, start, end, duration) {
        const startTime = performance.now();
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = start + (end - start) * this.easeOutQuart(progress);
            element.textContent = Math.round(current);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
    }

    // Cleanup with performance optimization
    destroy() {
        // Clear performance optimization resources
        if (this.performanceOptimized && window.PerformanceUtils) {
            if (window.PerformanceUtils.MemoryManager) {
                const memoryManager = new window.PerformanceUtils.MemoryManager();
                memoryManager.cleanup();
            }
        }
        
        // Clear validation cache
        if (this.validationCache) {
            this.validationCache.clear();
        }
        
        // Clear optimized function references
        this.optimizedAutoSave = null;
        this.optimizedValidation = null;
        
        // Remove event listeners if needed
        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler);
        }
        
        // Clear any remaining timeouts
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }
    }
}

// Global functions for backward compatibility
window.proceedToNextStep = function(stepData) {
    if (window.wizard) {
        window.wizard.proceedToNextStep(stepData);
    }
};

window.goToPreviousStep = function() {
    if (window.wizard) {
        window.wizard.goToPreviousStep();
    }
};

window.showLoading = function() {
    if (window.wizard) {
        window.wizard.showLoading();
    }
};

window.hideLoading = function() {
    if (window.wizard) {
        window.wizard.hideLoading();
    }
};

window.showError = function(message) {
    if (window.wizard) {
        window.wizard.showError(message);
    }
};

// Initialize wizard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.wizard = new CharacterCreationWizard();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.wizard) {
        window.wizard.destroy();
    }
});