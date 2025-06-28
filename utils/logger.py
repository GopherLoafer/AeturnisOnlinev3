"""
Logging Utilities - Centralized logging configuration and management
"""

import logging
import logging.handlers
import os
from typing import Optional

def setup_logger(name: Optional[str] = None, 
                log_level: str = "INFO",
                log_to_file: bool = True,
                log_file_path: str = "logs/aeturnis.log",
                max_file_size: int = 10 * 1024 * 1024,
                backup_count: int = 5) -> logging.Logger:
    """
    Set up and configure the logger for the application.
    
    Args:
        name: Logger name (default: root logger)
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_to_file: Whether to log to a file
        log_file_path: Path to the log file
        max_file_size: Maximum size of log file before rotation
        backup_count: Number of backup log files to keep
        
    Returns:
        Configured logger instance
    """
    # Create logger
    logger = logging.getLogger(name)
    
    # Clear any existing handlers
    logger.handlers.clear()
    
    # Set log level
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)
    logger.setLevel(numeric_level)
    
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(numeric_level)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # File handler (if enabled)
    if log_to_file:
        # Ensure log directory exists
        log_dir = os.path.dirname(log_file_path)
        if log_dir and not os.path.exists(log_dir):
            try:
                os.makedirs(log_dir)
            except OSError as e:
                logger.error(f"Failed to create log directory {log_dir}: {e}")
                return logger
        
        try:
            # Use rotating file handler to prevent log files from getting too large
            file_handler = logging.handlers.RotatingFileHandler(
                log_file_path,
                maxBytes=max_file_size,
                backupCount=backup_count
            )
            file_handler.setLevel(numeric_level)
            file_handler.setFormatter(formatter)
            logger.addHandler(file_handler)
            
        except Exception as e:
            logger.error(f"Failed to set up file logging: {e}")
    
    logger.info(f"Logger initialized with level {log_level}")
    return logger

def get_logger(name: str) -> logging.Logger:
    """
    Get a logger with the specified name.
    
    Args:
        name: Logger name
        
    Returns:
        Logger instance
    """
    return logging.getLogger(name)

class GameLogger:
    """
    Enhanced logger class with game-specific functionality.
    """
    
    def __init__(self, name: str):
        """Initialize the game logger."""
        self.logger = logging.getLogger(name)
        self.debug_enabled = False
        
    def enable_debug(self):
        """Enable debug mode logging."""
        self.debug_enabled = True
        self.logger.setLevel(logging.DEBUG)
        
    def disable_debug(self):
        """Disable debug mode logging."""
        self.debug_enabled = False
        self.logger.setLevel(logging.INFO)
        
    def log_player_action(self, player_id: str, action: str, details: Optional[str] = None):
        """
        Log a player action.
        
        Args:
            player_id: Identifier for the player
            action: The action performed
            details: Additional details about the action
        """
        message = f"Player {player_id} performed action: {action}"
        if details:
            message += f" - {details}"
        self.logger.info(message)
        
    def log_game_event(self, event_type: str, description: str, severity: str = "INFO"):
        """
        Log a game event.
        
        Args:
            event_type: Type of event (combat, exploration, etc.)
            description: Description of the event
            severity: Log severity level
        """
        message = f"[{event_type}] {description}"
        
        severity_upper = severity.upper()
        if severity_upper == "DEBUG":
            self.logger.debug(message)
        elif severity_upper == "INFO":
            self.logger.info(message)
        elif severity_upper == "WARNING":
            self.logger.warning(message)
        elif severity_upper == "ERROR":
            self.logger.error(message)
        elif severity_upper == "CRITICAL":
            self.logger.critical(message)
        else:
            self.logger.info(message)
            
    def log_system_status(self, component: str, status: str, details: Optional[str] = None):
        """
        Log system status information.
        
        Args:
            component: System component name
            status: Current status
            details: Additional status details
        """
        message = f"[SYSTEM] {component}: {status}"
        if details:
            message += f" - {details}"
        self.logger.info(message)
        
    def log_performance_metric(self, metric_name: str, value: float, unit: str = ""):
        """
        Log performance metrics.
        
        Args:
            metric_name: Name of the metric
            value: Metric value
            unit: Unit of measurement
        """
        message = f"[PERFORMANCE] {metric_name}: {value}"
        if unit:
            message += f" {unit}"
        
        if self.debug_enabled:
            self.logger.debug(message)
        
    def log_error_with_context(self, error: Exception, context: dict):
        """
        Log an error with additional context information.
        
        Args:
            error: The exception that occurred
            context: Dictionary containing context information
        """
        context_str = ", ".join([f"{k}={v}" for k, v in context.items()])
        message = f"Error: {str(error)} | Context: {context_str}"
        self.logger.error(message, exc_info=True)
