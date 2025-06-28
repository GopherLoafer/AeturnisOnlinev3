"""
Menu System - Handles all menu displays and interactions
"""

import logging
from typing import List, Dict, Optional

class MenuSystem:
    """
    Manages all menu displays and user interactions for the game.
    Provides a centralized system for menu navigation.
    """
    
    def __init__(self):
        """Initialize the menu system."""
        self.logger = logging.getLogger(__name__)
        
        # Menu configurations
        self.main_menu_options = [
            "Start Game",
            "Settings", 
            "Quit"
        ]
        
        self.pause_menu_options = [
            "Resume Game",
            "Main Menu",
            "Quit"
        ]
        
        self.settings_menu_options = [
            "Display Settings",
            "Audio Settings",
            "Game Settings",
            "Back to Main Menu"
        ]
        
        self.logger.info("Menu system initialized")
    
    def show_main_menu(self) -> str:
        """
        Display the main menu and get user choice.
        
        Returns:
            The user's menu choice
        """
        print("\n" + "="*50)
        print("AETURNIS ONLINE - MAIN MENU".center(50))
        print("="*50)
        
        for i, option in enumerate(self.main_menu_options, 1):
            print(f"  {i}. {option}")
        
        print("\nEnter your choice (1-{}) or type command: ".format(len(self.main_menu_options)), end="")
        return input().strip()
    
    def show_pause_menu(self) -> str:
        """
        Display the pause menu and get user choice.
        
        Returns:
            The user's menu choice
        """
        print("\n" + "="*50)
        print("GAME PAUSED".center(50))
        print("="*50)
        
        for i, option in enumerate(self.pause_menu_options, 1):
            print(f"  {i}. {option}")
        
        print("\nEnter your choice (1-{}): ".format(len(self.pause_menu_options)), end="")
        return input().strip()
    
    def show_settings_menu(self) -> str:
        """
        Display the settings menu and get user choice.
        
        Returns:
            The user's menu choice
        """
        print("\n" + "="*50)
        print("SETTINGS".center(50))
        print("="*50)
        
        for i, option in enumerate(self.settings_menu_options, 1):
            print(f"  {i}. {option}")
        
        print("\nEnter your choice (1-{}): ".format(len(self.settings_menu_options)), end="")
        return input().strip()
    
    def show_character_creation_menu(self) -> Dict[str, str]:
        """
        Display character creation menu.
        This is a placeholder for future character creation functionality.
        
        Returns:
            Dictionary containing character information
        """
        print("\n" + "="*50)
        print("CHARACTER CREATION".center(50))
        print("="*50)
        
        character_info = {}
        
        print("Character creation is not yet implemented.")
        print("Using default character for now...")
        
        character_info['name'] = 'Adventurer'
        character_info['class'] = 'Wanderer'
        
        return character_info
    
    def show_help_menu(self):
        """Display the help menu with game instructions."""
        print("\n" + "="*60)
        print("AETURNIS ONLINE - HELP".center(60))
        print("="*60)
        
        help_text = """
BASIC COMMANDS:
  help or ?     - Show this help menu
  quit or exit  - Exit the game
  menu or main  - Return to main menu
  pause         - Pause the game (during gameplay)

NAVIGATION:
  In menus, you can either:
  - Enter the number of your choice (1, 2, 3...)
  - Type the full command name (start, settings, quit)

GAME CONTROLS:
  The game uses text-based commands. Type your actions and
  press Enter to execute them.

GETTING STARTED:
  1. Select "Start Game" from the main menu
  2. Follow the on-screen prompts
  3. Type commands to interact with the game world
  4. Use 'help' anytime you need assistance

MORE HELP:
  As the game develops, more commands and features will
  be added. Check this help menu regularly for updates.
        """
        
        print(help_text)
        print("="*60)
        print("\nPress Enter to continue...")
        input()
    
    def show_about_menu(self):
        """Display information about the game."""
        print("\n" + "="*60)
        print("ABOUT AETURNIS ONLINE".center(60))
        print("="*60)
        
        about_text = """
AETURNIS ONLINE
Version: 0.1.0 (Development)

Aeturnis Online is a text-based adventure game that takes you
on an epic journey through a rich fantasy world. Explore vast
landscapes, engage in thrilling combat, solve puzzles, and
uncover the mysteries of Aeturnis.

FEATURES (Planned):
- Rich narrative storytelling
- Character progression system
- Combat mechanics
- Inventory management
- Quest system
- Multiple game areas to explore

DEVELOPMENT STATUS:
This is currently a foundational build with basic menu
systems and game structure in place. Game content and
features will be added in future updates.

DEVELOPERS:
Aeturnis Online Development Team

Thank you for playing and supporting the development
of Aeturnis Online!
        """
        
        print(about_text)
        print("="*60)
        print("\nPress Enter to continue...")
        input()
    
    def show_confirmation_dialog(self, message: str, default: bool = False) -> bool:
        """
        Show a yes/no confirmation dialog.
        
        Args:
            message: The confirmation message to display
            default: Default choice if user just presses Enter
            
        Returns:
            True if user confirms, False otherwise
        """
        default_text = "(Y/n)" if default else "(y/N)"
        choice = input(f"{message} {default_text}: ").strip().lower()
        
        if not choice:
            return default
        
        return choice in ['y', 'yes', 'true', '1']
    
    def show_text_input_dialog(self, prompt: str, default: Optional[str] = None) -> str:
        """
        Show a text input dialog.
        
        Args:
            prompt: The input prompt to display
            default: Default value if user just presses Enter
            
        Returns:
            The user's input string
        """
        if default:
            full_prompt = f"{prompt} (default: {default}): "
        else:
            full_prompt = f"{prompt}: "
        
        user_input = input(full_prompt).strip()
        
        if not user_input and default:
            return default
        
        return user_input
    
    def show_loading_screen(self, message: str = "Loading..."):
        """
        Display a loading screen.
        
        Args:
            message: The loading message to display
        """
        print(f"\n{message}")
        print("Please wait...")
        # In a real implementation, this might show a progress bar
        # or animated loading indicator
