
import { useChatSessions } from "@/hooks/useChatSessions";
import { ChatLayout } from "@/components/chat/ChatLayout";

const Index = () => {
  const {
    sessions,
    currentSessionId,
    isLoading,
    isTyping,
    createNewSession,
    deleteSession,
    renameSession,
    sendMessage,
    setCurrentSessionId,
    toggleFavorite,
  } = useChatSessions();

  // Always render the component, don't add any conditional returns
  return (
    <div className="relative">
      <ChatLayout
        sessions={sessions}
        currentSessionId={currentSessionId}
        isLoading={isLoading}
        isTyping={isTyping}
        onNewChat={createNewSession}
        onSessionSelect={setCurrentSessionId}
        onDeleteSession={deleteSession}
        onRenameSession={renameSession}
        onToggleFavorite={toggleFavorite}
        onSendMessage={sendMessage}
      />
    </div>
  );
};

export default Index;
