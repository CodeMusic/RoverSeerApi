
import { Message } from "@/types/chat";
import { ChatMessage } from "@/components/ChatMessage";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef, useState } from "react";
import { MysticalTypingIndicator } from "./MysticalTypingIndicator";
import { MysticalWaveEffect } from "./MysticalWaveEffect";

interface ChatMessagesProps {
  messages: Message[];
  isTyping?: boolean;
}

export const ChatMessages = ({ messages, isTyping = false }: ChatMessagesProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [waveTrigger, setWaveTrigger] = useState(false);
  const [lastAssistantMessageId, setLastAssistantMessageId] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check for new assistant messages and trigger wave effect
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant' && lastMessage.id !== lastAssistantMessageId) {
      setLastAssistantMessageId(lastMessage.id);
      setWaveTrigger(true);
    }
  }, [messages, lastAssistantMessageId]);

  // Check if dark mode is enabled
  const isDarkMode = document.documentElement.classList.contains('dark');

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
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
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
