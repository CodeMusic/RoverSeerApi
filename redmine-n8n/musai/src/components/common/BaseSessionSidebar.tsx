import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BaseSession } from "@/types/chat";
import { PlusCircle, Trash2, Pencil, Check, X, Star, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";

interface BaseSessionSidebarProps<T extends BaseSession> {
  sessions: T[];
  currentSessionId: string;
  isSidebarOpen: boolean;
  title: string;
  newSessionText: string;
  getSessionIcon: (session: T) => ReactNode;
  getSessionName: (session: T) => string;
  getSessionSubtitle: (session: T) => string;
  onNewSession: () => void;
  onSessionSelect: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newName: string) => void;
  onToggleFavorite: (sessionId: string) => void;
  onToggleCollapse?: () => void;
}

export function BaseSessionSidebar<T extends BaseSession>({
  sessions,
  currentSessionId,
  isSidebarOpen,
  title,
  newSessionText,
  getSessionIcon,
  getSessionName,
  getSessionSubtitle,
  onNewSession,
  onSessionSelect,
  onDeleteSession,
  onRenameSession,
  onToggleFavorite,
  onToggleCollapse,
}: BaseSessionSidebarProps<T>) {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    const session = sessions.find(s => s.id === sessionId);
    
    if (session?.favorite) {
      toast.error("Cannot delete a favorite session");
      return;
    }
    
    if (sessions.length === 1) {
      toast.error("Cannot delete the last session");
      return;
    }
    onDeleteSession(sessionId);
    toast.success("Session deleted successfully");
  };

  const handleToggleFavorite = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    onToggleFavorite(sessionId);
    const session = sessions.find(s => s.id === sessionId);
    toast.success(session?.favorite ? "Session removed from favorites" : "Session added to favorites");
  };

  const startEditing = (e: React.MouseEvent, session: T) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingName(session.name || getSessionName(session));
  };

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSessionId && editingName.trim()) {
      onRenameSession(editingSessionId, editingName.trim());
      setEditingSessionId(null);
      toast.success("Session renamed successfully");
    }
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(null);
    setEditingName("");
  };

  if (!isSidebarOpen) return null;

  return (
    <div className="w-80 bg-sidebar border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/20">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">{title}</h2>
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="h-6 w-6 p-0"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
        </div>
        <Button
          onClick={onNewSession}
          className="w-full flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <PlusCircle className="w-4 h-4" />
          {newSessionText}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sessions.map((session) => {
            const isActive = session.id === currentSessionId;
            const isHovered = hoveredSessionId === session.id;
            const showActions = isActive || isHovered || isMobile;

            return (
              <div
                key={session.id}
                onClick={() => onSessionSelect(session.id)}
                onMouseEnter={() => setHoveredSessionId(session.id)}
                onMouseLeave={() => setHoveredSessionId(null)}
                className={cn(
                  "group relative cursor-pointer rounded-lg transition-all duration-200",
                  "border text-sm",
                  isActive 
                    ? "bg-sidebar-accent border-border/50 shadow-sm" 
                    : isHovered
                      ? "bg-sidebar-accent/70 border-border/40 shadow-sm"
                      : "hover:bg-sidebar-accent/50 border-transparent hover:border-border/30"
                )}
                tabIndex={0}
              >
                <div className="flex items-center p-3 min-w-0">
                  {/* Icon and Dot */}
                  <div className="flex items-center gap-2 flex-shrink-0 mr-3">
                    {getSessionIcon(session)}
                    <div className={cn(
                      "w-2 h-2 rounded-full transition-colors duration-200",
                      isActive 
                        ? "bg-primary" 
                        : isHovered
                          ? "bg-primary/60"
                          : "bg-muted-foreground/30 group-hover:bg-muted-foreground/50"
                    )} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 mr-2">
                    {editingSessionId === session.id ? (
                      <form onSubmit={handleRename} onClick={e => e.stopPropagation()} className="flex items-center gap-2">
                        <Input
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          className="h-6 text-sm"
                          autoFocus
                        />
                        <Button type="submit" size="icon" variant="ghost" className="h-6 w-6 flex-shrink-0">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button type="button" size="icon" variant="ghost" className="h-6 w-6 flex-shrink-0" onClick={cancelEditing}>
                          <X className="h-4 w-4" />
                        </Button>
                      </form>
                    ) : (
                      <>
                        <div className="font-medium truncate">
                          {getSessionName(session)}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {getSessionSubtitle(session)}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {editingSessionId !== session.id && showActions && (
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-6 w-6 hover:bg-sidebar-accent hover:shadow-sm",
                          session.favorite && "text-yellow-500"
                        )}
                        onClick={(e) => handleToggleFavorite(e, session.id)}
                        title="Toggle favorite"
                        aria-label="Toggle favorite"
                      >
                        <Star className="h-3 w-3" fill={session.favorite ? "currentColor" : "none"} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-sidebar-accent hover:shadow-sm"
                        onClick={(e) => startEditing(e, session)}
                        title="Rename session"
                        aria-label="Rename session"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-destructive/20 hover:text-destructive hover:shadow-sm focus:bg-destructive/20 focus:text-destructive"
                        onClick={(e) => handleDelete(e, session.id)}
                        title="Delete session"
                        aria-label="Delete session"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}