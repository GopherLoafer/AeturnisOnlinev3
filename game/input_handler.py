"""
Input Handler - Manages all user input processing and validation
"""

import logging
from typing import Optional, List, Callable

class InputHandler:
    """
    Handles all user input processing, validation, and routing
    to appropriate game systems.
    """
    
    def __init__(self):
        """Initialize the input handler."""
        self.logger = logging.getLogger(__name__)
        
        # Input validation settings
        self.max_input_length = 1000
        self.allowed_commands = set()
        
        # Command history for debugging and user convenience
        self.command_history: List[str] = []
        self.max_history = 100
        
        self.logger.info("Input handler initialized")
    
    def get_user_input(self, prompt: str = "> ") -> str:
        """
        Get input from the user with basic validation.
        
        Args:
            prompt: The prompt to display to the user
            
        Returns:
            The cleaned user input string
        """
        try:
            user_input = input(prompt).strip()
            
            # Basic input validation
            if len(user_input) > self.max_input_length:
                self.logger.warning(f"Input too long: {len(user_input)} characters")
                return ""
            
            # Add to command history if not empty
            if user_input:
                self._add_to_history(user_input)
            
            self.logger.debug(f"User input received: '{user_input}'")
            return user_input
            
        except EOFError:
            self.logger.info("EOF received, treating as quit command")
            return "quit"
        except KeyboardInterrupt:
            self.logger.info("Keyboard interrupt received")
            raise
        except Exception as e:
            self.logger.error(f"Error getting user input: {e}")
            return ""
    
    def process_menu_input(self, choice: str, game_state) -> bool:
        """
        Process input from menu interactions.
        
        Args:
            choice: The menu choice selected
            game_state: Reference to the game state object
            
        Returns:
            True if input was processed successfully
        """
        choice = choice.lower().strip()
        
        if choice in ['1', 'start', 'play']:
            game_state.set_state("playing")
            return True
        elif choice in ['2', 'settings', 'options']:
            self._handle_settings_menu(game_state)
            return True
        elif choice in ['3', 'quit', 'exit']:
            game_state.set_state("quit")
            return True
        elif choice in ['help', '?']:
            self._show_menu_help()
            return True
        else:
            self.logger.warning(f"Invalid menu choice: {choice}")
            print("Invalid choice. Please try again.")
            return False
    
    def process_game_input(self, user_input: str, game_state) -> bool:
        """
        Process input during gameplay.
        
        Args:
            user_input: The raw user input
            game_state: Reference to the game state object
            
        Returns:
            True if input was processed successfully
        """
        if not user_input:
            return False
        
        # Parse the input into command and arguments
        parts = user_input.lower().split()
        command = parts[0] if parts else ""
        args = parts[1:] if len(parts) > 1 else []
        
        # Handle special commands
        if command in ['quit', 'exit']:
            game_state.set_state("quit")
            return True
        elif command in ['menu', 'main']:
            game_state.set_state("menu")
            return True
        elif command in ['pause']:
            game_state.set_state("paused")
            return True
        elif command in ['help', '?']:
            self._show_game_help()
            return True
        else:
            # This is where game-specific commands would be processed
            print(f"Unknown command: {command}")
            print("Type 'help' for available commands.")
            return False
    
    def process_pause_input(self, choice: str, game_state) -> bool:
        """
        Process input from the pause menu.
        
        Args:
            choice: The pause menu choice
            game_state: Reference to the game state object
            
        Returns:
            True if input was processed successfully
        """
        choice = choice.lower().strip()
        
        if choice in ['1', 'resume', 'continue']:
            game_state.set_state("playing")
            return True
        elif choice in ['2', 'menu', 'main']:
            game_state.set_state("menu")
            return True
        elif choice in ['3', 'quit', 'exit']:
            game_state.set_state("quit")
            return True
        else:
            print("Invalid choice. Please try again.")
            return False
    
    def _add_to_history(self, command: str):
        """Add a command to the input history."""
        self.command_history.append(command)
        
        # Limit history size
        if len(self.command_history) > self.max_history:
            self.command_history.pop(0)
    
    def _handle_settings_menu(self, game_state):
        """Handle settings menu interaction."""
        print("\n=== Settings ===")
        print("Settings functionality not yet implemented.")
        print("Press Enter to return to main menu...")
        input()
    
    def _show_menu_help(self):
        """Display help for menu commands."""
        print("\n=== Menu Help ===")
        print("1 or 'start' - Start the game")
        print("2 or 'settings' - Open settings")
        print("3 or 'quit' - Exit the game")
        print("'help' or '?' - Show this help")
        print()
    
    def _show_game_help(self):
        """Display help for game commands."""
        print("\n=== Game Help ===")
        print("Available commands:")
        print("  help or ? - Show this help")
        print("  pause - Pause the game")
        print("  menu - Return to main menu")
        print("  quit - Exit the game")
        print("\nMore commands will be available as the game develops.")
        print()
    
    def validate_input(self, user_input: str, allowed_chars: Optional[str] = None) -> bool:
        """
        Validate user input against various criteria.
        
        Args:
            user_input: The input to validate
            allowed_chars: Optional string of allowed characters
            
        Returns:
            True if input is valid
        """
        if not user_input:
            return False
        
        if len(user_input) > self.max_input_length:
            return False
        
        if allowed_chars:
            return all(c in allowed_chars for c in user_input)
        
        return True
