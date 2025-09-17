
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
import { useEyeSessions } from "@/hooks/useEyeSessions";
import { APP_TERMS, CANONICAL_TOOL_ORDER } from "@/config/constants";
import { ROUTES } from "@/config/routes";
import { prepareFileData } from '@/utils/fileOperations';
import { eyeApi } from '@/lib/eyeApi';
import { medicalApi } from '@/lib/medicalApi';
import { PreMusaiPageType } from "@/components/common/PreMusaiPage";
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';
import NarrativePanel from "@/components/narrative/NarrativePanel";
import TherapyPanel from "@/components/therapy/TherapyPanel";
import { NarrativeSidebar, ConceptSeedingPanel, CharacterCreationPanel, ArcGenerationPanel, SceneRunner } from "@/components/narrative";
import PortalEffect from "@/components/effects/PortalEffect";
import VictoryModal from "@/components/common/VictoryModal";
import { CodeMusaiLayout } from "@/components/code/CodeMusaiLayout";
import { useDevSessions } from "@/hooks/useDevSessions";
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { useMusaiMood } from '@/contexts/MusaiMoodContext';
import { useCurationsAvailability } from '@/hooks/useCurationsAvailability';
import EyeWorkbenchPanel, { EyeWorkbenchSeed } from '@/components/eye/EyeWorkbenchPanel';
import { discoverMusaiModule, type MusaiDiscoverModule } from '@/lib/discoveryApi';

const Index = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const hasSentInitialMessage = useRef(false);
  const initialMessageKey = useRef<string | null>(null);
  const discoverPayloadRef = useRef<{ module: MusaiDiscoverModule | string; query: string } | null>(null);
  // Narrative state must be declared before any effects that reference it
  const [narrativeMode, setNarrativeMode] = useState<'tale' | 'story'>('tale');
  const [storyIdea, setStoryIdea] = useState<string | null>(null);
  const [storyInput, setStoryInput] = useState('');
  useEffect(() => {
    try
    {
      const raw = sessionStorage.getItem('musai-discover-payload');
      if (raw)
      {
        const parsed = JSON.parse(raw) as { module?: string; query?: string } | null;
        if (parsed && typeof parsed?.query === 'string')
        {
          const module = parsed.module ?? 'chat';
          discoverPayloadRef.current = { module, query: parsed.query };
          if (module === 'tale')
          {
            setNarrativeMode('tale');
          }
          if (module === 'story')
          {
            setNarrativeMode('story');
            setStoryIdea(parsed.query);
          }
        }
        sessionStorage.removeItem('musai-discover-payload');
      }
    }
    catch
    {
      discoverPayloadRef.current = null;
    }
  }, []);

  

  useEffect(() => {
    if (storyIdea)
    {
      setStoryInput(storyIdea);
    }
  }, [storyIdea]);
  
  // Navigation and layout state
  const navigate = useNavigate();
  const [isNavigationExpanded, setIsNavigationExpanded] = useState(false);
  const [portalPhase, setPortalPhase] = useState<'enter' | 'leave' | 'none'>('none');
  // When true, bypasses PreMusai and shows Chat UI immediately while session is being prepared/sent
  const [forceChatUI, setForceChatUI] = useState<boolean>(false);
  const [showVictory, setShowVictory] = useState<boolean>(false);
  const [isCreatingNarrative, setIsCreatingNarrative] = useState<boolean>(false);
  const [isProcessingMedical, setIsProcessingMedical] = useState<boolean>(false);
  const [eyePerceivePrompt, setEyePerceivePrompt] = useState<string | null>(null);
  const [eyeReflectPayload, setEyeReflectPayload] = useState<{ payload: any; preview: { data: string; mimeType: string; fileName?: string }; autoMagic?: boolean } | null>(null);
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
	// Keep currentTab in sync with navigation state and ?mode= when navigating from Topbar/DevConsole
	useEffect(() => {
		const stateAny = location.state as any;
		const stateTab = stateAny?.switchToTab as string | undefined;
		const mode = searchParams.get('mode');
		const modeToTab = (m?: string): string => {
			switch (m) {
				case 'search': return APP_TERMS.TAB_SEARCH;
				case 'code': return APP_TERMS.TAB_CODE;
				case 'narrative': return APP_TERMS.TAB_NARRATIVE;
				case 'university': return APP_TERMS.TAB_UNIVERSITY;
				case 'career': return APP_TERMS.TAB_CAREER;
				case 'therapy': return APP_TERMS.TAB_THERAPY;
				case 'eye': return APP_TERMS.TAB_EYE;
				case 'task': return APP_TERMS.TAB_TASK;
				case 'chat':
				default: return APP_TERMS.TAB_CHAT;
			}
		};
		const desiredTab = stateTab || modeToTab(mode || undefined);
		if (desiredTab && desiredTab !== currentTab) {
			// Use the unified handler to perform transitions and keep URL in sync
			handleTabChange(desiredTab);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [location.state, location.search]);
  // Animate leave/enter when tab changes and sync URL ?mode=...
  const handleTabChange = (nextTab: string) => {
    if (nextTab === currentTab) return setPortalPhase('none');
    // When navigating away from Eye, clear transient Eye prompts/payloads
    // to avoid auto-running Perceive/Reflect when returning later.
    if (currentTab === APP_TERMS.TAB_EYE && nextTab !== APP_TERMS.TAB_EYE)
    {
      setEyePerceivePrompt(null);
      setEyeReflectPayload(null);
    }
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
    }, 320);
  };
  const {
    sessions: devSessions,
    currentSessionId: devCurrentSessionId,
    createNewSession: createNewDevSession,
    deleteSession: deleteDevSession,
    renameSession: renameDevSession,
    toggleFavorite: toggleDevFavorite,
    updateSession: updateDevSession,
    setCurrentSessionId: setDevCurrentSessionId,
  } = useDevSessions();

  const getCurrentDevSession = () => devSessions.find(s => s.id === devCurrentSessionId);
  // Build ordered list of visible tools to support Cmd+number shortcuts
  const { isToolVisible } = useUserPreferences();
  const { isCareerMusaiActive } = useMusaiMood();
  const { isAvailable: curationsAvailable } = useCurationsAvailability();

  const tabIdToToolKey = (tabId: string): 'chat' | 'search' | 'code' | 'university' | 'narrative' | 'career' | 'therapy' | 'medical' | 'task' | 'eye' =>
  {
    switch (tabId)
    {
      case APP_TERMS.TAB_CHAT:
        return 'chat';
      case APP_TERMS.TAB_SEARCH:
        return 'search';
      case APP_TERMS.TAB_CODE:
        return 'code';
      case APP_TERMS.TAB_UNIVERSITY:
        return 'university';
      case APP_TERMS.TAB_NARRATIVE:
        return 'narrative';
      case APP_TERMS.TAB_CAREER:
        return 'career';
      case APP_TERMS.TAB_THERAPY:
        return 'therapy';
      case APP_TERMS.TAB_MEDICAL:
        return 'medical';
      case APP_TERMS.TAB_TASK:
        return 'task';
      case APP_TERMS.TAB_EYE:
        return 'eye';
      default:
        return 'chat';
    }
  };

  const orderedToolIds = useCallback(() => {
    const base = [
      APP_TERMS.TAB_CHAT,
      APP_TERMS.TAB_SEARCH,
      APP_TERMS.TAB_EYE,
      APP_TERMS.TAB_CODE,
      APP_TERMS.TAB_UNIVERSITY,
      APP_TERMS.TAB_NARRATIVE,
      APP_TERMS.TAB_THERAPY,
      APP_TERMS.TAB_MEDICAL,
    ].filter(id => isToolVisible(tabIdToToolKey(id)));

    const extra: string[] = [];
    if (isCareerMusaiActive && isToolVisible('career')) extra.push(APP_TERMS.TAB_CAREER);
    // Pseudo-ids for routes outside the main tab system
    extra.push('studio');
    if (curationsAvailable) extra.push('curations');
    if (isToolVisible('task')) extra.push(APP_TERMS.TAB_TASK);

    const unordered = [...base, ...extra];
    return unordered.sort((a, b) => CANONICAL_TOOL_ORDER.indexOf(a) - CANONICAL_TOOL_ORDER.indexOf(b));
  }, [isToolVisible, isCareerMusaiActive, curationsAvailable]);

  const navigateToTool = useCallback((toolId: string) => {
    // Handle pseudo-ids first
    if (toolId === 'curations')
    {
      navigate(ROUTES.CURATIONS);
      return;
    }
    if (toolId === 'studio')
    {
      navigate(ROUTES.MUSAI_STUDIO);
      return;
    }
    // For real tabs, set accent color via mood context if desired
    // Then switch tabs through the unified handler
    handleTabChange(toolId);
  }, [navigate]);

  // Global keyboard shortcuts: Ctrl + 1..0 - =
  useEffect(() => {
    // Use KeyboardEvent.code so Shift does not change matching ('!' vs '1')
    const codeSequence = ['Digit1','Digit2','Digit3','Digit4','Digit5','Digit6','Digit7','Digit8','Digit9','Digit0','Minus','Equal'];
    const numpadSequence = ['Numpad1','Numpad2','Numpad3','Numpad4','Numpad5','Numpad6','Numpad7','Numpad8','Numpad9','Numpad0'];
    const handler = (e: KeyboardEvent) => {
      // Require only Ctrl (not Meta/Alt) so it works across screens; allow Shift without affecting code matching
      if (!e.ctrlKey || e.metaKey || e.altKey) return;
      let idx = codeSequence.indexOf(e.code);
      if (idx === -1) {
        const np = numpadSequence.indexOf(e.code);
        if (np !== -1) idx = np; // map numpad 1..0 → 0..9
      }
      if (idx === -1) return;
      e.preventDefault();
      const tools = orderedToolIds();
      if (idx < tools.length)
      {
        const toolId = tools[idx];
        navigateToTool(toolId);
      }
    };
    // Capture phase to avoid being swallowed by nested editors/widgets
    document.addEventListener('keydown', handler, { capture: true } as AddEventListenerOptions);
    return () => document.removeEventListener('keydown', handler, { capture: true } as EventListenerOptions);
  }, [orderedToolIds, navigateToTool]);

  
  
  
  
  
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

  const {
    sessions: eyeSessions,
    currentSessionId: eyeCurrentSessionId,
    createNewSession: createNewEyeSession,
    deleteSession: deleteEyeSession,
    renameSession: renameEyeSession,
    toggleFavorite: toggleEyeFavorite,
    updateSession: updateEyeSession,
    setCurrentSessionId: setEyeCurrentSessionId,
    getCurrentSession: getCurrentEyeSession,
    appendPrompt: appendEyePrompt,
  } = useEyeSessions();





  // Reset the ref when location changes (new navigation)
  useEffect(() => {
    const statePayload = location.state as Record<string, unknown> | null;
    const hasInitialIntent = Boolean(
      statePayload && (
        'initialMessage' in statePayload ||
        'initialQuery' in statePayload ||
        'newSession' in statePayload ||
        'sessionId' in statePayload
      )
    );

    if (hasInitialIntent)
    {
      hasSentInitialMessage.current = false;
      initialMessageKey.current = null;
    }
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
    ...therapySessions,
    ...devSessions,
    ...eyeSessions,
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
        return eyeSessions.find(s => s.id === eyeCurrentSessionId);
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
        return <NarrativePanel mode="therapy" onClose={() => setShowNarrativePanel(false)} />;
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
    if (currentTab !== APP_TERMS.TAB_NARRATIVE || narrativeMode === 'story') {
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
          // Inline Reflect panel; prevent double-clicks by replacing pending state
          setEyeReflectPayload({ payload: { image: imageData }, preview: imageData });
          return;
        }
        if (input && input.trim()) {
          const text = input.trim();
          // Default: generating from text prompt
          const prompt = text.toUpperCase().startsWith('GENERATE:') ? text.substring('GENERATE:'.length).trim() : text;
          // In-app perceive panel instead of route navigation
          setEyePerceivePrompt(prompt);
          return;
        }
        return;
      default:
        await sendChatMessage(input, file);
        return;
    }
  }, [currentTab, sendTherapyMessage, sendChatMessage]);

  // Create a stable callback for sending the initial message
  const sendInitialMessage = useCallback(async (message: string) => {
    const first = getCurrentSessionForTab();
    // If no session or session is empty, prefer discovery-first flow
    const isFirstMessage = !first || (('messages' in first) && first.messages.length === 0);
    if (isFirstMessage) {
      const trimmed = (message || '').trim();
      if (trimmed) {
        try {
          const mod = await discoverMusaiModule(trimmed);
          // Switch to discovered tab and stash payload so module-specific view handles it
          const toTab: Record<string, string> = {
            search: APP_TERMS.TAB_SEARCH,
            research: APP_TERMS.TAB_SEARCH,
            tale: APP_TERMS.TAB_NARRATIVE,
            story: APP_TERMS.TAB_NARRATIVE,
            university: APP_TERMS.TAB_UNIVERSITY,
            eye: APP_TERMS.TAB_EYE,
            medical: APP_TERMS.TAB_MEDICAL,
            therapy: APP_TERMS.TAB_THERAPY,
            career: APP_TERMS.TAB_CAREER,
            code: APP_TERMS.TAB_CODE,
            agile: APP_TERMS.TAB_TASK,
            task: APP_TERMS.TAB_TASK,
            chat: APP_TERMS.TAB_CHAT,
          };
          handleTabChange(toTab[String(mod)] || APP_TERMS.TAB_CHAT);
          try { sessionStorage.setItem('musai-discover-payload', JSON.stringify({ module: mod, query: trimmed })); } catch {}
          // Also push ?q for views that read from URL
          const params = new URLSearchParams(location.search);
          params.set('q', trimmed);
          navigate({ pathname: location.pathname, search: `?${params.toString()}` }, { replace: true });
          return;
        } catch {
          // fall through to chat send
        }
      }
    }
    if (first) {
      await sendMessage(message);
    }
  }, [getCurrentSessionForTab, sendMessage, handleTabChange, navigate, location.search]);

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
      // Subtle entry overlay when arriving from the Veil
      setPortalPhase('enter');
      setTimeout(() => setPortalPhase('none'), 700);
    }

    if (location.state?.newSession) {
      // A new session was created from the landing page
      // The session is already created and selected by createNewSession()
      // We don't need to override the selection
      const rawInitialMessage = typeof location.state?.initialMessage === 'string'
        ? location.state.initialMessage.trim()
        : '';
      if (rawInitialMessage && initialMessageKey.current !== rawInitialMessage)
      {
        hasSentInitialMessage.current = false;
      }

      // If there's an initial message and we haven't sent it yet, send it automatically
      if (rawInitialMessage && !hasSentInitialMessage.current) {
        const sessionIdFromLanding = (location.state as any)?.sessionId as string | undefined;
        // Prefer the explicitly passed session id, if present
        if (sessionIdFromLanding) {
          setCurrentSessionId(sessionIdFromLanding);
        }
        // Ensure the chat UI renders instead of PreMusai while we send
        setForceChatUI(true);
        hasSentInitialMessage.current = true;
        initialMessageKey.current = rawInitialMessage;
        // Wait for the session to be visible in state, then send
        const attemptSend = async () => {
          const wait = (ms: number) => new Promise(res => setTimeout(res, ms));
          for (let i = 0; i < 20; i++) {
            const s = getCurrentSessionForTab();
            if (s && (!sessionIdFromLanding || s.id === sessionIdFromLanding)) {
              sendMessage(rawInitialMessage);
              return;
            }
            await wait(50);
          }
          // Fallback: attempt send anyway
          sendMessage(rawInitialMessage);
        };
        attemptSend();
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
    const storedDiscover = discoverPayloadRef.current;
    const stateQuery = stateAny?.initialQuery;
    const initialMessage = (stateQuery || queryParam || storedDiscover?.query || '').trim();

    if (!initialMessage) {
      return;
    }

    if (initialMessageKey.current !== initialMessage)
    {
      hasSentInitialMessage.current = false;
    }

    if (hasSentInitialMessage.current) {
      return;
    }

    // Consume the q param so refresh won't re-submit
    if (queryParam) {
      const params = new URLSearchParams(location.search);
      params.delete('q');
      // Preserve other params like mode/victory
      navigate({ pathname: location.pathname, search: params.toString() ? `?${params.toString()}` : '' }, { replace: true });
    }

    hasSentInitialMessage.current = true;
    if (!stateQuery && !queryParam && storedDiscover)
    {
      discoverPayloadRef.current = null;
    }
    initialMessageKey.current = initialMessage;

    if (currentTab === APP_TERMS.TAB_NARRATIVE)
    {
      // Allow landing to force story mode explicitly
      if (stateAny?.narrativeMode === 'story')
      {
        setNarrativeMode('story');
        setStoryIdea(initialMessage);
        return;
      }
      if (narrativeMode === 'story')
      {
        setStoryIdea(initialMessage);
        return;
      }
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
    if (currentTab === APP_TERMS.TAB_UNIVERSITY)
    {
      // University: route to course creation with the topic
      navigate(`${ROUTES.UNIVERSITY_COURSE_NEW}?topic=${encodeURIComponent(initialMessage)}`, { state: { initialTopic: initialMessage } });
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

    // Discovery-first for first message within main app
    (async () => {
      const existingSession = getCurrentSessionForTab();
      const isFirst = !existingSession || (('messages' in existingSession) && existingSession.messages.length === 0);
      if (isFirst) {
        try {
          const mod = await discoverMusaiModule(initialMessage);
          const toTab: Record<string, string> = {
            search: APP_TERMS.TAB_SEARCH,
            research: APP_TERMS.TAB_SEARCH,
            tale: APP_TERMS.TAB_NARRATIVE,
            story: APP_TERMS.TAB_NARRATIVE,
            university: APP_TERMS.TAB_UNIVERSITY,
            eye: APP_TERMS.TAB_EYE,
            medical: APP_TERMS.TAB_MEDICAL,
            therapy: APP_TERMS.TAB_THERAPY,
            career: APP_TERMS.TAB_CAREER,
            code: APP_TERMS.TAB_CODE,
            agile: APP_TERMS.TAB_TASK,
            task: APP_TERMS.TAB_TASK,
            chat: APP_TERMS.TAB_CHAT,
          };
          handleTabChange(toTab[String(mod)] || APP_TERMS.TAB_CHAT);
          try { sessionStorage.setItem('musai-discover-payload', JSON.stringify({ module: mod, query: initialMessage })); } catch {}
          const params = new URLSearchParams(location.search);
          params.set('q', initialMessage);
          navigate({ pathname: location.pathname, search: `?${params.toString()}` }, { replace: true });
          return;
        } catch {
          // fall through to chat send
        }
      }
      // If not first message or discovery failed, send normally into current tab
      setForceChatUI(true);
      if (!existingSession) {
        handleNewSession();
        setTimeout(() => sendInitialMessage(initialMessage), 150);
      } else {
        sendInitialMessage(initialMessage);
      }
    })();
  }, [location.search, location.state, currentTab]);

  // Handle session selection based on tab
  const handleSessionSelect = (sessionId: string) => {
    const session = allSessions.find(s => s.id === sessionId);
    if (!session) return;

    switch (session.type) {
      case 'dev':
        setDevCurrentSessionId(sessionId);
        break;
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
      case 'eye':
        setEyeCurrentSessionId(sessionId);
        break;
      default:
        setCurrentSessionId(sessionId);
    }

    // If currently in Eye, selecting a session should switch to that module's tab
    if (currentTab === APP_TERMS.TAB_EYE) {
      const typeToTab: Record<string, string> = {
        dev: APP_TERMS.TAB_CODE,
        chat: APP_TERMS.TAB_CHAT,
        career: APP_TERMS.TAB_CAREER,
        narrative: APP_TERMS.TAB_NARRATIVE,
        therapy: APP_TERMS.TAB_THERAPY,
      };
      const nextTab = typeToTab[session.type] || APP_TERMS.TAB_CHAT;
      handleTabChange(nextTab);
    }
  };

  // Handle new session creation based on tab
  const handleNewSession = async () => {
    switch (currentTab) {
      case APP_TERMS.TAB_CODE:
        return createNewDevSession();
      case APP_TERMS.TAB_CAREER:
        return createNewCareerSession();
      case APP_TERMS.TAB_EYE: {
        // Eye: start a fresh Eye session; the in-panel UI will handle interactions
        createNewEyeSession('perceive');
        setEyePerceivePrompt(null);
        setEyeReflectPayload(null);
        setForceChatUI(false);
        return;
      }
      case APP_TERMS.TAB_UNIVERSITY: {
        // For University, use the PreMusai flow. Do not create a chat session.
        // Ensure we're on the University tab so PreMusai is visible, then wait for user input.
        if (currentTab !== APP_TERMS.TAB_UNIVERSITY) {
          handleTabChange(APP_TERMS.TAB_UNIVERSITY);
        }
        return;
      }
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
      case 'dev':
        deleteDevSession(sessionId);
        break;
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
      case 'eye':
        deleteEyeSession(sessionId);
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
      case 'dev':
        renameDevSession(sessionId, newName);
        break;
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
      case 'eye':
        renameEyeSession(sessionId, newName);
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
      case 'dev':
        toggleDevFavorite(sessionId);
        break;
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
      case 'eye':
        toggleEyeFavorite(sessionId);
        break;
      default:
        toggleFavorite(sessionId);
    }
  };

  // Render main content based on current tab and session
  const renderMainContent = () => {
    // Eye: always render Eye workspace (panels or PreMusai), regardless of session message model
    if (currentTab === APP_TERMS.TAB_EYE)
    {
      if (eyePerceivePrompt || eyeReflectPayload)
      {
        const seed: EyeWorkbenchSeed = eyePerceivePrompt
          ? { initialPrompt: eyePerceivePrompt, autoRun: true }
          : { initialImage: eyeReflectPayload!.preview, autoRun: false, autoRunMagicEye: false };
        return (
          <EyeWorkbenchPanel
            seed={seed}
            onCancel={() => { setEyePerceivePrompt(null); setEyeReflectPayload(null); }}
            eyeSessionId={eyeCurrentSessionId}
            onAppendPrompt={(p) => { if (eyeCurrentSessionId) appendEyePrompt(eyeCurrentSessionId, p); }}
          />
        );
      }
      // Default: show Eye PreMusai to gather prompt or image
      return (
        <PreMusaiPage
          type="eye"
          onSubmit={(input, file, mode) => {
            if (file)
            {
              // Reflect path (image-based)
              prepareFileData(file).then(imageData => {
                setEyeReflectPayload({ payload: { image: imageData }, preview: imageData, autoMagic: mode === 'magiceye' });
              });
              return;
            }
            const text = (input || '').trim();
            if (text)
            {
              setEyePerceivePrompt(text);
            }
          }}
          isLoading={false}
        />
      );
    }

    // Dedicated CodeMusai playground UI
    if (currentTab === APP_TERMS.TAB_CODE) {
      return (
        <CodeMusaiLayout 
          onClose={() => handleTabChange(APP_TERMS.TAB_CHAT)} 
          sessions={devSessions}
          currentSessionId={devCurrentSessionId}
          createNewSession={createNewDevSession}
          deleteSession={deleteDevSession}
          renameSession={renameDevSession}
          toggleFavorite={toggleDevFavorite}
          updateSession={updateDevSession}
          setCurrentSessionId={setDevCurrentSessionId}
        />
      );
    }
    // Dedicated curated search UI (non-chat)
    if (currentTab === APP_TERMS.TAB_SEARCH) {
      const stateAny = location.state as any;
      const fallbackDiscover = discoverPayloadRef.current;
      // Do NOT reuse previous queries from URL or discovery. Only use an explicitly
      // provided initialQuery from navigation state. This prevents accidental
      // auto-researching of an old chat query when the user opens Search/Research.
      const initialQuery = (stateAny?.initialQuery || '').trim();
      // Clear any leftover discovery payload so it cannot seed Search implicitly
      if (fallbackDiscover) { discoverPayloadRef.current = null; }
      return (
        <SearchLayout 
          onClose={() => handleTabChange(APP_TERMS.TAB_CHAT)} 
          initialQuery={initialQuery || undefined}
          initialMode={stateAny?.searchMode === 'research' ? 'research' : undefined}
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
    const shouldShowPreMusai = !forceChatUI && (
      !currentSession || (('messages' in currentSession) && currentSession.messages.length === 0)
    );

    // All Musai features should work within the unified app - no redirects!

    // Show PreMusai page for any tab without a current session (except narrative which uses its own flow)
    if (shouldShowPreMusai && currentTab !== APP_TERMS.TAB_NARRATIVE) {
      if (currentTab === APP_TERMS.TAB_EYE && (eyePerceivePrompt || eyeReflectPayload)) {
        const seed: EyeWorkbenchSeed = eyePerceivePrompt
          ? { initialPrompt: eyePerceivePrompt, autoRun: true }
          : { initialImage: eyeReflectPayload!.preview, autoRun: false, autoRunMagicEye: false };
        return (
          <EyeWorkbenchPanel
            seed={seed}
            onCancel={() => { setEyePerceivePrompt(null); setEyeReflectPayload(null); }}
          />
        );
      }
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
            // University: route to course creation with topic; that screen calls n8n immediately
            if (currentTab === APP_TERMS.TAB_UNIVERSITY) {
              const topic = (input || '').trim();
              if (topic) {
                navigate(`${ROUTES.UNIVERSITY_COURSE_NEW}?topic=${encodeURIComponent(topic)}`, { state: { initialTopic: topic } });
                return;
              }
            }
            // Special handling for Medical: go to UI and call n8n in background
            if (currentTab === APP_TERMS.TAB_MEDICAL) {
              setIsProcessingMedical(true);
              setTimeout(async () => {
                try {
                  const trimmed = (input || '').trim();
                  if (file) {
                    const { arrayBufferToBase64DataUri } = await import('@/utils/files');
                    const b64 = await arrayBufferToBase64DataUri(file);
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
            // Handle common server-driven actions first
            if (actionType === 'navigate' && actionData && typeof actionData === 'object' && typeof actionData.path === 'string') {
              navigate(actionData.path);
              return;
            }

            // University-specific quick actions
            if (currentTab === APP_TERMS.TAB_UNIVERSITY) {
              switch (actionId) {
                case 'uni-browse':
                  // Stay on dashboard (no-op)
                  return;
                case 'uni-create':
                  navigate(ROUTES.UNIVERSITY_COURSE_NEW);
                  return;
                case 'uni-continue': {
                  // Let dedicated University view handle smart resume; here just open main U page
                  navigate('/university');
                  return;
                }
                default:
                  break;
              }
            }

            // Fallback: submit provided text (if any) into the current module's chat
            if (actionData && typeof actionData === 'string') {
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
      const toggle = (
        <div className="mb-4 flex items-center gap-2">
          {(['tale', 'story'] as const).map(option => (
            <button
              key={option}
              onClick={() => setNarrativeMode(option)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold transition-colors",
                narrativeMode === option
                  ? "bg-primary text-primary-foreground shadow"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {option === 'tale' ? 'Tale' : 'Story'}
            </button>
          ))}
        </div>
      );

      if (narrativeMode === 'story')
      {
        const idea = storyIdea?.trim();
        const storyUrl = idea
          ? `https://story.codemusic.ca/Storyforge/?idea=${encodeURIComponent(idea)}`
          : 'https://story.codemusic.ca';
        return (
          <div className="h-full flex flex-col p-4 gap-4">
            {toggle}
            <form
              className="flex items-center gap-2"
              onSubmit={(e) =>
              {
                e.preventDefault();
                const cleaned = storyInput.trim();
                if (cleaned)
                {
                  setStoryIdea(cleaned);
                }
              }}
            >
              <input
                value={storyInput}
                onChange={e => setStoryInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded border bg-background"
                placeholder="Describe the story idea..."
              />
              <Button type="submit" variant="secondary">Forge</Button>
            </form>
            <div className="flex-1 border rounded-lg overflow-hidden shadow-sm bg-background">
              <iframe
                key={storyUrl}
                src={storyUrl}
                title="Musai Storyforge"
                className="w-full h-full"
                loading="lazy"
              />
            </div>
          </div>
        );
      }

      const ns = getCurrentNarrativeSession();
      if (!ns)
      {
        // No session yet: show PreMusai for narrative.
        // On submit: immediately open the editor by creating a local session and show a spinner
        // while we call n8n in the background to fetch the official summary/title/id.
        return (
          <div className="h-full flex flex-col p-4">
            {toggle}
            <div className="relative flex-1">
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
          </div>
        );
      }
      const update = (data: any) => updateNarrative(ns.id, data);
      const go = (step: typeof narrativeStep) => setNarrativeStep(step);
      const withOverlay = (content: React.ReactNode) => (
        <div className="h-full flex flex-col p-4">
          {toggle}
          <div className="relative flex-1">
          {content}
          {isCreatingNarrative && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-20" aria-live="polite" aria-busy="true">
              <div className="w-8 h-8 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
              <span className="ml-3 text-sm text-muted-foreground">Musai is composing…</span>
            </div>
          )}
          </div>
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
    const activeTyping = currentTab === APP_TERMS.TAB_THERAPY ? therapyIsTyping : isTyping;

    if (currentSession && typeof currentSession === 'object' && 'messages' in currentSession) {
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
          isTyping={activeTyping}
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
          isTyping={activeTyping}
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
      currentSessionId={currentTab === APP_TERMS.TAB_CODE ? (devCurrentSessionId || "") : (currentSession?.id || "")}
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
