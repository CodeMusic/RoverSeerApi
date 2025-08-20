import { useState } from "react";
import { NarrativeSession } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Users, Map, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { BaseSessionSidebar } from "@/components/common/BaseSessionSidebar";
import { format } from "date-fns";
import { UI_STRINGS } from "@/config/uiStrings";
import { APP_TERMS } from "@/config/constants";

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

  const filteredSessions = sessions.filter(session =>
    (session.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const storyData: any = (currentSession as any)?.storyData || {};
  const hasFramework = Boolean(storyData?.concept?.title) && Array.isArray(storyData?.acts) && storyData.acts.length > 0;
  const hasCharacters = Array.isArray(storyData?.characters) && storyData.characters.length >= 2;

  const isStepEnabled = (step: typeof currentStep): boolean => {
    switch (step) {
      case 'concept':
        return true;
      case 'characters':
        return hasFramework;
      case 'arc':
        return hasFramework;
      case 'scenes':
        return hasCharacters;
      default:
        return false;
    }
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

  const renderTopSection = (
    <div className="p-4 space-y-4">
      <div className="relative">
        {/* search icon is handled via padding only to keep base simple */}
        <Input
          placeholder="Search narratives..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div>
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
    </div>
  );

  return (
    <BaseSessionSidebar
      sessions={filteredSessions}
      currentSessionId={currentSessionId}
      isSidebarOpen={isSidebarOpen}
      title={UI_STRINGS.musai[APP_TERMS.TAB_NARRATIVE]?.sidebarTitle || UI_STRINGS.defaults.sidebarTitle}
      newSessionText={UI_STRINGS.musai[APP_TERMS.TAB_NARRATIVE]?.newSessionText || UI_STRINGS.defaults.newSessionText}
      getSessionIcon={() => <BookOpen className="w-4 h-4" />}
      getSessionName={(session: NarrativeSession) => session.name || `Narrative ${session.id.slice(0, 8)}`}
      getSessionSubtitle={(session: NarrativeSession) => format(session.lastUpdated, 'MMM d, h:mm a')}
      onNewSession={onNewNarrative}
      onSessionSelect={onSessionSelect}
      onDeleteSession={onDeleteSession}
      onRenameSession={onRenameSession}
      onToggleFavorite={onToggleFavorite}
      onToggleCollapse={onToggleCollapse}
      renderTopSection={renderTopSection}
    />
  );
}; 