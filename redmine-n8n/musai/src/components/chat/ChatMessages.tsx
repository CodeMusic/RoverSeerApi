
import { Message } from "@/types/chat";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef, useState } from "react";
import { MysticalTypingIndicator } from "./MysticalTypingIndicator";
import { MysticalWaveEffect } from "./MysticalWaveEffect";
import { PreMusaiPage } from "@/components/common/PreMusaiPage";

interface ChatMessagesProps {
  messages: Message[];
  isTyping?: boolean;
  onSendMessage?: (message: string) => void;
}

export const ChatMessages = ({ messages, isTyping = false, onSendMessage }: ChatMessagesProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [waveTrigger, setWaveTrigger] = useState(false);
  const [lastAssistantMessageId, setLastAssistantMessageId] = useState<string | null>(null);
  const [previousMessageCount, setPreviousMessageCount] = useState(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check for new assistant messages and trigger wave effect
  useEffect(() => {
    const currentMessageCount = messages.length;
    const lastMessage = messages[messages.length - 1];
    
    // Only trigger if we have more messages than before and the last message is from assistant
    if (currentMessageCount > previousMessageCount && 
        lastMessage && 
        lastMessage.role === 'assistant' && 
        lastMessage.id !== lastAssistantMessageId) {
      
      // Check if there was a user message before this assistant message
      const hasUserMessageBefore = messages.some((msg, index) => 
        index < messages.length - 1 && msg.role === 'user'
      );
      
      if (hasUserMessageBefore) {
        console.log('New assistant message received after user message, triggering wave effect');
        setLastAssistantMessageId(lastMessage.id);
        setWaveTrigger(true);
      }
    }
    
    setPreviousMessageCount(currentMessageCount);
  }, [messages, lastAssistantMessageId, previousMessageCount]);

  // Check if dark mode is enabled
  const isDarkMode = document.documentElement.classList.contains('dark');

  // Show PreMusaiPage if no messages
  if (messages.length === 0 && onSendMessage) {
    return (
      <div className="h-full flex flex-col">
        <PreMusaiPage
          type="chat"
          onSubmit={onSendMessage}
          isLoading={isTyping}
          className="h-full"
        />
      </div>
    );
  }

  return (
    <>
      <ScrollArea 
        className="h-full"
        style={{
          background: `
            linear-gradient(to bottom, 
              hsl(var(--background)) 0%,
              hsl(var(--muted)/0.1) 100%
            ),
            radial-gradient(
              circle at 2px 2px,
              hsl(var(--muted)/0.15) 1px,
              transparent 0
            )
          `,
          backgroundSize: '100% 100%, 24px 24px'
        }}
      >
        <div className="container max-w-3xl mx-auto p-4">
          <div className="max-w-[900px] mx-auto space-y-12">
            {messages.map((message) => {
              if (message.role === 'assistant' && (!message.content || message.content.trim().length === 0))
              {
                return null;
              }
              return <ChatMessage key={message.id} message={message} />;
            })}
            {isTyping && (
              <MysticalTypingIndicator isDarkMode={isDarkMode} />
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>
      </ScrollArea>
      
      <MysticalWaveEffect 
        isDarkMode={isDarkMode}
        trigger={waveTrigger}
        onAnimationComplete={() => setWaveTrigger(false)}
      />
    </>
  );
};
