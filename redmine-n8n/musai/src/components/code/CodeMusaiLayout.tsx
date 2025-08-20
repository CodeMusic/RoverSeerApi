import { Code, Sparkles } from "lucide-react";
import CodeMusaiPlayground from "@/components/code/CodeMusaiPlayground";
import { ToolHeader } from "@/components/common/ToolHeader";
import { APP_TERMS } from "@/config/constants";
import { DevSession } from "@/types/chat";

interface CodeMusaiLayoutProps {
  onClose: () => void;
  sessions: DevSession[];
  currentSessionId: string;
  createNewSession: () => void;
  deleteSession: (sessionId: string) => void;
  renameSession: (sessionId: string, newName: string) => void;
  toggleFavorite: (sessionId: string) => void;
  updateSession: (sessionId: string, data: Partial<DevSession>) => void;
  setCurrentSessionId: (sessionId: string) => void;
}

export const CodeMusaiLayout = ({
  onClose,
  sessions,
  currentSessionId,
  createNewSession,
  deleteSession,
  renameSession,
  toggleFavorite,
  updateSession,
  setCurrentSessionId,
}: CodeMusaiLayoutProps) => {

  return (
    <div className="flex-1 flex flex-col bg-background h-full overflow-hidden">
      {/* Header */}
      <ToolHeader
        icon={Code}
        title={APP_TERMS.CODE}
        badge={APP_TERMS.CODE_BADGE}
        badgeIcon={Sparkles}
        description={APP_TERMS.CODE_DESCRIPTION}
        size="compact"
      />

      {/* Code Playground Content */}
      <div className="flex-1 overflow-hidden">
        <CodeMusaiPlayground 
          onClose={onClose}
          sessions={sessions}
          currentSessionId={currentSessionId}
          onNewSession={createNewSession}
          onSessionSelect={setCurrentSessionId}
          onDeleteSession={deleteSession}
          onRenameSession={renameSession}
          onToggleFavorite={toggleFavorite}
          onUpdateSession={updateSession}
        />
      </div>
    </div>
  );
};