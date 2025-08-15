import { useState } from "react";
import { NarrativeSession } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Search, 
  Star, 
  StarOff, 
  MoreHorizontal,
  Edit3,
  Trash2,
  BookOpen,
  Users,
  Map,
  Play
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface NarrativeSidebarProps {
  sessions: NarrativeSession[];
  currentSessionId: string;
  isSidebarOpen: boolean;
  isCollapsed: boolean;
  onNewNarrative: () => void;
  onSessionSelect: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newName: string) => void;
  onToggleFavorite: (sessionId: string) => void;
  onToggleCollapse: () => void;
  currentStep: 'concept' | 'characters' | 'arc' | 'scenes';
  onStepChange: (step: 'concept' | 'characters' | 'arc' | 'scenes') => void;
}

export const NarrativeSidebar = ({
  sessions,
  currentSessionId,
  isSidebarOpen,
  isCollapsed,
  onNewNarrative,
  onSessionSelect,
  onDeleteSession,
  onRenameSession,
  onToggleFavorite,
  onToggleCollapse,
  currentStep,
  onStepChange,
}: NarrativeSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);

  const filteredSessions = sessions.filter(session =>
    session.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute wizard gating from the current session
  const currentSession = sessions.find(s => s.id === currentSessionId);
  const storyData: any = (currentSession as any)?.storyData || {};
  const hasFramework = Boolean(storyData?.concept?.title) && Array.isArray(storyData?.acts) && storyData.acts.length > 0;
  const hasCharacters = Array.isArray(storyData?.characters) && storyData.characters.length >= 2;
  const hasScenes = Array.isArray(storyData?.acts) && storyData.acts.some((a: any) => Array.isArray(a.scenes) && a.scenes.length > 0);

  const isStepEnabled = (step: typeof currentStep): boolean => {
    switch (step) {
      case 'concept':
        return true; // Always reachable after seed
      case 'characters':
        return hasFramework; // Require framework from n8n
      case 'arc':
        return hasFramework; // Arc preview exists only after framework
      case 'scenes':
        return hasCharacters; // Require at least two characters
      default:
        return false;
    }
  };

  const handleEditStart = (session: NarrativeSession) => {
    setEditingSessionId(session.id);
    setEditName(session.name || "");
  };

  const handleEditSave = () => {
    if (editingSessionId && editName.trim()) {
      onRenameSession(editingSessionId, editName.trim());
      setEditingSessionId(null);
      setEditName("");
    }
  };

  const handleEditCancel = () => {
    setEditingSessionId(null);
    setEditName("");
  };

  const getStepIcon = (step: typeof currentStep) => {
    switch (step) {
      case 'concept':
        return <BookOpen className="w-4 h-4" />;
      case 'characters':
        return <Users className="w-4 h-4" />;
      case 'arc':
        return <Map className="w-4 h-4" />;
      case 'scenes':
        return <Play className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getStepLabel = (step: typeof currentStep) => {
    switch (step) {
      case 'concept':
        return 'Concept';
      case 'characters':
        return 'Characters';
      case 'arc':
        return 'Story Arc';
      case 'scenes':
        return 'Scenes';
      default:
        return 'Concept';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Narratives</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        
        <Button 
          onClick={onNewNarrative} 
          className="w-full flex items-center gap-2"
          size="sm"
        >
          <Plus className="w-4 h-4" />
          New Narrative
        </Button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-border/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search narratives..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Step Navigation */}
      <div className="p-4 border-b border-border/20">
        <h3 className="text-sm font-medium mb-3 text-muted-foreground">Current Step</h3>
        <div className="space-y-1">
          {(['concept', 'characters', 'arc', 'scenes'] as const).map((step) => {
            const enabled = isStepEnabled(step);
            return (
              <button
                key={step}
                onClick={() => enabled && onStepChange(step)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  currentStep === step
                    ? "bg-primary text-primary-foreground"
                    : enabled
                      ? "hover:bg-accent text-muted-foreground hover:text-foreground"
                      : "opacity-50 cursor-not-allowed text-muted-foreground"
                )}
                disabled={!enabled}
              >
                {getStepIcon(step)}
                {getStepLabel(step)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-2">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No narratives found</p>
              </div>
            ) : (
              filteredSessions.map((session) => {
                const isActive = currentSessionId === session.id;
                const isHovered = hoveredSessionId === session.id;
                return (
                  <div
                    key={session.id}
                    className={cn(
                      "group relative cursor-pointer rounded-lg transition-all duration-200",
                      "border text-sm p-3",
                      isActive 
                        ? "bg-sidebar-accent border-border/50 shadow-sm" 
                        : isHovered
                          ? "bg-sidebar-accent/70 border-border/40 shadow-sm"
                          : "hover:bg-sidebar-accent/50 border-transparent hover:border-border/30"
                    )}
                    onClick={() => onSessionSelect(session.id)}
                    onMouseEnter={() => setHoveredSessionId(session.id)}
                    onMouseLeave={() => setHoveredSessionId(null)}
                  >
                  {/* Session Content */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {editingSessionId === session.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleEditSave();
                              if (e.key === 'Escape') handleEditCancel();
                            }}
                            className="h-6 text-sm"
                            autoFocus
                          />
                          <Button size="sm" onClick={handleEditSave} className="h-6 px-2">
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={handleEditCancel} className="h-6 px-2">
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-sm truncate">
                              {session.name || `Narrative ${session.id.slice(0, 8)}`}
                            </h3>
                            {session.favorite && (
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(session.lastUpdated).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {editingSessionId !== session.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditStart(session)}>
                            <Edit3 className="w-3 h-3 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onToggleFavorite(session.id)}>
                            {session.favorite ? (
                              <>
                                <StarOff className="w-3 h-3 mr-2" />
                                Remove from favorites
                              </>
                            ) : (
                              <>
                                <Star className="w-3 h-3 mr-2" />
                                Add to favorites
                              </>
                            )}
                          </DropdownMenuItem>
                          <Separator />
                          <DropdownMenuItem 
                            onClick={() => onDeleteSession(session.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-3 h-3 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              );
            })
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}; 