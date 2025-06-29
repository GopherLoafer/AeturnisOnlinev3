// Game Interface JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeGame();
});

function initializeGame() {
    updateServerTime();
    setInterval(updateServerTime, 1000);
    
    // Auto-refresh game state every 30 seconds
    setInterval(refreshGameState, 30000);
    
    // Initialize tab switching
    initializeTabs();
    
    // Initialize chat switching
    initializeChatTabs();
    
    // Auto-scroll chat to bottom
    scrollChatToBottom();
}

function updateServerTime() {
    const serverTimeElement = document.getElementById('server-time');
    if (serverTimeElement) {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        serverTimeElement.textContent = `Server Time: ${timeString}`;
    }
}

function refreshGameState() {
    // In a real implementation, this would make an AJAX call to refresh game data
    // For now, we'll just log that it would refresh
    console.log('Game state refresh triggered');
}

function initializeTabs() {
    // Add click handlers for tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            showTab(tabName);
        });
    });
}

function showTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab content
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Add active class to clicked button
    const activeButton = document.querySelector(`[onclick="showTab('${tabName}')"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

function initializeChatTabs() {
    const chatTabs = document.querySelectorAll('.chat-tab');
    chatTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const channel = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            showChat(channel);
        });
    });
}

function showChat(channel) {
    // Remove active class from all chat tabs
    const chatTabs = document.querySelectorAll('.chat-tab');
    chatTabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Add active class to clicked chat tab
    const activeTab = document.querySelector(`[onclick="showChat('${channel}')"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // Filter chat messages based on channel
    filterChatMessages(channel);
}

function filterChatMessages(channel) {
    const messages = document.querySelectorAll('.chat-message');
    messages.forEach(message => {
        if (channel === 'all') {
            message.style.display = 'block';
        } else {
            if (message.classList.contains(channel)) {
                message.style.display = 'block';
            } else {
                message.style.display = 'none';
            }
        }
    });
}

function scrollChatToBottom() {
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

function toggleMenu() {
    // Placeholder for menu toggle functionality
    alert('Menu functionality would be implemented here');
}

// Inventory and equipment interactions
function equipItem(itemId) {
    // Placeholder for equipment functionality
    console.log('Equip item:', itemId);
}

function useItem(itemId) {
    // Placeholder for item usage functionality
    console.log('Use item:', itemId);
}

// Combat action handlers
function performAction(action) {
    // Disable buttons temporarily to prevent spam
    const actionButtons = document.querySelectorAll('.action-btn, .move-btn');
    actionButtons.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
    });
    
    // Re-enable after cooldown
    setTimeout(() => {
        actionButtons.forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
        });
    }, 2000); // 2 second cooldown
}

// Add click handlers for all action buttons
document.addEventListener('DOMContentLoaded', function() {
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const action = this.getAttribute('name') === 'action' ? this.value : 'move';
            performAction(action);
        });
    });
});

// Chat form submission with AJAX (placeholder)
function submitChatMessage(event) {
    event.preventDefault();
    const form = event.target;
    const messageInput = form.querySelector('input[name="message"]');
    const message = messageInput.value.trim();
    
    if (message) {
        // In a real implementation, this would send via AJAX
        console.log('Chat message:', message);
        messageInput.value = '';
    }
    
    return false;
}

// Add chat form handler
document.addEventListener('DOMContentLoaded', function() {
    const chatForm = document.querySelector('.chat-form');
    if (chatForm) {
        chatForm.addEventListener('submit', submitChatMessage);
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Prevent shortcuts when typing in input fields
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
    }
    
    switch(event.key) {
        case 'w':
        case 'W':
            // Move north
            document.querySelector('button[value="north"]')?.click();
            break;
        case 's':
        case 'S':
            // Move south
            document.querySelector('button[value="south"]')?.click();
            break;
        case 'a':
        case 'A':
            // Move west
            document.querySelector('button[value="west"]')?.click();
            break;
        case 'd':
        case 'D':
            // Move east
            document.querySelector('button[value="east"]')?.click();
            break;
        case ' ':
            // Fight
            event.preventDefault();
            document.querySelector('button[value="fight"]')?.click();
            break;
        case 'c':
        case 'C':
            // Cast
            document.querySelector('button[value="cast"]')?.click();
            break;
        case 'r':
        case 'R':
            // Rest
            document.querySelector('button[value="rest"]')?.click();
            break;
        case 'm':
        case 'M':
            // Map
            document.querySelector('button[value="map"]')?.click();
            break;
    }
});