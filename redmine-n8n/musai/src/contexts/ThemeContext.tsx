import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

type ThemePreference = 'auto' | 'light' | 'dark';

interface ThemeContextType {
  isDark: boolean;
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('themePreference') as ThemePreference | null;
      return saved ?? 'auto';
    }
    return 'auto';
  });

  const computeIsDarkByDaylight = (): boolean => {
    const now = new Date();
    const hour = now.getHours();
    // Daylight window (local time): 7am–7pm → light, otherwise dark
    return !(hour >= 7 && hour < 19);
  };

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    if (preference === 'light') return false;
    if (preference === 'dark') return true;
    // 'auto' by default follows daylight
    return computeIsDarkByDaylight();
  });

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Apply theme when state changes
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    // Persist preference and manage auto updates
    localStorage.setItem('themePreference', preference);
    if (preference === 'auto') {
      // Immediately compute according to daylight
      setIsDark(computeIsDarkByDaylight());
      // Re-check periodically in case the user crosses the boundary while app is open
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      intervalRef.current = window.setInterval(() => {
        setIsDark(computeIsDarkByDaylight());
      }, 5 * 60 * 1000); // every 5 minutes
    } else {
      // Stop auto updates and set explicit preference
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsDark(preference === 'dark');
    }
  }, [preference]);

  const toggleTheme = () => {
    // If user toggles while in auto, switch to explicit opposite of current
    setPreference(prevPref => {
      if (prevPref === 'auto') {
        return isDark ? 'light' : 'dark';
      }
      return prevPref === 'dark' ? 'light' : 'dark';
    });
  };

  return (
    <ThemeContext.Provider value={{ isDark, preference, setPreference, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}