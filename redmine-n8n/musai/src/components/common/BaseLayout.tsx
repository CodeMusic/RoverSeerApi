import React, { useState, useCallback, useEffect } from 'react';
import {
  Menu,
  Code,
  MessageSquare,
  Search,
  GraduationCap,
  Theater,
  TrendingUp,
  Heart,
  Eye,
  Stethoscope,
  Bot,
  Music,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { NavigationBar } from '@/components/common/NavigationBar';
import TopAppBar from '@/components/common/TopAppBar';
import { BaseSessionSidebar } from '@/components/common/BaseSessionSidebar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { AllSessions, BaseSession } from '@/types/chat';
import { APP_TERMS } from '@/config/constants';
import { useIsMobile } from '@/hooks/use-mobile';
import { UI_STRINGS } from '@/config/uiStrings';
import { getStoredClientIpHash } from '@/utils/ip';
import { attentionalRequestQueue } from '@/lib/AttentionalRequestQueue';
import type { QueueMetrics } from '@/lib/AttentionalRequestQueue';

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
  leftSidebarGetSessionIcon?: (session: AllSessions) => React.ReactNode;
  leftSidebarGetSessionName?: (session: AllSessions) => string;
  leftSidebarGetSessionSubtitle?: (session: AllSessions) => string;
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
  leftSidebarGetSessionName,
  leftSidebarGetSessionSubtitle
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [isSearchSidebarVisible, setIsSearchSidebarVisible] = useState(false);
  const [sidebarAnimated, setSidebarAnimated] = useState(false);
  const [magicLevel, setMagicLevel] = useState(0);
  const [searchSidebarLabel, setSearchSidebarLabel] = useState<'Search' | 'Research'>('Search');
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
      // Eye uses its own session type
      [APP_TERMS.TAB_EYE]: 'eye',
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
    if (currentTab === APP_TERMS.TAB_UNIVERSITY) {
      return filteredSessions.filter(session => session.type === 'university');
    }
    return filteredSessions.filter((session) => 
      session.type === 'chat' || session.type === 'career' || session.type === 'therapy' || session.type === 'eye'
    );
  })() as BaseSession[];

  const resolvedSidebarTitle = leftSidebarTitle ?? (
    UI_STRINGS.musai[currentTab]?.sidebarTitle ?? UI_STRINGS.defaults.sidebarTitle
  );
  const resolvedNewSessionText = leftSidebarNewSessionText ?? (
    UI_STRINGS.musai[currentTab]?.newSessionText ?? UI_STRINGS.defaults.newSessionText
  );
  const collapsedLabelMap: Record<string, string> = {
    [APP_TERMS.TAB_EYE]: 'Eye',
    [APP_TERMS.TAB_CHAT]: 'Chat',
    [APP_TERMS.TAB_SEARCH]: searchSidebarLabel,
    [APP_TERMS.TAB_UNIVERSITY]: 'Course',
    [APP_TERMS.TAB_THERAPY]: 'Therapy',
    [APP_TERMS.TAB_MEDICAL]: 'Medical',
    [APP_TERMS.TAB_CODE]: 'Code',
    [APP_TERMS.TAB_TASK]: 'Studio',
    studio: 'Studio',
  };
  const effectiveCollapsedTitle = collapsedLabelMap[currentTab] || resolvedSidebarTitle;
  const collapsedIconMap: Record<string, LucideIcon> = {
    [APP_TERMS.TAB_CHAT]: MessageSquare,
    [APP_TERMS.TAB_SEARCH]: Search,
    [APP_TERMS.TAB_EYE]: Eye,
    [APP_TERMS.TAB_CODE]: Code,
    [APP_TERMS.TAB_UNIVERSITY]: GraduationCap,
    [APP_TERMS.TAB_NARRATIVE]: Theater,
    [APP_TERMS.TAB_THERAPY]: Heart,
    [APP_TERMS.TAB_MEDICAL]: Stethoscope,
    [APP_TERMS.TAB_CAREER]: TrendingUp,
    [APP_TERMS.TAB_TASK]: Bot,
    studio: Music,
    curations: Sparkles,
  };
  const CollapsedIcon = collapsedIconMap[currentTab] || MessageSquare;

  // Initialize left and right sidebars from persisted state; default collapsed everywhere
  useEffect(() => {
    try
    {
      const leftKey = leftCollapseStorageKey(currentTab, isMobile);
      const rightKey = rightCollapseStorageKey(currentTab);

      const storedLeft = localStorage.getItem(leftKey);
      const storedRight = localStorage.getItem(rightKey);

      const defaultLeftCollapsed = true;
      const defaultRightCollapsed = false;

      const nextLeftCollapsed = storedLeft != null ? storedLeft === 'true' : defaultLeftCollapsed;
      const nextRightCollapsed = storedRight != null ? storedRight === 'true' : defaultRightCollapsed;

      setIsSidebarCollapsed(nextLeftCollapsed);
      setIsRightSidebarCollapsed(nextRightCollapsed);

      setIsSidebarOpen(!nextLeftCollapsed && !isMobile);
    }
    catch
    {
      setIsSidebarCollapsed(true);
      setIsSidebarOpen(false);
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

  useEffect(() => {
    if (isSidebarCollapsed)
    {
      setSidebarAnimated(false);
      return;
    }
    const id = requestAnimationFrame(() => setSidebarAnimated(true));
    return () => cancelAnimationFrame(id);
  }, [isSidebarCollapsed]);

  useEffect(() => {
    const handler = (event: Event) =>
    {
      const detail = (event as CustomEvent<{ mode?: string }>).detail;
      if (detail && detail.mode === 'research')
      {
        setSearchSidebarLabel('Research');
      }
      else
      {
        setSearchSidebarLabel('Search');
      }
    };
    window.addEventListener('musai-search-mode-change', handler as EventListener);
    return () => window.removeEventListener('musai-search-mode-change', handler as EventListener);
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

  useEffect(() => {
    const handleMetrics = (event: Event) =>
    {
      const detail = (event as CustomEvent<QueueMetrics>).detail;
      if (!detail)
      {
        setMagicLevel(0);
        return;
      }
      const activeCount = detail.activeCount ?? 0;
      const maxConcurrent = detail.maxConcurrent ?? 1;
      const ratio = maxConcurrent > 0 ? Math.min(1, activeCount / maxConcurrent) : (activeCount > 0 ? 1 : 0);
      setMagicLevel(ratio);
    };

    attentionalRequestQueue.addEventListener('metrics', handleMetrics as EventListener);
    return () => attentionalRequestQueue.removeEventListener('metrics', handleMetrics as EventListener);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined')
    {
      return;
    }
    const baseAmount = 0.12;
    const dynamicAmount = baseAmount + magicLevel * 0.25;
    const clamped = Math.min(0.45, Math.max(0.08, dynamicAmount));
    document.documentElement.style.setProperty('--musai-magic-amount', clamped.toFixed(3));
    document.body.dataset.magicActive = clamped > baseAmount ? '1' : '0';
  }, [magicLevel]);

  useEffect(() => {
    if (typeof document === 'undefined')
    {
      return;
    }
    if (!document.body.dataset.magicActive)
    {
      document.body.dataset.magicActive = '0';
    }
    return () =>
    {
      document.documentElement.style.setProperty('--musai-magic-amount', '0.12');
      document.body.dataset.magicActive = '0';
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

  const defaultSidebarIcon = (session: AllSessions) => {
    switch (session.type) {
      case 'dev':
        return <Code className="w-4 h-4" />;
      case 'career':
        return <TrendingUp className="w-4 h-4" />;
      case 'therapy':
        return <Heart className="w-4 h-4" />;
      case 'eye':
        return <Eye className="w-4 h-4" />;
      case 'university':
        return <GraduationCap className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const defaultSidebarName = (session: AllSessions) => {
    switch (session.type) {
      case 'dev': {
        const firstLine = String(session.code || '').split('\n')[0] || '';
        return session.name || (firstLine.length > 30 ? `${firstLine.slice(0, 30)}…` : firstLine || 'Dev Session');
      }
      case 'career':
      case 'therapy':
      case 'chat': {
        const message = (session as any).messages?.find?.((m: any) => m.role === 'user')?.content;
        return session.name || message || (session.type === 'career' ? 'Career Session' : session.type === 'therapy' ? 'Therapy Session' : 'Chat Session');
      }
      case 'eye': {
        const prompts = (session as any).prompts as string[] | undefined;
        const last = prompts && prompts.length > 0 ? prompts[prompts.length - 1] : undefined;
        return session.name || last || 'Eye Session';
      }
      case 'university':
        return session.name || session.topic || (session.scope === 'standalone' ? 'Standalone Lecture' : 'Course Concept');
      case 'task':
        return session.name || 'Task Session';
      case 'narrative':
        return session.name || 'Narrative Session';
      case 'medical':
        return session.name || 'Medical Session';
      default:
        return session.name || 'Session';
    }
  };

  const defaultSidebarSubtitle = (session: AllSessions) => format(session.lastUpdated, 'MMM d, h:mm a');

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
        // Top app bar height offset (desktop only; mobile top bar is not fixed)
        hideTopAppBar ? undefined : "md:pt-16",
        // Offset for fixed left navigation bar
        "ml-12",
        isNavigationExpanded ? "md:ml-48" : "md:ml-16"
      )}>
        <div className={cn(
          // Ensure main content fits viewport. Only subtract top bar height on desktop.
          hideTopAppBar ? "h-[100dvh] md:h-[100svh]" : "h-[100dvh] md:h-[calc(100svh-4rem)]",
          "flex overflow-x-hidden musai-spa-surface"
        )}>
          {/* Left Sidebar (disabled for Search; Search manages its own sidebar) */}
          {currentTab !== APP_TERMS.TAB_SEARCH && !isSidebarCollapsed && (
            <div className={cn(
              "w-96 border-r border-border bg-background h-full transition-all duration-300 ease-in-out relative",
              "magic-reactive magical-sidebar",
              sidebarAnimated && "magical-sidebar-enter",
              // On mobile, render as overlay to avoid affecting layout width
              isMobile ? "absolute top-0 left-0 h-full z-20 shadow-lg w-[85vw] max-w-[85vw] overflow-y-auto" : "relative",
              // Slide it offscreen when closed on mobile; fixed/absolute avoids layout shift
              isMobile && !isSidebarOpen ? "-translate-x-full" : undefined
            )}>
              {leftOverride ?? (
                <BaseSessionSidebar
                  sessions={sidebarSessions as AllSessions[]}
                  currentSessionId={currentSessionId}
                  isSidebarOpen={isMobile ? isSidebarOpen : true}
                  title={resolvedSidebarTitle}
                  newSessionText={resolvedNewSessionText}
                  getSessionIcon={leftSidebarGetSessionIcon ?? defaultSidebarIcon}
                  getSessionName={leftSidebarGetSessionName ?? defaultSidebarName}
                  getSessionSubtitle={leftSidebarGetSessionSubtitle ?? defaultSidebarSubtitle}
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
                "w-20 flex flex-col items-center py-4 relative",
                hideTopAppBar ? undefined : "md:-mt-16 md:pt-20"
              )}
            >
              <button
                onClick={() => {
                  if (currentTab === APP_TERMS.TAB_SEARCH) {
                    const evt = new Event('musai-search-expand-sidebar');
                    window.dispatchEvent(evt);
                  } else {
                    setIsSidebarCollapsed(false);
                    setIsSidebarOpen(true);
                    try { localStorage.setItem(leftCollapseStorageKey(currentTab, isMobile), 'false'); } catch {}
                  }
                }}
                className="mx-auto w-16 px-2 py-2 flex items-center justify-center gap-2 rounded-xl border border-primary/40 text-primary/80 hover:text-primary hover:bg-primary/10 shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/40"
                title={`Show ${effectiveCollapsedTitle}`}
                aria-label={`Show ${effectiveCollapsedTitle}`}
              >
                <Menu className="h-4 w-4" />
                <CollapsedIcon className="h-4 w-4" />
                <span className="sr-only">{`Show ${effectiveCollapsedTitle}`}</span>
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
