/**
 * JavaScript Performance Utilities - Phase 7.3 Implementation
 * Provides performance optimizations and utilities for Aeturnis Online
 */

// Debounce function for resize events
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

// Throttle function for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Performance-optimized scroll handler
let ticking = false;

function updateScrollPosition() {
    // Update scroll-dependent elements with minimal DOM operations
    const gameOutput = document.querySelector('.game-output');
    const chatMessages = document.querySelector('.chat-messages');
    
    if (gameOutput) {
        // Check if user is near bottom for auto-scroll
        const isNearBottom = gameOutput.scrollTop + gameOutput.clientHeight >= gameOutput.scrollHeight - 50;
        if (isNearBottom) {
            gameOutput.setAttribute('data-auto-scroll', 'true');
        }
    }
    
    ticking = false;
}

// Initialize scroll optimization
function initScrollOptimization() {
    const gameOutput = document.querySelector('.game-output');
    const chatMessages = document.querySelector('.chat-messages');
    
    if (gameOutput) {
        gameOutput.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(updateScrollPosition);
                ticking = true;
            }
        });
    }
    
    if (chatMessages) {
        chatMessages.addEventListener('scroll', throttle(() => {
            // Handle chat scroll events
        }, 16)); // ~60fps
    }
}

// DOM manipulation optimization utilities
class DOMOptimizer {
    constructor() {
        this.fragmentCache = new Map();
        this.updateQueue = [];
        this.isUpdating = false;
    }
    
    // Batch DOM updates for better performance
    batchUpdate(callback) {
        this.updateQueue.push(callback);
        
        if (!this.isUpdating) {
            this.isUpdating = true;
            window.requestAnimationFrame(() => {
                // Execute all queued updates in a single frame
                this.updateQueue.forEach(cb => cb());
                this.updateQueue = [];
                this.isUpdating = false;
            });
        }
    }
    
    // Create document fragments for efficient DOM insertion
    createFragment(html) {
        if (!this.fragmentCache.has(html)) {
            const template = document.createElement('template');
            template.innerHTML = html;
            this.fragmentCache.set(html, template.content.cloneNode(true));
        }
        return this.fragmentCache.get(html).cloneNode(true);
    }
    
    // Efficiently update text content without DOM thrashing
    updateTextContent(element, text) {
        if (element && element.textContent !== text) {
            element.textContent = text;
        }
    }
    
    // Virtual scrolling for large lists
    virtualScroll(container, items, itemHeight = 50, bufferSize = 5) {
        const containerHeight = container.clientHeight;
        const visibleCount = Math.ceil(containerHeight / itemHeight) + (bufferSize * 2);
        const scrollTop = container.scrollTop;
        const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
        const endIndex = Math.min(items.length, startIndex + visibleCount);
        
        return {
            startIndex,
            endIndex,
            offsetY: startIndex * itemHeight,
            visibleItems: items.slice(startIndex, endIndex)
        };
    }
}

// Memory management utilities
class MemoryManager {
    constructor() {
        this.observers = new Set();
        this.intervals = new Set();
        this.timeouts = new Set();
    }
    
    // Add observer for cleanup tracking
    addObserver(observer) {
        this.observers.add(observer);
        return observer;
    }
    
    // Add interval for cleanup tracking
    addInterval(callback, delay) {
        const id = setInterval(callback, delay);
        this.intervals.add(id);
        return id;
    }
    
    // Add timeout for cleanup tracking
    addTimeout(callback, delay) {
        const id = setTimeout(() => {
            callback();
            this.timeouts.delete(id);
        }, delay);
        this.timeouts.add(id);
        return id;
    }
    
    // Clean up all tracked resources
    cleanup() {
        // Disconnect observers
        this.observers.forEach(observer => {
            if (observer.disconnect) observer.disconnect();
            if (observer.unobserve) observer.unobserve();
        });
        
        // Clear intervals
        this.intervals.forEach(id => clearInterval(id));
        
        // Clear timeouts
        this.timeouts.forEach(id => clearTimeout(id));
        
        // Clear sets
        this.observers.clear();
        this.intervals.clear();
        this.timeouts.clear();
    }
}

// Performance monitoring utilities
class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.isMonitoring = false;
    }
    
    // Start monitoring performance
    startMonitoring() {
        if (this.isMonitoring) return;
        this.isMonitoring = true;
        
        // Monitor frame rate
        this.monitorFPS();
        
        // Monitor memory usage (if available)
        if (performance.memory) {
            this.monitorMemory();
        }
        
        // Monitor long tasks
        if ('PerformanceObserver' in window) {
            this.monitorLongTasks();
        }
    }
    
    monitorFPS() {
        let frames = 0;
        let lastTime = performance.now();
        let warningCount = 0;
        
        const countFPS = (currentTime) => {
            frames++;
            
            if (currentTime >= lastTime + 2000) { // Check every 2 seconds
                const fps = Math.round((frames * 1000) / (currentTime - lastTime));
                this.metrics.set('fps', fps);
                
                // Limit warning frequency to prevent spam
                if (fps < 20 && warningCount < 2) {
                    console.warn(`Low FPS detected: ${fps}`);
                    warningCount++;
                }
                
                // Reset warning counter after good performance
                if (fps >= 30) {
                    warningCount = 0;
                }
                
                frames = 0;
                lastTime = currentTime;
            }
            
            if (this.isMonitoring) {
                requestAnimationFrame(countFPS);
            }
        };
        
        requestAnimationFrame(countFPS);
    }
    
    monitorMemory() {
        let memoryWarningCount = 0;
        let lastMemoryCheck = 0;
        
        const updateMemory = () => {
            if (performance.memory) {
                const used = Math.round(performance.memory.usedJSHeapSize / 1048576); // MB
                const total = Math.round(performance.memory.totalJSHeapSize / 1048576); // MB
                
                this.metrics.set('memoryUsed', used);
                this.metrics.set('memoryTotal', total);
                
                // Only warn occasionally about high memory usage
                const now = performance.now();
                if (used / total > 0.85 && memoryWarningCount < 2 && now - lastMemoryCheck > 10000) {
                    console.warn(`High memory usage: ${used}MB / ${total}MB`);
                    memoryWarningCount++;
                    lastMemoryCheck = now;
                }
                
                // Reset warning counter when memory usage improves
                if (used / total < 0.7) {
                    memoryWarningCount = 0;
                }
            }
            
            if (this.isMonitoring) {
                setTimeout(updateMemory, 10000); // Check every 10 seconds to reduce overhead
            }
        };
        
        updateMemory();
    }
    
    monitorLongTasks() {
        try {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.duration > 50) {
                        console.warn(`Long task detected: ${entry.duration}ms`);
                        this.metrics.set('lastLongTask', entry.duration);
                    }
                });
            });
            observer.observe({ entryTypes: ['longtask'] });
        } catch (e) {
            // Long task observer not supported
        }
    }
    
    getMetrics() {
        return Object.fromEntries(this.metrics);
    }
    
    stopMonitoring() {
        this.isMonitoring = false;
    }
}

// Initialize performance optimizations
function initPerformanceOptimizations() {
    // Initialize scroll optimization
    initScrollOptimization();
    
    // Add passive event listeners for better performance
    document.addEventListener('touchstart', () => {}, { passive: true });
    document.addEventListener('touchmove', () => {}, { passive: true });
    document.addEventListener('wheel', () => {}, { passive: true });
    
    // Optimize resize events
    window.addEventListener('resize', debounce(() => {
        // Trigger responsive recalculations
        if (window.ResponsiveImages && window.ResponsiveImages.setResponsiveBackgrounds) {
            window.ResponsiveImages.setResponsiveBackgrounds();
        }
    }, 250));
    
    // Initialize performance monitoring in development
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('replit')) {
        const monitor = new PerformanceMonitor();
        monitor.startMonitoring();
        
        // Expose monitor for debugging
        window.performanceMonitor = monitor;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPerformanceOptimizations);
} else {
    initPerformanceOptimizations();
}

// Export utilities for global access
window.PerformanceUtils = {
    debounce,
    throttle,
    DOMOptimizer,
    MemoryManager,
    PerformanceMonitor,
    initPerformanceOptimizations
};