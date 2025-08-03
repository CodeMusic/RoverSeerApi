import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MessageSquare, Theater, GraduationCap, Search, Bot, Settings, Code, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/config/routes";
import { APP_TERMS } from "@/config/constants";
import { useIsMobile } from "@/hooks/use-mobile";
import { MusaiLifeLogo, MusaiShimmer } from "@/components/effects/MusaiEffects";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useCurationsAvailability } from "@/hooks/useCurationsAvailability";
import { useMusaiMood } from "@/contexts/MusaiMoodContext";

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
  const isMobile = useIsMobile();
  const navigate = useNavigate(); 
  const { toggleDevConsole } = useMusaiMood();
  const { isAvailable: curationsAvailable } = useCurationsAvailability();

  // Base navigation items - always available
  const baseNavigationItems = [
    {
      id: APP_TERMS.TAB_CHAT,
      icon: MessageSquare,
      label: APP_TERMS.NAV_CHAT,
      available: true,
    },
    {
      id: APP_TERMS.TAB_SEARCH,
      icon: Search,
      label: APP_TERMS.NAV_SEARCH,
      available: true,
    },
    {
      id: APP_TERMS.TAB_CODE,
      icon: Code,
      label: APP_TERMS.NAV_CODE,
      available: true,
    },
    {
      id: APP_TERMS.TAB_UNIVERSITY,
      icon: GraduationCap,
      label: APP_TERMS.NAV_UNIVERSITY,
      available: true,
      comingSoon: false,
    },
    {
      id: APP_TERMS.TAB_NARRATIVE,
      icon: Theater,
      label: APP_TERMS.NAV_NARRATIVE,
      available: true,
      comingSoon: false,
    },
    {
      id: APP_TERMS.TAB_TASK,
      icon: Bot,
      label: APP_TERMS.NAV_TASK,
      available: true,
      comingSoon: false,
    },
    {
      id: APP_TERMS.TAB_SETTINGS,
      icon: Settings,
      label: APP_TERMS.NAV_SETTINGS,
      available: true,
    },
  ];

  // Conditionally add curations if content is available
  const navigationItems = [
    ...baseNavigationItems.slice(0, -1), // All items except settings
    ...(curationsAvailable ? [{
      id: "curations",
      icon: Sparkles,
      label: "AI Curations",
      available: true,
      comingSoon: false,
      isExternal: true,
    }] : []),
    baseNavigationItems[baseNavigationItems.length - 1] // Settings at the end
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
          <MusaiLifeLogo 
            size={isExpanded && !isMobile ? "lg" : "md"} 
            isDarkMode={true}
            noShimmer={true}
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

      <div className={cn(
        "flex flex-col flex-1 w-full",
        isExpanded && !isMobile ? "space-y-2 items-center" : "space-y-4 items-center px-3"
      )}>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const isComingSoon = item.comingSoon;

          return (
            <div
              key={item.id}
              className="relative group w-full"
              onMouseEnter={() => !isMobile && !isExpanded && setShowTooltip(item.id)}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <Button
                variant="ghost"
                size={isExpanded && !isMobile ? undefined : "icon"}
                className={cn(
                  "transition-all duration-200 hover:scale-105 relative",
                  isExpanded && !isMobile 
                    ? "w-full justify-start h-11 px-3 rounded-lg" 
                    : "w-10 h-10 rounded-xl p-0 gap-0",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg scale-105"
                    : "hover:bg-sidebar-accent text-muted-foreground hover:text-foreground",
                  isComingSoon && !isActive && "opacity-70"
                )}
                onClick={() => {
                  if (item.available) {
                    if (item.id === "curations") {
                      navigate(ROUTES.CURATIONS);
                    } else {
                      onTabChange(item.id);
                    }
                  }
                }}
                disabled={!item.available}
                title={isMobile || isExpanded ? undefined : item.label}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
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
          );
        })}
      </div>

      {/* Expand/Collapse Toggle Button - only show on desktop */}
      {!isMobile && (
        <Button
          variant="ghost"
          size={isExpanded ? undefined : "icon"}
          className={cn(
            "transition-all duration-200 hover:bg-sidebar-accent text-muted-foreground hover:text-foreground mystical-glow border border-gray-300/30 mt-4",
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