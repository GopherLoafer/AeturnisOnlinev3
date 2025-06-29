// Aeturnis Online - Client-side Game Interface
// Phase 2.3 Implementation with Affinity System Integration

// ===== Core Game State Management =====

let gameState = {
    character: null,
    location: null,
    inventory: [],
    affinities: {
        weapons: {},
        magic: {}
    },
    cooldowns: {}
};

// Timeout for debouncing game state refreshes
let gameStateRefreshTimeout;

// ===== Tab System for Sidebar =====

function switchTab(tabName) {
    try {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            if (tab) {
                tab.style.display = 'none';
                tab.classList.remove('active');
            }
        });
        
        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            if (button && button.classList) {
                button.classList.remove('active');
            }
        });
        
        // Show the selected tab
        const selectedTab = document.getElementById(tabName);
        if (selectedTab) {
            selectedTab.style.display = 'block';
            selectedTab.classList.add('active');
        }
        
        // Add active class to the clicked button by finding button containing the tabName
        const buttons = document.querySelectorAll('.tab-button');
        buttons.forEach(button => {
            if (button && button.textContent && button.textContent.toLowerCase().includes(tabName.toLowerCase())) {
                if (button.classList) {
                    button.classList.add('active');
                }
            }
        });
        
    } catch (error) {
        console.error('Tab switching error:', error);
    }
}

// ===== Real-time Clock Updates =====

function updateServerTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const timeElement = document.getElementById('server-time');
    if (timeElement) {
        timeElement.textContent = timeString;
    }
}

// Update time every second
setInterval(updateServerTime, 1000);

// ===== Movement Controls =====

function move(direction) {
    if (isCooldownActive('movement')) return;
    
    setCooldown('movement', 1000); // 1 second movement cooldown
    
    fetch(`/api/game/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateGameText(data.message);
            updateLocation(data.location);
        } else {
            updateGameText(`Cannot move ${direction}: ${data.error}`);
        }
    })
    .catch(error => {
        console.error('Movement error:', error);
        updateGameText('Movement failed - server error');
    });
}

// ===== Action System =====

function performAction(action) {
    if (isCooldownActive(action)) return;
    
    const cooldownTimes = {
        fight: 2000,
        cast: 3000,
        rest: 5000,
        map: 1000
    };
    
    setCooldown(action, cooldownTimes[action] || 2000);
    
    fetch(`/api/game/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateGameText(data.message);
            if (data.experience) {
                updateExperience(data.experience);
            }
            if (data.affinityGain) {
                updateAffinityDisplay(data.affinityGain);
            }
        } else {
            updateGameText(`Action failed: ${data.error}`);
        }
    })
    .catch(error => {
        console.error('Action error:', error);
        updateGameText('Action failed - server error');
    });
}

// ===== Cooldown Management =====

function setCooldown(action, duration) {
    gameState.cooldowns[action] = Date.now() + duration;
    
    const button = document.querySelector(`[onclick*="${action}"]`);
    if (button) {
        button.disabled = true;
        button.classList.add('cooldown');
        
        setTimeout(() => {
            button.disabled = false;
            button.classList.remove('cooldown');
            delete gameState.cooldowns[action];
        }, duration);
    }
}

function isCooldownActive(action) {
    return gameState.cooldowns[action] && Date.now() < gameState.cooldowns[action];
}

// ===== Game Text Updates =====

function updateGameText(message) {
    const gameText = document.getElementById('game-text');
    if (gameText) {
        const timestamp = new Date().toLocaleTimeString();
        const messageElement = document.createElement('div');
        messageElement.innerHTML = `<span class="timestamp">[${timestamp}]</span> ${message}`;
        
        gameText.appendChild(messageElement);
        gameText.scrollTop = gameText.scrollHeight;
        
        // Keep only last 100 messages for performance
        while (gameText.children.length > 100) {
            gameText.removeChild(gameText.firstChild);
        }
    }
}

// ===== Character State Updates =====

function updateCharacterStats(character) {
    console.log('updateCharacterStats called with:', character);
    
    // Update individual stat displays
    const statMappings = {
        'stat-str': character.str_total || character.str_base || 10,
        'stat-int': character.int_total || character.int_base || 10,
        'stat-vit': character.vit_total || character.vit_base || 10,
        'stat-dex': character.dex_total || character.dex_base || 10,
        'stat-wis': character.wis_total || character.wis_base || 10
    };
    
    Object.entries(statMappings).forEach(([elementId, value]) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    });
    
    // Update total stats
    const totalElement = document.getElementById('stat-total');
    if (totalElement) {
        const str = character.str_total || character.str_base || 10;
        const int = character.int_total || character.int_base || 10;
        const vit = character.vit_total || character.vit_base || 10;
        const dex = character.dex_total || character.dex_base || 10;
        const wis = character.wis_total || character.wis_base || 10;
        const total = str + int + vit + dex + wis;
        totalElement.textContent = total;
    }
}

function updateHealthMana(health, mana) {
    const healthBar = document.getElementById('health-bar');
    const manaBar = document.getElementById('mana-bar');
    const healthText = document.getElementById('health-text');
    const manaText = document.getElementById('mana-text');
    
    if (healthBar && health.current !== undefined && health.max !== undefined) {
        const healthPercent = (health.current / health.max) * 100;
        healthBar.style.width = `${healthPercent}%`;
        if (healthText) {
            healthText.textContent = `${Math.round(healthPercent)}%`;
        }
    }
    
    if (manaBar && mana.current !== undefined && mana.max !== undefined) {
        const manaPercent = (mana.current / mana.max) * 100;
        manaBar.style.width = `${manaPercent}%`;
        if (manaText) {
            manaText.textContent = `${Math.round(manaPercent)}%`;
        }
    }
}

function updateLocation(location) {
    const locationElement = document.getElementById('current-location');
    if (locationElement && location) {
        locationElement.textContent = location.zone || location;
    }
}

// ===== Experience System =====

function updateExperience(expData) {
    if (expData.gained) {
        updateGameText(`<span class="exp-gain">+${expData.gained} experience!</span>`);
    }
    
    if (expData.levelUp) {
        updateGameText(`<span class="level-up">Level up! You are now level ${expData.newLevel}!</span>`);
        updateCharacterLevel(expData.newLevel);
    }
    
    updateExperienceBar(expData);
}

function updateExperienceBar(expData) {
    const expBar = document.getElementById('exp-bar');
    const expText = document.getElementById('exp-text');
    const expLabel = document.querySelector('#exp-bar').closest('.stat-bar').querySelector('.stat-label span:last-child');
    
    if (expBar && expData.current !== undefined && expData.required !== undefined) {
        const expPercent = Math.floor((expData.current / expData.required) * 100);
        expBar.style.width = `${expPercent}%`;
        
        if (expText) {
            expText.textContent = `${formatNumber(expData.current)}/${formatNumber(expData.required)}`;
        }
        
        if (expLabel) {
            expLabel.textContent = `${expPercent}% to next`;
        }
    }
}

function updateCharacterLevel(level) {
    const levelElement = document.getElementById('character-level');
    if (levelElement) {
        levelElement.textContent = level;
    }
}

// ===== Affinity System =====

function updateAffinityDisplay(affinityData) {
    if (affinityData && affinityData.weapon) {
        updateWeaponAffinity(affinityData.weapon.type, affinityData.weapon.level);
        updateGameText(`<span class="affinity-gain">${affinityData.weapon.type} affinity increased!</span>`);
    }
    
    if (affinityData && affinityData.magic) {
        updateMagicAffinity(affinityData.magic.school, affinityData.magic.level);
        updateGameText(`<span class="affinity-gain">${affinityData.magic.school} magic affinity increased!</span>`);
    }
}

function updateWeaponAffinity(weaponType, level) {
    const affinityElement = document.getElementById(`weapon-${weaponType}-affinity`);
    if (affinityElement) {
        affinityElement.textContent = `${level.toFixed(2)}%`;
    }
    if (gameState && gameState.affinities && gameState.affinities.weapons) {
        gameState.affinities.weapons[weaponType] = level;
    }
}

function updateMagicAffinity(school, level) {
    const affinityElement = document.getElementById(`magic-${school}-affinity`);
    if (affinityElement) {
        affinityElement.textContent = `${level.toFixed(2)}%`;
    }
    if (gameState && gameState.affinities && gameState.affinities.magic) {
        gameState.affinities.magic[school] = level;
    }
}

// ===== Chat System =====

function sendChatMessage() {
    const chatInput = document.getElementById('chat-input');
    const activeChannel = document.querySelector('.chat-tab.active')?.dataset.channel || 'all';
    
    if (chatInput && chatInput.value.trim()) {
        const message = chatInput.value.trim();
        
        fetch('/api/game/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, channel: activeChannel })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                chatInput.value = '';
                // Message will be received through WebSocket or polling
            } else {
                updateGameText(`Chat error: ${data.error}`);
            }
        })
        .catch(error => {
            console.error('Chat error:', error);
        });
    }
}

function switchChatChannel(channel) {
    document.querySelectorAll('.chat-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const activeTab = document.querySelector(`[data-channel="${channel}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
}

// ===== Keyboard Controls =====

document.addEventListener('keydown', function(event) {
    // Prevent keyboard shortcuts when typing in input fields
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        if (event.key === 'Enter' && event.target.id === 'chat-input') {
            sendChatMessage();
        }
        return;
    }
    
    switch(event.key.toLowerCase()) {
        case 'w':
            move('north');
            break;
        case 'a':
            move('west');
            break;
        case 's':
            move('south');
            break;
        case 'd':
            move('east');
            break;
        case ' ':
            event.preventDefault();
            performAction('fight');
            break;
        case 'r':
            performAction('rest');
            break;
        case 'c':
            performAction('cast');
            break;
        case 'm':
            performAction('map');
            break;
    }
});

// ===== Progression System Integration =====

function gainExperience(amount) {
    console.log('gainExperience called with amount:', amount);
    console.log('Making API request to /api/progression/award-experience');
    
    fetch('/api/progression/award-experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseInt(amount) })
    })
    .then(response => {
        console.log('Response status:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Response data:', data);
        if (data.success) {
            const expGained = parseInt(data.data?.experienceGained || amount);
            addProgressionMessage(`Gained ${formatNumber(expGained)} experience!`, 'success');
            
            if (data.data?.leveledUp) {
                addProgressionMessage(`Level up! Now level ${data.data.newLevel}!`, 'level-up');
            }
            
            refreshGameState();
        } else {
            addProgressionMessage(data.error || 'Failed to award experience', 'error');
        }
    })
    .catch(error => {
        console.error('Experience gain error:', error);
        addProgressionMessage('Network error while gaining experience', 'error');
    });
}

function addProgressionMessage(message, type = 'info') {
    console.log('addProgressionMessage called:', message, type);
    const messagesDiv = document.getElementById('progression-messages');
    if (messagesDiv) {
        const messageElement = document.createElement('div');
        messageElement.className = `progression-message ${type}`;
        messageElement.textContent = message;
        messagesDiv.appendChild(messageElement);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        
        // Keep only last 10 messages
        while (messagesDiv.children.length > 10) {
            messagesDiv.removeChild(messagesDiv.firstChild);
        }
    }
}

function initializeProgressionButtons() {
    console.log('Initializing progression buttons');
    // Buttons already have onclick handlers in HTML template
    // No additional event listeners needed to prevent double calls
    console.log('Progression buttons initialized');
}

// ===== Game State Refresh =====

function refreshGameState() {
    // Debounce rapid successive calls
    clearTimeout(gameStateRefreshTimeout);
    gameStateRefreshTimeout = setTimeout(() => {
        fetch('/api/game/state')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            gameState.character = data.character;
            
            // Update character display
            if (data.character) {
                updateCharacterStats(data.character);
                
                updateHealthMana(
                    { current: data.character.health_current, max: data.character.health_max },
                    { current: data.character.mana_current, max: data.character.mana_max }
                );
                
                updateCharacterLevel(data.character.level);
                
                if (data.character.experience !== undefined) {
                    // Use experience_progress (current level progress) instead of total experience
                    const currentProgress = data.character.experience_progress || 0;
                    const required = data.character.experience_to_next || 1000;
                    
                    updateExperienceBar({
                        current: currentProgress,
                        required: required
                    });
                }
                
                // Force update character level display
                if (data.character.level) {
                    updateCharacterLevel(data.character.level);
                }
            }
        } else {
            console.error('Game state error:', data.error);
        }
    })
    .catch(error => {
        console.error('Game state refresh error:', error);
    });
    }, 150); // 150ms debounce delay
}

// ===== Utility Functions =====

function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + 'B';
    } else if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// ===== Initialization =====

document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI components
    updateServerTime();
    initializeProgressionButtons();
    
    // Start periodic game state refresh
    setInterval(refreshGameState, 60000); // Refresh every 60 seconds
    
    // Initial game state load
    refreshGameState();
    
    // Focus chat input when page loads
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.focus();
    }
    
    // Set default tab
    switchTab('inventory');
    
    console.log('Aeturnis Online client initialized');
});