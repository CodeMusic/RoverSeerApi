import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';

interface SmartRouterProps {
  children: React.ReactNode;
}

export const SmartRouter: React.FC<SmartRouterProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { shouldShowLanding, getRecommendedRoute, recordToolUsage } = useUserPreferences();

  useEffect(() => {
    // Only handle root path routing
    if (location.pathname === '/') {
      // Always show landing page as the main site - don't redirect based on preferences
      // This ensures home page is always the main entry point
      return;
    } else {
      // Track tool usage based on current path
      const pathToTool: Record<string, string> = {
        '/chat': 'chat',
        '/search': 'search', 
        '/code': 'code',
        '/university': 'university',
        '/task': 'task',
        '/narrative': 'narrative'
      };

      const tool = pathToTool[location.pathname];
      if (tool) {
        recordToolUsage(tool as any);
      }
    }
  }, [location.pathname, recordToolUsage]);

  return <>{children}</>;
};