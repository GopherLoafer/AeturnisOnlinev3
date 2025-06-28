"""
Helper Utilities - Common utility functions used throughout the application
"""

import re
import os
import time
import random
import string
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timedelta

def validate_string(text: str, 
                   min_length: int = 0, 
                   max_length: int = 1000,
                   allowed_chars: Optional[str] = None,
                   disallowed_patterns: Optional[List[str]] = None) -> bool:
    """
    Validate a string against various criteria.
    
    Args:
        text: The string to validate
        min_length: Minimum allowed length
        max_length: Maximum allowed length
        allowed_chars: String containing allowed characters
        disallowed_patterns: List of regex patterns that are not allowed
        
    Returns:
        True if string is valid, False otherwise
    """
    if not isinstance(text, str):
        return False
    
    # Check length constraints
    if len(text) < min_length or len(text) > max_length:
        return False
    
    # Check allowed characters
    if allowed_chars and not all(c in allowed_chars for c in text):
        return False
    
    # Check disallowed patterns
    if disallowed_patterns:
        for pattern in disallowed_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return False
    
    return True

def sanitize_string(text: str, 
                   replacement_char: str = "_",
                   allowed_chars: Optional[str] = None) -> str:
    """
    Sanitize a string by replacing invalid characters.
    
    Args:
        text: The string to sanitize
        replacement_char: Character to replace invalid chars with
        allowed_chars: String containing allowed characters
        
    Returns:
        Sanitized string
    """
    if not isinstance(text, str):
        return ""
    
    if allowed_chars is None:
        # Default allowed characters: alphanumeric, spaces, basic punctuation
        allowed_chars = string.ascii_letters + string.digits + " .,!?-_"
    
    sanitized = ''.join(c if c in allowed_chars else replacement_char for c in text)
    
    # Remove multiple consecutive replacement characters
    while replacement_char * 2 in sanitized:
        sanitized = sanitized.replace(replacement_char * 2, replacement_char)
    
    return sanitized.strip(replacement_char)

def format_time(seconds: Union[int, float], 
               format_type: str = "readable") -> str:
    """
    Format time duration in various formats.
    
    Args:
        seconds: Time duration in seconds
        format_type: Format type ("readable", "short", "timestamp")
        
    Returns:
        Formatted time string
    """
    if format_type == "timestamp":
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Convert to integer seconds
    total_seconds = int(seconds)
    
    if format_type == "readable":
        if total_seconds < 60:
            return f"{total_seconds} second{'s' if total_seconds != 1 else ''}"
        elif total_seconds < 3600:
            minutes = total_seconds // 60
            remaining_seconds = total_seconds % 60
            if remaining_seconds == 0:
                return f"{minutes} minute{'s' if minutes != 1 else ''}"
            else:
                return f"{minutes} minute{'s' if minutes != 1 else ''} and {remaining_seconds} second{'s' if remaining_seconds != 1 else ''}"
        else:
            hours = total_seconds // 3600
            remaining_minutes = (total_seconds % 3600) // 60
            if remaining_minutes == 0:
                return f"{hours} hour{'s' if hours != 1 else ''}"
            else:
                return f"{hours} hour{'s' if hours != 1 else ''} and {remaining_minutes} minute{'s' if remaining_minutes != 1 else ''}"
    
    elif format_type == "short":
        if total_seconds < 60:
            return f"{total_seconds}s"
        elif total_seconds < 3600:
            minutes = total_seconds // 60
            remaining_seconds = total_seconds % 60
            return f"{minutes}m {remaining_seconds}s"
        else:
            hours = total_seconds // 3600
            remaining_minutes = (total_seconds % 3600) // 60
            return f"{hours}h {remaining_minutes}m"
    
    return str(total_seconds)

def create_safe_filename(filename: str, 
                        max_length: int = 255,
                        replacement_char: str = "_") -> str:
    """
    Create a safe filename by removing/replacing invalid characters.
    
    Args:
        filename: The original filename
        max_length: Maximum filename length
        replacement_char: Character to replace invalid chars with
        
    Returns:
        Safe filename string
    """
    # Characters that are generally not allowed in filenames
    invalid_chars = '<>:"/\\|?*'
    
    # Replace invalid characters
    safe_name = ''.join(c if c not in invalid_chars else replacement_char for c in filename)
    
    # Remove control characters
    safe_name = ''.join(c for c in safe_name if ord(c) >= 32)
    
    # Limit length
    if len(safe_name) > max_length:
        name_part, ext = os.path.splitext(safe_name)
        available_length = max_length - len(ext)
        safe_name = name_part[:available_length] + ext
    
    # Ensure the filename is not empty
    if not safe_name or safe_name.isspace():
        safe_name = f"unnamed_file_{int(time.time())}"
    
    return safe_name

def generate_random_id(length: int = 8, 
                      include_numbers: bool = True,
                      include_uppercase: bool = True,
                      include_lowercase: bool = True) -> str:
    """
    Generate a random ID string.
    
    Args:
        length: Length of the ID
        include_numbers: Whether to include numbers
        include_uppercase: Whether to include uppercase letters
        include_lowercase: Whether to include lowercase letters
        
    Returns:
        Random ID string
    """
    chars = ""
    if include_lowercase:
        chars += string.ascii_lowercase
    if include_uppercase:
        chars += string.ascii_uppercase
    if include_numbers:
        chars += string.digits
    
    if not chars:
        chars = string.ascii_lowercase  # Fallback
    
    return ''.join(random.choice(chars) for _ in range(length))

def parse_user_input(user_input: str) -> Dict[str, Any]:
    """
    Parse user input into command and arguments.
    
    Args:
        user_input: Raw user input string
        
    Returns:
        Dictionary containing parsed command information
    """
    if not user_input or not user_input.strip():
        return {
            'command': '',
            'args': [],
            'raw': user_input,
            'valid': False
        }
    
    # Split input into parts
    parts = user_input.strip().split()
    
    return {
        'command': parts[0].lower() if parts else '',
        'args': parts[1:] if len(parts) > 1 else [],
        'raw': user_input,
        'valid': bool(parts)
    }

def format_list(items: List[Any], 
               conjunction: str = "and",
               oxford_comma: bool = True) -> str:
    """
    Format a list of items into a readable string.
    
    Args:
        items: List of items to format
        conjunction: Word to use before the last item
        oxford_comma: Whether to use Oxford comma
        
    Returns:
        Formatted string
    """
    if not items:
        return ""
    
    str_items = [str(item) for item in items]
    
    if len(str_items) == 1:
        return str_items[0]
    elif len(str_items) == 2:
        return f"{str_items[0]} {conjunction} {str_items[1]}"
    else:
        if oxford_comma:
            return f"{', '.join(str_items[:-1])}, {conjunction} {str_items[-1]}"
        else:
            return f"{', '.join(str_items[:-1])} {conjunction} {str_items[-1]}"

def clamp(value: Union[int, float], 
         min_value: Union[int, float], 
         max_value: Union[int, float]) -> Union[int, float]:
    """
    Clamp a value between minimum and maximum bounds.
    
    Args:
        value: The value to clamp
        min_value: Minimum allowed value
        max_value: Maximum allowed value
        
    Returns:
        Clamped value
    """
    return max(min_value, min(value, max_value))

def retry_operation(operation, 
                   max_attempts: int = 3,
                   delay: float = 1.0,
                   backoff_factor: float = 2.0):
    """
    Retry an operation with exponential backoff.
    
    Args:
        operation: Function to retry
        max_attempts: Maximum number of attempts
        delay: Initial delay between attempts
        backoff_factor: Factor to multiply delay by after each attempt
        
    Returns:
        Result of successful operation
        
    Raises:
        Exception: If all attempts fail
    """
    last_exception = None
    current_delay = delay
    
    for attempt in range(max_attempts):
        try:
            return operation()
        except Exception as e:
            last_exception = e
            if attempt < max_attempts - 1:  # Don't delay on last attempt
                time.sleep(current_delay)
                current_delay *= backoff_factor
    
    # If we get here, all attempts failed
    raise last_exception

def is_valid_email(email: str) -> bool:
    """
    Basic email validation.
    
    Args:
        email: Email address to validate
        
    Returns:
        True if email appears valid, False otherwise
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def truncate_text(text: str, 
                 max_length: int, 
                 suffix: str = "...") -> str:
    """
    Truncate text to a maximum length with suffix.
    
    Args:
        text: Text to truncate
        max_length: Maximum length including suffix
        suffix: Suffix to add if text is truncated
        
    Returns:
        Truncated text
    """
    if len(text) <= max_length:
        return text
    
    return text[:max_length - len(suffix)] + suffix
