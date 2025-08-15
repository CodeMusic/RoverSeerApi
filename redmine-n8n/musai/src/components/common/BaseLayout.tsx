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
import { getStoredClientIpHash } from '@/utils/ip';

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
  renderLeftSidebarOverride?: () => React.ReactNode | null;
  
  // Navigation
  onTabChange: (tab: string) => void;
  isNavigationExpanded: boolean;
  onToggleNavigation: () => void;
  hideTopAppBar?: boolean;
  // When true, expands the left sidebar once (used after creating a new narrative)
  expandLeftSidebarOnce?: boolean;
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
  renderLeftSidebarOverride,
  onTabChange,
  isNavigationExpanded,
  onToggleNavigation,
  hideTopAppBar,
  expandLeftSidebarOnce
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const { preferences } = useUserPreferences();
  const isMobile = useIsMobile();
  const rightContent = renderRightSidebar ? renderRightSidebar() : null;
  const leftOverride = renderLeftSidebarOverride ? renderLeftSidebarOverride() : null;
  const hasRightContent = Boolean(rightContent);
  const clientIpHash = getStoredClientIpHash();

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
      // Medical and Eye currently do not use traditional sessions
      // Include mapping only when session types exist
      [APP_TERMS.TAB_EYE]: 'chat', // Eye reuses chat-like sessions initially
    };
    
    const expectedType = tabToSessionType[currentTab];
    const typeMatches = expectedType ? session.type === expectedType : true;
    // Filter by IP hash if present; allow untagged sessions for back-compat
    const ipMatches = clientIpHash ? (!session.clientIpHash || session.clientIpHash === clientIpHash) : true;
    return typeMatches && ipMatches;
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
      // If user prefers auto-select, collapse the sidebar; otherwise keep it open
      setIsSidebarCollapsed(preferences.autoSelectFirstItem);
    } else {
      setIsSidebarCollapsed(true);
    }
  }, [currentTab, filteredSessions.length, preferences.autoSelectFirstItem]);

  // Allow parent to force-expand the left sidebar once (e.g., after creating a narrative)
  useEffect(() => {
    if (expandLeftSidebarOnce) {
      setIsSidebarCollapsed(false);
    }
  }, [expandLeftSidebarOnce]);

  return (
    <div className="h-full flex flex-col">
      <NavigationBar
        currentTab={currentTab}
        onTabChange={onTabChange}
        isExpanded={isNavigationExpanded}
        onToggleExpanded={onToggleNavigation}
      />
      {/* Top App Bar replaces vertical toolbar for now */}
      {!hideTopAppBar && <TopAppBar />}

      {/* Main Layout below top bar */}
      <div className={cn(
        "flex-1 transition-all duration-300 relative z-10",
        // Top app bar height
        hideTopAppBar ? undefined : "pt-16",
        // Offset for fixed left navigation bar
        "ml-12",
        isNavigationExpanded ? "md:ml-48" : "md:ml-16"
      )}>
        <div className={cn(
          // Ensure main content fits viewport. If top bar is visible (pt-14 = 3.5rem), subtract it.
          hideTopAppBar ? "h-[100dvh] md:h-[100svh]" : "h-[calc(100dvh-4rem)] md:h-[calc(100svh-4rem)]",
          "flex overflow-x-hidden"
        )}>
          {/* Left Sidebar */}
          {!isSidebarCollapsed && (
            <div className={cn(
              "w-80 border-r border-border bg-background",
              "transition-all duration-300 ease-in-out",
              // On mobile, render as overlay to avoid affecting layout width
              isMobile ? "absolute top-0 left-0 h-full z-20 shadow-lg" : undefined,
              // Slide it offscreen when closed on mobile; fixed/absolute avoids layout shift
              isMobile && !isSidebarOpen ? "-translate-x-full" : undefined
            )}>
              {leftOverride ?? (
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
              )}
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
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            {renderMainContent()}
          </div>

          {/* Right Sidebar (render only if content exists and not on mobile) */}
          {hasRightContent && !isMobile && (
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
