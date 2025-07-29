
import { useChatSessions } from "@/hooks/useChatSessions";
import { ChatLayout } from "@/components/chat/ChatLayout";
import { useLocation } from "react-router-dom";
import { useEffect, useRef, useCallback } from "react";

const Index = () => {
  const location = useLocation();
  const hasSentInitialMessage = useRef(false);
  const {
    sessions,
    currentSessionId,
    isLoading,
    isTyping,
    hasReachedLimit,
    isUnlocked,
    createNewSession,
    deleteSession,
    renameSession,
    sendMessage,
    setCurrentSessionId,
    toggleFavorite,
    getCurrentSession,
    unlockUser,
    clearAllData,
    debugState,
    checkLimit,
    resetInteractionState,
  } = useChatSessions();

  // Create a stable callback for sending the initial message
  const sendInitialMessage = useCallback((message: string) => {
    const currentSession = getCurrentSession();
    if (currentSession) {
      sendMessage(message);
    }
  }, [getCurrentSession, sendMessage]);

  // Handle navigation state from landing page
  useEffect(() => {
    if (location.state?.newSession) {
      // A new session was created from the landing page
      // The session is already created and selected by createNewSession()
      // We don't need to override the selection
      
      // If there's an initial message and we haven't sent it yet, send it automatically
      if (location.state?.initialMessage && !hasSentInitialMessage.current) {
        const initialMessage = location.state.initialMessage;
        hasSentInitialMessage.current = true;
        
        // Use a longer delay to ensure the session is properly set and we can get its messages
        setTimeout(() => {
          sendInitialMessage(initialMessage);
        }, 200);
      }
    } else if (location.state?.viewPastChats) {
      // User wants to view past chats
      // Select the most recent session if available
      if (sessions.length > 0) {
        setCurrentSessionId(sessions[sessions.length - 1].id);
      }
    }
  }, [location.state, sessions, setCurrentSessionId, sendInitialMessage]);

  // Reset the ref when location changes (new navigation)
  useEffect(() => {
    hasSentInitialMessage.current = false;
  }, [location.state]);

  // Always render the component, don't add any conditional returns
  return (
    <div className="relative">
      <ChatLayout
        sessions={sessions}
        currentSessionId={currentSessionId}
        isLoading={isLoading}
        isTyping={isTyping}
        hasReachedLimit={hasReachedLimit}
        isUnlocked={isUnlocked}
        onNewChat={createNewSession}
        onSessionSelect={setCurrentSessionId}
        onDeleteSession={deleteSession}
        onRenameSession={renameSession}
        onToggleFavorite={toggleFavorite}
        onSendMessage={sendMessage}
        onUnlock={unlockUser}
        onDebugState={debugState}
        onClearData={clearAllData}
        onCheckLimit={checkLimit}
        onResetInteractionState={resetInteractionState}
      />
    </div>
  );
};

export default Index;
