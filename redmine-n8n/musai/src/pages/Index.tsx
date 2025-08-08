
import { useChatSessions } from "@/hooks/useChatSessions";
import { useNarrativeSessions } from "@/hooks/useNarrativeSessions";
import { useTherapySessions } from "@/hooks/useTherapySessions";
import { BaseLayout } from "@/components/common/BaseLayout";
import { PreMusaiPage } from "@/components/common/PreMusaiPage";
import { ChatPane } from "@/components/Chat/ChatPane";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useCallback, useState } from "react";
import { AllSessions } from "@/types/chat";
import { APP_TERMS } from "@/config/constants";
import { PreMusaiPageType } from "@/components/common/PreMusaiPage";
import NarrativePanel from "@/components/narrative/NarrativePanel";
import PortalEffect from "@/components/effects/PortalEffect";

const Index = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const hasSentInitialMessage = useRef(false);
  const initialMessageKey = useRef<string | null>(null);
  
  // Navigation and layout state
  const navigate = useNavigate();
  const [isNavigationExpanded, setIsNavigationExpanded] = useState(false);
  const [portalPhase, setPortalPhase] = useState<'enter' | 'leave' | 'none'>('none');
  const [currentTab, setCurrentTab] = useState<string>(
    location.state?.switchToTab || 
    (searchParams.get('mode') === 'search' ? APP_TERMS.TAB_SEARCH :
     searchParams.get('mode') === 'code' ? APP_TERMS.TAB_CODE :
     searchParams.get('mode') === 'narrative' ? APP_TERMS.TAB_NARRATIVE :
     searchParams.get('mode') === 'university' ? APP_TERMS.TAB_UNIVERSITY :
     searchParams.get('mode') === 'career' ? APP_TERMS.TAB_CAREER :
     searchParams.get('mode') === 'therapy' ? APP_TERMS.TAB_THERAPY :
     searchParams.get('mode') === 'eye' ? APP_TERMS.TAB_EYE :
     APP_TERMS.TAB_CHAT)
  );
  // Animate leave/enter when tab changes
  const handleTabChange = (nextTab: string) => {
    if (nextTab === currentTab) return setPortalPhase('none');
    setPortalPhase('leave');
    setTimeout(() => {
      setPortalPhase('enter');
      setCurrentTab(nextTab);
      setTimeout(() => setPortalPhase('none'), 700);
    }, 250);
  };
  const {
    sessions,
    currentSessionId,
    isLoading,
    isTyping,
    createNewSession,
    createNewCareerSession,
    deleteSession,
    renameSession,
    toggleFavorite,
    updateCareerContext,
    sendMessage: sendChatMessage,
    setCurrentSessionId,
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

  const {
    sessions: therapySessions,
    currentSessionId: therapyCurrentSessionId,
    isLoading: therapyIsLoading,
    isTyping: therapyIsTyping,
    createNewSession: createNewTherapy,
    deleteSession: deleteTherapy,
    renameSession: renameTherapy,
    toggleFavorite: toggleTherapyFavorite,
    sendMessage: sendTherapyMessage,
    setCurrentSessionId: setTherapyCurrentSessionId,
    getCurrentSession: getCurrentTherapySession,
  } = useTherapySessions();





  // Reset the ref when location changes (new navigation)
  useEffect(() => {
    hasSentInitialMessage.current = false;
    initialMessageKey.current = null;
  }, [location.state]);

  // Handle tab changes - clear current session when switching to incompatible tab
  useEffect(() => {
    const currentSession = getCurrentSessionForTab();
    if (!currentSession) {
      // If no session for this tab, clear current session IDs
      if (currentTab === APP_TERMS.TAB_NARRATIVE) {
        setNarrativeCurrentSessionId("");
      } else {
        setCurrentSessionId("");
      }
    }
  }, [currentTab]);

  // Combine all sessions for unified session management
  const allSessions: AllSessions[] = [
    ...sessions,
    ...narrativeSessions,
    ...therapySessions
  ];

  // Get current session based on tab
  const getCurrentSessionForTab = () => {
    switch (currentTab) {
      case APP_TERMS.TAB_CHAT:
        return sessions.find(s => s.id === currentSessionId && s.type === 'chat');
      case APP_TERMS.TAB_CAREER:
        return sessions.find(s => s.id === currentSessionId && s.type === 'career');
      case APP_TERMS.TAB_NARRATIVE:
        return narrativeSessions.find(s => s.id === narrativeCurrentSessionId);
      case APP_TERMS.TAB_THERAPY:
        return therapySessions.find(s => s.id === therapyCurrentSessionId);
      case APP_TERMS.TAB_SEARCH:
        // For now, search uses chat-like sessions but we can distinguish them later
        return sessions.find(s => s.id === currentSessionId);
      case APP_TERMS.TAB_TASK:
        // For now, task uses chat-like sessions but we can distinguish them later
        return sessions.find(s => s.id === currentSessionId);
      case APP_TERMS.TAB_CODE:
      case APP_TERMS.TAB_UNIVERSITY:
        // These features might not have traditional sessions yet
        return null;
      default:
        return sessions.find(s => s.id === currentSessionId);
    }
  };

  const currentSession = getCurrentSessionForTab();

  // Right sidebar rendering per tool (properties, etc.)
  const [showNarrativePanel, setShowNarrativePanel] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      // Open narrative panel when export is requested
      setShowNarrativePanel(true);
    };
    window.addEventListener('musai-export-to-narrative', handler as EventListener);
    return () => window.removeEventListener('musai-export-to-narrative', handler as EventListener);
  }, []);

  const renderRightSidebar = () => {
    if (!currentSession) {
      return null;
    }
    // Therapy: show Narrative panel pop-in
    if (currentTab === APP_TERMS.TAB_THERAPY && showNarrativePanel) {
      return <NarrativePanel mode="therapy" />;
    }
    if (currentTab === APP_TERMS.TAB_CAREER && currentSession.type === 'career') {
      // Simple properties panel for career context
      return (
        <div className="h-full p-4 space-y-4 overflow-y-auto">
          <div className="font-semibold">Career Properties</div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Current Role</label>
            <input
              className="w-full border rounded px-2 py-1 bg-background"
              value={currentSession.careerContext?.currentRole || ''}
              onChange={(e) => renameSession(currentSession.id, currentSession.name || e.target.value)}
              placeholder="e.g., Frontend Engineer"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Target Role</label>
            <input
              className="w-full border rounded px-2 py-1 bg-background"
              value={currentSession.careerContext?.targetRole || ''}
              onChange={(e) => updateCareerContext(currentSession.id, { targetRole: e.target.value })}
              placeholder="e.g., Staff Engineer"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Location</label>
            <input
              className="w-full border rounded px-2 py-1 bg-background"
              value={currentSession.careerContext?.location || ''}
              onChange={(e) => updateCareerContext(currentSession.id, { location: e.target.value })}
              placeholder="e.g., Remote / NYC"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Skills</label>
            <input
              className="w-full border rounded px-2 py-1 bg-background"
              value={(currentSession.careerContext?.skills || []).join(', ')}
              onChange={(e) => updateCareerContext(currentSession.id, { skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              placeholder="e.g., React, TypeScript, GraphQL"
            />
          </div>
        </div>
      );
    }
    return null;
  };

  // Unified sendMessage function that handles different session types
  const sendMessage = useCallback(async (input: string, file?: File) => {
    switch (currentTab) {
      case APP_TERMS.TAB_THERAPY:
        return await sendTherapyMessage(input, file);
      case APP_TERMS.TAB_CAREER:
        // For now, career uses the same as chat
        return await sendChatMessage(input, file);
      case APP_TERMS.TAB_NARRATIVE:
        // Narrative sessions don't have direct message sending
        console.log('Narrative sessions use different message handling');
        return;
      default:
        return await sendChatMessage(input, file);
    }
  }, [currentTab, sendTherapyMessage, sendChatMessage]);

  // Create a stable callback for sending the initial message
  const sendInitialMessage = useCallback((message: string) => {
    const currentSession = getCurrentSessionForTab();
    if (currentSession) {
      sendMessage(message);
    }
  }, [getCurrentSessionForTab, sendMessage]);

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

  // Handle session selection based on tab
  const handleSessionSelect = (sessionId: string) => {
    const session = allSessions.find(s => s.id === sessionId);
    if (!session) return;

    switch (session.type) {
      case 'chat':
      case 'career':
        setCurrentSessionId(sessionId);
        break;
      case 'narrative':
        setNarrativeCurrentSessionId(sessionId);
        break;
      case 'therapy':
        setTherapyCurrentSessionId(sessionId);
        break;
      default:
        setCurrentSessionId(sessionId);
    }
  };

  // Handle new session creation based on tab
  const handleNewSession = () => {
    switch (currentTab) {
      case APP_TERMS.TAB_CAREER:
        return createNewCareerSession();
      case APP_TERMS.TAB_NARRATIVE:
        return createNewNarrative();
      case APP_TERMS.TAB_THERAPY:
        return createNewTherapy();
      default:
        return createNewSession();
    }
  };

  // Handle session deletion based on tab
  const handleDeleteSession = (sessionId: string) => {
    const session = allSessions.find(s => s.id === sessionId);
    if (!session) return;

    switch (session.type) {
      case 'chat':
      case 'career':
        deleteSession(sessionId);
        break;
      case 'narrative':
        deleteNarrative(sessionId);
        break;
      case 'therapy':
        deleteTherapy(sessionId);
        break;
      default:
        deleteSession(sessionId);
    }
  };

  // Handle session rename based on tab
  const handleRenameSession = (sessionId: string, newName: string) => {
    const session = allSessions.find(s => s.id === sessionId);
    if (!session) return;

    switch (session.type) {
      case 'chat':
      case 'career':
        renameSession(sessionId, newName);
        break;
      case 'narrative':
        renameNarrative(sessionId, newName);
        break;
      case 'therapy':
        renameTherapy(sessionId, newName);
        break;
      default:
        renameSession(sessionId, newName);
    }
  };

  // Handle toggle favorite based on tab
  const handleToggleFavorite = (sessionId: string) => {
    const session = allSessions.find(s => s.id === sessionId);
    if (!session) return;

    switch (session.type) {
      case 'chat':
      case 'career':
        toggleFavorite(sessionId);
        break;
      case 'narrative':
        toggleNarrativeFavorite(sessionId);
        break;
      case 'therapy':
        toggleTherapyFavorite(sessionId);
        break;
      default:
        toggleFavorite(sessionId);
    }
  };

  // Render main content based on current tab and session
  const renderMainContent = () => {
    // Map tab to PreMusai type
    const getPreMusaiType = (): PreMusaiPageType => {
      switch (currentTab) {
        case APP_TERMS.TAB_CHAT: return 'chat';
        case APP_TERMS.TAB_SEARCH: return 'search';
        case APP_TERMS.TAB_CODE: return 'code';
        case APP_TERMS.TAB_UNIVERSITY: return 'university';
        case APP_TERMS.TAB_NARRATIVE: return 'narrative';
        case APP_TERMS.TAB_CAREER: return 'career';
        case APP_TERMS.TAB_THERAPY: return 'therapy';
        case APP_TERMS.TAB_EYE: return 'eye';
        case APP_TERMS.TAB_TASK: return 'task';
        default: return 'chat';
      }
    };

    // Check if we should show PreMusai page (no session for this tab or empty session)
    const shouldShowPreMusai = !currentSession || !('messages' in currentSession) || currentSession.messages.length === 0;

    // All Musai features should work within the unified app - no redirects!

    // Show PreMusai page for any tab without a current session
    if (shouldShowPreMusai) {
      return (
        <PreMusaiPage
          type={getPreMusaiType()}
          onSubmit={(input) => {
            if (!currentSession) {
              handleNewSession();
              // Wait for session creation then send message
              setTimeout(() => sendMessage(input), 100);
            } else {
              sendMessage(input);
            }
          }}
          onQuickAction={(actionId, actionType, actionData) => {
            console.log('Quick action:', actionId, actionType, actionData);
            if (actionData) {
              if (!currentSession) {
                handleNewSession();
                setTimeout(() => sendMessage(actionData), 100);
              } else {
                sendMessage(actionData);
              }
            }
          }}
          isLoading={isTyping}
        />
      );
    }

    // Show chat pane for sessions with messages (Chat, Career, Search, Narrative, Task, Therapy)
    if ('messages' in currentSession) {
      // Map tab to module for theming/behavior
      const tabToModule: Record<string, 'therapy' | 'chat' | 'code' | 'university' | 'career' | 'search' | 'narrative' | 'task' | 'eye'> = {
        [APP_TERMS.TAB_THERAPY]: 'therapy',
        [APP_TERMS.TAB_CHAT]: 'chat',
        [APP_TERMS.TAB_CODE]: 'code',
        [APP_TERMS.TAB_UNIVERSITY]: 'university',
        [APP_TERMS.TAB_CAREER]: 'career',
        [APP_TERMS.TAB_SEARCH]: 'search',
        [APP_TERMS.TAB_NARRATIVE]: 'narrative',
        [APP_TERMS.TAB_TASK]: 'task',
        [APP_TERMS.TAB_EYE]: 'eye',
      };
      const module = tabToModule[currentTab] ?? 'chat';

      return (
        <ChatPane
          sessionId={currentSession.id}
          module={module}
          roleConfig={{ user: 'You', assistant: 'Musai' }}
          messageList={currentSession.messages}
          onMessageSend={sendMessage}
          isTyping={isTyping}
          isLoading={isLoading}
        />
      );
    }

    // Fallback for any other session types
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">
          Content for {currentTab} coming soon...
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      <PortalEffect phase={portalPhase} />
      <BaseLayout
      currentTab={currentTab}
      sessions={allSessions}
      currentSessionId={currentSession?.id || ""}
      onNewSession={handleNewSession}
      onSessionSelect={handleSessionSelect}
      onDeleteSession={handleDeleteSession}
      onRenameSession={handleRenameSession}
      onToggleFavorite={handleToggleFavorite}
      renderMainContent={renderMainContent}
      renderRightSidebar={renderRightSidebar}
      onTabChange={handleTabChange}
      isNavigationExpanded={isNavigationExpanded}
      onToggleNavigation={() => setIsNavigationExpanded(!isNavigationExpanded)}
      />
    </div>
  );
};

export default Index;
