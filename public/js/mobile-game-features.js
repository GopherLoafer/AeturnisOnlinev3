/**
 * Mobile-specific game features and enhancements
 */

class MobileGameFeatures {
    constructor() {
        this.isTouch = 'ontouchstart' in window;
        this.init();
    }
    
    init() {
        if (window.innerWidth < 768 || this.isTouch) {
            this.createQuickActionWheel();
            this.enhanceTouchInteractions();
            this.setupVirtualKeyboard();
            this.addHapticFeedback();
        }
    }
    
    createQuickActionWheel() {
        const wheel = document.createElement('div');
        wheel.className = 'mobile-action-wheel';
        wheel.innerHTML = `
            <button class="quick-action-toggle" aria-label="Toggle quick actions">
                <svg viewBox="0 0 24 24" width="24" height="24">
                    <circle cx="12" cy="12" r="2"/>
                    <circle cx="12" cy="6" r="2"/>
                    <circle cx="12" cy="18" r="2"/>
                    <circle cx="6" cy="12" r="2"/>
                    <circle cx="18" cy="12" r="2"/>
                </svg>
            </button>
            <div class="quick-actions-menu">
                <button class="quick-action" data-action="fight" aria-label="Fight">⚔️</button>
                <button class="quick-action" data-action="cast" aria-label="Cast spell">✨</button>
                <button class="quick-action" data-action="rest" aria-label="Rest">💤</button>
                <button class="quick-action" data-action="inventory" aria-label="Inventory">🎒</button>
                <button class="quick-action" data-action="map" aria-label="Map">🗺️</button>
                <button class="quick-action" data-action="stats" aria-label="Stats">📊</button>
            </div>
        `;
        
        document.body.appendChild(wheel);
        
        // Toggle menu
        const toggle = wheel.querySelector('.quick-action-toggle');
        const menu = wheel.querySelector('.quick-actions-menu');
        
        toggle.addEventListener('click', () => {
            wheel.classList.toggle('active');
            this.vibrate(10);
        });
        
        // Handle actions
        wheel.querySelectorAll('.quick-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleQuickAction(action);
                wheel.classList.remove('active');
                this.vibrate(20);
            });
        });
        
        // Long press for descriptions
        this.addLongPress(wheel.querySelectorAll('.quick-action'));
    }
    
    handleQuickAction(action) {
        switch(action) {
            case 'fight':
                window.performAction?.('fight');
                break;
            case 'cast':
                window.performAction?.('cast');
                break;
            case 'rest':
                window.performAction?.('rest');
                break;
            case 'inventory':
                window.mobileNav?.togglePanel('right');
                break;
            case 'map':
                this.showMapModal();
                break;
            case 'stats':
                window.mobileNav?.togglePanel('left');
                break;
        }
    }
    
    enhanceTouchInteractions() {
        // Double tap to zoom on equipment/items
        const items = document.querySelectorAll('.inventory-slot, .equipment-slot');
        
        items.forEach(item => {
            let lastTap = 0;
            
            item.addEventListener('touchend', (e) => {
                const currentTime = new Date().getTime();
                const tapLength = currentTime - lastTap;
                
                if (tapLength < 300 && tapLength > 0) {
                    e.preventDefault();
                    this.showItemDetails(item);
                }
                
                lastTap = currentTime;
            });
        });
        
        // Swipe on action buttons for alternative actions
        this.addSwipeActions();
    }
    
    addSwipeActions() {
        const actionBtns = document.querySelectorAll('.action-btn');
        
        actionBtns.forEach(btn => {
            let startX = 0;
            
            btn.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
            }, { passive: true });
            
            btn.addEventListener('touchend', (e) => {
                const endX = e.changedTouches[0].clientX;
                const diff = endX - startX;
                
                if (Math.abs(diff) > 50) {
                    // Swipe detected - show alternative actions
                    this.showAlternativeActions(btn, diff > 0 ? 'right' : 'left');
                }
            });
        });
    }
    
    showAlternativeActions(button, direction) {
        const tooltip = document.createElement('div');
        tooltip.className = 'action-tooltip';
        tooltip.textContent = direction === 'right' ? 'Strong Attack' : 'Quick Attack';
        
        button.appendChild(tooltip);
        setTimeout(() => tooltip.remove(), 2000);
    }
    
    addLongPress(elements) {
        elements.forEach(el => {
            let pressTimer;
            
            el.addEventListener('touchstart', (e) => {
                pressTimer = setTimeout(() => {
                    this.showTooltip(el);
                    this.vibrate(30);
                }, 500);
            });
            
            el.addEventListener('touchend', () => {
                clearTimeout(pressTimer);
            });
            
            el.addEventListener('touchcancel', () => {
                clearTimeout(pressTimer);
            });
        });
    }
    
    showTooltip(element) {
        const tooltip = document.createElement('div');
        tooltip.className = 'mobile-tooltip';
        tooltip.textContent = element.getAttribute('aria-label') || 'Action';
        
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - 40}px`;
        
        setTimeout(() => tooltip.remove(), 3000);
    }
    
    setupVirtualKeyboard() {
        // Improve virtual keyboard behavior
        const inputs = document.querySelectorAll('input[type="text"], textarea');
        
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                // Scroll input into view with padding
                setTimeout(() => {
                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            });
        });
    }
    
    addHapticFeedback() {
        // Add haptic feedback to buttons
        if (!('vibrate' in navigator)) return;
        
        const buttons = document.querySelectorAll('button, .btn, .action-btn');
        
        buttons.forEach(btn => {
            btn.addEventListener('touchstart', () => {
                this.vibrate(5);
            });
        });
    }
    
    vibrate(duration) {
        if ('vibrate' in navigator) {
            navigator.vibrate(duration);
        }
    }
    
    showMapModal() {
        const modal = document.createElement('div');
        modal.className = 'map-modal';
        modal.innerHTML = `
            <div class="map-modal-content">
                <button class="map-close">✕</button>
                <h2>World Map</h2>
                <div class="full-map">
                    <!-- Map content would go here -->
                    <p>Map feature coming soon!</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.map-close').addEventListener('click', () => {
            modal.remove();
        });
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    showItemDetails(itemElement) {
        const modal = document.createElement('div');
        modal.className = 'item-modal';
        modal.innerHTML = `
            <div class="item-modal-content">
                <button class="item-close">✕</button>
                <h3>Item Details</h3>
                <div class="item-info">
                    <p>Item information would appear here</p>
                </div>
                <div class="item-actions">
                    <button class="btn btn-primary">Equip</button>
                    <button class="btn btn-secondary">Drop</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.item-close').addEventListener('click', () => {
            modal.remove();
        });
    }
}

// Initialize mobile features
document.addEventListener('DOMContentLoaded', () => {
    window.mobileFeatures = new MobileGameFeatures();
});