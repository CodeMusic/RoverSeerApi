import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MessageSquare, Theater, GraduationCap, Search, Bot, Settings, Code } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { MusaiLifeLogo, MusaiShimmer } from "@/components/effects/MusaiEffects";
import { ThemeToggle } from "@/components/ThemeToggle";
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

  const navigationItems = [
    {
      id: "chat",
      icon: MessageSquare,
      label: "MusaiChat",
      available: true,
    },
    {
      id: "musai-search",
      icon: Search,
      label: "MusaiSearch",
      available: true,
    },
    {
      id: "code-musai",
      icon: Code,
      label: "CodeMusai",
      available: true,
    },
    {
      id: "task-musai",
      icon: Bot,
      label: "TaskMusai",
      available: true,
      comingSoon: false,
    },
    {
      id: "emergent-narrative",
      icon: Theater,
      label: "Narrative",
      available: true,
      comingSoon: false,
    },
    {
      id: "musai-university",
      icon: GraduationCap,
      label: "MusaiU",
      available: true,
      comingSoon: false,
      isRoute: true,
      route: "/university",
    },
    {
      id: "settings",
      icon: Settings,
      label: "Settings",
      available: true,
    },
  ];

  return (
    <div
      className={cn(
        "fixed left-0 top-0 h-full bg-sidebar border-r border-border flex flex-col py-4 z-50 transition-all duration-300",
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
        "flex items-center justify-center mb-6",
        isExpanded && !isMobile ? "w-full" : ""
      )}>
        <div 
          onClick={toggleDevConsole}
          className="cursor-pointer hover:scale-110 transition-transform duration-200"
          title="Open Musai Developer Console"
        >
          <MusaiLifeLogo 
            size={isExpanded && !isMobile ? "lg" : "md"} 
            isDarkMode={true}
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
      <div className="mb-4 px-2">
        <ThemeToggle isExpanded={isExpanded && !isMobile} />
      </div>

      <div className={cn(
        "flex flex-col flex-1 w-full",
        isExpanded && !isMobile ? "space-y-2" : "space-y-4 items-center"
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
                className={cn(
                  "transition-all duration-200 hover:scale-105 relative",
                  isExpanded && !isMobile 
                    ? "w-full justify-start h-11 px-3 rounded-lg" 
                    : "w-10 h-10 rounded-xl",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg scale-105"
                    : "hover:bg-sidebar-accent text-muted-foreground hover:text-foreground",
                  isComingSoon && !isActive && "opacity-70"
                )}
                onClick={() => {
                  if (item.available) {
                    if (item.isRoute && item.route) {
                      navigate(item.route);
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
        <MusaiShimmer className="mt-4" speed="slow">
          <Button
            variant="ghost"
            className={cn(
              "transition-all duration-200 hover:bg-sidebar-accent text-muted-foreground hover:text-foreground mystical-glow",
              isExpanded ? "w-full justify-start h-11 px-3 rounded-lg" : "w-10 h-10 rounded-xl"
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
        </MusaiShimmer>
      )}
    </div>
  );
}; 