import React, { useState, useCallback, useEffect } from 'react';
import { Menu, Code } from 'lucide-react';
import { NavigationBar } from '@/components/common/NavigationBar';
import TopAppBar from '@/components/common/TopAppBar';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable';
import BottomTabBar from '@/components/common/BottomTabBar';
import { BaseSessionSidebar } from '@/components/common/BaseSessionSidebar';
import { MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { AllSessions, BaseSession, ChatSession, CareerSession, TherapySession, DevSession } from '@/types/chat';
import { APP_TERMS } from '@/config/constants';
import { useIsMobile } from '@/hooks/use-mobile';
import { UI_STRINGS } from '@/config/uiStrings';
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

  // Optional overrides to make the base session manager flexible per module
  leftSidebarTitle?: string;
  leftSidebarNewSessionText?: string;
  leftSidebarGetSessionIcon?: (session: ChatSession | CareerSession | TherapySession | DevSession) => React.ReactNode;
  leftSidebarGetSessionName?: (session: ChatSession | CareerSession | TherapySession | DevSession) => string;
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
  expandLeftSidebarOnce,
  leftSidebarTitle,
  leftSidebarNewSessionText,
  leftSidebarGetSessionIcon,
  leftSidebarGetSessionName
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [isSearchSidebarVisible, setIsSearchSidebarVisible] = useState(false);
  const { preferences } = useUserPreferences();
  const isMobile = useIsMobile();
  const rightContent = renderRightSidebar ? renderRightSidebar() : null;
  const leftOverride = renderLeftSidebarOverride ? renderLeftSidebarOverride() : null;
  const hasRightContent = Boolean(rightContent);
  const clientIpHash = getStoredClientIpHash();

  // Local storage keys for persisting user intent
  const leftCollapseStorageKey = (tab: string, mobile: boolean) => `musai_left_collapsed_${mobile ? 'mobile_' : ''}${tab}`;
  const rightCollapseStorageKey = (tab: string) => `musai_right_collapsed_${tab}`;

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

  // Choose which sessions to show in the base sidebar per tab
  const sidebarSessions: BaseSession[] = (() => {
    if (currentTab === APP_TERMS.TAB_CODE) {
      return filteredSessions.filter(s => s.type === 'dev');
    }
    return filteredSessions.filter((session) => 
      session.type === 'chat' || session.type === 'career' || session.type === 'therapy'
    );
  })() as BaseSession[];

  // Initialize left and right sidebars from persisted state; default expanded on desktop, collapsed on mobile
  useEffect(() => {
    try
    {
      const leftKey = leftCollapseStorageKey(currentTab, isMobile);
      const rightKey = rightCollapseStorageKey(currentTab);

      const storedLeft = localStorage.getItem(leftKey);
      const storedRight = localStorage.getItem(rightKey);

      const defaultLeftCollapsed = isMobile ? true : false;
      const defaultRightCollapsed = false;

      const nextLeftCollapsed = storedLeft != null ? storedLeft === 'true' : defaultLeftCollapsed;
      const nextRightCollapsed = storedRight != null ? storedRight === 'true' : defaultRightCollapsed;

      setIsSidebarCollapsed(nextLeftCollapsed);
      setIsRightSidebarCollapsed(nextRightCollapsed);

      // On mobile, avoid auto-opening overlay; only open when the user explicitly expands
      if (isMobile)
      {
        setIsSidebarOpen(false);
      }
      else
      {
        // On desktop, if not collapsed, ensure visible; if collapsed, hidden
        setIsSidebarOpen(!nextLeftCollapsed);
      }
    }
    catch
    {
      // Fail safe: default desktop expanded, mobile collapsed
      setIsSidebarCollapsed(isMobile);
      setIsSidebarOpen(!isMobile);
    }
  }, [currentTab, isMobile]);

  // Listen for search sidebar visibility changes
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { visible?: boolean } | undefined;
      setIsSearchSidebarVisible(Boolean(detail?.visible));
    };
    window.addEventListener('musai-search-visibility-change', handler as EventListener);
    return () => window.removeEventListener('musai-search-visibility-change', handler as EventListener);
  }, []);

  // Removed PreMusai visibility gating so the hamburger remains available when the sidebar is collapsed

  // Global events to control the left sidebar (used by CodeMusai and others)
  useEffect(() => {
    const collapse = () =>
    {
      setIsSidebarCollapsed(true);
      setIsSidebarOpen(false);
      try { localStorage.setItem(leftCollapseStorageKey(currentTab, isMobile), 'true'); } catch {}
    };

    const expand = () =>
    {
      setIsSidebarCollapsed(false);
      setIsSidebarOpen(isMobile ? true : true);
      try { localStorage.setItem(leftCollapseStorageKey(currentTab, isMobile), 'false'); } catch {}
    };
    const toggle = () => {
      setIsSidebarCollapsed(prev => !prev);
      setIsSidebarOpen(prev => !prev);
    };
    window.addEventListener('musai-left-sidebar-collapse', collapse);
    window.addEventListener('musai-left-sidebar-expand', expand);
    window.addEventListener('musai-left-sidebar-toggle', toggle);
    return () => {
      window.removeEventListener('musai-left-sidebar-collapse', collapse);
      window.removeEventListener('musai-left-sidebar-expand', expand);
      window.removeEventListener('musai-left-sidebar-toggle', toggle);
    };
  }, []);

  // Allow parent to force-expand the left sidebar once (e.g., after creating a narrative)
  useEffect(() => {
    if (expandLeftSidebarOnce) {
      setIsSidebarCollapsed(false);
    }
  }, [expandLeftSidebarOnce]);

  // Announce sidebar-capable layout presence for global UI (e.g., toasters)
  useEffect(() => {
    const evt = new CustomEvent('musai-sidebar-presence', { detail: { hasSidebar: true } });
    window.dispatchEvent(evt);
    return () => {
      const bye = new CustomEvent('musai-sidebar-presence', { detail: { hasSidebar: false } });
      window.dispatchEvent(bye);
    };
  }, []);

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
        "flex-1 transition-all duration-300 relative z-10 bg-background",
        // Top app bar height
        hideTopAppBar ? undefined : "pt-16",
        // Offset for fixed left navigation bar
        "ml-12",
        isNavigationExpanded ? "md:ml-48" : "md:ml-16"
      )}>
        <div className={cn(
          // Ensure main content fits viewport. If top bar is visible (pt-14 = 3.5rem), subtract it.
          hideTopAppBar ? "h-[100dvh] md:h-[100svh]" : "h-[calc(100dvh-4rem)] md:h-[calc(100svh-4rem)]",
          "flex overflow-x-hidden",
          // Leave space for bottom tab bar on mobile
          isMobile ? "pb-16 pb-safe" : undefined
        )}>
          {(!isMobile && currentTab !== APP_TERMS.TAB_SEARCH && !isSidebarCollapsed) ? (
            <ResizablePanelGroup direction="horizontal" className="flex-1 min-w-0" id="base-left-resizable">
              <ResizablePanel defaultSize={25} minSize={18} maxSize={40} id="base-left-sidebar">
                <div className="h-full border-r border-border bg-background">
                  {leftOverride ?? (
                    <BaseSessionSidebar
                      sessions={sidebarSessions}
                      currentSessionId={currentSessionId}
                      isSidebarOpen={true}
                      title={leftSidebarTitle ?? (
                        UI_STRINGS.musai[currentTab]?.sidebarTitle ?? UI_STRINGS.defaults.sidebarTitle
                      )}
                      newSessionText={leftSidebarNewSessionText ?? (
                        UI_STRINGS.musai[currentTab]?.newSessionText ?? UI_STRINGS.defaults.newSessionText
                      )}
                      getSessionIcon={leftSidebarGetSessionIcon ?? ((session) => (
                        (session as any).code ? <Code className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />
                      ))}
                      getSessionName={leftSidebarGetSessionName ?? ((session) => {
                        if ((session as any).code) {
                          const code = String((session as any).code || '');
                          const first = code.split('\n')[0] || '';
                          return session.name || (first.length > 30 ? first.slice(0, 30) + '...' : (first || `${(session as any).language || 'code'} Session`));
                        }
                        const msg = (session as any).messages?.find?.((m: any) => m.role === 'user')?.content;
                        return session.name || msg || 'New Chat';
                      })}
                      getSessionSubtitle={(session) => format(session.lastUpdated, 'MMM d, h:mm a')}
                      onNewSession={onNewSession}
                      onSessionSelect={onSessionSelect}
                      onDeleteSession={onDeleteSession}
                      onRenameSession={onRenameSession}
                      onToggleFavorite={onToggleFavorite}
                      onToggleCollapse={() =>
                      {
                        setIsSidebarCollapsed(true);
                        setIsSidebarOpen(false);
                        try { localStorage.setItem(leftCollapseStorageKey(currentTab, isMobile), 'true'); } catch {}
                      }}
                    />
                  )}
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel id="base-left-main" defaultSize={75} minSize={40}>
                <div className="flex w-full min-w-0">
                  {/* Main Content Area */}
                  <div className="flex-1 flex flex-col min-w-0 min-h-0">
                    {renderMainContent()}
                  </div>
                  {/* Right Sidebar (desktop only) */}
                  {hasRightContent && (
                    <>
                      {!isRightSidebarCollapsed && (
                        <div className="w-80 h-full border-l border-border bg-background relative flex flex-col min-h-0 overflow-hidden">
                          <button
                            onClick={() => {
                              setIsRightSidebarCollapsed(true);
                              try { localStorage.setItem(rightCollapseStorageKey(currentTab), 'true'); } catch {}
                            }}
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
                            onClick={() => {
                              setIsRightSidebarCollapsed(false);
                              try { localStorage.setItem(rightCollapseStorageKey(currentTab), 'false'); } catch {}
                            }}
                            className="h-12 hover:bg-accent"
                            title="Expand Right Panel"
                          >
                            <span className="mx-auto block w-0.5 h-6 bg-foreground/60" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <>
              {/* Left Sidebar (disabled for Search; Search manages its own sidebar) */}
              {currentTab !== APP_TERMS.TAB_SEARCH && !isSidebarCollapsed && (
                <div className={cn(
                  "w-96 border-r border-border bg-background h-full",
                  "transition-all duration-300 ease-in-out",
                  // On mobile, render as overlay to avoid affecting layout width
                  isMobile ? "absolute top-0 left-0 h-full z-20 shadow-lg w-[85vw] max-w-[85vw] overflow-y-auto" : undefined,
                  // Slide it offscreen when closed on mobile; fixed/absolute avoids layout shift
                  isMobile && !isSidebarOpen ? "-translate-x-full" : undefined
                )}>
                  {leftOverride ?? (
                    <BaseSessionSidebar
                      sessions={sidebarSessions}
                      currentSessionId={currentSessionId}
                      isSidebarOpen={isMobile ? isSidebarOpen : true}
                      title={leftSidebarTitle ?? (
                        UI_STRINGS.musai[currentTab]?.sidebarTitle ?? UI_STRINGS.defaults.sidebarTitle
                      )}
                      newSessionText={leftSidebarNewSessionText ?? (
                        UI_STRINGS.musai[currentTab]?.newSessionText ?? UI_STRINGS.defaults.newSessionText
                      )}
                      getSessionIcon={leftSidebarGetSessionIcon ?? ((session) => (
                        (session as any).code ? <Code className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />
                      ))}
                      getSessionName={leftSidebarGetSessionName ?? ((session) => {
                        if ((session as any).code) {
                          const code = String((session as any).code || '');
                          const first = code.split('\n')[0] || '';
                          return session.name || (first.length > 30 ? first.slice(0, 30) + '...' : (first || `${(session as any).language || 'code'} Session`));
                        }
                        const msg = (session as any).messages?.find?.((m: any) => m.role === 'user')?.content;
                        return session.name || msg || 'New Chat';
                      })}
                      getSessionSubtitle={(session) => format(session.lastUpdated, 'MMM d, h:mm a')}
                      onNewSession={onNewSession}
                      onSessionSelect={onSessionSelect}
                      onDeleteSession={onDeleteSession}
                      onRenameSession={onRenameSession}
                      onToggleFavorite={onToggleFavorite}
                      onToggleCollapse={() =>
                      {
                        setIsSidebarCollapsed(true);
                        setIsSidebarOpen(false);
                        try { localStorage.setItem(leftCollapseStorageKey(currentTab, isMobile), 'true'); } catch {}
                      }}
                    />
                  )}
                </div>
              )}

              {/* Collapsed Sidebar Toggle; for Search show only when its own sidebar is hidden */}
              {(
                (currentTab !== APP_TERMS.TAB_SEARCH && isSidebarCollapsed) ||
                (currentTab === APP_TERMS.TAB_SEARCH && !isSearchSidebarVisible)
              ) && (
                <div
                  className={cn(
                    "w-12 border-l border-border bg-background flex flex-col relative",
                    // Visually extend the white strip under the top app bar without affecting layout
                    hideTopAppBar ? undefined : "-mt-16 pt-16"
                  )}
                >
                  <button
                    onClick={() => {
                      if (currentTab === APP_TERMS.TAB_SEARCH) {
                        const evt = new Event('musai-search-expand-sidebar');
                        window.dispatchEvent(evt);
                      } else {
                        setIsSidebarCollapsed(false);
                        setIsSidebarOpen(isMobile ? true : true);
                        try { localStorage.setItem(leftCollapseStorageKey(currentTab, isMobile), 'false'); } catch {}
                      }
                    }}
                    className="p-3 hover:bg-accent hover:text-accent-foreground transition-colors text-muted-foreground"
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
                    <div className="w-80 h-full border-l border-border bg-background relative flex flex-col min-h-0 overflow-hidden">
                      <button
                        onClick={() => {
                          setIsRightSidebarCollapsed(true);
                          try { localStorage.setItem(rightCollapseStorageKey(currentTab), 'true'); } catch {}
                        }}
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
                        onClick={() => {
                          setIsRightSidebarCollapsed(false);
                          try { localStorage.setItem(rightCollapseStorageKey(currentTab), 'false'); } catch {}
                        }}
                        className="h-12 hover:bg-accent"
                        title="Expand Right Panel"
                      >
                        <span className="mx-auto block w-0.5 h-6 bg-foreground/60" />
                      </button>
                    </div>
                  )}
                </>
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
        {/* Bottom Tab Bar on mobile */}
        {isMobile && (
          <BottomTabBar currentTab={currentTab} onTabChange={onTabChange} />
        )}
      </div>
    </div>
  );
};
