import React from 'react';
import { PreMusaiPage, PreMusaiPageType } from '@/components/common/PreMusaiPage';
import { ChatInterface } from '@/components/common/ChatInterface';
import { Message } from '@/types/chat';

interface MusaiFeatureProps {
  type: PreMusaiPageType;
  hasActiveSession: boolean;
  messages?: Message[];
  isTyping?: boolean;
  isLoading?: boolean;
  onSendMessage: (message: string, file?: File) => Promise<void>;
  onCreateSession: () => void;
  className?: string;
  // PreMusai specific props
  onQuickAction?: (actionId: string, actionType: string, actionData?: string) => void;
  customTitle?: string;
  customSubtitle?: string;
  chatPlaceholder?: string;
}

export const MusaiFeature: React.FC<MusaiFeatureProps> = ({
  type,
  hasActiveSession,
  messages = [],
  isTyping = false,
  isLoading = false,
  onSendMessage,
  onCreateSession,
  className = "",
  onQuickAction,
  customTitle,
  customSubtitle,
  chatPlaceholder
}) => {
  // If no active session or no messages, show PreMusai page
  if (!hasActiveSession || messages.length === 0) {
    return (
      <PreMusaiPage
        type={type}
        title={customTitle}
        subtitle={customSubtitle}
        onSubmit={(input) => {
          if (!hasActiveSession) {
            onCreateSession();
            // Wait for session creation then send message
            setTimeout(() => onSendMessage(input), 100);
          } else {
            onSendMessage(input);
          }
        }}
        onQuickAction={onQuickAction || ((actionId, actionType, actionData) => {
          console.log(`${type} quick action:`, actionId, actionType, actionData);
          if (actionData) {
            if (!hasActiveSession) {
              onCreateSession();
              setTimeout(() => onSendMessage(actionData), 100);
            } else {
              onSendMessage(actionData);
            }
          }
        })}
        isLoading={isTyping}
        className={className}
      />
    );
  }

  // Show chat interface for active sessions with messages
  return (
    <ChatInterface
      messages={messages}
      isTyping={isTyping}
      isLoading={isLoading}
      onSendMessage={onSendMessage}
      className={className}
      placeholder={chatPlaceholder}
    />
  );
};
