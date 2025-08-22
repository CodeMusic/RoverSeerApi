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
  // Enable Perspective Thinking toggle in generic chat usage
  perspectiveEnabled?: boolean;
  onTogglePerspective?: (enabled: boolean) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isTyping = false,
  isLoading = false,
  onSendMessage,
  className = "",
  placeholder,
  perspectiveEnabled = true,
  onTogglePerspective
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
          module="chat"
          onMessageSend={onSendMessage}
          isLoading={isLoading}
          streamEnabled={true}
          onToggleStream={(v) => { try { (window as any).__musai_stream_enabled = v; } catch {} }}
          effectsEnabled={true}
          onToggleEffects={(v) => { try { (window as any).__musai_effects_enabled = v; } catch {} }}
          placeholder={placeholder}
          theme={{ container: 'bg-white dark:bg-gray-900', accent: 'text-black dark:text-white', border: 'border-gray-200 dark:border-gray-700' }}
          perspectiveEnabled={perspectiveEnabled}
          onTogglePerspective={onTogglePerspective}
        />
      </div>
    </div>
  );
};
