import React, { useState, useCallback, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { NavigationBar } from '@/components/common/NavigationBar';
import TopAppBar from '@/components/common/TopAppBar';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { cn } from '@/lib/utils';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { AllSessions, ChatSession, CareerSession, TherapySession } from '@/types/chat';
import { APP_TERMS } from '@/config/constants';
import { useIsMobile } from '@/hooks/use-mobile';

interface BaseLayoutProps {
  // Layout structure
  currentTab: string;
  sessions: AllSessions[];
  currentSessionId: string;
  
  // Session management
  onNewSession: () => void;
  onSessionSelect: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newName: string) => void;
  onToggleFavorite: (sessionId: string) => void;
  
  // Content rendering
  renderMainContent: () => React.ReactNode;
  renderRightSidebar?: () => React.ReactNode;
  
  // Navigation
  onTabChange: (tab: string) => void;
  isNavigationExpanded: boolean;
  onToggleNavigation: () => void;
}

export const BaseLayout: React.FC<BaseLayoutProps> = ({
  currentTab,
  sessions,
  currentSessionId,
  onNewSession,
  onSessionSelect,
  onDeleteSession,
  onRenameSession,
  onToggleFavorite,
  renderMainContent,
  renderRightSidebar,
  onTabChange,
  isNavigationExpanded,
  onToggleNavigation
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const { preferences } = useUserPreferences();
  const isMobile = useIsMobile();
  const rightContent = renderRightSidebar ? renderRightSidebar() : null;
  const hasRightContent = Boolean(rightContent);

  // Filter sessions based on current tab and type compatibility
  const filteredSessions = sessions.filter(session => {
    const tabToSessionType: Record<string, string> = {
      [APP_TERMS.TAB_CHAT]: 'chat',
      [APP_TERMS.TAB_CAREER]: 'career', 
      [APP_TERMS.TAB_NARRATIVE]: 'narrative',
      [APP_TERMS.TAB_UNIVERSITY]: 'university',
      [APP_TERMS.TAB_CODE]: 'dev',
      [APP_TERMS.TAB_SEARCH]: 'search',
      [APP_TERMS.TAB_TASK]: 'task',
      [APP_TERMS.TAB_THERAPY]: 'therapy',
      [APP_TERMS.TAB_EYE]: 'chat', // Eye reuses chat-like sessions initially
    };
    
    const expectedType = tabToSessionType[currentTab];
    return expectedType ? session.type === expectedType : true;
  });

  // Filter for sessions that have messages (compatible with ChatSidebar)
  const chatCompatibleSessions = filteredSessions.filter((session): session is ChatSession | CareerSession | TherapySession => 
    session.type === 'chat' || session.type === 'career' || session.type === 'therapy'
  );

  // Set initial sidebar state based on user preferences
  useEffect(() => {
    // For Chat, keep the session list open by default
    if (currentTab === APP_TERMS.TAB_CHAT) {
      setIsSidebarCollapsed(false);
      return;
    }

    if (filteredSessions.length > 0) {
      if (!preferences.autoSelectFirstItem) {
        setIsSidebarCollapsed(true);
      } else {
        setIsSidebarCollapsed(false);
      }
    } else {
      setIsSidebarCollapsed(true);
    }
  }, [currentTab, filteredSessions.length, preferences.autoSelectFirstItem]);

  return (
    <div className="h-full flex flex-col">
      {/* Top App Bar replaces vertical toolbar for now */}
      <TopAppBar />

      {/* Main Layout below top bar */}
      <div className={cn(
        "flex-1 transition-all duration-300 relative z-10",
        // No left offset when using a top app bar
        "pt-14"
      )}>
        <div className="h-[100dvh] md:h-[100svh] flex">
          {/* Left Sidebar */}
          {!isSidebarCollapsed && (
            <div className={cn(
              "w-80 border-r border-border bg-background",
              "transition-all duration-300 ease-in-out",
              isMobile && !isSidebarOpen && "-translate-x-full"
            )}>
              <ChatSidebar
                sessions={chatCompatibleSessions}
                currentSessionId={currentSessionId}
                onNewChat={onNewSession}
                onSessionSelect={onSessionSelect}
                onDeleteSession={onDeleteSession}
                onRenameSession={onRenameSession}
                onToggleFavorite={onToggleFavorite}
                isSidebarOpen={isSidebarOpen}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(true)}
              />
            </div>
          )}

          {/* Collapsed Sidebar Toggle */}
          {isSidebarCollapsed && (
            <div className="w-12 border-l border-border bg-background flex flex-col">
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="p-3 hover:bg-accent hover:text-accent-foreground transition-colors"
                title="Expand Sidebar"
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {renderMainContent()}
          </div>

          {/* Right Sidebar (render only if content exists) */}
          {hasRightContent && (
            <>
              {!isRightSidebarCollapsed && (
                <div className="w-80 border-l border-border bg-background relative">
                  <button
                    onClick={() => setIsRightSidebarCollapsed(true)}
                    className="absolute left-0 -ml-3 top-3 w-3 h-8 rounded-l bg-background border border-border flex items-center justify-center hover:bg-accent"
                    title="Collapse Right Panel"
                  >
                    <span className="block w-0.5 h-4 bg-foreground/60" />
                  </button>
                  {rightContent}
                </div>
              )}
              {isRightSidebarCollapsed && (
                <div className="w-3 border-l border-border bg-background flex flex-col items-stretch">
                  <button
                    onClick={() => setIsRightSidebarCollapsed(false)}
                    className="h-12 hover:bg-accent"
                    title="Expand Right Panel"
                  >
                    <span className="mx-auto block w-0.5 h-6 bg-foreground/60" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* Mobile Sidebar Overlay */}
          {isMobile && isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-20 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};
