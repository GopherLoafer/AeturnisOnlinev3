"""
Aeturnis Online Game Package
Main game package containing all game logic and components.
"""

__version__ = "0.1.0"
__author__ = "Aeturnis Online Development Team"
__description__ = "Text-based online game engine"

# Package imports for easier access
from .engine import GameEngine
from .state import GameState
from .display import Display
from .input_handler import InputHandler
from .menu import MenuSystem

__all__ = [
    'GameEngine',
    'GameState', 
    'Display',
    'InputHandler',
    'MenuSystem'
]
