import re


def sanitize_for_speech(text):
    """Sanitize text for natural speech output by converting symbols to spoken words"""
    
    # First handle markdown headers - convert to spoken form
    # Do these before other replacements to preserve structure
    text = re.sub(r'^###\s+(.+)$', r'Section: \1.', text, flags=re.MULTILINE)
    text = re.sub(r'^##\s+(.+)$', r'Heading: \1.', text, flags=re.MULTILINE)  
    text = re.sub(r'^#\s+(.+)$', r'Title: \1.', text, flags=re.MULTILINE)
    
    # Handle inline headers too (not at start of line)
    text = re.sub(r'###\s+(.+)', r'Section: \1.', text)
    text = re.sub(r'##\s+(.+)', r'Heading: \1.', text)
    text = re.sub(r'#\s+(.+)', r'Title: \1.', text)
    
    # Common symbol replacements
    replacements = {
        '*': '',  # Remove asterisks completely
        '**': '',  # Remove bold markdown
        '***': '',  # Remove bold italic markdown
        '_': ' ',  # Replace underscores with spaces
        '__': '',  # Remove italic markdown
        '`': '',  # Remove code backticks
        '```': '',  # Remove code blocks
        '&': ' and ',
        '@': ' at ',
        '%': ' percent',
        '$': ' dollars',
        '€': ' euros',
        '£': ' pounds',
        '+': ' plus ',
        '=': ' equals ',
        '<': ' less than ',
        '>': ' greater than ',
        '/': ' slash ',
        '\\': ' backslash ',
        '|': ' pipe ',
        '~': ' tilde ',
        '^': ' caret ',
        '[': '',  # Remove brackets
        ']': '',
        '{': '',  # Remove braces
        '}': '',
        '(': ', ',  # Replace parentheses with commas
        ')': ', ',
        '...': ' dot dot dot ',
        '..': ' dot dot ',
        '--': ', ',  # Replace dashes with commas
        '---': ', ',
        '\n\n': '. ',  # Replace double newlines with periods
        '\n': '. ',  # Replace single newlines with periods
        '\t': ' ',  # Replace tabs with spaces
    }
    
    # Apply replacements
    result = text
    for symbol, replacement in replacements.items():
        result = result.replace(symbol, replacement)
    
    # Clean up multiple spaces and punctuation
    result = re.sub(r'\s+', ' ', result)  # Multiple spaces to single
    result = re.sub(r'\.+', '.', result)  # Multiple periods to single
    result = re.sub(r',+', ',', result)  # Multiple commas to single
    result = re.sub(r'\s+([.,!?])', r'\1', result)  # Remove space before punctuation
    result = re.sub(r'([.,!?])\s*([.,!?])', r'\1', result)  # Remove duplicate punctuation
    
    # Remove URLs (they're hard to speak naturally)
    result = re.sub(r'https?://\S+', ' web link ', result)
    result = re.sub(r'www\.\S+', ' web link ', result)
    
    # Convert numbers with special formatting
    result = re.sub(r'(\d+)x(\d+)', r'\1 by \2', result)  # 1920x1080 -> 1920 by 1080
    result = re.sub(r'(\d+):(\d+)', r'\1 colon \2', result)  # 3:45 -> 3 colon 45
    
    # Clean up any remaining odd characters
    result = ''.join(char if char.isalnum() or char in ' .,!?;:\'-' else ' ' for char in result)
    
    # Final cleanup
    result = result.strip()
    result = re.sub(r'\s+', ' ', result)
    
    return result 