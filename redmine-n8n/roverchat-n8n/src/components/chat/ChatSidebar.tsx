import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChatSession } from "@/types/chat";
import { MessageSquare, PlusCircle, Trash2, Pencil, Check, X, Star, Code, Lock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string;
  isSidebarOpen: boolean;
  hasReachedLimit?: boolean;
  isUnlocked?: boolean;
  onNewChat: () => void;
  onSessionSelect: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newName: string) => void;
  onToggleFavorite: (sessionId: string) => void;
}

export const ChatSidebar = ({
  sessions,
  currentSessionId,
  isSidebarOpen,
  hasReachedLimit = false,
  isUnlocked = false,
  onNewChat,
  onSessionSelect,
  onDeleteSession,
  onRenameSession,
  onToggleFavorite,
}: ChatSidebarProps) => {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const navigate = useNavigate();

  const getFirstMessage = (messages: ChatSession["messages"]) => {
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
    
    if (sessions.length === 1) {
      toast.error("Cannot delete the last chat session");
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

  const startEditing = (e: React.MouseEvent, session: ChatSession) => {
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
          <h2 className="text-lg font-semibold">Chats</h2>
          <ThemeToggle />
        </div>
        
        <Button
          onClick={onNewChat}
          disabled={hasReachedLimit && !isUnlocked}
          className={cn(
            "w-full justify-start",
            hasReachedLimit && !isUnlocked && "opacity-50 cursor-not-allowed"
          )}
          variant="outline"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          {isUnlocked ? "New Chat (Unlocked)" : hasReachedLimit ? "Interaction Limit Reached" : "New Chat"}
        </Button>
        
        {hasReachedLimit && !isUnlocked && (
          <div className="mt-2 p-2 bg-muted/50 rounded-lg text-xs text-muted-foreground">
            <div className="flex items-center gap-1 mb-1">
              <Lock className="w-3 h-3" />
              <span className="font-medium">Interaction Limit</span>
            </div>
            <p>You've reached the free interaction limit. Sign up coming soon!</p>
          </div>
        )}
        
        {isUnlocked && (
          <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-green-600 dark:text-green-400">
            <div className="flex items-center gap-1 mb-1">
              <Check className="w-3 h-3" />
              <span className="font-medium">Unlocked Mode</span>
            </div>
            <p>You have unlimited interactions with Musai.</p>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => onSessionSelect(session.id)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors group",
                "flex items-center gap-2 text-sm relative cursor-pointer",
                session.id === currentSessionId && "bg-sidebar-accent"
              )}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
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
              {editingSessionId !== session.id && (
                <div className="opacity-0 group-hover:opacity-100 absolute right-2 flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-6 w-6",
                      session.favorite && "text-yellow-500 opacity-100"
                    )}
                    onClick={(e) => handleToggleFavorite(e, session.id)}
                  >
                    <Star className="h-3 w-3" fill={session.favorite ? "currentColor" : "none"} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => startEditing(e, session)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={(e) => handleDelete(e, session.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};