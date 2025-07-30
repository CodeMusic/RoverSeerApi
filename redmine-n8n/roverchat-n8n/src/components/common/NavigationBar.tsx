import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MessageSquare, Theater, GraduationCap, Search, Bot, Settings } from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

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

  const navigationItems = [
    {
      id: "chat",
      icon: MessageSquare,
      label: "Chat",
      available: true,
    },
    {
      id: "emergent-narrative",
      icon: Theater,
      label: "Emergent Narrative",
      available: true,
      comingSoon: true,
    },
    {
      id: "musai-university",
      icon: GraduationCap,
      label: "Musai University",
      available: true,
      comingSoon: true,
    },
    {
      id: "musai-search",
      icon: Search,
      label: "Musai Search",
      available: true,
    },
    {
      id: "agents",
      icon: Bot,
      label: "Agents",
      available: true,
      comingSoon: true,
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
                    onTabChange(item.id);
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
          className={cn(
            "transition-all duration-200 hover:bg-sidebar-accent text-muted-foreground hover:text-foreground mt-4",
            isExpanded ? "w-full justify-start h-11 px-3 rounded-lg" : "w-10 h-10 rounded-xl"
          )}
          onClick={onToggleExpanded}
          title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          <div className={cn(
            "border-2 border-current rounded transition-transform duration-200",
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