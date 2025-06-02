import re
from config import STRIP_THINK_TAGS


class TextProcessingHelper:
    """Helper class for text processing operations including speech sanitization and model name extraction."""
    
    @staticmethod
    def strip_think_tags(text):
        """
        Remove <think></think> tags and their content from text for model privacy.
        
        This gives models privacy by not speaking their internal reasoning process.
        
        Args:
            text (str): The text that may contain think tags
            
        Returns:
            str: Text with think tags removed
        """
        if not STRIP_THINK_TAGS:
            return text
        
        # Remove <think>...</think> blocks (case insensitive, multiline)
        cleaned_text = re.sub(r'<think>.*?</think>', '', text, flags=re.IGNORECASE | re.DOTALL)
        
        # Clean up any extra whitespace left behind
        cleaned_text = re.sub(r'\n\s*\n', '\n', cleaned_text)  # Remove multiple newlines
        cleaned_text = cleaned_text.strip()
        
        return cleaned_text

    @staticmethod
    def sanitize_for_speech(text):
        """
        Clean up text for text-to-speech by removing problematic characters
        and optionally stripping think tags for model privacy.
        
        Args:
            text (str): The text to sanitize
            
        Returns:
            str: Sanitized text suitable for TTS
        """
        if not text:
            return ""
        
        # First, strip think tags if configured
        text = TextProcessingHelper.strip_think_tags(text)
        
        # Handle markdown headers - convert to spoken form
        text = re.sub(r'^###\s+(.+)$', r'Section: \1.', text, flags=re.MULTILINE)
        text = re.sub(r'^##\s+(.+)$', r'Heading: \1.', text, flags=re.MULTILINE)  
        text = re.sub(r'^#\s+(.+)$', r'Title: \1.', text, flags=re.MULTILINE)
        
        # Handle inline headers too (not at start of line)
        text = re.sub(r'###\s+(.+)', r'Section: \1.', text)
        text = re.sub(r'##\s+(.+)', r'Heading: \1.', text)
        text = re.sub(r'#\s+(.+)', r'Title: \1.', text)
        
        # Remove markdown formatting
        text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)  # **bold** -> bold
        text = re.sub(r'\*(.*?)\*', r'\1', text)      # *italic* -> italic
        text = re.sub(r'`(.*?)`', r'\1', text)        # `code` -> code
        text = re.sub(r'```.*?```', '', text, flags=re.DOTALL)  # Remove code blocks
        
        # Common symbol replacements for natural speech
        replacements = {
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
        for symbol, replacement in replacements.items():
            text = text.replace(symbol, replacement)
        
        # Remove URLs (they're hard to speak naturally)
        text = re.sub(r'https?://\S+', ' web link ', text)
        text = re.sub(r'www\.\S+', ' web link ', text)
        
        # Convert numbers with special formatting
        text = re.sub(r'(\d+)x(\d+)', r'\1 by \2', text)  # 1920x1080 -> 1920 by 1080
        text = re.sub(r'(\d+):(\d+)', r'\1 colon \2', text)  # 3:45 -> 3 colon 45
        
        # Clean up punctuation and spacing
        text = re.sub(r'\s+', ' ', text)  # Multiple spaces to single
        text = re.sub(r'\.+', '.', text)  # Multiple periods to single
        text = re.sub(r',+', ',', text)  # Multiple commas to single
        text = re.sub(r'\s+([.,!?])', r'\1', text)  # Remove space before punctuation
        text = re.sub(r'([.,!?])\s*([.,!?])', r'\1', text)  # Remove duplicate punctuation
        
        # Clean up any remaining odd characters
        text = ''.join(char if char.isalnum() or char in ' .,!?;:\'-' else ' ' for char in text)
        
        # Final cleanup
        text = text.strip()
        text = re.sub(r'\s+', ' ', text)
        
        return text

    @staticmethod
    def extract_short_model_name(full_model_name):
        """
        Extract the short model name for display purposes.
        
        Examples:
        - "ALIENTELLIGENCE/gooddoctor:latest" -> "gooddoctor:latest"
        - "organization/model:tag" -> "model:tag"  
        - "simplemodel:latest" -> "simplemodel:latest" (unchanged)
        - "PenphinMind" -> "PenphinMind" (unchanged)
        - "llama1.1b 37 25" -> "llama1.1b"
        - "model 123" -> "model"
        
        Args:
            full_model_name (str): The full model name potentially with organization prefix
            
        Returns:
            str: The model name without organization prefix and trailing numbers
        """
        if not full_model_name:
            return full_model_name
        
        # If there's a slash, take everything after the last slash
        if '/' in full_model_name:
            name = full_model_name.split('/')[-1]
        else:
            name = full_model_name
        
        # Remove trailing numbers and spaces
        name = re.sub(r'\s+\d+(?:\s+\d+)*$', '', name)
        
        return name 