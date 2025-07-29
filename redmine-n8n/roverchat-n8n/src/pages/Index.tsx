
import { useChatSessions } from "@/hooks/useChatSessions";
import { ChatLayout } from "@/components/chat/ChatLayout";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const Index = () => {
  const location = useLocation();
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

  // Handle navigation state from landing page
  useEffect(() => {
    if (location.state?.newSession) {
      // A new session was created from the landing page
      // The session is already created, so we just need to ensure it's selected
      if (sessions.length > 0) {
        const newSessionId = sessions[sessions.length - 1].id;
        setCurrentSessionId(newSessionId);
        
        // If there's an initial message, send it automatically
        if (location.state?.initialMessage) {
          const initialMessage = location.state.initialMessage;
          // Use a small delay to ensure the session is properly set
          setTimeout(() => {
            sendMessage(initialMessage);
          }, 100);
        }
      }
    } else if (location.state?.viewPastChats) {
      // User wants to view past chats
      // Select the most recent session if available
      if (sessions.length > 0) {
        setCurrentSessionId(sessions[sessions.length - 1].id);
      }
    }
  }, [location.state, sessions, setCurrentSessionId, sendMessage]);

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
