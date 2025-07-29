
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { SignupPrompt } from "@/components/SignupPrompt";
import { ChatSession } from "@/types/chat";
import { useState, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Check } from "lucide-react";

interface ChatLayoutProps {
  sessions: ChatSession[];
  currentSessionId: string;
  isLoading: boolean;
  isTyping: boolean;
  hasReachedLimit?: boolean;
  isUnlocked?: boolean;
  onNewChat: () => void;
  onSessionSelect: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newName: string) => void;
  onToggleFavorite: (sessionId: string) => void;
  onSendMessage: (message: string, file?: File) => void;
  onUnlock?: (code: string) => boolean;
}

export const ChatLayout = ({
  sessions,
  currentSessionId,
  isLoading,
  isTyping,
  hasReachedLimit = false,
  isUnlocked = false,
  onNewChat,
  onSessionSelect,
  onDeleteSession,
  onRenameSession,
  onToggleFavorite,
  onSendMessage,
  onUnlock,
}: ChatLayoutProps) => {
  const [input, setInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  const currentSession = sessions.find(s => s.id === currentSessionId);

  const handleNewChat = useCallback(() => {
    if (hasReachedLimit && !isUnlocked) {
      setShowSignupPrompt(true);
    } else {
      onNewChat();
    }
  }, [hasReachedLimit, isUnlocked, onNewChat]);

  const handleSend = useCallback(async (e: React.FormEvent, file?: File): Promise<boolean> => {
    e.preventDefault();
    
    if (!input.trim() && !file) {
      toast({
        description: "Please enter a message or attach an image",
        variant: "destructive",
      });
      return false;
    }

    try {
      await onSendMessage(input, file);
      setInput("");
      return true;
    } catch (error) {
      toast({
        description: "Failed to send message",
        variant: "destructive",
      });
      return false;
    }
  }, [input, onSendMessage, toast]);

  const handleImageSelect = useCallback((file: File) => {
    console.log('Image selected:', file.name);
  }, []);

  const handleSessionClick = useCallback((sessionId: string) => {
    onSessionSelect(sessionId);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile, onSessionSelect]);

  return (
    <div className="flex h-[100dvh] relative">
      {isMobile && (
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-background border"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      <ChatSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        isSidebarOpen={isSidebarOpen}
        hasReachedLimit={hasReachedLimit}
        isUnlocked={isUnlocked}
        onNewChat={handleNewChat}
        onSessionSelect={handleSessionClick}
        onDeleteSession={onDeleteSession}
        onRenameSession={onRenameSession}
        onToggleFavorite={onToggleFavorite}
      />

      <div className="flex-1 flex flex-col bg-background h-[100dvh] overflow-hidden">
        {currentSession && (
          <>
            {/* Unlocked Mode Indicator */}
            {isUnlocked && (
              <div className="flex items-center justify-center p-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-green-500/20">
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <Check className="w-4 h-4" />
                  <span className="font-medium">Unlocked Mode</span>
                  <span className="text-xs opacity-75">• Unlimited interactions</span>
                </div>
              </div>
            )}
            
            <div className="flex-1 min-h-0">
              <ChatMessages messages={currentSession.messages} isTyping={isTyping} />
            </div>
            <div className="w-full">
              <ChatInput
                input={input}
                isLoading={isLoading}
                onInputChange={setInput}
                onSend={handleSend}
                onImageSelect={handleImageSelect}
              />
            </div>
          </>
        )}
      </div>

      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {showSignupPrompt && (
        <SignupPrompt 
          onClose={() => setShowSignupPrompt(false)} 
          onUnlock={onUnlock}
          isUnlocked={isUnlocked}
        />
      )}
    </div>
  );
};
