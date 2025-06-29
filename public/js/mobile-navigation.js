class MobileNavigation {
    constructor() {
        this.leftPanel = document.querySelector('.left-panel');
        this.rightPanel = document.querySelector('.right-panel');
        this.overlay = null;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.init();
    }
    
    init() {
        // Create mobile navigation buttons
        this.createMobileNav();
        this.createOverlay();
        this.bindEvents();
        this.initSwipeGestures();
    }
    
    initSwipeGestures() {
        // Use arrow functions to maintain 'this' context
        document.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
            this.touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.touchEndY = e.changedTouches[0].screenY;
            this.handleSwipe();
        }, { passive: true });
    }
    
    handleSwipe() {
        const swipeThreshold = 50;
        const verticalThreshold = 100;
        const diffX = this.touchEndX - this.touchStartX;
        const diffY = this.touchEndY - this.touchStartY;
        
        // Only process horizontal swipes (ignore vertical swipes)
        if (Math.abs(diffX) > Math.abs(diffY) && 
            Math.abs(diffX) > swipeThreshold && 
            Math.abs(diffY) < verticalThreshold) {
            
            if (diffX > 0 && this.touchStartX < 20) {
                // Swipe right from left edge
                this.togglePanel('left');
            } else if (diffX < 0 && this.touchStartX > window.innerWidth - 20) {
                // Swipe left from right edge
                this.togglePanel('right');
            }
        }
    }
    
    togglePanel(side) {
        const panel = side === 'left' ? this.leftPanel : this.rightPanel;
        const isActive = panel?.classList.contains('active');
        
        this.closeAllPanels();
        
        if (!isActive && panel) {
            panel.classList.add('active');
            this.overlay?.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Announce to screen readers
            const announcement = side === 'left' ? 'Character panel opened' : 'Inventory panel opened';
            this.announceToScreenReader(announcement);
        }
    }
    
    closeAllPanels() {
        this.leftPanel?.classList.remove('active');
        this.rightPanel?.classList.remove('active');
        this.overlay?.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 1000);
    }
    
    createOverlay() {
        // Check if overlay already exists
        this.overlay = document.querySelector('.mobile-overlay');
        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.className = 'mobile-overlay';
            document.body.appendChild(this.overlay);
        }
    }
    
    createMobileNav() {
        // Check if nav already exists in header
        const existingNav = document.querySelector('.mobile-nav-buttons');
        if (existingNav) {
            console.log('Mobile nav buttons already exist');
            return;
        }
        
        console.log('Creating mobile navigation buttons');
        
        // Mobile nav should already be in template, but ensure it's visible
        const header = document.querySelector('.header');
        if (header) {
            let mobileNavButtons = header.querySelector('.mobile-nav-buttons');
            if (!mobileNavButtons) {
                // Create if it doesn't exist
                mobileNavButtons = document.createElement('div');
                mobileNavButtons.className = 'mobile-nav-buttons';
                mobileNavButtons.innerHTML = `
                    <button class="nav-btn left-toggle" aria-label="Toggle character panel">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                    </button>
                    <button class="nav-btn right-toggle" aria-label="Toggle inventory panel">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                        </svg>
                    </button>
                `;
                header.appendChild(mobileNavButtons);
            }
            
            // Force visibility on mobile
            if (window.innerWidth < 1024) {
                mobileNavButtons.style.display = 'flex';
                mobileNavButtons.style.visibility = 'visible';
                mobileNavButtons.style.opacity = '1';
                console.log('Mobile nav buttons should now be visible');
            }
        }
    }
    
    bindEvents() {
        // Use event delegation for better performance
        document.addEventListener('click', (e) => {
            if (e.target.closest('.left-toggle')) {
                this.togglePanel('left');
            } else if (e.target.closest('.right-toggle')) {
                this.togglePanel('right');
            } else if (e.target.classList.contains('mobile-overlay')) {
                this.closeAllPanels();
            }
        });
        
        // Close panels on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllPanels();
            }
        });
    }
}

/**
 * ChatHandler - Manages mobile chat expansion functionality
 * Based on responsive-mmorpg-plan.md Phase 4.2
 */
class ChatHandler {
    constructor() {
        this.chatPanel = document.querySelector('.chat-panel');
        this.mainPanel = document.querySelector('.main-panel');
        this.gameOutput = document.querySelector('.game-output');
        this.isExpanded = false;
        this.originalHeight = null;
        this.init();
    }
    
    init() {
        // Store original height
        if (this.chatPanel) {
            this.originalHeight = window.getComputedStyle(this.chatPanel).height;
        }
        
        // Create expand button
        const expandBtn = document.createElement('button');
        expandBtn.className = 'chat-expand-btn';
        expandBtn.innerHTML = '💬 <span class="expand-text">Expand Chat</span>';
        expandBtn.setAttribute('aria-label', 'Toggle chat expansion');
        expandBtn.setAttribute('title', 'Toggle chat size');
        
        // Add to chat panel header
        const chatHeader = this.chatPanel?.querySelector('.chat-header');
        if (chatHeader) {
            chatHeader.appendChild(expandBtn);
        } else if (this.chatPanel) {
            // Create header if it doesn't exist
            const header = document.createElement('div');
            header.className = 'chat-header';
            header.appendChild(expandBtn);
            this.chatPanel.insertBefore(header, this.chatPanel.firstChild);
        }
        
        // Bind events
        expandBtn.addEventListener('click', () => this.toggle());
        
        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isExpanded) {
                this.toggle();
            }
        });
        
        // Save preference
        const savedState = localStorage.getItem('chatExpanded');
        if (savedState === 'true') {
            this.toggle();
        }
    }
    
    toggle() {
        this.isExpanded = !this.isExpanded;
        
        if (this.isExpanded) {
            this.chatPanel?.classList.add('expanded');
            this.mainPanel?.classList.add('chat-expanded');
            document.body.classList.add('chat-modal-open');
            
            // Focus chat input
            const chatInput = this.chatPanel?.querySelector('.chat-input');
            chatInput?.focus();
        } else {
            this.chatPanel?.classList.remove('expanded');
            this.mainPanel?.classList.remove('chat-expanded');
            document.body.classList.remove('chat-modal-open');
        }
        
        // Update button text
        const btn = this.chatPanel?.querySelector('.chat-expand-btn');
        if (btn) {
            btn.innerHTML = this.isExpanded ? 
                '✕ <span class="expand-text">Minimize</span>' : 
                '💬 <span class="expand-text">Expand Chat</span>';
        }
        
        // Save preference
        localStorage.setItem('chatExpanded', this.isExpanded);
        
        // Emit event for other components
        window.dispatchEvent(new CustomEvent('chatToggled', { 
            detail: { expanded: this.isExpanded } 
        }));
    }
}

// Export for global access
window.ChatHandler = ChatHandler;

// Initialize mobile features when DOM is ready
(function() {
    let mobileNav = null;
    let chatHandler = null;
    
    function initializeMobileFeatures() {
        const isMobile = window.innerWidth < 1024;
        
        console.log('Initializing mobile features, isMobile:', isMobile);
        
        // Always initialize mobile navigation on small screens
        if (isMobile) {
            if (!mobileNav) {
                console.log('Creating MobileNavigation instance');
                mobileNav = new MobileNavigation();
                window.mobileNav = mobileNav;
            }
        }
        
        // Initialize chat handler for ALL screen sizes
        if (!chatHandler) {
            console.log('Creating ChatHandler instance');
            chatHandler = new ChatHandler();
            window.chatHandler = chatHandler;
        }
    }
    
    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeMobileFeatures);
    } else {
        initializeMobileFeatures();
    }
    
    // Handle resize events with debouncing
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(initializeMobileFeatures, 250);
    });
})();