import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MessageSquare, Theater, GraduationCap, Search, Bot, Settings, Code, Sparkles, TrendingUp, Heart, Eye } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/config/routes";
import { APP_TERMS, MUSAI_COLORS } from "@/config/constants";
import { useIsMobile } from "@/hooks/use-mobile";
import { MusaiLifeLogo, MusaiShimmer } from "@/components/effects/MusaiEffects";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useCurationsAvailability } from "@/hooks/useCurationsAvailability";
import { useMusaiMood } from "@/contexts/MusaiMoodContext";
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { DynamicProfileLogo } from '@/components/effects/MusaiEffects';

interface NavigationBarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export const NavigationBar = ({
  currentTab,
  onTabChange,
  isExpanded,
  onToggleExpanded,
}: NavigationBarProps) => {
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const navigate = useNavigate();
  const isMobile = false; // Simplified for now
  const { toggleDevConsole, setToolColor, isCareerMusaiActive } = useMusaiMood();
  const { isAvailable: curationsAvailable } = useCurationsAvailability();
  const { preferences, isToolVisible } = useUserPreferences();

  // ROYGBIV color coding for tools
  const toolColors = MUSAI_COLORS;

  // Map tab id constants to tool visibility keys used in preferences.visibleTools
  const tabIdToToolKey = (tabId: string): 'chat' | 'search' | 'code' | 'university' | 'narrative' | 'career' | 'therapy' | 'task' | 'eye' | 'settings' =>
  {
    switch (tabId)
    {
      case APP_TERMS.TAB_CHAT:
        return 'chat';
      case APP_TERMS.TAB_SEARCH:
        return 'search';
      case APP_TERMS.TAB_CODE:
        return 'code';
      case APP_TERMS.TAB_UNIVERSITY:
        return 'university';
      case APP_TERMS.TAB_NARRATIVE:
        return 'narrative';
      case APP_TERMS.TAB_CAREER:
        return 'career';
      case APP_TERMS.TAB_THERAPY:
        return 'therapy';
      case APP_TERMS.TAB_TASK:
        return 'task';
      case APP_TERMS.TAB_EYE:
        return 'eye';
      case APP_TERMS.TAB_SETTINGS:
        return 'settings';
      default:
        return 'chat';
    }
  };

  // Base navigation items - always available (ROYGBIV order with Eye placed after Search)
  const baseNavigationItems = [
    {
      id: APP_TERMS.TAB_CHAT,
      icon: MessageSquare,
      label: APP_TERMS.NAV_CHAT,
      available: true,
      color: toolColors[APP_TERMS.TAB_CHAT],
    },
    {
      id: APP_TERMS.TAB_SEARCH,
      icon: Search,
      label: APP_TERMS.NAV_SEARCH,
      available: true,
      color: toolColors[APP_TERMS.TAB_SEARCH],
    },
    {
      id: APP_TERMS.TAB_EYE,
      icon: Eye,
      label: APP_TERMS.NAV_EYE,
      available: true,
      color: toolColors[APP_TERMS.TAB_EYE],
    },
    {
      id: APP_TERMS.TAB_CODE,
      icon: Code,
      label: APP_TERMS.NAV_CODE,
      available: true,
      color: toolColors[APP_TERMS.TAB_CODE],
    },
    {
      id: APP_TERMS.TAB_UNIVERSITY,
      icon: GraduationCap,
      label: APP_TERMS.NAV_UNIVERSITY,
      available: true,
      comingSoon: false,
      color: toolColors[APP_TERMS.TAB_UNIVERSITY],
    },
    {
      id: APP_TERMS.TAB_NARRATIVE,
      icon: Theater,
      label: APP_TERMS.NAV_NARRATIVE,
      available: true,
      comingSoon: false,
      color: toolColors[APP_TERMS.TAB_NARRATIVE],
    },
    {
      id: APP_TERMS.TAB_THERAPY,
      icon: Heart,
      label: APP_TERMS.NAV_THERAPY,
      available: true,
      comingSoon: false,
      color: toolColors[APP_TERMS.TAB_THERAPY],
    },
  ];

  // Add career mode as 6th tool (Indigo) only if activated
  const careerItem = isCareerMusaiActive ? {
    id: APP_TERMS.TAB_CAREER,
    icon: TrendingUp,
    label: APP_TERMS.NAV_CAREER,
    available: true,
    comingSoon: false,
    color: toolColors[APP_TERMS.TAB_CAREER],
  } : null;

  // Task item (Violet - 7th position)
  const taskItem = {
    id: APP_TERMS.TAB_TASK,
    icon: Bot,
    label: APP_TERMS.NAV_TASK,
    available: true,
    comingSoon: false,
    color: toolColors[APP_TERMS.TAB_TASK],
  };

  // Build navigation items in correct order
  const navigationItems = [
    ...baseNavigationItems.filter(item => isToolVisible(tabIdToToolKey(item.id))),
    ...(careerItem && isToolVisible('career') ? [careerItem] : []),
    ...(isToolVisible('task') ? [taskItem] : []),
    ...(curationsAvailable ? [{
      id: "curations",
      icon: Sparkles,
      label: "AI Curations",
      available: true,
      comingSoon: false,
      isExternal: true,
      color: '#FF69B4',
    }] : []),
    {
      id: APP_TERMS.TAB_SETTINGS,
      icon: Settings,
      label: APP_TERMS.NAV_SETTINGS,
      available: true,
      color: '#808080',
    },
  ];

  return (
    <div
      className={cn(
        "fixed left-0 top-0 h-full bg-sidebar flex flex-col py-4 z-50 transition-all duration-300",
        isMobile 
          ? "w-12 items-center" // Always compact on mobile
          : isExpanded 
            ? "w-48 items-start px-3" // Expanded with text
            : "w-16 items-center", // Collapsed icons only
        "backdrop-blur-sm"
      )}
    >
      {/* Musai Logo Header */}
      <div className={cn(
        "flex items-center mb-3",
        isExpanded && !isMobile ? "w-full justify-center" : "justify-center"
      )}>
        <div 
          onClick={toggleDevConsole}
          className="cursor-pointer hover:scale-110 transition-transform duration-200"
          title="Open Musai Developer Console"
        >
          <DynamicProfileLogo 
            size={isExpanded && !isMobile ? "lg" : "md"} 
            isDarkMode={true}
            noShimmer={true}
            userPhotoUrl={preferences.userPhotoUrl}
            showUserPhoto={preferences.showUserPhoto || false}
          />
        </div>
        {isExpanded && !isMobile && (
          <div className="ml-3">
            <div className="text-sm font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              MUSAI
            </div>
            <div className="text-xs text-muted-foreground">
              AI Assistant
            </div>
          </div>
        )}
      </div>

      {/* Theme Toggle */}
      <div className={cn(
        "mb-2 w-full",
        isExpanded && !isMobile ? "flex justify-center" : "flex justify-center"
      )}>
        <ThemeToggle isExpanded={isExpanded && !isMobile} />
      </div>

      {/* Visual Separator */}
      <div className={cn(
        "mb-3",
        isExpanded && !isMobile ? "w-full" : "w-8"
      )}>
        <div className={cn(
          "border-t border-border/50",
          isExpanded && !isMobile ? "mx-2" : "mx-auto"
        )} />
      </div>

      {/* Spacing after theme toggle */}
      <div className={cn(
        "mb-4",
        isExpanded && !isMobile ? "w-full" : "w-8"
      )}>
        <div className={cn(
          "h-4",
          isExpanded && !isMobile ? "mx-2" : "mx-auto"
        )} />
      </div>

      <div className={cn(
        "flex flex-col flex-1 w-full",
        isExpanded && !isMobile ? "space-y-2 items-center" : "space-y-4 items-center px-3"
      )}>
        {navigationItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const isComingSoon = item.comingSoon;

          // Add spacing before settings (last item)
          const isLastItem = index === navigationItems.length - 1;
          const showSpacingBeforeSettings = isLastItem && item.id === APP_TERMS.TAB_SETTINGS;

          return (
            <div key={item.id}>
              {/* Spacing before settings */}
              {showSpacingBeforeSettings && (
                <div className={cn(
                  "mb-6",
                  isExpanded && !isMobile ? "w-full" : "w-8"
                )}>
                  <div className={cn(
                    "h-8",
                    isExpanded && !isMobile ? "mx-2" : "mx-auto"
                  )} />
                </div>
              )}

              <div
                className="relative group w-full"
                onMouseEnter={() => !isMobile && !isExpanded && setShowTooltip(item.id)}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <Button
                  key={item.id}
                  variant="ghost"
                  size={isExpanded ? undefined : "icon"}
                  className={cn(
                    "relative transition-all duration-200 hover:bg-sidebar-accent text-muted-foreground hover:text-foreground",
                    isExpanded 
                      ? "w-full justify-start h-11 px-3 rounded-lg" 
                      : "w-10 h-10 rounded-xl p-0 gap-0",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg scale-105 mystical-glow"
                      : "hover:bg-sidebar-accent text-muted-foreground hover:text-foreground",
                    isComingSoon && !isActive && "opacity-70"
                  )}
                  style={isActive && item.color ? {
                    '--tool-glow-color': item.color,
                    '--tool-glow-opacity': '0.6',
                  } as React.CSSProperties : undefined}
                  onClick={() => {
                    if (item.available) {
                      if (item.id === "curations") {
                        navigate(ROUTES.CURATIONS);
                      } else if (item.id === APP_TERMS.TAB_SETTINGS) {
                        navigate("/settings");
                      } else {
                        // Set the tool color as accent color when tool is selected
                        if (item.color) {
                          setToolColor(item.color);
                        }
                        onTabChange(item.id);
                      }
                    }
                  }}
                  disabled={!item.available}
                  title={isMobile || isExpanded ? undefined : item.label}
                >
                  <Icon 
                    className={cn(
                      "w-5 h-5 flex-shrink-0",
                      isActive && item.color && "tool-glow"
                    )} 
                  />
                  {isExpanded && !isMobile && (
                    <span className="ml-3 text-sm font-medium truncate">
                      {item.label}
                      {isComingSoon && (
                        <span className="ml-2 text-xs opacity-60">(Soon)</span>
                      )}
                    </span>
                  )}
                </Button>

                {/* Tooltip - only show on desktop when collapsed */}
                {!isMobile && !isExpanded && showTooltip === item.id && (
                  <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-popover text-popover-foreground px-3 py-2 rounded-lg shadow-lg border text-sm whitespace-nowrap z-50 animate-in slide-in-from-left-2">
                    {item.label}
                    {isComingSoon && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (Coming Soon)
                      </span>
                    )}
                  </div>
                )}

                {/* Coming Soon Badge */}
                {isComingSoon && (
                  <div className={cn(
                    "absolute bg-yellow-500 rounded-full flex items-center justify-center",
                    isExpanded && !isMobile 
                      ? "top-3 right-4 w-2 h-2" 
                      : "top-1 right-1 w-3 h-3"
                  )}>
                    {!isExpanded || isMobile ? (
                      <span className="text-[8px] text-white font-bold">!</span>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expand/Collapse Toggle Button - only show on desktop */}
      {!isMobile && (
        <Button
          variant="ghost"
          size={isExpanded ? undefined : "icon"}
          className={cn(
            "transition-all duration-200 hover:bg-sidebar-accent text-muted-foreground hover:text-foreground subtle-glow border border-gray-300/30 mt-4",
            isExpanded ? "w-full justify-start h-11 px-3 rounded-lg" : "w-10 h-10 rounded-xl p-0 gap-0"
          )}
          onClick={onToggleExpanded}
          title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          <div className={cn(
            "border-2 border-current rounded transition-transform duration-200 mystical-pulse",
            isExpanded ? "w-3 h-3 rotate-45" : "w-3 h-3 rotate-0"
          )} />
          {isExpanded && (
            <span className="ml-3 text-sm font-medium">
              {isExpanded ? "Collapse" : "Expand"}
            </span>
          )}
        </Button>
      )}
    </div>
  );
}; 