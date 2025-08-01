
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { NavigationBar } from "@/components/common/NavigationBar";
import { SettingsPanel } from "@/components/chat/SettingsPanel";
import { ComingSoonPanel } from "@/components/chat/ComingSoonPanel";
import { SearchLayout } from "@/components/search/SearchLayout";
import { CodeMusaiLayout } from "@/components/code/CodeMusaiLayout";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

import { ChatSession } from "@/types/chat";
import { useState, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatLayoutProps {
  sessions: ChatSession[];
  currentSessionId: string;
  isLoading: boolean;
  isTyping: boolean;
  onNewChat: () => void;
  onSessionSelect: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newName: string) => void;
  onToggleFavorite: (sessionId: string) => void;
  onSendMessage: (message: string, file?: File) => void;
  initialTab?: string;
  initialQuery?: string;
}

export const ChatLayout = ({
  sessions,
  currentSessionId,
  isLoading,
  isTyping,
  onNewChat,
  onSessionSelect,
  onDeleteSession,
  onRenameSession,
  onToggleFavorite,
  onSendMessage,
  initialTab,
  initialQuery,
}: ChatLayoutProps) => {
  const [input, setInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [currentTab, setCurrentTab] = useState(initialTab || "chat");
  const [isNavigationExpanded, setIsNavigationExpanded] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  const currentSession = sessions.find(s => s.id === currentSessionId);

  const handleNewChat = useCallback(() => {
    onNewChat();
  }, [onNewChat]);

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

  const handleTabChange = useCallback((tab: string) => {
    setCurrentTab(tab);
    // All tabs are now properly handled with their own components
  }, []);

  const handleToggleExpanded = useCallback(() => {
    setIsNavigationExpanded(!isNavigationExpanded);
  }, [isNavigationExpanded]);

  const handleCloseSettings = useCallback(() => {
    setCurrentTab("chat");
  }, []);

  const handleCloseComingSoon = useCallback(() => {
    setCurrentTab("chat");
  }, []);

  const renderMainContent = () => {
    switch (currentTab) {
      case "settings":
        return <SettingsPanel onClose={handleCloseSettings} />;
      case "musai-search":
        return <SearchLayout onClose={handleCloseComingSoon} initialQuery={initialQuery} />;
      case "code-musai":
        return <CodeMusaiLayout onClose={handleCloseComingSoon} />;
      case "emergent-narrative":
      case "musai-university":
      case "task-musai":
        return <ComingSoonPanel tab={currentTab} onClose={handleCloseComingSoon} />;
      case "chat":
      default:
        // Check if we should show PreMusaiPage - similar to SearchLayout logic
        const hasAnyMessages = sessions.some(session => session.messages && session.messages.length > 0);
        const hasCurrentMessages = currentSession?.messages && currentSession.messages.length > 0;
        
        // Show PreMusaiPage if current session has no messages (for new sessions)
        if (!hasCurrentMessages) {
          return (
            <div className="flex-1 min-h-0">
              <ChatMessages 
                messages={[]} 
                isTyping={isTyping}
                onSendMessage={(message) => onSendMessage(message)}
              />
            </div>
          );
        }
        
        // Show normal chat interface if current session has messages
        if (hasCurrentMessages) {
          return (
            <>
              <div className="flex-1 min-h-0">
                <ChatMessages 
                  messages={currentSession?.messages || []} 
                  isTyping={isTyping}
                  onSendMessage={(message) => onSendMessage(message)}
                />
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
          );
        }
        
        // Show empty state for session without messages but other sessions exist
        return (
          <>
            <div className="flex-1 min-h-0">
              <ChatMessages 
                messages={currentSession?.messages || []} 
                isTyping={isTyping}
                onSendMessage={(message) => onSendMessage(message)}
              />
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
        );
    }
  };

  return (
    <div className="flex h-[100dvh] relative">
      {/* Navigation Bar */}
      <NavigationBar
        currentTab={currentTab}
        onTabChange={handleTabChange}
        isExpanded={isNavigationExpanded}
        onToggleExpanded={handleToggleExpanded}
      />

      {/* Main Layout with offset for navigation */}
      <div className={cn(
        "flex-1 transition-all duration-300",
        isMobile 
          ? "ml-16" // Fixed mobile offset for navigation bar
          : isNavigationExpanded 
            ? "ml-52" // Desktop: expanded navigation bar
            : "ml-20"  // Desktop: collapsed navigation bar
      )}>
        {currentTab === "chat" ? (
          <ResizablePanelGroup direction="horizontal" className="h-[100dvh]">
            {/* Mobile sidebar toggle */}
            {isMobile && (
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="fixed top-4 left-20 z-50 p-2 rounded-lg bg-background border shadow-md"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* Resizable Sidebar Panel - only show for chat tab */}
            <ResizablePanel 
              defaultSize={25} 
              minSize={20} 
              maxSize={40}
              className={cn(
                "transition-all duration-300",
                isMobile && !isSidebarOpen ? "hidden" : ""
              )}
            >
              <ChatSidebar
                sessions={sessions}
                currentSessionId={currentSessionId}
                isSidebarOpen={isSidebarOpen}
                onNewChat={handleNewChat}
                onSessionSelect={handleSessionClick}
                onDeleteSession={onDeleteSession}
                onRenameSession={onRenameSession}
                onToggleFavorite={onToggleFavorite}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Main Content Panel */}
            <ResizablePanel defaultSize={75} minSize={60}>
              <div className="flex flex-col bg-background h-full overflow-hidden">
                {renderMainContent()}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          /* Non-chat tabs don't need resizable sidebar */
          <div className="flex flex-col bg-background h-[100dvh] overflow-hidden">
            {renderMainContent()}
          </div>
        )}
      </div>

      {/* Mobile sidebar overlay */}
      {isMobile && isSidebarOpen && currentTab === "chat" && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};
