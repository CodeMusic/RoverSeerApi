
import { useChatSessions } from "@/hooks/useChatSessions";
import { useNarrativeSessions } from "@/hooks/useNarrativeSessions";
import { narrativeApi } from "@/lib/narrativeApi";
import { useTherapySessions } from "@/hooks/useTherapySessions";
import { BaseLayout } from "@/components/common/BaseLayout";
import { PreMusaiPage } from "@/components/common/PreMusaiPage";
import { SearchLayout } from "@/components/search/SearchLayout";
import { ChatPane } from "@/components/chat/ChatPane";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useCallback, useState } from "react";
import { AllSessions } from "@/types/chat";
import { APP_TERMS } from "@/config/constants";
import { ROUTES } from "@/config/routes";
import { prepareFileData } from '@/utils/fileOperations';
import { eyeApi } from '@/lib/eyeApi';
import { medicalApi } from '@/lib/medicalApi';
import { PreMusaiPageType } from "@/components/common/PreMusaiPage";
import NarrativePanel from "@/components/narrative/NarrativePanel";
import TherapyPanel from "@/components/therapy/TherapyPanel";
import { NarrativeSidebar, ConceptSeedingPanel, CharacterCreationPanel, ArcGenerationPanel, SceneRunner } from "@/components/narrative";
import PortalEffect from "@/components/effects/PortalEffect";
import VictoryModal from "@/components/common/VictoryModal";
import { CodeMusaiLayout } from "@/components/code/CodeMusaiLayout";

const Index = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const hasSentInitialMessage = useRef(false);
  const initialMessageKey = useRef<string | null>(null);
  
  // Navigation and layout state
  const navigate = useNavigate();
  const [isNavigationExpanded, setIsNavigationExpanded] = useState(false);
  const [portalPhase, setPortalPhase] = useState<'enter' | 'leave' | 'none'>('none');
  // When true, bypasses PreMusai and shows Chat UI immediately while session is being prepared/sent
  const [forceChatUI, setForceChatUI] = useState<boolean>(false);
  const [showVictory, setShowVictory] = useState<boolean>(false);
  const [isCreatingNarrative, setIsCreatingNarrative] = useState<boolean>(false);
  const [isProcessingMedical, setIsProcessingMedical] = useState<boolean>(false);
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
  // Animate leave/enter when tab changes and sync URL ?mode=...
  const handleTabChange = (nextTab: string) => {
    if (nextTab === currentTab) return setPortalPhase('none');
    // Map tab id → mode query param for deep-linking and content loaders
    const tabToMode: Record<string, string> = {
      [APP_TERMS.TAB_CHAT]: 'chat',
      [APP_TERMS.TAB_SEARCH]: 'search',
      [APP_TERMS.TAB_CODE]: 'code',
      [APP_TERMS.TAB_UNIVERSITY]: 'university',
      [APP_TERMS.TAB_NARRATIVE]: 'narrative',
      [APP_TERMS.TAB_CAREER]: 'career',
      [APP_TERMS.TAB_THERAPY]: 'therapy',
      [APP_TERMS.TAB_EYE]: 'eye',
      [APP_TERMS.TAB_TASK]: 'task',
    };
    const mode = tabToMode[nextTab] || 'chat';
    setPortalPhase('leave');
    setTimeout(() => {
      setPortalPhase('enter');
      setCurrentTab(nextTab);
      // Replace URL mode to keep PreMusai/content loaders in sync
      const params = new URLSearchParams(location.search);
      params.set('mode', mode);
      navigate({ pathname: location.pathname, search: `?${params.toString()}` }, { replace: true });
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
    createNewSessionFromSummary,
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
    updateTherapyContext,
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
      case APP_TERMS.TAB_MEDICAL:
        // Medical flows do not use chat sessions yet; force PreMusai
        return null;
      case APP_TERMS.TAB_EYE:
        // Eye of Musai uses a specialized PreMusai panel with image tools
        return null;
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

  // Regenerate framework on demand (from ConceptSeedingPanel Regenerate button)
  useEffect(() => {
    const onRegen = async () => {
      try {
        const ns = getCurrentNarrativeSession();
        if (!ns) return;
        const seed = (ns as any)?.storyData?.seedText as string | undefined;
        const mode = (ns as any)?.storyData?.concept?.mode || 'general';
        if (!seed || !seed.trim()) {
          alert('No seed text available to regenerate.');
          return;
        }
        setIsCreatingNarrative(true);
        const framework = await narrativeApi.getFramework({ seedText: seed, mode });
        updateNarrative(ns.id, {
          concept: {
            title: framework.title,
            description: framework.description,
            emotionalTone: 'neutral',
            genre: 'drama'
          },
          acts: framework.acts.map(a => ({ ...a, scenes: (a as any).scenes || [] })),
        });
        renameNarrative(ns.id, framework.title);
      } catch (e) {
        console.warn('Regenerate framework failed', e);
        alert('Failed to regenerate framework.');
      } finally {
        setIsCreatingNarrative(false);
      }
    };
    window.addEventListener('musai-regenerate-framework', onRegen as EventListener);
    return () => window.removeEventListener('musai-regenerate-framework', onRegen as EventListener);
  }, [getCurrentNarrativeSession, updateNarrative, renameNarrative]);

  const renderRightSidebar = () => {
    if (!currentSession) {
      return null;
    }
    // Therapy: show Narrative panel pop-in
    if (currentTab === APP_TERMS.TAB_THERAPY) {
      if (showNarrativePanel) {
        return <NarrativePanel mode="therapy" />;
      }
      if (currentSession.type === 'therapy') {
        return <TherapyPanel session={currentSession} onUpdateContext={(id, ctx) => updateTherapyContext(id, ctx)} />;
      }
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

  // Narrative workspace: left sidebar override and main content for narrative tab
  const [narrativeStep, setNarrativeStep] = useState<'concept' | 'characters' | 'arc' | 'scenes'>('concept');
  const [showNarrativeWizard, setShowNarrativeWizard] = useState(false);
  const [lastFrameworkSeed, setLastFrameworkSeed] = useState<string | null>(null);
  const [frameworkError, setFrameworkError] = useState<string | null>(null);

  // helper to fetch framework from n8n
  const fetchFramework = useCallback(async (seed: string) => {
    try {
      console.log('[Narrative] Fetching framework from n8n with payload:', { seedText: seed, mode: 'general' });
      const framework = await narrativeApi.getFramework({ seedText: seed, mode: 'general' });
      console.log('[Narrative] Framework received');
      const created = getCurrentNarrativeSession();
      if (!created) return;
      updateNarrative(created.id, {
        concept: {
          title: framework.title,
          description: framework.description,
          emotionalTone: 'neutral',
          genre: 'drama'
        },
        acts: framework.acts.map((a: any) => ({ ...a, scenes: a.scenes || [] })),
      });
      renameNarrative(created.id, framework.title);
      setFrameworkError(null);
    } catch (err: any) {
      console.warn('[Narrative] Framework fetch failed', err);
      setFrameworkError(err?.message || 'Failed to fetch framework');
    }
  }, [getCurrentNarrativeSession, updateNarrative, renameNarrative]);

  useEffect(() => {
    if (currentTab === APP_TERMS.TAB_NARRATIVE)
    {
      // Initialize step based on available storyData
      const ns = getCurrentNarrativeSession();
      if (ns?.storyData?.acts?.length > 0)
      {
        setNarrativeStep('scenes');
      }
      else if (ns?.storyData?.characters?.length > 1)
      {
        setNarrativeStep('arc');
      }
      else if (ns?.storyData?.concept)
      {
        setNarrativeStep('characters');
      }
      else
      {
        setNarrativeStep('concept');
      }
    }
  }, [currentTab, narrativeCurrentSessionId]);

  const renderLeftSidebarOverride = () => {
    // Hide chat sidebar for curated search UI
    if (currentTab === APP_TERMS.TAB_SEARCH) {
      return <></>;
    }
    if (currentTab !== APP_TERMS.TAB_NARRATIVE) {
      return null;
    }
    const hasNarrative = Boolean(getCurrentNarrativeSession());
    if (!hasNarrative) {
      // Hide sidebar until a narrative is created (PreMusai stage)
      return null;
    }
    return (
      <NarrativeSidebar
        sessions={narrativeSessions}
        currentSessionId={narrativeCurrentSessionId}
        isSidebarOpen={true}
        isCollapsed={false}
        onNewNarrative={() => {
          // Open the PreMusai wizard instead of creating immediately
          setNarrativeCurrentSessionId('');
          setShowNarrativeWizard(true);
        }}
        onSessionSelect={(id) => setNarrativeCurrentSessionId(id)}
        onDeleteSession={deleteNarrative}
        onRenameSession={renameNarrative}
        onToggleFavorite={toggleNarrativeFavorite}
        onToggleCollapse={() => { /* noop for now */ }}
        currentStep={narrativeStep}
        onStepChange={setNarrativeStep}
      />
    );
  };

  // Unified sendMessage function that handles different session types
  const sendMessage = useCallback(async (input: string, file?: File) => {
    switch (currentTab) {
      case APP_TERMS.TAB_THERAPY:
        await sendTherapyMessage(input, file);
        return;
      case APP_TERMS.TAB_CAREER:
        // For now, career uses the same as chat
        await sendChatMessage(input, file);
        return;
      case APP_TERMS.TAB_NARRATIVE:
        // Narrative sessions don't have direct message sending
        console.log('Narrative sessions use different message handling');
        return;
      case APP_TERMS.TAB_EYE:
        // Eye: route to confirmation pages with payload; those pages call n8n
        if (file) {
          const imageData = await prepareFileData(file);
          if (input && input.startsWith('TRAIN:')) {
            const prompt = input.substring('TRAIN:'.length).trim() || undefined;
            navigate(ROUTES.EYE_TRAIN, { state: { payload: { prompt, images: [{ ...imageData }] }, preview: imageData } });
          } else {
            navigate(ROUTES.EYE_RECOGNIZE, { state: { payload: { image: imageData }, preview: imageData } });
          }
          return;
        }
        if (input && input.trim()) {
          navigate(ROUTES.EYE_TRAIN, { state: { payload: { prompt: input.trim() } } });
          return;
        }
        return;
      default:
        await sendChatMessage(input, file);
        return;
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
    // For MusaiSearch, handle initial query within SearchLayout; do not auto-send via chat
    if (currentTab === APP_TERMS.TAB_SEARCH) {
      return;
    }
    // Show victory modal if arriving from RiddleGate success
    const victoryQuery = searchParams.get('victory') === '1';
    const justUnlocked = Boolean((location.state as any)?.justUnlocked);
    const hasShown = localStorage.getItem('musai-victory-shown') === 'true';
    if ((victoryQuery || justUnlocked) && !hasShown)
    {
      setShowVictory(true);
      // Enable debug bicamera agent flow temporarily in beta
      localStorage.setItem('musai-debug-bicamera', 'true');
      localStorage.setItem('musai-victory-shown', 'true');
    }

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

  // Handle any initialQuery/q passed via URL or navigation state (e.g., after RiddleGate unlock)
  useEffect(() => {
    const stateAny = location.state as any;
    const queryParam = searchParams.get('q');
    const stateQuery = stateAny?.initialQuery;
    const initialMessage = (stateQuery || queryParam || '').trim();

    if (!initialMessage || hasSentInitialMessage.current) {
      return;
    }

    const messageKey = `${currentTab}-${initialMessage}`;
    const wasAlreadySent = localStorage.getItem(`sent_initial_${messageKey}`) === 'true';
    if (wasAlreadySent) {
      return;
    }

    hasSentInitialMessage.current = true;
    initialMessageKey.current = messageKey;
    localStorage.setItem(`sent_initial_${messageKey}`, 'true');

    if (currentTab === APP_TERMS.TAB_NARRATIVE)
    {
      // New flow: Seed → Framework; do NOT create yet
      setIsCreatingNarrative(true);
      createNewNarrative();
      // Navigate to Concept immediately; show composing overlay while fetching
      setNarrativeStep('concept');
      setTimeout(async () => {
        try {
          const created = getCurrentNarrativeSession();
          if (!created) return;
          // Fetch framework from n8n
          const framework = await narrativeApi.getFramework({ seedText: initialMessage, mode: 'general' });
          // Populate local session with editable framework
          updateNarrative(created.id, {
            seedText: initialMessage,
            concept: {
              title: framework.title,
              description: framework.description,
              emotionalTone: 'neutral',
              genre: 'drama'
            },
            acts: framework.acts.map(a => ({ ...a, scenes: (a as any).scenes || [] })),
            characters: []
          });
          renameNarrative(created.id, framework.title);
        } catch (e) {
          console.warn('Failed to get framework via n8n', e);
          // Fall back to concept step for manual editing
          const created = getCurrentNarrativeSession();
          if (created) {
            updateNarrative(created.id, {
              concept: {
                title: initialMessage,
                description: '',
                emotionalTone: 'neutral',
                genre: 'drama'
              }
            });
            setNarrativeStep('concept');
          }
        } finally {
          setIsCreatingNarrative(false);
        }
      }, 0);
      return;
    }
    if (currentTab === APP_TERMS.TAB_MEDICAL)
    {
      // Show processing screen, then call n8n in background
      setIsProcessingMedical(true);
      setTimeout(async () => {
        try {
          const trimmed = initialMessage;
          if (trimmed) {
            await medicalApi.startIntake({ concern: trimmed });
          }
        } catch (e) {
          console.warn('Medical intake failed', e);
        } finally {
          setIsProcessingMedical(false);
        }
      }, 0);
      return;
    }
    // Task/AgileMusai: go to dedicated console with spinner and n8n call
    if (currentTab === APP_TERMS.TAB_TASK)
    {
      navigate(ROUTES.TASK_MUSAI_CONSOLE, { state: { initialRequest: initialMessage } });
      return;
    }

    // Non-narrative/non-task: ensure chat UI while session spins and message is sent
    setForceChatUI(true);
    const existingSession = getCurrentSessionForTab();
    if (!existingSession) {
      handleNewSession();
      setTimeout(() => {
        sendInitialMessage(initialMessage);
      }, 150);
    } else {
      sendInitialMessage(initialMessage);
    }
  }, [location.search, location.state, currentTab]);

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
  const handleNewSession = async () => {
    switch (currentTab) {
      case APP_TERMS.TAB_CAREER:
        return createNewCareerSession();
      case APP_TERMS.TAB_NARRATIVE: {
        // Show PreMusai first; when user submits, we call n8n to create a narrative
        // This path is handled via PreMusai onSubmit below
        return createNewNarrative();
      }
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
    // Dedicated CodeMusai playground UI
    if (currentTab === APP_TERMS.TAB_CODE) {
      return (
        <CodeMusaiLayout onClose={() => handleTabChange(APP_TERMS.TAB_CHAT)} />
      );
    }
    // Dedicated curated search UI (non-chat)
    if (currentTab === APP_TERMS.TAB_SEARCH) {
      const stateAny = location.state as any;
      const initialQuery = (stateAny?.initialQuery || searchParams.get('q') || '').trim();
      return (
        <SearchLayout 
          onClose={() => handleTabChange(APP_TERMS.TAB_CHAT)} 
          initialQuery={initialQuery || undefined}
        />
      );
    }
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
        case APP_TERMS.TAB_MEDICAL: return 'medical';
        case APP_TERMS.TAB_EYE: return 'eye';
        case APP_TERMS.TAB_TASK: return 'task';
        default: return 'chat';
      }
    };

    // Check if we should show PreMusai page (no session for this tab or empty session)
    const shouldShowPreMusai = !forceChatUI && (!currentSession || !('messages' in currentSession) || currentSession.messages.length === 0);

    // All Musai features should work within the unified app - no redirects!

    // Show PreMusai page for any tab without a current session (except narrative which uses its own flow)
    if (shouldShowPreMusai && currentTab !== APP_TERMS.TAB_NARRATIVE) {
      // Medical: show processing screen when active
      if (currentTab === APP_TERMS.TAB_MEDICAL && isProcessingMedical) {
        return (
          <div className="flex items-center justify-center h-full" aria-live="polite" aria-busy="true">
            <div className="flex items-center">
              <div className="w-8 h-8 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
              <span className="ml-3 text-sm text-muted-foreground">Preparing MedicalMusai via n8n…</span>
            </div>
          </div>
        );
      }
      return (
        <PreMusaiPage
          type={getPreMusaiType()}
          onSubmit={(input, file) => {
            // Special handling for Medical: go to UI and call n8n in background
            if (currentTab === APP_TERMS.TAB_MEDICAL) {
              setIsProcessingMedical(true);
              setTimeout(async () => {
                try {
                  const trimmed = (input || '').trim();
                  if (file) {
                    const b64 = await file.arrayBuffer().then(buf =>
                      `data:${file.type};base64,` + btoa(String.fromCharCode(...new Uint8Array(buf)))
                    );
                    await medicalApi.ingestDocuments({ files: [{ name: file.name, type: file.type, data: b64 }] });
                  }
                  if (trimmed) {
                    await medicalApi.startIntake({ concern: trimmed });
                  }
                } catch (e) {
                  console.warn('Medical intake/doc ingest failed', e);
                } finally {
                  setIsProcessingMedical(false);
                }
              }, 0);
              return;
            }

            if (!currentSession) {
              handleNewSession();
              // Wait for session creation then send message
              setTimeout(() => sendMessage(input, file), 100);
            } else {
              sendMessage(input, file);
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

    // Narrative workspace main content
    if (currentTab === APP_TERMS.TAB_NARRATIVE)
    {
      const ns = getCurrentNarrativeSession();
      if (!ns)
      {
        // No session yet: show PreMusai for narrative.
        // On submit: immediately open the editor by creating a local session and show a spinner
        // while we call n8n in the background to fetch the official summary/title/id.
        return (
          <div className="relative">
            <PreMusaiPage
              type="narrative"
              onSubmit={async (seed: string) => {
                try {
                  console.log('[Narrative] PreMusai submit received, seed length=', (seed || '').length);
                  setIsCreatingNarrative(true);
                  createNewNarrative();

                  // Poll for newly created session (state updates are async)
                  const wait = (ms: number) => new Promise(res => setTimeout(res, ms));
                  let created = getCurrentNarrativeSession();
                  for (let attempt = 0; attempt < 15 && !created; attempt++) {
                    await wait(50);
                    created = getCurrentNarrativeSession();
                  }

                  if (!created) {
                    console.warn('[Narrative] Failed to locate newly created session');
                    setIsCreatingNarrative(false);
                    return;
                  }

                  // Navigate to Concept immediately and store the seed
                  const effectiveSeed = (seed || '').trim();
                  setNarrativeStep('concept');
                  updateNarrative(created.id, { seedText: effectiveSeed });
                  setLastFrameworkSeed(effectiveSeed);

                  await fetchFramework(effectiveSeed);
                } catch (e) {
                  console.warn('Failed narrative bootstrap', e);
                } finally {
                  setIsCreatingNarrative(false);
                }
              }}
              isLoading={isCreatingNarrative}
            />
            {isCreatingNarrative && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-20" aria-live="polite" aria-busy="true">
                <div className="w-8 h-8 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                <span className="ml-3 text-sm text-muted-foreground">Musai is composing…</span>
              </div>
            )}
            {frameworkError && (
              <div className="absolute inset-x-0 bottom-6 z-20 flex items-center justify-center">
                <div className="px-4 py-2 rounded-md border bg-card shadow-sm flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{frameworkError}</span>
                  <button
                    className="px-3 py-1 rounded bg-primary text-primary-foreground text-xs"
                    onClick={async () => {
                      if (lastFrameworkSeed) {
                        setIsCreatingNarrative(true);
                        await fetchFramework(lastFrameworkSeed);
                        setIsCreatingNarrative(false);
                      }
                    }}
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      }
      const update = (data: any) => updateNarrative(ns.id, data);
      const go = (step: typeof narrativeStep) => setNarrativeStep(step);
      const withOverlay = (content: React.ReactNode) => (
        <div className="relative">
          {content}
          {isCreatingNarrative && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-20" aria-live="polite" aria-busy="true">
              <div className="w-8 h-8 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
              <span className="ml-3 text-sm text-muted-foreground">Musai is composing…</span>
            </div>
          )}
        </div>
      );

      switch (narrativeStep)
      {
        case 'concept':
          return withOverlay(
            <ConceptSeedingPanel
              session={ns}
              onUpdate={update}
              onNext={() => go('characters')}
            />
          );
        case 'characters':
          return withOverlay(
            <CharacterCreationPanel
              session={ns}
              onBack={() => go('concept')}
              onUpdate={update}
              onNext={() => go('arc')}
            />
          );
        case 'arc':
          return withOverlay(
            <ArcGenerationPanel
              session={ns}
              onBack={() => go('characters')}
              onUpdate={update}
              onNext={() => go('scenes')}
            />
          );
        case 'scenes':
          return withOverlay(
            <SceneRunner
              session={ns}
              onBack={() => go('arc')}
              onUpdate={update}
            />
          );
        default:
          return null;
      }
    }

    // Show chat pane for sessions with messages (Chat, Career, Task, Therapy)
    if ('messages' in currentSession) {
      // Map tab to module for theming/behavior
      const tabToModule: Record<string, 'therapy' | 'chat' | 'code' | 'university' | 'career' | 'search' | 'narrative' | 'task' | 'eye'> = {
        [APP_TERMS.TAB_THERAPY]: 'therapy',
        [APP_TERMS.TAB_CHAT]: 'chat',
        [APP_TERMS.TAB_CODE]: 'code',
        [APP_TERMS.TAB_UNIVERSITY]: 'university',
        [APP_TERMS.TAB_CAREER]: 'career',
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
          onMessageSend={async (text, file) => { await sendMessage(text, file); }}
          isTyping={isTyping}
          isLoading={isLoading}
        />
      );
    }

    // If we are forcing chat UI but messages not yet present, show an empty chat pane (booting session)
    if (forceChatUI) {
      const moduleByTab: Record<string, 'therapy' | 'chat' | 'code' | 'university' | 'career' | 'search' | 'narrative' | 'task' | 'eye'> = {
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
      const module = moduleByTab[currentTab] ?? 'chat';
      return (
        <ChatPane
          sessionId={currentSession?.id || ''}
          module={module}
          roleConfig={{ user: 'You', assistant: 'Musai' }}
          messageList={[]}
          onMessageSend={async (text, file) => { await sendMessage(text, file); }}
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
      <VictoryModal isOpen={showVictory} onOpenChange={setShowVictory} />
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
      renderLeftSidebarOverride={renderLeftSidebarOverride}
      onTabChange={handleTabChange}
      isNavigationExpanded={isNavigationExpanded}
      onToggleNavigation={() => setIsNavigationExpanded(!isNavigationExpanded)}
      
      // Expand left sidebar once after narrative is created
      expandLeftSidebarOnce={currentTab === APP_TERMS.TAB_NARRATIVE && Boolean(getCurrentNarrativeSession())}
      />
    </div>
  );
};

export default Index;
