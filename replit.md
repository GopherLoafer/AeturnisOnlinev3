# Aeturnis Online - Text-Based Game

## Overview

Aeturnis Online is a text-based game written in Python 3. The project follows a modular architecture with clear separation of concerns, organizing game functionality into distinct packages for the core game engine, utilities, and supporting systems. The application is designed as a console-based interactive game with menu systems, input handling, display management, and state persistence.

## System Architecture

The system follows a component-based architecture with the following key design principles:

- **Modular Design**: Separate packages for game logic (`game/`) and utilities (`utils/`)
- **Single Responsibility**: Each module handles a specific aspect of the game
- **Centralized Configuration**: Configuration management through `GameConfig` class
- **Event-Driven Loop**: Main game loop with state management
- **Logging Infrastructure**: Comprehensive logging throughout the application

## Key Components

### Game Engine (`game/engine.py`)
- **Purpose**: Core game loop and system coordination
- **Architecture**: Central hub that manages all other game components
- **Key Features**: Main game loop, component initialization, graceful shutdown handling

### State Management (`game/state.py`)
- **Purpose**: Game state tracking and transitions
- **Architecture**: Enum-based state system with transition history
- **States**: MENU, PLAYING, PAUSED, QUIT
- **Data Storage**: Dictionary-based game data management

### Display System (`game/display.py`)
- **Purpose**: Text output formatting and screen management
- **Architecture**: ANSI color support with fallback options
- **Features**: Screen clearing, welcome screen, color formatting
- **Cross-platform**: Supports both Windows and Unix-like systems

### Input Handler (`game/input_handler.py`)
- **Purpose**: User input processing and validation
- **Architecture**: Centralized input management with history tracking
- **Features**: Input validation, command history, length restrictions

### Menu System (`game/menu.py`)
- **Purpose**: Menu display and navigation
- **Architecture**: Option-based menu system
- **Menus**: Main menu, pause menu, settings menu with hierarchical navigation

### Configuration (`game/config.py`)
- **Purpose**: Centralized configuration management
- **Architecture**: Single class containing all game settings
- **Categories**: Display, input, mechanics, logging, performance, network

### Utilities Package (`utils/`)
- **Logger**: Centralized logging with file rotation and console output
- **Helpers**: Common utility functions for string validation and formatting

## Data Flow

1. **Initialization**: Main entry point initializes GameEngine
2. **Component Setup**: GameEngine creates and configures all subsystems
3. **Game Loop**: Continuous loop handling user input and state updates
4. **State Transitions**: MenuSystem and InputHandler coordinate state changes
5. **Display Updates**: Display system renders current game state
6. **Logging**: All components log activities for debugging and monitoring

## External Dependencies

The application is designed with minimal external dependencies:

- **Python Standard Library**: Primary dependency for all functionality
- **OS Integration**: Uses `os` module for cross-platform file operations
- **Logging**: Built-in Python logging with file rotation
- **Terminal Control**: ANSI escape codes for display formatting

## Deployment Strategy

- **Single Entry Point**: `main.py` serves as the application launcher
- **Self-contained**: No external package dependencies required
- **Cross-platform**: Compatible with Windows, macOS, and Linux
- **Logging**: Automatic log file creation and rotation
- **Error Handling**: Graceful error handling with user-friendly messages

## Changelog

- June 28, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.