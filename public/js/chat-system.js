
/**
 * Enhanced Chat System for all screen sizes
 */
class UniversalChatSystem {
    constructor() {
        this.chatPanel = document.querySelector('.chat-panel');
        this.chatMessages = document.querySelector('.chat-messages');
        this.chatInput = document.querySelector('.chat-input');
        this.isExpanded = false;
        this.defaultHeight = {
            mobile: '100px',
            tablet: '180px',
            desktop: '200px'
        };
        this.expandedHeight = {
            mobile: '60vh',
            tablet: '350px',
            desktop: '400px'
        };
        this.init();
    }
    
    init() {
        // Create collapse indicator
        this.createCollapseIndicator();
        
        // Add keyboard shortcuts
        this.initKeyboardShortcuts();
        
        // Handle window resize
        this.handleResize();
        
        // Restore saved state
        this.restoreState();
    }
    
    createCollapseIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'chat-collapse-indicator';
        indicator.innerHTML = `
            <div class="indicator-line"></div>
            <div class="indicator-text">Drag to resize</div>
        `;
        
        if (this.chatPanel) {
            this.chatPanel.insertBefore(indicator, this.chatPanel.firstChild);
            this.initResizable(indicator);
        }
    }
    
    initResizable(handle) {
        let isResizing = false;
        let startY = 0;
        let startHeight = 0;
        
        handle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startY = e.clientY;
            startHeight = parseInt(window.getComputedStyle(this.chatPanel).height, 10);
            document.body.style.cursor = 'ns-resize';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const diff = startY - e.clientY;
            const newHeight = Math.min(Math.max(100, startHeight + diff), window.innerHeight * 0.7);
            this.chatPanel.style.height = newHeight + 'px';
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                this.saveState();
            }
        });
    }
    
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + C to toggle chat
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                window.chatHandler?.toggle();
            }
            
            // / to focus chat input
            if (e.key === '/' && !this.isInputFocused()) {
                e.preventDefault();
                this.chatInput?.focus();
            }
        });
    }
    
    isInputFocused() {
        const activeElement = document.activeElement;
        return activeElement && (
            activeElement.tagName === 'INPUT' || 
            activeElement.tagName === 'TEXTAREA'
        );
    }
    
    handleResize() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.adjustForScreenSize();
            }, 250);
        });
    }
    
    adjustForScreenSize() {
        const width = window.innerWidth;
        let deviceType = 'desktop';
        
        if (width < 768) deviceType = 'mobile';
        else if (width < 1024) deviceType = 'tablet';
        
        // Adjust chat panel based on device
        if (!this.isExpanded && this.chatPanel) {
            this.chatPanel.style.height = this.defaultHeight[deviceType];
        }
    }
    
    saveState() {
        const state = {
            expanded: this.isExpanded,
            height: this.chatPanel?.style.height || '',
            timestamp: Date.now()
        };
        localStorage.setItem('chatState', JSON.stringify(state));
    }
    
    restoreState() {
        try {
            const saved = localStorage.getItem('chatState');
            if (saved) {
                const state = JSON.parse(saved);
                // Only restore if saved within last 7 days
                if (Date.now() - state.timestamp < 7 * 24 * 60 * 60 * 1000) {
                    if (state.height && this.chatPanel) {
                        this.chatPanel.style.height = state.height;
                    }
                }
            }
        } catch (e) {
            console.error('Failed to restore chat state:', e);
        }
    }
}

// Initialize universal chat system
document.addEventListener('DOMContentLoaded', () => {
    window.universalChat = new UniversalChatSystem();
});
/**
 * Enhanced Chat System for all screen sizes
 */
class UniversalChatSystem {
    constructor() {
        this.chatPanel = document.querySelector('.chat-panel');
        this.chatMessages = document.querySelector('.chat-messages');
        this.chatInput = document.querySelector('.chat-input');
        this.isExpanded = false;
        this.defaultHeight = {
            mobile: '100px',
            tablet: '180px',
            desktop: '200px'
        };
        this.expandedHeight = {
            mobile: '60vh',
            tablet: '350px',
            desktop: '400px'
        };
        this.init();
    }
    
    init() {
        // Create collapse indicator
        this.createCollapseIndicator();
        
        // Add keyboard shortcuts
        this.initKeyboardShortcuts();
        
        // Handle window resize
        this.handleResize();
        
        // Restore saved state
        this.restoreState();
    }
    
    createCollapseIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'chat-collapse-indicator';
        indicator.innerHTML = `
            <div class="indicator-line"></div>
            <div class="indicator-text">Drag to resize</div>
        `;
        
        if (this.chatPanel) {
            this.chatPanel.insertBefore(indicator, this.chatPanel.firstChild);
            this.initResizable(indicator);
        }
    }
    
    initResizable(handle) {
        let isResizing = false;
        let startY = 0;
        let startHeight = 0;
        
        handle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startY = e.clientY;
            startHeight = parseInt(window.getComputedStyle(this.chatPanel).height, 10);
            document.body.style.cursor = 'ns-resize';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const diff = startY - e.clientY;
            const newHeight = Math.min(Math.max(100, startHeight + diff), window.innerHeight * 0.7);
            this.chatPanel.style.height = newHeight + 'px';
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                this.saveState();
            }
        });
    }
    
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + C to toggle chat
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                window.chatHandler?.toggle();
            }
            
            // / to focus chat input
            if (e.key === '/' && !this.isInputFocused()) {
                e.preventDefault();
                this.chatInput?.focus();
            }
        });
    }
    
    isInputFocused() {
        const activeElement = document.activeElement;
        return activeElement && (
            activeElement.tagName === 'INPUT' || 
            activeElement.tagName === 'TEXTAREA'
        );
    }
    
    handleResize() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.adjustForScreenSize();
            }, 250);
        });
    }
    
    adjustForScreenSize() {
        const width = window.innerWidth;
        let deviceType = 'desktop';
        
        if (width < 768) deviceType = 'mobile';
        else if (width < 1024) deviceType = 'tablet';
        
        // Adjust chat panel based on device
        if (!this.isExpanded && this.chatPanel) {
            this.chatPanel.style.height = this.defaultHeight[deviceType];
        }
    }
    
    saveState() {
        const state = {
            expanded: this.isExpanded,
            height: this.chatPanel?.style.height || '',
            timestamp: Date.now()
        };
        localStorage.setItem('chatState', JSON.stringify(state));
    }
    
    restoreState() {
        try {
            const saved = localStorage.getItem('chatState');
            if (saved) {
                const state = JSON.parse(saved);
                // Only restore if saved within last 7 days
                if (Date.now() - state.timestamp < 7 * 24 * 60 * 60 * 1000) {
                    if (state.height && this.chatPanel) {
                        this.chatPanel.style.height = state.height;
                    }
                }
            }
        } catch (e) {
            console.error('Failed to restore chat state:', e);
        }
    }
}

// Initialize universal chat system
document.addEventListener('DOMContentLoaded', () => {
    window.universalChat = new UniversalChatSystem();
});
