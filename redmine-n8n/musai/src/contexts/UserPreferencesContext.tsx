import React, { createContext, useContext, useEffect, useState } from 'react';
import { TOOL_TO_ROUTE } from '@/config/routes';

export type MusaiTool = 'chat' | 'search' | 'eye' | 'code' | 'university' | 'task' | 'narrative' | 'career' | 'therapy' | 'medical';

interface LastSession {
  timestamp: number;
  sessionId?: string;
  // University-specific fields
  courseId?: string;
  lectureId?: string;
  view?: string; // 'dashboard', 'course', 'lecture', etc.
  // Narrative-specific fields
  narrativeId?: string;
  // Chat-specific fields
  chatId?: string;
  // Search-specific fields
  searchId?: string;
  // Code-specific fields
  projectId?: string;
  // Career-specific fields
  careerId?: string;
}

interface UserPreferences {
  hasVisited: boolean;
  preferredTool?: MusaiTool;
  lastUsedTool?: MusaiTool;
  lastVisit?: number;
  toolUsageCount: Record<MusaiTool, number>;
  autoSelectFirstItem: boolean;
  lastSessions: Partial<Record<MusaiTool, LastSession>>;
  userPhotoUrl?: string;
  showUserPhoto?: boolean;
  // Tool visibility settings
  visibleTools: Record<MusaiTool, boolean>;
  // Performance tuning per UI session
  clientMaxConcurrent?: number; // user-selected per-session cap
}

interface UserPreferencesContextType {
  preferences: UserPreferences;
  hasVisited: boolean;
  shouldShowLanding: boolean;
  setPreferredTool: (tool: MusaiTool) => void;
  recordToolUsage: (tool: MusaiTool) => void;
  getMostUsedTool: () => MusaiTool | null;
  getRecommendedRoute: () => string;
  setAutoSelectFirstItem: (enabled: boolean) => void;
  // Session tracking methods
  recordLastSession: (tool: MusaiTool, session: Partial<LastSession>) => void;
  getLastSession: (tool: MusaiTool) => LastSession | null;
  clearLastSession: (tool: MusaiTool) => void;
  // User photo methods
  setUserPhoto: (photoUrl: string) => void;
  clearUserPhoto: () => void;
  setShowUserPhoto: (show: boolean) => void;
  // Tool visibility methods
  setToolVisibility: (tool: MusaiTool, visible: boolean) => void;
  getVisibleTools: () => MusaiTool[];
  isToolVisible: (tool: MusaiTool) => boolean;
  // Performance tuning API
  getClientMaxConcurrent: () => number;
  setClientMaxConcurrent: (value: number) => void;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

const defaultPreferences: UserPreferences = {
  hasVisited: false,
  preferredTool: undefined,
  lastUsedTool: undefined,
  lastVisit: undefined,
  toolUsageCount: {
    chat: 0,
    search: 0,
    eye: 0,
    code: 0,
    university: 0,
    task: 0,
    narrative: 0,
    career: 0,
      therapy: 0,
      medical: 0,
  },
  autoSelectFirstItem: false,
  lastSessions: {},
  visibleTools: {
    chat: true,
    search: true,
    eye: true,
    code: true,
    university: true,
    task: true,
    narrative: true,
    career: true,
      therapy: true,
      medical: true,
  }
};

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('musai-user-preferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreferences({
          ...defaultPreferences,
          ...parsed,
          toolUsageCount: {
            ...defaultPreferences.toolUsageCount,
            ...(parsed.toolUsageCount || {})
          },
          lastSessions: {
            ...defaultPreferences.lastSessions,
            ...(parsed.lastSessions || {})
          }
        });
      } catch (error) {
        console.error('Failed to parse user preferences:', error);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('musai-user-preferences', JSON.stringify(preferences));
    }
  }, [preferences, isInitialized]);

  const setPreferredTool = (tool: MusaiTool) => {
    setPreferences(prev => ({
      ...prev,
      preferredTool: tool,
      hasVisited: true,
      lastVisit: Date.now()
    }));
  };

  const recordToolUsage = (tool: MusaiTool) => {
    setPreferences(prev => ({
      ...prev,
      hasVisited: true,
      lastUsedTool: tool,
      lastVisit: Date.now(),
      toolUsageCount: {
        ...prev.toolUsageCount,
        [tool]: prev.toolUsageCount[tool] + 1
      }
    }));
  };

  const setAutoSelectFirstItem = (enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      autoSelectFirstItem: enabled
    }));
  };

  const recordLastSession = (tool: MusaiTool, session: Partial<LastSession>) => {
    setPreferences(prev => ({
      ...prev,
      lastSessions: {
        ...prev.lastSessions,
        [tool]: {
          timestamp: Date.now(),
          ...session
        }
      }
    }));
  };

  const getLastSession = (tool: MusaiTool): LastSession | null => {
    return preferences.lastSessions[tool] || null;
  };

  const clearLastSession = (tool: MusaiTool) => {
    setPreferences(prev => ({
      ...prev,
      lastSessions: {
        ...prev.lastSessions,
        [tool]: undefined
      }
    }));
  };

  const setUserPhoto = (photoUrl: string) => {
    setPreferences(prev => ({
      ...prev,
      userPhotoUrl: photoUrl,
      showUserPhoto: true
    }));
  };

  const clearUserPhoto = () => {
    setPreferences(prev => ({
      ...prev,
      userPhotoUrl: undefined,
      showUserPhoto: false
    }));
  };

  const setShowUserPhoto = (show: boolean) => {
    setPreferences(prev => ({
      ...prev,
      showUserPhoto: show
    }));
  };

  const getMostUsedTool = (): MusaiTool | null => {
    const counts = preferences.toolUsageCount;
    const maxCount = Math.max(...Object.values(counts));
    
    if (maxCount === 0) return null;
    
    const mostUsed = Object.entries(counts).find(([_, count]) => count === maxCount);
    return mostUsed ? (mostUsed[0] as MusaiTool) : null;
  };

  const getRecommendedRoute = (): string => {
    // Priority: preferred tool > most used tool > last used tool > default (chat)
    const recommendedTool = 
      preferences.preferredTool || 
      getMostUsedTool() || 
      preferences.lastUsedTool || 
      'chat';

    const route = TOOL_TO_ROUTE[recommendedTool];
    return route ?? TOOL_TO_ROUTE.chat;
  };

  // Determine if we should show landing page
  const shouldShowLanding = !preferences.hasVisited || 
    (preferences.lastVisit && Date.now() - preferences.lastVisit > 7 * 24 * 60 * 60 * 1000); // 7 days

  // Tool visibility methods
  const setToolVisibility = (tool: MusaiTool, visible: boolean) => {
    setPreferences(prev => ({
      ...prev,
      visibleTools: {
        ...prev.visibleTools,
        [tool]: visible
      }
    }));
  };

  const getVisibleTools = (): MusaiTool[] => {
    return Object.entries(preferences.visibleTools)
      .filter(([_, visible]) => visible)
      .map(([tool, _]) => tool as MusaiTool);
  };

  const isToolVisible = (tool: MusaiTool): boolean => {
    return preferences.visibleTools[tool] ?? true; // Default to visible if not set
  };

  const contextValue: UserPreferencesContextType = {
    preferences,
    hasVisited: preferences.hasVisited,
    shouldShowLanding,
    setPreferredTool,
    recordToolUsage,
    getMostUsedTool,
    getRecommendedRoute,
    setAutoSelectFirstItem,
    recordLastSession,
    getLastSession,
    clearLastSession,
    setUserPhoto,
    clearUserPhoto,
    setShowUserPhoto,
    setToolVisibility,
    getVisibleTools,
    isToolVisible,
    getClientMaxConcurrent: () => {
      const serverDefault = (() => {
        try {
          const winEnv = (typeof window !== 'undefined' && (window as any).env) ? (window as any).env : undefined;
          const raw = (import.meta as any).env?.VITE_N8N_MAX_CONCURRENCY || winEnv?.VITE_N8N_MAX_CONCURRENCY;
          const parsed = raw ? parseInt(String(raw), 10) : NaN;
          return !Number.isNaN(parsed) && parsed > 0 ? parsed : 3;
        } catch { return 3; }
      })();
      const clientPref = preferences.clientMaxConcurrent;
      if (typeof clientPref === 'number' && clientPref > 0)
      {
        return Math.min(clientPref, serverDefault);
      }
      return serverDefault;
    },
    setClientMaxConcurrent: (value: number) => {
      setPreferences(prev => ({ ...prev, clientMaxConcurrent: Math.max(1, Math.floor(value)) }));
    }
  };

  return (
    <UserPreferencesContext.Provider value={contextValue}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
}