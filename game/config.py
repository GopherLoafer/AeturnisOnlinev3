"""
Game Configuration - Centralized configuration management
"""

import os
import logging
from typing import Dict, Any, Optional

class GameConfig:
    """
    Manages all game configuration settings and provides
    centralized access to configuration values.
    """
    
    def __init__(self):
        """Initialize game configuration with default values."""
        self.logger = logging.getLogger(__name__)
        
        # Game information
        self.game_name = "Aeturnis Online"
        self.game_version = "0.1.0"
        self.game_author = "Aeturnis Online Development Team"
        
        # Display settings
        self.display_width = 80
        self.display_height = 24
        self.use_colors = True
        self.clear_screen_on_start = True
        
        # Input settings
        self.max_input_length = 1000
        self.input_timeout = None  # No timeout by default
        self.command_history_size = 100
        
        # Game mechanics settings
        self.auto_save_enabled = True
        self.auto_save_interval = 300  # 5 minutes in seconds
        self.debug_mode = False
        
        # Logging settings
        self.log_level = "INFO"
        self.log_to_file = True
        self.log_file_path = "aeturnis.log"
        self.max_log_size = 10 * 1024 * 1024  # 10MB
        
        # Performance settings
        self.game_loop_delay = 0.1  # seconds
        self.max_fps = 60
        
        # Network settings (for future online features)
        self.server_host = "localhost"
        self.server_port = 8000
        self.connection_timeout = 30
        
        # File paths
        self.save_directory = "saves"
        self.config_directory = "config"
        self.log_directory = "logs"
        
        # Load configuration from environment variables or config files
        self._load_configuration()
        
        self.logger.info(f"Game configuration loaded for {self.game_name} v{self.game_version}")
    
    def _load_configuration(self):
        """Load configuration from environment variables and config files."""
        # Load from environment variables
        self.debug_mode = os.getenv("AETURNIS_DEBUG", "false").lower() == "true"
        self.log_level = os.getenv("AETURNIS_LOG_LEVEL", self.log_level)
        self.use_colors = os.getenv("AETURNIS_USE_COLORS", "true").lower() == "true"
        
        # Server settings from environment
        self.server_host = os.getenv("AETURNIS_HOST", self.server_host)
        self.server_port = int(os.getenv("AETURNIS_PORT", str(self.server_port)))
        
        # Create necessary directories
        self._create_directories()
    
    def _create_directories(self):
        """Create necessary directories if they don't exist."""
        directories = [
            self.save_directory,
            self.config_directory,
            self.log_directory
        ]
        
        for directory in directories:
            if not os.path.exists(directory):
                try:
                    os.makedirs(directory)
                    self.logger.debug(f"Created directory: {directory}")
                except OSError as e:
                    self.logger.error(f"Failed to create directory {directory}: {e}")
    
    def get(self, key: str, default: Any = None) -> Any:
        """
        Get a configuration value.
        
        Args:
            key: The configuration key
            default: Default value if key not found
            
        Returns:
            The configuration value or default
        """
        return getattr(self, key, default)
    
    def set(self, key: str, value: Any) -> bool:
        """
        Set a configuration value.
        
        Args:
            key: The configuration key
            value: The value to set
            
        Returns:
            True if successful, False otherwise
        """
        try:
            setattr(self, key, value)
            self.logger.debug(f"Configuration set: {key} = {value}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to set configuration {key}: {e}")
            return False
    
    def get_display_config(self) -> Dict[str, Any]:
        """Get display-related configuration."""
        return {
            'width': self.display_width,
            'height': self.display_height,
            'use_colors': self.use_colors,
            'clear_screen_on_start': self.clear_screen_on_start
        }
    
    def get_input_config(self) -> Dict[str, Any]:
        """Get input-related configuration."""
        return {
            'max_input_length': self.max_input_length,
            'input_timeout': self.input_timeout,
            'command_history_size': self.command_history_size
        }
    
    def get_game_config(self) -> Dict[str, Any]:
        """Get game mechanics configuration."""
        return {
            'auto_save_enabled': self.auto_save_enabled,
            'auto_save_interval': self.auto_save_interval,
            'debug_mode': self.debug_mode,
            'game_loop_delay': self.game_loop_delay
        }
    
    def get_logging_config(self) -> Dict[str, Any]:
        """Get logging-related configuration."""
        return {
            'log_level': self.log_level,
            'log_to_file': self.log_to_file,
            'log_file_path': os.path.join(self.log_directory, self.log_file_path),
            'max_log_size': self.max_log_size
        }
    
    def validate_config(self) -> bool:
        """
        Validate the current configuration.
        
        Returns:
            True if configuration is valid, False otherwise
        """
        try:
            # Check required string values
            if not self.game_name or not isinstance(self.game_name, str):
                return False
            
            # Check numeric values
            if not isinstance(self.display_width, int) or self.display_width <= 0:
                return False
            
            if not isinstance(self.server_port, int) or not (1 <= self.server_port <= 65535):
                return False
            
            # Check boolean values
            if not isinstance(self.debug_mode, bool):
                return False
            
            self.logger.info("Configuration validation passed")
            return True
            
        except Exception as e:
            self.logger.error(f"Configuration validation failed: {e}")
            return False
    
    def save_config(self, filepath: Optional[str] = None):
        """
        Save current configuration to a file.
        
        Args:
            filepath: Optional path to save config file
        """
        # Placeholder for future configuration file saving
        if filepath is None:
            filepath = os.path.join(self.config_directory, "game_config.ini")
        
        self.logger.info(f"Configuration save requested to {filepath} (not implemented)")
    
    def load_config(self, filepath: Optional[str] = None):
        """
        Load configuration from a file.
        
        Args:
            filepath: Optional path to load config file from
        """
        # Placeholder for future configuration file loading
        if filepath is None:
            filepath = os.path.join(self.config_directory, "game_config.ini")
        
        self.logger.info(f"Configuration load requested from {filepath} (not implemented)")
