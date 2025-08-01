import { Code, Sparkles } from "lucide-react";
import CodeMusaiPlayground from "@/components/code/CodeMusaiPlayground";
import { useDevSessions } from "@/hooks/useDevSessions";

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
      <div className="flex items-center justify-between p-6 border-b-2 border-purple-200 dark:border-purple-800 bg-sidebar/30">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Code className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-semibold">CodeMusai</h1>
              <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                <Sparkles className="w-3 h-3" />
                Interactive Playground
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Write, run, and experiment with code in multiple programming languages
            </p>
          </div>
        </div>
      </div>

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