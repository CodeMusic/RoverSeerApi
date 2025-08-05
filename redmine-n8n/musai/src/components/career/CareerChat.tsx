import React, { useState, useCallback, useEffect } from 'react';
import { TrendingUp, Sparkles, Calendar, AlertCircle } from 'lucide-react';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { ChatInput } from '@/components/chat/ChatInput';
import { APP_TERMS } from '@/config/constants';

interface CareerChatProps {
  currentSession: any;
  onSendMessage: (message: string) => void;
  isTyping: boolean;
  onNewChat: () => void;
}

export const CareerChat: React.FC<CareerChatProps> = ({
  currentSession,
  onSendMessage,
  isTyping,
  onNewChat
}) => {
  const [input, setInput] = useState('');
  const [careerContext, setCareerContext] = useState({
    currentRole: '',
    targetRole: '',
    skills: [] as string[],
    experience: '',
    location: '',
    salaryRange: '',
    preferences: [] as string[]
  });

  // Career-specific system prompt
  const getCareerSystemPrompt = useCallback(() => {
    return `You are CareerMusai, an AI career development assistant. You help users with:

1. **Job Search Strategy**: Analyze career goals, skills, and market trends
2. **Skill Development**: Recommend learning paths and certifications
3. **Interview Preparation**: Provide guidance on common questions and techniques
4. **Salary Negotiation**: Offer insights on compensation and benefits
5. **Career Planning**: Help with long-term career trajectory planning
6. **Industry Insights**: Share trends and opportunities in various fields

Current user context:
- Current Role: ${careerContext.currentRole || 'Not specified'}
- Target Role: ${careerContext.targetRole || 'Not specified'}
- Skills: ${careerContext.skills.join(', ') || 'Not specified'}
- Experience: ${careerContext.experience || 'Not specified'}
- Location: ${careerContext.location || 'Not specified'}
- Salary Range: ${careerContext.salaryRange || 'Not specified'}

Always provide actionable, specific advice and consider the user's context when making recommendations.`;
  }, [careerContext]);

  // Enhanced message sending with career context
  const handleSendMessage = useCallback((message: string) => {
    // Add career context to the message if this is a new conversation
    if (!currentSession?.messages?.length) {
      const enhancedMessage = `Career Context: ${JSON.stringify(careerContext)}\n\nUser Query: ${message}`;
      onSendMessage(enhancedMessage);
    } else {
      onSendMessage(message);
    }
  }, [onSendMessage, currentSession, careerContext]);

  // Handle form submission
  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      const message = input.trim();
      setInput('');
      handleSendMessage(message);
    }
    return true;
  }, [input, handleSendMessage]);

  // Handle input change
  const handleInputChange = useCallback((value: string) => {
    setInput(value);
  }, []);

  // Career-specific quick actions
  const careerQuickActions = [
    {
      label: "Analyze my skills",
      action: () => handleSendMessage("Can you analyze my current skills and suggest areas for improvement?")
    },
    {
      label: "Find job opportunities",
      action: () => handleSendMessage("Help me find job opportunities that match my skills and experience")
    },
    {
      label: "Interview prep",
      action: () => handleSendMessage("Help me prepare for technical interviews")
    },
    {
      label: "Salary research",
      action: () => handleSendMessage("What's the typical salary range for my target role?")
    },
    {
      label: "Career path planning",
      action: () => handleSendMessage("Help me plan my career path for the next 5 years")
    },
    {
      label: "Skill gap analysis",
      action: () => handleSendMessage("What skills am I missing for my target role?")
    }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Career Context Bar */}
      {careerContext.currentRole && (
        <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-b">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Career Context:</span>
            <span className="text-muted-foreground">
              {careerContext.currentRole} → {careerContext.targetRole || 'Exploring options'}
            </span>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        <ChatMessages
          messages={currentSession?.messages || []}
          isTyping={isTyping}
        />
      </div>

      {/* Quick Actions */}
      {!currentSession?.messages?.length && (
        <div className="p-4 border-t">
          <h3 className="text-sm font-medium mb-3 text-muted-foreground">
            Quick Career Actions
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {careerQuickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="p-2 text-xs text-left rounded-md border hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Input */}
      <div className="p-4 border-t">
        <ChatInput
          input={input}
          isLoading={isTyping}
          onInputChange={handleInputChange}
          onSend={handleSend}
        />
      </div>
    </div>
  );
}; 