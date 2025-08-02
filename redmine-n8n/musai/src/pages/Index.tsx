
import { useChatSessions } from "@/hooks/useChatSessions";
import { useNarrativeSessions } from "@/hooks/useNarrativeSessions";
import { ChatLayout } from "@/components/chat/ChatLayout";
import { useLocation, useSearchParams } from "react-router-dom";
import { useEffect, useRef, useCallback } from "react";

const Index = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const hasSentInitialMessage = useRef(false);
  const initialMessageKey = useRef<string | null>(null);
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
    getCurrentSession,
    clearAllData,
    debugState,
  } = useChatSessions();

  const {
    sessions: narrativeSessions,
    currentSessionId: narrativeCurrentSessionId,
    isLoading: narrativeIsLoading,
    createNewSession: createNewNarrative,
    deleteSession: deleteNarrative,
    renameSession: renameNarrative,
    toggleFavorite: toggleNarrativeFavorite,
    updateNarrative,
    setCurrentSessionId: setNarrativeCurrentSessionId,
    getCurrentSession: getCurrentNarrativeSession,
  } = useNarrativeSessions();

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
        const messageKey = `${currentSessionId}-${initialMessage}`;
        
        // Check if this exact message was already sent for this session
        const wasAlreadySent = localStorage.getItem(`sent_initial_${messageKey}`) === 'true';
        
        if (!wasAlreadySent) {
          hasSentInitialMessage.current = true;
          initialMessageKey.current = messageKey;
          
          // Mark this message as sent
          localStorage.setItem(`sent_initial_${messageKey}`, 'true');
          
          // Use a longer delay to ensure the session is properly set and we can get its messages
          setTimeout(() => {
            sendInitialMessage(initialMessage);
          }, 200);
        } else {
          console.log('Initial message already sent for this session, skipping');
        }
      }
    } else if (location.state?.viewPastChats) {
      // User wants to view past chats
      // Don't auto-select - let user choose from sidebar
      // The sidebar will show available sessions for selection
    }
  }, [location.state, sessions, setCurrentSessionId, sendInitialMessage, currentSessionId]);

  // Reset the ref when location changes (new navigation)
  useEffect(() => {
    hasSentInitialMessage.current = false;
    initialMessageKey.current = null;
  }, [location.state]);

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
        initialTab={location.state?.switchToTab || (searchParams.get('mode') === 'search' ? 'musai-search' : undefined)}
        initialQuery={location.state?.initialQuery || searchParams.get('q')}
        // Narrative props
        narrativeSessions={narrativeSessions}
        narrativeCurrentSessionId={narrativeCurrentSessionId}
        onNewNarrative={createNewNarrative}
        onUpdateNarrative={updateNarrative}
        // Pass narrative session handlers
        onNarrativeSessionSelect={setNarrativeCurrentSessionId}
        onDeleteNarrativeSession={deleteNarrative}
        onRenameNarrativeSession={renameNarrative}
        onToggleNarrativeFavorite={toggleNarrativeFavorite}
      />
    </div>
  );
};

export default Index;
