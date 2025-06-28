"""
Game State Management - Handles all game state logic and persistence
"""

import logging
from typing import Dict, Any, Optional
from enum import Enum

class GameStates(Enum):
    """Enumeration of possible game states."""
    MENU = "menu"
    PLAYING = "playing"
    PAUSED = "paused"
    QUIT = "quit"

class GameState:
    """
    Manages the current state of the game and provides
    methods for state transitions and data persistence.
    """
    
    def __init__(self):
        """Initialize the game state."""
        self.logger = logging.getLogger(__name__)
        
        # Current game state
        self.current_state = GameStates.MENU.value
        self.previous_state = None
        
        # Game data storage
        self.game_data: Dict[str, Any] = {
            'player': {},
            'world': {},
            'session': {},
            'settings': {}
        }
        
        # State transition history for debugging
        self.state_history = []
        
        self.logger.info("Game state initialized")
    
    def set_state(self, new_state: str):
        """
        Change the current game state.
        
        Args:
            new_state: The new state to transition to
        """
        if new_state not in [state.value for state in GameStates]:
            self.logger.error(f"Invalid state transition attempted: {new_state}")
            return False
        
        self.previous_state = self.current_state
        self.current_state = new_state
        
        # Log state transition
        self.logger.info(f"State changed: {self.previous_state} -> {self.current_state}")
        self.state_history.append((self.previous_state, self.current_state))
        
        return True
    
    def get_state(self) -> str:
        """Get the current game state."""
        return self.current_state
    
    def revert_state(self):
        """Revert to the previous state if available."""
        if self.previous_state:
            old_current = self.current_state
            self.current_state = self.previous_state
            self.previous_state = old_current
            self.logger.info(f"Reverted state to: {self.current_state}")
            return True
        return False
    
    def update(self):
        """
        Update game state. This method is called every game loop iteration.
        Used for time-based updates, state validation, etc.
        """
        # Validate current state
        if self.current_state not in [state.value for state in GameStates]:
            self.logger.warning(f"Invalid current state detected: {self.current_state}")
            self.set_state(GameStates.MENU.value)
        
        # Update session data
        self._update_session_data()
    
    def _update_session_data(self):
        """Update session-specific data like playtime, etc."""
        # This would contain logic for updating session information
        # For now, this is a placeholder for future implementation
        pass
    
    def set_data(self, category: str, key: str, value: Any):
        """
        Set data in the game state.
        
        Args:
            category: The data category (player, world, session, settings)
            key: The data key
            value: The value to store
        """
        if category not in self.game_data:
            self.logger.warning(f"Unknown data category: {category}")
            return False
        
        self.game_data[category][key] = value
        self.logger.debug(f"Set {category}.{key} = {value}")
        return True
    
    def get_data(self, category: str, key: str, default: Any = None) -> Any:
        """
        Get data from the game state.
        
        Args:
            category: The data category
            key: The data key
            default: Default value if key not found
            
        Returns:
            The stored value or default
        """
        if category not in self.game_data:
            return default
        
        return self.game_data[category].get(key, default)
    
    def save_state(self):
        """Save the current game state to persistent storage."""
        # Placeholder for future save functionality
        self.logger.info("Game state save requested (not implemented)")
        pass
    
    def load_state(self):
        """Load game state from persistent storage."""
        # Placeholder for future load functionality
        self.logger.info("Game state load requested (not implemented)")
        pass
