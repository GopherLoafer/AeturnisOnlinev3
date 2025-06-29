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
        this.init();
    }
    
    init() {
        if (window.innerWidth <= 767) {
            this.bindEvents();
            this.restoreState();
        }
    }
    
    bindEvents() {
        const header = this.chatPanel?.querySelector('.chat-header');
        
        // Toggle chat on header click
        header?.addEventListener('click', () => {
            this.toggleChat();
        });
        
        // Prevent closing when interacting with chat content
        this.chatPanel?.addEventListener('click', (e) => {
            if (e.target.closest('.chat-messages') || 
                e.target.closest('.chat-input-container') ||
                e.target.closest('.chat-tabs')) {
                e.stopPropagation();
            }
        });
        
        // Close chat when clicking outside
        document.addEventListener('click', (e) => {
            if (this.chatPanel?.classList.contains('expanded') && 
                !e.target.closest('.chat-panel') &&
                window.innerWidth <= 767) {
                this.closeChat();
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 767) {
                this.resetChat();
            }
        });
    }
    
    toggleChat() {
        const isExpanded = this.chatPanel?.classList.toggle('expanded');
        
        // Save state
        localStorage.setItem('chatExpanded', isExpanded.toString());
        
        // Adjust main content area for mobile
        this.adjustMainContent(isExpanded);
        
        // Auto-scroll to bottom when expanded
        if (isExpanded) {
            setTimeout(() => {
                const chatMessages = document.getElementById('chat-messages');
                if (chatMessages) {
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            }, 300); // Wait for expansion animation
        }
    }
    
    closeChat() {
        this.chatPanel?.classList.remove('expanded');
        localStorage.setItem('chatExpanded', 'false');
        this.adjustMainContent(false);
    }
    
    expandChat() {
        this.chatPanel?.classList.add('expanded');
        localStorage.setItem('chatExpanded', 'true');
        this.adjustMainContent(true);
    }
    
    adjustMainContent(isExpanded) {
        if (window.innerWidth <= 767 && this.mainPanel) {
            if (isExpanded) {
                // Account for expanded chat height (60vh max 500px)
                const chatHeight = Math.min(window.innerHeight * 0.6, 500);
                this.mainPanel.style.marginBottom = `${chatHeight}px`;
            } else {
                // Account for collapsed chat height (60px)
                this.mainPanel.style.marginBottom = '60px';
            }
        }
    }
    
    restoreState() {
        const wasExpanded = localStorage.getItem('chatExpanded') === 'true';
        if (wasExpanded && this.chatPanel) {
            this.chatPanel.classList.add('expanded');
            this.adjustMainContent(true);
        }
    }
    
    resetChat() {
        // Reset mobile-specific styles when switching to desktop
        if (this.mainPanel) {
            this.mainPanel.style.marginBottom = '';
        }
        this.chatPanel?.classList.remove('expanded');
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.game-container')) {
        new MobileNavigation();
        new ChatHandler();
    }
});