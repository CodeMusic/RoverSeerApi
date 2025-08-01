import React, { createContext, useContext, useEffect, useState } from 'react';

export type MusaiTool = 'chat' | 'search' | 'code' | 'university' | 'task' | 'narrative';

interface UserPreferences {
  hasVisited: boolean;
  preferredTool?: MusaiTool;
  lastUsedTool?: MusaiTool;
  lastVisit?: number;
  toolUsageCount: Record<MusaiTool, number>;
}

interface UserPreferencesContextType {
  preferences: UserPreferences;
  hasVisited: boolean;
  shouldShowLanding: boolean;
  setPreferredTool: (tool: MusaiTool) => void;
  recordToolUsage: (tool: MusaiTool) => void;
  getMostUsedTool: () => MusaiTool | null;
  getRecommendedRoute: () => string;
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
    code: 0,
    university: 0,
    task: 0,
    narrative: 0
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
    
    return `/${recommendedTool}`;
  };

  // Determine if we should show landing page
  const shouldShowLanding = !preferences.hasVisited || 
    (preferences.lastVisit && Date.now() - preferences.lastVisit > 7 * 24 * 60 * 60 * 1000); // 7 days

  const contextValue: UserPreferencesContextType = {
    preferences,
    hasVisited: preferences.hasVisited,
    shouldShowLanding,
    setPreferredTool,
    recordToolUsage,
    getMostUsedTool,
    getRecommendedRoute
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