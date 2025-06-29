/**
 * Responsive Images & Media - Phase 7.1 Implementation
 * Provides lazy loading and responsive image optimization for Aeturnis Online
 */

// Lazy loading for images
const lazyImages = document.querySelectorAll('img[data-src]');
const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.add('loaded');
            observer.unobserve(img);
        }
    });
});

lazyImages.forEach(img => imageObserver.observe(img));

// Responsive background images
function setResponsiveBackgrounds() {
    const elements = document.querySelectorAll('[data-bg-mobile]');
    const isMobile = window.innerWidth < 768;
    
    elements.forEach(el => {
        const bgImage = isMobile ? el.dataset.bgMobile : el.dataset.bgDesktop;
        el.style.backgroundImage = `url(${bgImage})`;
    });
}

// Debounce function for performance
function debounce(func, wait) {
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

// Initialize responsive backgrounds and set up resize listener
window.addEventListener('resize', debounce(setResponsiveBackgrounds, 250));
setResponsiveBackgrounds();

// Preload critical images for faster loading
function preloadCriticalImages() {
    const criticalImages = [
        '/images/logo.png',
        '/images/hero-bg.jpg'
    ];
    
    criticalImages.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', preloadCriticalImages);
} else {
    preloadCriticalImages();
}

// Export functions for global access
window.ResponsiveImages = {
    setResponsiveBackgrounds,
    debounce
};