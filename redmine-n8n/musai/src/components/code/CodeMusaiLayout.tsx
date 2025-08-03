import { Code, Sparkles } from "lucide-react";
import CodeMusaiPlayground from "@/components/code/CodeMusaiPlayground";
import { useDevSessions } from "@/hooks/useDevSessions";
import { ToolHeader } from "@/components/common/ToolHeader";
import { APP_TERMS } from "@/config/constants";

interface CodeMusaiLayoutProps {
  onClose: () => void;
}

export const CodeMusaiLayout = ({ onClose }: CodeMusaiLayoutProps) => {
  const {
    sessions,
    currentSessionId,
    isLoading,
    createNewSession,
    deleteSession,
    renameSession,
    toggleFavorite,
    updateSession,
    setCurrentSessionId,
    getCurrentSession
  } = useDevSessions();

  return (
    <div className="flex-1 flex flex-col bg-background h-[100dvh] overflow-hidden">
      {/* Header */}
      <ToolHeader
        icon={Code}
        title={APP_TERMS.CODE}
        badge={APP_TERMS.CODE_BADGE}
        badgeIcon={Sparkles}
        description={APP_TERMS.CODE_DESCRIPTION}
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