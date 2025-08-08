import React, { useState } from 'react';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { ChatInput } from '@/components/chat/ChatInput';
import { Message } from '@/types/chat';

interface ChatInterfaceProps {
  messages: Message[];
  isTyping?: boolean;
  isLoading?: boolean;
  onSendMessage: (message: string, file?: File) => Promise<void>;
  className?: string;
  placeholder?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isTyping = false,
  isLoading = false,
  onSendMessage,
  className = "",
  placeholder
}) => {
  const [input, setInput] = useState("");

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      const message = input.trim();
      setInput('');
      await onSendMessage(message);
    }
    return true;
  };

  const handleImageSelect = async (file: File) => {
    await onSendMessage("", file);
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <div className="flex-1 min-h-0">
        <ChatMessages 
          messages={messages} 
          isTyping={isTyping}
          onSendMessage={onSendMessage}
        />
      </div>
      <div className="w-full">
        <ChatInput
          input={input}
          isLoading={isLoading}
          onInputChange={setInput}
          onSend={handleSend}
          onImageSelect={handleImageSelect}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};
