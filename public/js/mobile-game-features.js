/**
 * Mobile-specific game features and enhancements
 */

class MobileGameFeatures {
    constructor() {
        this.isInstalled = false;
        this.deferredPrompt = null;
        this.isOnline = navigator.onLine;
        this.offlineActions = [];
        this.isTouch = 'ontouchstart' in window;
        this.init();
    }

    init() {
        this.setupPWAInstallPrompt();
        this.optimizeForMobile();
        this.setupGestures();
        this.initializeHapticFeedback();
        this.createMobileToolbar();
        this.setupOfflineSupport();
        this.initializePushNotifications();

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

    setupPWAInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });
    }

    showInstallButton() {
        const installBtn = document.createElement('button');
        installBtn.textContent = 'Install App';
        installBtn.className = 'install-btn';
        installBtn.addEventListener('click', this.installPWA.bind(this));
        document.body.appendChild(installBtn);
    }

    async installPWA() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            const choiceResult = await this.deferredPrompt.userChoice;

            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }

            this.deferredPrompt = null;
        }
    }

    optimizeForMobile() {
        // Disable text selection to improve UX
        document.body.style.webkitUserSelect = 'none';
        document.body.style.msUserSelect = 'none';
        document.body.style.userSelect = 'none';
    }

    setupGestures() {
        // Example: Swipe gestures for navigation
        let touchStartX = 0;
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const swipeDistance = touchEndX - touchStartX;

            if (swipeDistance > 50) {
                // Swipe right - go back
                window.history.back();
            } else if (swipeDistance < -50) {
                // Swipe left - go forward
                window.history.forward();
            }
        }, { passive: true });
    }

    initializeHapticFeedback() {
        // Check for haptic feedback support
        this.hasHaptic = 'vibrate' in navigator;
    }

    createMobileToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'mobile-toolbar';
        toolbar.innerHTML = `
            <button aria-label="Home">🏠</button>
            <button aria-label="Menu">☰</button>
            <button aria-label="Chat">💬</button>
        `;

        document.body.appendChild(toolbar);

        // Add event listeners to buttons
        toolbar.querySelector('[aria-label="Home"]').addEventListener('click', () => {
            window.location.href = '/';
        });

        toolbar.querySelector('[aria-label="Menu"]').addEventListener('click', () => {
            window.mobileNav?.togglePanel('left');
        });

        toolbar.querySelector('[aria-label="Chat"]').addEventListener('click', () => {
            window.universalChat?.toggleChat();
        });
    }

    setupOfflineSupport() {
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncOfflineActions();
            this.showNetworkStatus('online');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showNetworkStatus('offline');
        });

        // Intercept API calls when offline
        this.interceptAPICallsForOffline();
    }

    interceptAPICallsForOffline() {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                return await originalFetch(...args);
            } catch (error) {
                if (!this.isOnline && args[0].includes('/api/')) {
                    // Store action for later sync
                    this.storeOfflineAction(args[0], args[1]);
                    throw new Error('Offline - action queued for sync');
                }
                throw error;
            }
        };
    }

    storeOfflineAction(url, options) {
        const action = {
            url,
            options: {
                ...options,
                body: options?.body
            },
            timestamp: Date.now()
        };

        this.offlineActions.push(action);
        localStorage.setItem('offlineActions', JSON.stringify(this.offlineActions));

        // Register background sync if available
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            navigator.serviceWorker.ready.then(registration => {
                registration.sync.register('game-action-sync');
            });
        }
    }

    async syncOfflineActions() {
        const storedActions = localStorage.getItem('offlineActions');
        if (!storedActions) return;

        const actions = JSON.parse(storedActions);
        const successfulActions = [];

        for (const action of actions) {
            try {
                await fetch(action.url, action.options);
                successfulActions.push(action);
            } catch (error) {
                console.log('Failed to sync action:', error);
            }
        }

        // Remove successful actions
        this.offlineActions = actions.filter(action => 
            !successfulActions.includes(action)
        );
        localStorage.setItem('offlineActions', JSON.stringify(this.offlineActions));

        if (successfulActions.length > 0) {
            this.showSyncNotification(successfulActions.length);
        }
    }

    showNetworkStatus(status) {
        const statusEl = document.getElementById('network-status');
        if (statusEl) {
            statusEl.className = `network-status ${status}`;
            statusEl.textContent = status === 'online' ? '🟢 Online' : '🔴 Offline';
        }
    }

    showSyncNotification(count) {
        const notification = document.createElement('div');
        notification.className = 'sync-notification';
        notification.innerHTML = `
            <div class="sync-content">
                ✅ Synced ${count} offline action${count > 1 ? 's' : ''}
            </div>
        `;
        document.body.appendChild(notification);

        setTimeout(() => notification.remove(), 3000);
    }

    async initializePushNotifications() {
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
            return;
        }

        // Check if already granted
        if (Notification.permission === 'granted') {
            await this.subscribeToPushNotifications();
        } else if (Notification.permission !== 'denied') {
            // Show permission prompt after user interaction
            this.createNotificationPrompt();
        }
    }

    createNotificationPrompt() {
        const prompt = document.createElement('div');
        prompt.className = 'notification-prompt';
        prompt.innerHTML = `
            <div class="prompt-content">
                <span>🔔 Enable notifications for guild updates and game events?</span>
                <button onclick="this.parentNode.parentNode.remove(); window.mobileFeatures.requestNotificationPermission()">Enable</button>
                <button onclick="this.parentNode.parentNode.remove()">Later</button>
            </div>
        `;

        // Show after 30 seconds of gameplay
        setTimeout(() => {
            document.body.appendChild(prompt);
        }, 30000);
    }

    async requestNotificationPermission() {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            await this.subscribeToPushNotifications();
            this.showNotification('Notifications enabled! You\'ll receive updates about your adventures.');
        }
    }

    async subscribeToPushNotifications() {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(
                    'BLd3_OGUdXPkdQxrWHPVhKZiQrshZCJRXq3fYhPQxHlWBF9LXUl6rOvh6FtJPhJ7gkJz2zr4S6-3JcJT4uQJRJk' // Your VAPID public key
                )
            });

            // Send subscription to server
            await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(subscription)
            });
        } catch (error) {
            console.log('Push notification subscription failed:', error);
        }
    }

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    showNotification(message) {
        if (Notification.permission === 'granted') {
            new Notification('Aeturnis Online', {
                body: message,
                icon: '/images/icon-192.png',
                badge: '/images/badge-72x72.png'
            });
        }
    }
}

// Initialize mobile features
document.addEventListener('DOMContentLoaded', () => {
    window.mobileFeatures = new MobileGameFeatures();
});