
import { Message } from "@/types/chat";
import { ChatMessage } from "@/components/ChatMessage";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface ChatMessagesProps {
  messages: Message[];
  isTyping?: boolean;
}

export const ChatMessages = ({ messages, isTyping = false }: ChatMessagesProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
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
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Responding...</span>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>
    </ScrollArea>
  );
};
