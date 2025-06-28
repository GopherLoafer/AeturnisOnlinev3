#!/usr/bin/env python3
"""
Aeturnis Online - Text-Based Game
Main entry point for the game application.
"""

import sys
import os

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from game.engine import GameEngine
from utils.logger import setup_logger

def main():
    """Main function to start the Aeturnis Online game."""
    # Setup logging
    logger = setup_logger()
    logger.info("Starting Aeturnis Online...")
    
    try:
        # Initialize and start the game engine
        game = GameEngine()
        game.run()
    except KeyboardInterrupt:
        print("\n\nThank you for playing Aeturnis Online!")
        logger.info("Game terminated by user")
    except Exception as e:
        logger.error(f"Game crashed with error: {e}")
        print(f"An error occurred: {e}")
        print("Please check the logs for more details.")
        sys.exit(1)

if __name__ == "__main__":
    main()
