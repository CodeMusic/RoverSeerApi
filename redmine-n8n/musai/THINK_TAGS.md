# Think Tags Feature

## Overview

The Think Tags feature allows AI assistants to display their internal thoughts and reasoning process to users in a collapsible panel. This provides transparency into the AI's cognitive process and helps users understand how decisions are made.

## How It Works

### For Users
1. **Visible Indicator**: When an AI message contains internal thoughts, a "Show thoughts" button with a speech bubble icon appears below the message
2. **Expandable Panel**: Click the button to expand/collapse the thoughts panel
3. **Styled Display**: Thoughts are displayed in a purple-themed groupbox with proper formatting
4. **Dark/Light Mode**: The panel automatically adapts to the current theme

### For Developers
1. **API Response Format**: The AI should include thoughts in the API response
2. **Supported Fields**: The system looks for thoughts in various response fields:
   - `thoughts`
   - `thinking`
   - `reasoning`
   - `internal_thoughts`
   - `cognitive_process`
3. **Nested Structures**: Also supports nested formats like `message.thoughts` or `response.thoughts`

## API Response Examples

### Simple Format
```json
{
  "content": "Hello! How can I help you today?",
  "thoughts": "The user greeted me. I should respond warmly and offer assistance. This is a good opportunity to establish a helpful tone."
}
```

### Nested Format
```json
{
  "message": {
    "content": "I can help you with that!",
    "thoughts": "The user asked about a complex topic. I should break it down into manageable steps and provide clear guidance."
  }
}
```

### Array Format
```json
[
  {
    "content": "Here's what I found:",
    "thoughts": "The user's question requires research. I should provide accurate information and cite sources when possible."
  }
]
```

## Implementation Details

### Components
- **ThinkPanel**: Collapsible component that displays thoughts
- **ChatMessage**: Updated to include ThinkPanel for assistant messages
- **Response Handler**: Extracts thoughts from various API response formats
- **Message Sender**: Includes thoughts in assistant message creation

### Styling
- Purple accent colors to distinguish thoughts from regular content
- Responsive design that works on mobile and desktop
- Smooth animations for expand/collapse
- Proper contrast for accessibility

## Benefits

1. **Transparency**: Users can see the AI's reasoning process
2. **Trust**: Understanding how decisions are made builds user confidence
3. **Learning**: Users can learn from the AI's thought process
4. **Debugging**: Developers can better understand AI behavior
5. **Compliance**: Meets requirements for AI transparency and explainability

## Future Enhancements

- **Thought Categories**: Different types of thoughts (reasoning, planning, reflection)
- **Thought Timeline**: Show thought evolution over time
- **Interactive Thoughts**: Allow users to ask questions about specific thoughts
- **Thought Analytics**: Track which thoughts are most helpful to users 