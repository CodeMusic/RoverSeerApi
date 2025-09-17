import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SettingsPanel } from '@/components/chat/SettingsPanel';
import { NavigationBar } from '@/components/common/NavigationBar';
import TopAppBar from '@/components/common/TopAppBar';
import { APP_TERMS } from '@/config/constants';
import { RouteUtils } from '@/config/routes';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [isNavigationExpanded, setIsNavigationExpanded] = useState(false);

  // Announce sidebar-capable layout presence so status bar shows up
  useEffect(() => {
    const evt = new CustomEvent('musai-sidebar-presence', { detail: { hasSidebar: true } });
    window.dispatchEvent(evt);
    return () => {
      const bye = new CustomEvent('musai-sidebar-presence', { detail: { hasSidebar: false } });
      window.dispatchEvent(bye);
    };
  }, []);

  const handleTabChange = (nextTab: string) => {
    // Map tab id → mode for unified main app route
    const tabToMode: Record<string, string> = {
      [APP_TERMS.TAB_CHAT]: 'chat',
      [APP_TERMS.TAB_SEARCH]: 'search',
      [APP_TERMS.TAB_CODE]: 'code',
      [APP_TERMS.TAB_UNIVERSITY]: 'university',
      [APP_TERMS.TAB_NARRATIVE]: 'narrative',
      [APP_TERMS.TAB_CAREER]: 'career',
      [APP_TERMS.TAB_THERAPY]: 'therapy',
      [APP_TERMS.TAB_EYE]: 'eye',
      [APP_TERMS.TAB_TASK]: 'task',
    };
    const mode = tabToMode[nextTab] || 'chat';
    navigate(RouteUtils.mainAppWithMode(mode));
  };

  return (
    <div className="h-full flex flex-col">
      <NavigationBar
        currentTab={APP_TERMS.TAB_SETTINGS}
        onTabChange={handleTabChange}
        isExpanded={isNavigationExpanded}
        onToggleExpanded={() => setIsNavigationExpanded((v) => !v)}
      />
      <TopAppBar />

      {/* Offset main content for fixed nav and top bar (desktop only; match BaseLayout spacing) */}
      <div className={`flex-1 transition-all duration-300 relative z-10 bg-background md:pt-16 ml-12 ${isNavigationExpanded ? 'md:ml-48' : 'md:ml-16'}`}>
        <div className="h-[100dvh] md:h-[calc(100svh-4rem)] flex overflow-x-hidden">
          <div className="flex-1 flex flex-col min-w-0 min-h-0 p-4">
            <SettingsPanel onClose={() => {}} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
