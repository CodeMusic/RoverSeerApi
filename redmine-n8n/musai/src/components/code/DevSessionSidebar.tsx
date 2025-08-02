import { DevSession } from "@/types/chat";
import { Code } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { BaseSessionSidebar } from "@/components/common/BaseSessionSidebar";

interface DevSessionSidebarProps {
  sessions: DevSession[];
  currentSessionId: string;
  isSidebarOpen: boolean;
  onNewSession: () => void;
  onSessionSelect: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newName: string) => void;
  onToggleFavorite: (sessionId: string) => void;
  onToggleCollapse?: () => void;
}

export const DevSessionSidebar = ({
  sessions,
  currentSessionId,
  isSidebarOpen,
  onNewSession,
  onSessionSelect,
  onDeleteSession,
  onRenameSession,
  onToggleFavorite,
  onToggleCollapse,
}: DevSessionSidebarProps) => {
  const getDefaultName = (session: DevSession) => {
    if (session.name) return session.name;
    const firstLine = session.code.split('\n')[0];
    if (firstLine.length > 30) return firstLine.substring(0, 30) + '...';
    return firstLine || `${session.language} Session`;
  };

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      javascript: "text-yellow-500",
      typescript: "text-blue-500",
      python: "text-green-500",
      html: "text-orange-500",
      css: "text-purple-500",
      java: "text-red-500",
      cpp: "text-blue-600",
      rust: "text-orange-600",
      go: "text-cyan-500",
    };
    return colors[language] || "text-gray-500";
  };

  const getSessionIcon = (session: DevSession) => (
    <Code className={cn("w-4 h-4", getLanguageColor(session.language))} />
  );

  const getSessionSubtitle = (session: DevSession) => {
    return `${session.language} • ${format(session.lastUpdated, 'MMM d, h:mm a')}`;
  };

  return (
    <BaseSessionSidebar
      sessions={sessions}
      currentSessionId={currentSessionId}
      isSidebarOpen={isSidebarOpen}
      title="Development Sessions"
      newSessionText="New Dev Session"
      getSessionIcon={getSessionIcon}
      getSessionName={getDefaultName}
      getSessionSubtitle={getSessionSubtitle} 
      onNewSession={onNewSession}
      onSessionSelect={onSessionSelect}
      onDeleteSession={onDeleteSession}
      onRenameSession={onRenameSession}
      onToggleFavorite={onToggleFavorite}
      onToggleCollapse={onToggleCollapse}
    />
  );
};