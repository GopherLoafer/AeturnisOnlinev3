/**
 * Performance utilities for mobile optimization
 */

class PerformanceManager {
    constructor() {
        this.memoryThreshold = 15 * 1024 * 1024; // 15MB
        this.fpsThreshold = 30;
        this.lastWarningTime = 0;
        this.warningCooldown = 5000; // 5 seconds
        this.init();
    }
    
    init() {
        this.setupLazyLoading();
        this.setupIntersectionObservers();
        this.optimizeAnimations();
        this.setupNetworkDetection();
        this.setupPerformanceMonitoring();
    }
    
    setupPerformanceMonitoring() {
        // Monitor memory usage
        if ('memory' in performance) {
            setInterval(() => {
                this.checkMemoryUsage();
            }, 10000); // Check every 10 seconds
        }
        
        // Monitor FPS
        this.setupFPSMonitoring();
        
        // Monitor long tasks
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.duration > 50) { // Tasks longer than 50ms
                        this.throttledWarn(`Long task detected: ${Math.round(entry.duration)}ms`);
                    }
                });
            });
            observer.observe({ entryTypes: ['longtask'] });
        }
    }
    
    checkMemoryUsage() {
        if ('memory' in performance) {
            const memory = performance.memory;
            const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
            const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
            
            if (memory.usedJSHeapSize > this.memoryThreshold) {
                this.throttledWarn(`High memory usage: ${usedMB}MB / ${totalMB}MB`);
                this.performMemoryCleanup();
            }
        }
    }
    
    setupFPSMonitoring() {
        let lastTime = performance.now();
        let frameCount = 0;
        
        const measureFPS = () => {
            const currentTime = performance.now();
            frameCount++;
            
            if (currentTime - lastTime >= 1000) {
                const fps = Math.round(frameCount * 1000 / (currentTime - lastTime));
                
                if (fps < this.fpsThreshold) {
                    this.throttledWarn(`Low FPS detected: ${fps}`);
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    }
    
    performMemoryCleanup() {
        // Clean up chat messages
        const chatMessages = document.querySelector('.chat-messages');
        if (chatMessages && chatMessages.children.length > 50) {
            const toRemove = chatMessages.children.length - 50;
            for (let i = 0; i < toRemove; i++) {
                chatMessages.removeChild(chatMessages.firstChild);
            }
        }
        
        // Clean up game output
        const gameOutput = document.querySelector('.game-output');
        if (gameOutput && gameOutput.children.length > 100) {
            const toRemove = gameOutput.children.length - 100;
            for (let i = 0; i < toRemove; i++) {
                gameOutput.removeChild(gameOutput.firstChild);
            }
        }
    }
    
    throttledWarn(message) {
        const now = Date.now();
        if (now - this.lastWarningTime > this.warningCooldown) {
            console.warn(message);
            this.lastWarningTime = now;
        }
    }
    
    setupLazyLoading() {
        // Lazy load images
        const lazyImages = document.querySelectorAll('img[data-src]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.add('loaded');
                        observer.unobserve(img);
                        
                        // Preload next image
                        const nextImg = img.parentElement?.nextElementSibling?.querySelector('img[data-src]');
                        if (nextImg && nextImg.dataset.src) {
                            const preload = new Image();
                            preload.src = nextImg.dataset.src;
                        }
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });
            
            lazyImages.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for older browsers
            lazyImages.forEach(img => {
                img.src = img.dataset.src;
            });
        }
    }
    
    setupIntersectionObservers() {
        // Pause animations when not visible
        const animatedElements = document.querySelectorAll('.animated, .shimmer, .pulse');
        
        const animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationPlayState = 'running';
                } else {
                    entry.target.style.animationPlayState = 'paused';
                }
            });
        });
        
        animatedElements.forEach(el => animationObserver.observe(el));
    }
    
    optimizeAnimations() {
        // Reduce motion for users who prefer it
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        
        if (prefersReducedMotion.matches) {
            document.documentElement.classList.add('reduce-motion');
        }
        
        prefersReducedMotion.addEventListener('change', (e) => {
            if (e.matches) {
                document.documentElement.classList.add('reduce-motion');
            } else {
                document.documentElement.classList.remove('reduce-motion');
            }
        });
    }
    
    setupNetworkDetection() {
        // Adjust quality based on connection
        if ('connection' in navigator) {
            const connection = navigator.connection;
            
            const updateConnectionStatus = () => {
                const effectiveType = connection.effectiveType;
                document.documentElement.setAttribute('data-connection', effectiveType);
                
                // Reduce quality on slow connections
                if (effectiveType === 'slow-2g' || effectiveType === '2g') {
                    document.documentElement.classList.add('low-bandwidth');
                } else {
                    document.documentElement.classList.remove('low-bandwidth');
                }
            };
            
            connection.addEventListener('change', updateConnectionStatus);
            updateConnectionStatus();
        }
    }
}

// Utility functions
window.debounce = function(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

window.throttle = function(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// Efficient scroll handler
const efficientScroll = window.throttle(() => {
    // Handle scroll events efficiently
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    document.documentElement.setAttribute('data-scroll', scrollTop > 100 ? 'scrolled' : '');
}, 100);

window.addEventListener('scroll', efficientScroll, { passive: true });

// Initialize performance manager
document.addEventListener('DOMContentLoaded', () => {
    window.performanceManager = new PerformanceManager();
});