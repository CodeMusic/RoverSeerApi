import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import ROUTES, { TOOL_TO_ROUTE } from '@/config/routes';
import { useMusaiMood } from '@/contexts/MusaiMoodContext';

interface SmartRouterProps {
  children: React.ReactNode;
}

export const SmartRouter: React.FC<SmartRouterProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { shouldShowLanding, getRecommendedRoute, recordToolUsage } = useUserPreferences();
  const { decrementRainbowPersistence } = useMusaiMood();

  useEffect(() => {
    // Only handle root path routing
    if (location.pathname === '/') {
      // Always show landing page as the main site - don't redirect based on preferences
      // This ensures home page is always the main entry point
      return;
    } else {
      // Track tool usage using canonical TOOL_TO_ROUTE mapping
      const pathname = location.pathname;
      const matchedTool = Object.entries(TOOL_TO_ROUTE).find(([, route]) => 
        pathname === route || pathname.startsWith(`${route}/`)
      )?.[0];

      if (matchedTool) {
        recordToolUsage(matchedTool as any);
      }
    }
  }, [location.pathname]); // Removed recordToolUsage from dependency array to prevent infinite loop

  // Handle rainbow persistence countdown per navigation (any route change)
  useEffect(() => {
    decrementRainbowPersistence();
    // run on route change
  }, [location.pathname]);

  return <>{children}</>;
};