/**
 * Performance utilities for mobile optimization
 */

class PerformanceManager {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupLazyLoading();
        this.setupIntersectionObservers();
        this.optimizeAnimations();
        this.setupNetworkDetection();
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