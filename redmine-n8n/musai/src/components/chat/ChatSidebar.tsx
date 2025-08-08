import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import { ChatSession, CareerSession, TherapySession } from "@/types/chat";
import { MessageSquare, PlusCircle, Trash2, Pencil, Check, X, Star, Code, Lock, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatSidebarProps {
  sessions: (ChatSession | CareerSession | TherapySession)[];
  currentSessionId: string;
  isSidebarOpen: boolean;
  isCollapsed?: boolean;
  onNewChat: () => void;
  onSessionSelect: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newName: string) => void;
  onToggleFavorite: (sessionId: string) => void;
  onToggleCollapse?: () => void;
}

export const ChatSidebar = ({
  sessions,
  currentSessionId,
  isSidebarOpen,
  isCollapsed = false,
  onNewChat,
  onSessionSelect,
  onDeleteSession,
  onRenameSession,
  onToggleFavorite,
  onToggleCollapse,
}: ChatSidebarProps) => {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const getFirstMessage = (messages: (ChatSession | CareerSession | TherapySession)["messages"]) => {
    const userMessage = messages.find(m => m.role === "user");
    return userMessage ? userMessage.content : "New Chat";
  };

  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    const session = sessions.find(s => s.id === sessionId);
    
    if (session?.favorite) {
      toast.error("Cannot delete a favorite chat");
      return;
    }
    
    onDeleteSession(sessionId);
    toast.success("Chat deleted successfully");
  };

  const handleToggleFavorite = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    onToggleFavorite(sessionId);
    const session = sessions.find(s => s.id === sessionId);
    toast.success(session?.favorite ? "Chat removed from favorites" : "Chat added to favorites");
  };

  const startEditing = (e: React.MouseEvent, session: ChatSession | CareerSession | TherapySession) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingName(session.name || getFirstMessage(session.messages));
  };

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSessionId && editingName.trim()) {
      onRenameSession(editingSessionId, editingName.trim());
      setEditingSessionId(null);
      toast.success("Chat renamed successfully");
    }
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(null);
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
          <h2 className="text-lg font-semibold">Library</h2>
          {onToggleCollapse && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onToggleCollapse}
              className="flex items-center gap-2"
              title="Collapse sidebar"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        <Button
          onClick={onNewChat}
          className="w-full justify-start"
          variant="outline"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Create a Thread
        </Button>
        

        

      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sessions.map((session) => {
            const isActive = session.id === currentSessionId;
            const isHovered = hoveredSessionId === session.id;
            const showActions = isActive || isHovered || isMobile;
            
            // Debug logging (remove in production)
            if (isHovered && import.meta.env.DEV) {
              console.log(`Chat session ${session.id} is hovered, showActions: ${showActions}`);
            }

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
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-200",
                    isActive 
                      ? "bg-primary" 
                      : isHovered
                        ? "bg-primary/60"
                        : "bg-muted-foreground/30 group-hover:bg-muted-foreground/50"
                  )} />
                  <div className="truncate flex-1">
                    {editingSessionId === session.id ? (
                      <form onSubmit={handleRename} onClick={e => e.stopPropagation()} className="flex items-center gap-2">
                        <Input
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          className="h-6 text-sm"
                          autoFocus
                        />
                        <Button type="submit" size="icon" variant="ghost" className="h-6 w-6">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={cancelEditing}>
                          <X className="h-4 w-4" />
                        </Button>
                      </form>
                    ) : (
                      <>
                        <div className="font-medium truncate">
                          {session.name || getFirstMessage(session.messages)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(session.lastUpdated, 'MMM d, h:mm a')}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {editingSessionId !== session.id && showActions && (
                  <div className="flex gap-1 opacity-100 transition-all duration-200 transform translate-x-0">
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
                      title="Rename chat"
                      aria-label="Rename chat"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-destructive/20 hover:text-destructive hover:shadow-sm focus:bg-destructive/20 focus:text-destructive"
                      onClick={(e) => handleDelete(e, session.id)}
                      title="Delete chat"
                      aria-label="Delete chat"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};