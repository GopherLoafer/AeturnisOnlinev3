// Game Interface JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeGame();
    initializeProgressionButtons();
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
    
    // Load race abilities when skills tab is opened
    loadRaceAbilities();
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
            const tabName = this.getAttribute('data-tab');
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
            const channel = this.getAttribute('data-chat');
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

// Load race abilities for the current character
async function loadRaceAbilities() {
    const abilitiesContainer = document.getElementById('race-abilities');
    if (!abilitiesContainer) return;

    try {
        // Get character ID from the page
        const characterId = document.body.dataset.characterId;
        if (!characterId) {
            abilitiesContainer.innerHTML = '<div class="error">Character not found</div>';
            return;
        }

        const response = await fetch(`/api/abilities/race-abilities/${characterId}`);
        const data = await response.json();

        if (data.success) {
            displayRaceAbilities(data.abilities);
        } else {
            abilitiesContainer.innerHTML = '<div class="error">Failed to load abilities</div>';
        }
    } catch (error) {
        console.error('Error loading race abilities:', error);
        abilitiesContainer.innerHTML = '<div class="error">Connection error</div>';
    }
}

// Display race abilities in the UI
function displayRaceAbilities(abilities) {
    const container = document.getElementById('race-abilities');
    if (!container) return;

    if (abilities.length === 0) {
        container.innerHTML = '<div class="no-abilities">No special abilities</div>';
        return;
    }

    let html = '';
    abilities.forEach(ability => {
        const isOnCooldown = ability.cooldown_remaining > 0;
        const isActive = ability.ability_type === 'active';
        
        html += `
            <div class="ability-item ${ability.ability_type}">
                <div class="ability-header">
                    <span class="ability-name">${ability.ability_name.replace(/_/g, ' ').toUpperCase()}</span>
                    ${isActive ? '<span class="ability-type">Active</span>' : '<span class="ability-type">Passive</span>'}
                </div>
                <div class="ability-description">${ability.description}</div>
                ${ability.mana_cost > 0 ? `<div class="ability-cost">Mana: ${ability.mana_cost}</div>` : ''}
                ${ability.cooldown_seconds > 0 ? `<div class="ability-cooldown">Cooldown: ${ability.cooldown_seconds}s</div>` : ''}
                ${isActive && !isOnCooldown ? `<button onclick="useAbility('${ability.ability_name}')" class="use-ability-btn">Use</button>` : ''}
                ${isOnCooldown ? `<div class="cooldown-timer">${ability.cooldown_remaining}s remaining</div>` : ''}
            </div>
        `;
    });

    container.innerHTML = html;
}

// Use a race ability
async function useAbility(abilityName) {
    try {
        const response = await fetch('/api/abilities/use-ability', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ abilityName })
        });

        const data = await response.json();
        
        if (data.success) {
            // Show success message in game output
            addToGameOutput(data.message, 'ability-success');
            
            // Reload abilities to show cooldown
            loadRaceAbilities();
            
            // Refresh character stats if needed
            if (data.effects && data.effects.length > 0) {
                refreshGameState();
            }
        } else {
            addToGameOutput(data.error, 'ability-error');
        }
    } catch (error) {
        console.error('Error using ability:', error);
        addToGameOutput('Failed to use ability', 'ability-error');
    }
}

// Add message to game output
function addToGameOutput(message, className = '') {
    const gameOutput = document.getElementById('game-output');
    if (gameOutput) {
        const messageElement = document.createElement('p');
        messageElement.textContent = message;
        if (className) {
            messageElement.className = className;
        }
        gameOutput.appendChild(messageElement);
        gameOutput.scrollTop = gameOutput.scrollHeight;
    }
}

// Progression System Functions
async function gainExperience(amount) {
    console.log('gainExperience called with amount:', amount);
    try {
        console.log('Making API request to /api/progression/award-experience');
        const response = await fetch('/api/progression/award-experience', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount })
        });

        console.log('Response status:', response.status);
        
        if (!response.ok) {
            console.error('Response not OK:', response.status, response.statusText);
            if (response.status === 302) {
                console.error('Being redirected - likely authentication issue');
                window.location.reload();
                return;
            }
        }

        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
            addProgressionMessage(`Gained ${data.experienceGained} experience!`, 'success');
            
            if (data.leveledUp) {
                addProgressionMessage(`LEVEL UP! You are now level ${data.newLevel}!`, 'level-up');
                
                if (data.statGains) {
                    const statText = Object.entries(data.statGains)
                        .filter(([stat, gain]) => gain > 0)
                        .map(([stat, gain]) => `${stat.toUpperCase()}: +${gain}`)
                        .join(', ');
                    addProgressionMessage(`Stat gains: ${statText}`, 'stat-gain');
                }
                
                if (data.milestoneRewards && data.milestoneRewards.length > 0) {
                    data.milestoneRewards.forEach(milestone => {
                        addProgressionMessage(`MILESTONE! Level ${milestone.level} reached! Gained ${milestone.goldReward} gold!`, 'milestone');
                        if (milestone.specialReward) {
                            addProgressionMessage(`Special reward: ${milestone.specialReward}`, 'special-reward');
                        }
                    });
                }
                
                if (data.newPrestigeMarker) {
                    addProgressionMessage(`NEW PRESTIGE MARKER: ${data.newPrestigeMarker.toUpperCase()}!`, 'prestige');
                }
                
                // Refresh the page to show updated stats
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }
        } else {
            addProgressionMessage(data.error, 'error');
        }
    } catch (error) {
        console.error('Error gaining experience:', error);
        addProgressionMessage('Failed to gain experience', 'error');
    }
}

async function simulateLevelUp() {
    console.log('simulateLevelUp called');
    try {
        console.log('Making API request to /api/progression/simulate-level-up');
        const response = await fetch('/api/progression/simulate-level-up', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Response status:', response.status);
        
        if (!response.ok) {
            console.error('Response not OK:', response.status, response.statusText);
            if (response.status === 302) {
                console.error('Being redirected - likely authentication issue');
                window.location.reload();
                return;
            }
        }

        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
            addProgressionMessage(data.message, 'success');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            addProgressionMessage(data.error, 'error');
        }
    } catch (error) {
        console.error('Error simulating level up:', error);
        addProgressionMessage('Failed to simulate level up', 'error');
    }
}

async function showLeaderboard() {
    console.log('showLeaderboard called');
    try {
        console.log('Making API request to /api/progression/leaderboard');
        const response = await fetch('/api/progression/leaderboard');
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            console.error('Response not OK:', response.status, response.statusText);
            if (response.status === 302) {
                console.error('Being redirected - likely authentication issue');
                window.location.reload();
                return;
            }
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
            displayLeaderboard(data.leaderboard);
        } else {
            addProgressionMessage('Failed to load leaderboard', 'error');
        }
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        addProgressionMessage('Failed to load leaderboard', 'error');
    }
}

function displayLeaderboard(leaderboard) {
    const output = document.getElementById('progression-output');
    if (!output) return;

    let html = '<div class="leaderboard-container"><h4>Level Leaderboard</h4>';
    
    if (leaderboard.length === 0) {
        html += '<p>No leaderboard data available</p>';
    } else {
        leaderboard.forEach(entry => {
            html += `
                <div class="leaderboard-entry">
                    <span class="leaderboard-rank">#${entry.rank}</span>
                    <span class="leaderboard-name">${entry.name}</span>
                    <span class="leaderboard-race">${entry.race}</span>
                    <span class="leaderboard-level">Lv ${entry.level}</span>
                    <span class="leaderboard-prestige">${entry.prestigeDisplay}</span>
                </div>
            `;
        });
    }
    
    html += '</div>';
    output.innerHTML = html;
}

function addProgressionMessage(message, className = '') {
    console.log('addProgressionMessage called:', message, className);
    
    // Display in the dedicated rewards panel
    const rewardsDisplay = document.getElementById('rewards-display');
    if (rewardsDisplay) {
        // Remove the initial info message if it exists
        const infoMessage = rewardsDisplay.querySelector('.reward-message.info');
        if (infoMessage && infoMessage.textContent.includes('Start gaining experience')) {
            infoMessage.remove();
        }
        
        const messageElement = document.createElement('div');
        messageElement.textContent = message;
        messageElement.className = `reward-message ${className}`;
        
        rewardsDisplay.appendChild(messageElement);
        rewardsDisplay.scrollTop = rewardsDisplay.scrollHeight;
        
        // Keep only the last 20 messages to prevent overflow
        const messages = rewardsDisplay.querySelectorAll('.reward-message');
        if (messages.length > 20) {
            messages[0].remove();
        }
    }
    
    // Still add important messages to main game output
    if (className === 'milestone' || className === 'level-up') {
        addToGameOutput(message, className);
    }
}

// Initialize progression button event listeners
function initializeProgressionButtons() {
    console.log('Initializing progression buttons');
    
    const gain100Btn = document.getElementById('gain-100-exp');
    if (gain100Btn) {
        gain100Btn.addEventListener('click', function() {
            gainExperience(100);
        });
    }
    
    const gain1000Btn = document.getElementById('gain-1000-exp');
    if (gain1000Btn) {
        gain1000Btn.addEventListener('click', function() {
            gainExperience(1000);
        });
    }
    
    const simulateBtn = document.getElementById('simulate-levelup');
    if (simulateBtn) {
        simulateBtn.addEventListener('click', function() {
            simulateLevelUp();
        });
    }
    
    const leaderboardBtn = document.getElementById('view-leaderboard');
    if (leaderboardBtn) {
        leaderboardBtn.addEventListener('click', function() {
            showLeaderboard();
        });
    }
    
    console.log('Progression buttons initialized');
    
    // Initialize menu button
    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn) {
        menuBtn.addEventListener('click', function() {
            toggleMenu();
        });
    }
}

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