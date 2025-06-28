"""
Display Manager - Handles all text output and formatting
"""

import logging
import os
from typing import List, Optional

class Display:
    """
    Manages all text display functionality including formatting,
    colors, and screen management.
    """
    
    def __init__(self):
        """Initialize the display manager."""
        self.logger = logging.getLogger(__name__)
        
        # Display settings
        self.width = 80
        self.use_colors = True
        
        # ANSI color codes
        self.colors = {
            'reset': '\033[0m',
            'bold': '\033[1m',
            'red': '\033[31m',
            'green': '\033[32m',
            'yellow': '\033[33m',
            'blue': '\033[34m',
            'magenta': '\033[35m',
            'cyan': '\033[36m',
            'white': '\033[37m'
        }
        
        self.logger.info("Display manager initialized")
    
    def clear_screen(self):
        """Clear the terminal screen."""
        os.system('cls' if os.name == 'nt' else 'clear')
    
    def show_welcome(self):
        """Display the welcome screen."""
        self.clear_screen()
        welcome_text = """
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                                ║
║      █████╗ ███████╗████████╗██╗   ██╗██████╗ ███╗   ██╗██╗███████╗          ║
║     ██╔══██╗██╔════╝╚══██╔══╝██║   ██║██╔══██╗████╗  ██║██║██╔════╝          ║
║     ███████║█████╗     ██║   ██║   ██║██████╔╝██╔██╗ ██║██║███████╗          ║
║     ██╔══██║██╔══╝     ██║   ██║   ██║██╔══██╗██║╚██╗██║██║╚════██║          ║
║     ██║  ██║███████╗   ██║   ╚██████╔╝██║  ██║██║ ╚████║██║███████║          ║
║     ╚═╝  ╚═╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝╚══════╝          ║
║                                                                                ║
║                               ██████╗ ███╗   ██╗██╗     ██╗███╗   ██╗███████╗ ║
║                              ██╔═══██╗████╗  ██║██║     ██║████╗  ██║██╔════╝ ║
║                              ██║   ██║██╔██╗ ██║██║     ██║██╔██╗ ██║█████╗   ║
║                              ██║   ██║██║╚██╗██║██║     ██║██║╚██╗██║██╔══╝   ║
║                              ╚██████╔╝██║ ╚████║███████╗██║██║ ╚████║███████╗ ║
║                               ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚═╝╚═╝  ╚═══╝╚══════╝ ║
║                                                                                ║
║                          Welcome to the World of Aeturnis                     ║
║                                                                                ║
╚═══════════════════════════════════════════════════════════════════════════════╝
        """
        print(welcome_text)
        print("\nPress Enter to continue...")
        input()
    
    def show_goodbye(self):
        """Display the goodbye message."""
        goodbye_text = """
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                                ║
║                          Thank you for playing                                ║
║                               AETURNIS ONLINE                                 ║
║                                                                                ║
║                        Your adventure awaits your return...                   ║
║                                                                                ║
╚═══════════════════════════════════════════════════════════════════════════════╝
        """
        print(goodbye_text)
    
    def show_game_prompt(self):
        """Display the main game prompt."""
        print("\n" + "="*60)
        print("Welcome to the world of Aeturnis!")
        print("Your journey begins here...")
        print("\nWhat would you like to do?")
        print("(Type 'help' for available commands)")
        print("="*60)
    
    def show_error(self, message: str):
        """
        Display an error message.
        
        Args:
            message: The error message to display
        """
        if self.use_colors:
            print(f"{self.colors['red']}Error: {message}{self.colors['reset']}")
        else:
            print(f"Error: {message}")
    
    def show_warning(self, message: str):
        """
        Display a warning message.
        
        Args:
            message: The warning message to display
        """
        if self.use_colors:
            print(f"{self.colors['yellow']}Warning: {message}{self.colors['reset']}")
        else:
            print(f"Warning: {message}")
    
    def show_success(self, message: str):
        """
        Display a success message.
        
        Args:
            message: The success message to display
        """
        if self.use_colors:
            print(f"{self.colors['green']}{message}{self.colors['reset']}")
        else:
            print(message)
    
    def show_info(self, message: str):
        """
        Display an info message.
        
        Args:
            message: The info message to display
        """
        if self.use_colors:
            print(f"{self.colors['cyan']}{message}{self.colors['reset']}")
        else:
            print(message)
    
    def format_text(self, text: str, width: Optional[int] = None, 
                   center: bool = False, color: Optional[str] = None) -> str:
        """
        Format text with various options.
        
        Args:
            text: The text to format
            width: Width for text wrapping (default: self.width)
            center: Whether to center the text
            color: Color to apply to the text
            
        Returns:
            The formatted text string
        """
        if width is None:
            width = self.width
        
        formatted = text
        
        if center:
            formatted = formatted.center(width)
        
        if color and self.use_colors and color in self.colors:
            formatted = f"{self.colors[color]}{formatted}{self.colors['reset']}"
        
        return formatted
    
    def show_bordered_text(self, text: str, border_char: str = "="):
        """
        Display text with a border.
        
        Args:
            text: The text to display
            border_char: Character to use for the border
        """
        border = border_char * self.width
        print(border)
        print(text.center(self.width))
        print(border)
    
    def show_menu(self, title: str, options: List[str], 
                  numbered: bool = True) -> str:
        """
        Display a menu and get user selection.
        
        Args:
            title: The menu title
            options: List of menu options
            numbered: Whether to show numbers for options
            
        Returns:
            The user's choice
        """
        print(f"\n{title}")
        print("=" * len(title))
        
        for i, option in enumerate(options, 1):
            if numbered:
                print(f"{i}. {option}")
            else:
                print(f"   {option}")
        
        print()
        return input("Please select an option: ").strip()
    
    def show_status_bar(self, status_items: dict):
        """
        Display a status bar with various game information.
        
        Args:
            status_items: Dictionary of status items to display
        """
        status_line = " | ".join([f"{k}: {v}" for k, v in status_items.items()])
        print(f"\n[{status_line}]")
        print("-" * len(status_line))
