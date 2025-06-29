class MobileNavigation {
    constructor() {
        this.leftPanel = document.querySelector('.left-panel');
        this.rightPanel = document.querySelector('.right-panel');
        this.overlay = null;
        this.init();
    }
    
    init() {
        // Create mobile navigation buttons
        this.createMobileNav();
        this.createOverlay();
        this.bindEvents();
    }
    
    createMobileNav() {
        const mobileNav = document.createElement('div');
        mobileNav.className = 'mobile-nav-buttons';
        mobileNav.innerHTML = `
            <button class="nav-btn left-toggle" aria-label="Toggle character panel">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                </svg>
            </button>
            <button class="nav-btn right-toggle" aria-label="Toggle inventory panel">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 8V6a5 5 0 1 1 10 0v2h1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h1zm2 0h6V6a3 3 0 0 0-6 0v2z"/>
                </svg>
            </button>
        `;
        
        // Insert into header on mobile
        if (window.innerWidth < 1024) {
            document.querySelector('.header')?.appendChild(mobileNav);
        }
    }
    
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'mobile-overlay';
        document.body.appendChild(this.overlay);
    }
    
    bindEvents() {
        // Left panel toggle
        document.querySelector('.left-toggle')?.addEventListener('click', () => {
            this.togglePanel('left');
        });
        
        // Right panel toggle
        document.querySelector('.right-toggle')?.addEventListener('click', () => {
            this.togglePanel('right');
        });
        
        // Overlay click
        this.overlay.addEventListener('click', () => {
            this.closeAllPanels();
        });
        
        // Swipe gestures
        this.initSwipeGestures();
    }
    
    togglePanel(side) {
        const panel = side === 'left' ? this.leftPanel : this.rightPanel;
        const isActive = panel.classList.contains('active');
        
        this.closeAllPanels();
        
        if (!isActive) {
            panel.classList.add('active');
            this.overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    closeAllPanels() {
        this.leftPanel?.classList.remove('active');
        this.rightPanel?.classList.remove('active');
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    initSwipeGestures() {
        let touchStartX = 0;
        let touchEndX = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        });
        
        const handleSwipe = () => {
            const swipeThreshold = 50;
            const diff = touchEndX - touchStartX;
            
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0 && touchStartX < 20) {
                    // Swipe right from left edge
                    this.togglePanel('left');
                } else if (diff < 0 && touchStartX > window.innerWidth - 20) {
                    // Swipe left from right edge
                    this.togglePanel('right');
                }
            }
        };
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

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.game-container')) {
        new MobileNavigation();
        new ChatHandler();
    }
});