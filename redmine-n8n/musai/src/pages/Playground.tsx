import React from 'react';
import CodeMusaiPlayground from '@/components/code/CodeMusaiPlayground';
import { useNavigate } from 'react-router-dom';
import { useDevSessions } from '@/hooks/useDevSessions';

const Playground = () => {
  const navigate = useNavigate();
  const {
    sessions,
    currentSessionId,
    createNewSession,
    deleteSession,
    renameSession,
    toggleFavorite,
    updateSession,
    setCurrentSessionId,
  } = useDevSessions();

  return (
    <div className="min-h-[100dvh] h-[100dvh] w-[100vw] bg-background flex flex-col">
      <div className="flex-1 min-h-0 min-w-0">
          <CodeMusaiPlayground
            onClose={() => navigate('/')}
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

export default Playground;