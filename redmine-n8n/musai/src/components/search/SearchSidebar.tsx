import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Clock, ArrowLeft, Brain, Link, Cog, Globe, Trash2, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { SearchSessionModel } from "@/types/search";

type SearchSession = SearchSessionModel;

interface SearchSidebarProps {
  sessions: SearchSession[];
  currentSessionId: string | null;
  isSidebarOpen: boolean;
  isCollapsed: boolean;
  onSessionSelect: (sessionId: string) => void;
  onNewSearch: () => void;
  onToggleCollapse: () => void;
  onDeleteSession?: (sessionId: string) => void;
}

export const SearchSidebar = ({
  sessions,
  currentSessionId,
  isSidebarOpen,
  isCollapsed,
  onSessionSelect,
  onNewSearch,
  onToggleCollapse,
  onDeleteSession,
}: SearchSidebarProps) => {
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);

  const getIntentIcon = (intent?: string) => {
    switch (intent) {
      case 'search':
        return Globe;
      case 'llm':
        return Brain;
      case 'summarize':
        return Link;
      case 'tool':
        return Cog;
      default:
        return Search;
    }
  };

  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (onDeleteSession) {
      onDeleteSession(sessionId);
    }
  };
  return (
    <div
      className={cn(
        "w-64 border-r bg-sidebar flex flex-col absolute md:relative z-40 h-full transition-transform duration-200 ease-in-out",
        !isSidebarOpen && "-translate-x-full md:translate-x-0"
      )}
    >
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Search History</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onToggleCollapse}
            className="flex items-center gap-2"
            title="Collapse sidebar"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>
        
        <Button
          onClick={onNewSearch}
          className="w-full justify-start"
          variant="outline"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Search
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sessions.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No search history yet
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === currentSessionId;
              const isHovered = hoveredSessionId === session.id;
              const showActions = isActive || isHovered;

              return (
                <div
                  key={session.id}
                  onClick={() => onSessionSelect(session.id)}
                  onMouseEnter={() => setHoveredSessionId(session.id)}
                  onMouseLeave={() => setHoveredSessionId(null)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 group relative cursor-pointer",
                    "flex items-center gap-3 text-sm",
                    isActive 
                      ? "bg-sidebar-accent border border-border/50 shadow-sm" 
                      : isHovered
                        ? "bg-sidebar-accent/70 border border-border/40 shadow-sm"
                        : "hover:bg-sidebar-accent/50 border border-transparent hover:border-border/30"
                  )}
                  tabIndex={0}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {(() => {
                      const IconComponent = getIntentIcon(session.intent);
                      return (
                        <IconComponent className={cn(
                          "w-4 h-4 flex-shrink-0 transition-colors duration-200",
                          isActive 
                            ? "text-primary" 
                            : "text-muted-foreground/60 group-hover:text-muted-foreground"
                        )} />
                      );
                    })()}
                    <div className="truncate flex-1 min-w-0 pr-2">
                      <div className="font-medium truncate">
                        {session.query}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">
                          {format(session.timestamp, 'MMM d, h:mm a')}
                        </span>
                      </div>
                       <div className="text-xs text-muted-foreground truncate">
                         {session.results.length} result{session.results.length !== 1 ? 's' : ''}
                         {session.followUps.length > 0 && (
                           <span> • {session.followUps.length} follow-up{session.followUps.length !== 1 ? 's' : ''}</span>
                         )}
                         {session.mode === 'research' && <span> • research</span>}
                       </div>
                    </div>
                  </div>

                  {/* Action Buttons - Always reserve space */}
                  <div className="flex gap-1 flex-shrink-0 w-8 justify-end">
                    {showActions && onDeleteSession && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-destructive/20 hover:text-destructive focus:bg-destructive/20 focus:text-destructive transition-all duration-200"
                        onClick={(e) => handleDelete(e, session.id)}
                        title="Delete search"
                        aria-label="Delete search"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Search Topics / Categories */}
      <div className="p-4 border-t">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Topics</h3>
        <div className="space-y-1">
          {[
            "Technology",
            "Science",
            "Programming",
            "AI & ML",
            "Business"
          ].map((topic) => (
            <Button
              key={topic}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs"
            >
              <Search className="w-3 h-3 mr-2" />
              {topic}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};