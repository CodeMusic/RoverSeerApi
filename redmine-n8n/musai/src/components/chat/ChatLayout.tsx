
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { NavigationBar } from "@/components/common/NavigationBar";
import { SettingsPanel } from "@/components/chat/SettingsPanel";
import { ComingSoonPanel } from "@/components/chat/ComingSoonPanel";
import { SearchLayout } from "@/components/search/SearchLayout";
import { CodeMusaiLayout } from "@/components/code/CodeMusaiLayout";
import { PreMusaiPage } from "@/components/common/PreMusaiPage";
// import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
        return <div className="h-full p-4"><SettingsPanel onClose={handleCloseSettings} /></div>;
      case "musai-search":
        return <div className="h-full p-4"><SearchLayout onClose={handleCloseComingSoon} initialQuery={initialQuery} /></div>;
      case "code-musai":
        return <div className="h-full p-4"><CodeMusaiLayout onClose={handleCloseComingSoon} /></div>;
      case "emergent-narrative":
      case "musai-university":
      case "task-musai":
        return <div className="h-full p-4"><ComingSoonPanel tab={currentTab} onClose={handleCloseComingSoon} /></div>;
      case "chat":
      default:
        // If no session is selected, show PreMusai screen
        if (!currentSession) {
          return (
            <div className="h-full flex flex-col p-4">
              <PreMusaiPage
                type="chat"
                onSubmit={(message) => onSendMessage(message)}
                isLoading={isLoading}
                className="h-full"
              />
            </div>
          );
        }
        
        const currentMessages = currentSession.messages || [];
        const hasMessages = currentMessages.length > 0;
        
        return (
          <div className="h-full flex flex-col p-4">
            <div className="flex-1 min-h-0">
              <ChatMessages 
                messages={currentMessages} 
                isTyping={isTyping}
                onSendMessage={(message) => onSendMessage(message)}
              />
            </div>
            {/* Always show ChatInput when we have a session, regardless of message count */}
            <div className="w-full">
              <ChatInput
                input={input}
                isLoading={isLoading}
                onInputChange={setInput}
                onSend={handleSend}
                onImageSelect={handleImageSelect}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-[100dvh] relative">
      {/* Beautiful Background - matching home page theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />
      
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-300/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-orange-400/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Navigation Bar */}
      <NavigationBar
        currentTab={currentTab}
        onTabChange={handleTabChange}
        isExpanded={isNavigationExpanded}
        onToggleExpanded={handleToggleExpanded}
      />

      {/* Main Layout with offset for navigation */}
      <div className={cn(
        "flex-1 transition-all duration-300 relative z-10",
        isMobile 
          ? "ml-16" // Fixed mobile offset for navigation bar
          : isNavigationExpanded 
            ? "ml-52" // Desktop: expanded navigation bar
            : "ml-20"  // Desktop: collapsed navigation bar
      )}>
        <div className="h-[100dvh] flex flex-col">
          {/* Mobile sidebar toggle - only show for chat tab and when sessions exist */}
          {isMobile && currentTab === "chat" && sessions.length > 0 && (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="fixed top-4 left-20 z-50 p-2 rounded-lg bg-background border shadow-md"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Desktop collapse toggle button for chat */}
          {currentTab === "chat" && sessions.length > 0 && !isMobile && isSidebarCollapsed && (
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="fixed top-4 left-24 z-50 p-2 rounded-lg bg-background border shadow-md hover:bg-accent transition-colors"
              title="Show chat library"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Sidebar Panel - only show for chat tab and when sessions exist */}
          {currentTab === "chat" && sessions.length > 0 && !isSidebarCollapsed && (
            <>
              <div 
                className={cn(
                  "transition-all duration-300 w-80 flex-shrink-0",
                  isMobile && !isSidebarOpen ? "hidden" : ""
                )}
              >
                <div className="h-full bg-background/95 backdrop-blur-sm rounded-lg border border-border/20 shadow-lg">
                  <ChatSidebar
                    sessions={sessions}
                    currentSessionId={currentSessionId}
                    isSidebarOpen={isSidebarOpen}
                    isCollapsed={isSidebarCollapsed}
                    onNewChat={handleNewChat}
                    onSessionSelect={handleSessionClick}
                    onDeleteSession={onDeleteSession}
                    onRenameSession={onRenameSession}
                    onToggleFavorite={onToggleFavorite}
                    onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  />
                </div>
              </div>

              <div className="w-4 flex-shrink-0" />
            </>
          )}

          {/* Main Content Panel */}
          <div className="flex-1">
            <div className="h-full bg-background/95 backdrop-blur-sm rounded-lg border border-border/20 shadow-lg overflow-hidden">
              {renderMainContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobile && isSidebarOpen && currentTab === "chat" && sessions.length > 0 && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};
