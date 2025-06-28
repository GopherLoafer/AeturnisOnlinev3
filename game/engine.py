"""
Game Engine - Core game loop and main engine functionality
"""

import logging
from typing import Optional

from .state import GameState
from .display import Display
from .input_handler import InputHandler
from .menu import MenuSystem
from .config import GameConfig

class GameEngine:
    """
    Main game engine that manages the core game loop and coordinates
    all game systems.
    """
    
    def __init__(self):
        """Initialize the game engine with all necessary components."""
        self.logger = logging.getLogger(__name__)
        self.config = GameConfig()
        
        # Initialize game components
        self.state = GameState()
        self.display = Display()
        self.input_handler = InputHandler()
        self.menu_system = MenuSystem()
        
        # Game loop control
        self.running = False
        
        self.logger.info("Game engine initialized")
    
    def run(self):
        """
        Start the main game loop.
        This is the primary entry point for running the game.
        """
        self.logger.info("Starting game engine")
        self.running = True
        
        # Display welcome message
        self.display.show_welcome()
        
        # Main game loop
        while self.running:
            try:
                self._game_loop_iteration()
            except Exception as e:
                self.logger.error(f"Error in game loop: {e}")
                self.display.show_error("An unexpected error occurred. Please try again.")
                continue
        
        self.logger.info("Game engine stopped")
    
    def _game_loop_iteration(self):
        """
        Execute one iteration of the game loop.
        This method handles the core game logic flow.
        """
        # Update game state
        self.state.update()
        
        # Handle current game state
        if self.state.current_state == "menu":
            self._handle_menu_state()
        elif self.state.current_state == "playing":
            self._handle_playing_state()
        elif self.state.current_state == "paused":
            self._handle_paused_state()
        elif self.state.current_state == "quit":
            self._handle_quit_state()
        else:
            self.logger.warning(f"Unknown game state: {self.state.current_state}")
            self.state.set_state("menu")
    
    def _handle_menu_state(self):
        """Handle the menu state logic."""
        choice = self.menu_system.show_main_menu()
        self.input_handler.process_menu_input(choice, self.state)
    
    def _handle_playing_state(self):
        """Handle the playing state logic."""
        # This is where the main game logic would go
        # For now, just provide a basic interface
        self.display.show_game_prompt()
        user_input = self.input_handler.get_user_input()
        self.input_handler.process_game_input(user_input, self.state)
    
    def _handle_paused_state(self):
        """Handle the paused state logic."""
        choice = self.menu_system.show_pause_menu()
        self.input_handler.process_pause_input(choice, self.state)
    
    def _handle_quit_state(self):
        """Handle the quit state logic."""
        self.display.show_goodbye()
        self.running = False
    
    def shutdown(self):
        """Gracefully shutdown the game engine."""
        self.logger.info("Shutting down game engine")
        self.running = False
        self.state.save_state()  # Save current game state if needed
