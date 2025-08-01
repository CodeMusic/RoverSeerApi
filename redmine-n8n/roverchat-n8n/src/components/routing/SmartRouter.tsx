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
      if (shouldShowLanding) {
        // First time visitors or returning after a long time - stay on landing
        return;
      } else {
        // Returning users - redirect to their preferred tool
        const recommendedRoute = getRecommendedRoute();
        navigate(recommendedRoute, { replace: true });
      }
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
  }, [location.pathname, shouldShowLanding, getRecommendedRoute, recordToolUsage, navigate]);

  return <>{children}</>;
};