import React from 'react';
import { cn } from '@/lib/utils';
import { MessageSquare, Search, Code, GraduationCap, Settings, Eye } from 'lucide-react';
import { APP_TERMS, CANONICAL_TOOL_ORDER, MUSAI_COLORS } from '@/config/constants';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { useMusaiMood } from '@/contexts/MusaiMoodContext';

interface BottomTabBarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ currentTab, onTabChange }) => {
  const navigate = useNavigate();
  const { isToolVisible } = useUserPreferences();
  const { setToolColor } = useMusaiMood();

  const items = [
    { id: APP_TERMS.TAB_CHAT, icon: MessageSquare, label: APP_TERMS.NAV_CHAT },
    { id: APP_TERMS.TAB_SEARCH, icon: Search, label: APP_TERMS.NAV_SEARCH },
    { id: APP_TERMS.TAB_EYE, icon: Eye, label: APP_TERMS.NAV_EYE },
    { id: APP_TERMS.TAB_CODE, icon: Code, label: APP_TERMS.NAV_CODE },
    { id: APP_TERMS.TAB_UNIVERSITY, icon: GraduationCap, label: APP_TERMS.NAV_UNIVERSITY },
    // Settings always last
    { id: APP_TERMS.TAB_SETTINGS, icon: Settings, label: APP_TERMS.NAV_SETTINGS },
  ].filter((it) => {
    if (it.id === APP_TERMS.TAB_SETTINGS) return true;
    const map: Record<string, keyof ReturnType<typeof useUserPreferences>['preferences']['visibleTools']> = {
      [APP_TERMS.TAB_CHAT]: 'chat',
      [APP_TERMS.TAB_SEARCH]: 'search',
      [APP_TERMS.TAB_EYE]: 'eye',
      [APP_TERMS.TAB_CODE]: 'code',
      [APP_TERMS.TAB_UNIVERSITY]: 'university',
    } as any;
    const key = map[it.id] as any;
    return key ? isToolVisible(key) : true;
  }).sort((a, b) => CANONICAL_TOOL_ORDER.indexOf(a.id) - CANONICAL_TOOL_ORDER.indexOf(b.id));

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-12 right-0 z-40',
        'border-t border-border bg-background/90 backdrop-blur pt-1 pb-safe'
      )}
      role="navigation"
      aria-label="Bottom Tabs"
    >
      <div className="grid grid-cols-5 gap-1 px-2 py-1">
        {items.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              className={cn(
                'flex flex-col items-center justify-center h-14 rounded-md transition-colors',
                'text-xs',
                isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => {
                if (item.id === APP_TERMS.TAB_SETTINGS) {
                  navigate(ROUTES.SETTINGS || '/settings');
                  return;
                }
                const color = MUSAI_COLORS[item.id as keyof typeof MUSAI_COLORS];
                if (color) setToolColor(color);
                onTabChange(item.id);
              }}
              aria-label={item.label}
            >
              <Icon className={cn('w-5 h-5 mb-0.5', isActive ? 'tool-glow' : undefined)} />
              <span className="leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomTabBar;


