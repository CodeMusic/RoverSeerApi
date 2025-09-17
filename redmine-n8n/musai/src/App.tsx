import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { MusaiMoodProvider, useMusaiMood } from "@/contexts/MusaiMoodContext";
import { UserPreferencesProvider } from "@/contexts/UserPreferencesContext";
import { MusaiAlertsProvider } from "@/contexts/MusaiAlertsContext";
import { MusaiStatusProvider, useMusaiStatus } from "@/contexts/MusaiStatusContext";
import { KnowledgePopinProvider } from '@/contexts/KnowledgePopinContext';
import KnowledgePopin from '@/components/common/KnowledgePopin';
import { Toaster } from "@/components/ui/toaster";
import { MatrixEffect } from "@/components/effects/MatrixEffect";
import { RainbowEffect } from "@/components/effects/RainbowEffect";
import { PartyEffect } from "@/components/effects/PartyEffect";
import { useEffect } from 'react';
import React from 'react';
import { attentionalRequestQueue } from '@/lib/AttentionalRequestQueue';
import { presenceService } from '@/lib/PresenceService';
import { MusaiDevConsole } from "@/components/developer/MusaiDevConsole";
import { AttentionalScrollReset } from "@/components/routing/AttentionalScrollReset";
import { SmartRouter } from "@/components/routing/SmartRouter";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import EyeOfMusai from "@/pages/info/EyeOfMusai";
import CareerMusaiInfo from "@/pages/info/CareerMusaiInfo";
import CareerMusaiConsole from "@/pages/CareerMusaiConsole";
import TherapyMusaiInfo from "@/pages/info/TherapyMusaiInfo";
import MedicalMusaiInfo from "@/pages/info/MedicalMusaiInfo";
import MedicalMusaiDemo from "@/pages/MedicalMusaiDemo";
import MedicalMusaiConsole from "@/pages/MedicalMusaiConsole";
import EmergentNarrativeInfo from "@/pages/info/EmergentNarrativeInfo";
import RiddleGate from "@/components/common/RiddleGate";
import AgileMusaiInfo from "@/pages/info/AgileMusaiInfo";
import AgileMusaiConsole from "@/pages/AgileMusaiConsole";

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});
  
// Pages
import Landing from "@/pages/Landing";
import Index from "@/pages/Index";
import CodeMusaiPlayground from "@/pages/CodeMusaiPlayground";
import CodeMusaiInfo from "@/pages/info/CodeMusaiInfo";
import Playground from "@/pages/Playground";
import Neuroscience from "@/pages/info/Neuroscience";
import MeetMusai from "@/pages/info/MeetMusai";
import FindYourMuse from "@/pages/info/FindYourMuse";
import LocalAI from "@/pages/info/LocalAI";
import University from "@/pages/University";
import UniversityInfo from "@/pages/info/UniversityInfo";
import LectureWizard from "@/pages/LectureWizard";
import LectureView from "@/pages/LectureView";
import CourseCreationPage from "@/pages/CourseCreationPage";
import CourseLectureView from "@/pages/CourseLectureView";
import CourseExamView from "@/pages/CourseExamView";
import CourseSyllabus from "@/components/university/CourseSyllabus";
import CourseLecturePreview from "@/pages/CourseLecturePreview";
import { Curations } from "@/pages/Curations";
import { CurationsLocked } from "@/pages/CurationsLocked";
import MusaiCurationsInfo from "@/pages/info/MusaiCurationsInfo";
import MusaiStudioInfo from "@/pages/info/MusaiStudioInfo";
import MusaiStudio from "@/pages/MusaiStudio";
import Roadmap from "@/pages/Roadmap";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";
import CFMInfo from "@/pages/info/CFMInfo";
import EyeTrain from "@/pages/eye/EyeTrain";
import EyeGenerate from "@/pages/eye/EyeGenerate";

// Routes
import { ROUTES, RouteUtils } from "@/config/routes";
import { SystemStatusBar } from "@/components/common/SystemStatusBar";
import { APP_TERMS } from "@/config/constants";
import type { MusaiDiscoverModule } from '@/lib/discoveryApi';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MusaiMoodProvider>
          <UserPreferencesProvider>
            <MusaiAlertsProvider>
            <MusaiStatusProvider>
              <KnowledgePopinProvider>
              <Router>
                <SmartRouter>
                  <BootMetrics />
                  <DevConsoleRoutingBridge />
                  <DevConsoleHotkey />
                  <AttentionalScrollReset />
                  <ErrorBoundary>
                    <div className="min-h-screen">
                      <Routes>
                        <Route path={ROUTES.HOME} element={<Landing />} />
                        <Route path={ROUTES.MAIN_APP} element={<RiddleGate><Index /></RiddleGate>} />
                        <Route path={ROUTES.PLAYGROUND} element={<RiddleGate><Playground /></RiddleGate>} />
                        <Route path={ROUTES.CODE_PLAYGROUND} element={<RiddleGate><CodeMusaiPlayground /></RiddleGate>} />
                        <Route path={ROUTES.CODE_MUSAI_INFO} element={<CodeMusaiInfo />} />
                        <Route path={ROUTES.NEUROSCIENCE} element={<Neuroscience />} />
                        <Route path={ROUTES.CFM_INFO} element={<CFMInfo />} />
                        <Route path={ROUTES.MEET_MUSAI} element={<MeetMusai />} />
                        <Route path={ROUTES.FIND_YOUR_MUSE} element={<FindYourMuse />} />
                        <Route path={ROUTES.EYE_OF_MUSAI} element={<EyeOfMusai />} />
                        <Route path={ROUTES.EYE_TRAIN} element={<RiddleGate><EyeTrain /></RiddleGate>} />
                        <Route path={ROUTES.EYE_RECOGNIZE} element={<RiddleGate><Index /></RiddleGate>} />
                        <Route path={ROUTES.EYE_GENERATE} element={<RiddleGate><EyeGenerate /></RiddleGate>} />
                        <Route path={ROUTES.CAREER_MUSAI} element={<CareerMusaiInfo />} />
                        <Route path={ROUTES.CAREER_MUSAI_CONSOLE} element={<RiddleGate><CareerMusaiConsole /></RiddleGate>} />
                        <Route path={ROUTES.THERAPY_MUSAI} element={<TherapyMusaiInfo />} />
                        <Route path={ROUTES.MEDICAL_MUSAI} element={<MedicalMusaiInfo />} />
                        <Route path={ROUTES.MEDICAL_MUSAI_DEMO} element={<MedicalMusaiDemo />} />
                        <Route path={ROUTES.MEDICAL_MUSAI_CONSOLE} element={<RiddleGate><MedicalMusaiConsole /></RiddleGate>} />
                        <Route path={ROUTES.EMERGENT_NARRATIVE} element={<EmergentNarrativeInfo />} />
                        <Route path={ROUTES.LOCAL_AI} element={<LocalAI />} />
                        <Route path={ROUTES.TASK_MUSAI} element={<AgileMusaiInfo />} />
                        <Route path={ROUTES.TASK_MUSAI_CONSOLE} element={<RiddleGate><AgileMusaiConsole /></RiddleGate>} />
                        <Route path={ROUTES.UNIVERSITY} element={<RiddleGate><University /></RiddleGate>} />
                        <Route path={ROUTES.UNIVERSITY_INFO} element={<UniversityInfo />} />
                        <Route path={ROUTES.UNIVERSITY_LECTURE_NEW} element={<RiddleGate><LectureWizard /></RiddleGate>} />
                        <Route path={ROUTES.UNIVERSITY_LECTURE_PREVIEW} element={<RiddleGate><CourseLecturePreview /></RiddleGate>} />
                        <Route path={ROUTES.UNIVERSITY_LECTURE_VIEW} element={<RiddleGate><LectureView /></RiddleGate>} />
                        <Route path={ROUTES.UNIVERSITY_COURSE_NEW} element={<RiddleGate><CourseCreationPage /></RiddleGate>} />
                        <Route path={ROUTES.UNIVERSITY_COURSE_VIEW} element={<RiddleGate><CourseSyllabus /></RiddleGate>} />
                        <Route path={ROUTES.UNIVERSITY_COURSE_LECTURE_VIEW} element={<RiddleGate><CourseLectureView /></RiddleGate>} />
                        <Route path={ROUTES.UNIVERSITY_COURSE_EXAM_VIEW} element={<RiddleGate><CourseExamView /></RiddleGate>} />
                        <Route path={ROUTES.CURATIONS} element={<RiddleGate><Curations /></RiddleGate>} />
                        <Route path={ROUTES.CURATIONS_INFO} element={<MusaiCurationsInfo />} />
                        <Route path={ROUTES.MUSAI_STUDIO_INFO} element={<MusaiStudioInfo />} />
                        <Route path={ROUTES.MUSAI_STUDIO} element={<RiddleGate><MusaiStudio /></RiddleGate>} />
                        <Route path={ROUTES.ROADMAP} element={<Roadmap />} />
                        <Route path="/curations/locked" element={<CurationsLocked />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
                      </Routes>
                    </div>
                  </ErrorBoundary>
                  <RouteAwareToaster />
                  <MusaiDevConsole />
                  <MatrixEffectWrapper />
                  <RainbowEffectWrapper />
                  <PartyEffectWrapper />
                  <KnowledgePopin />
                  <StatusBarGate />
                </SmartRouter>
              </Router>
              </KnowledgePopinProvider>
            </MusaiStatusProvider>
            </MusaiAlertsProvider>
          </UserPreferencesProvider>
        </MusaiMoodProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function DevConsoleRoutingBridge()
{
  const navigate = useNavigate();
  const { toggleDevConsole, isDevConsoleOpen } = useMusaiMood();

  useEffect(() =>
  {
    const handle = (event: Event) =>
    {
      const detail = (event as CustomEvent<{ module?: MusaiDiscoverModule | string; query: string }>).detail;
      if (!detail || !detail.query)
      {
        return;
      }
      const module = (detail.module ?? 'chat') as MusaiDiscoverModule | string;
      const query = detail.query.trim();
      if (!query)
      {
        return;
      }

      const navigateMain = (mode: string, tab: string, extraState: Record<string, unknown> = {}) =>
      {
        navigate(RouteUtils.mainAppWithMode(mode, query), {
          state: { switchToTab: tab, initialQuery: query, newSession: true, initialMessage: query, ...extraState }
        });
        // If the Dev Console is currently open, close it after a brief delay.
        // Never open the console implicitly.
        setTimeout(() => { try { if (isDevConsoleOpen) toggleDevConsole(); } catch {} }, 350);
      };

      switch (module)
      {
        case 'research':
          navigateMain('search', APP_TERMS.TAB_SEARCH, { searchMode: 'research' });
          break;
        case 'search':
          navigateMain('search', APP_TERMS.TAB_SEARCH);
          break;
        case 'university':
          navigateMain('university', APP_TERMS.TAB_UNIVERSITY);
          break;
        case 'tale':
          navigateMain('narrative', APP_TERMS.TAB_NARRATIVE);
          break;
        case 'eye':
          navigateMain('eye', APP_TERMS.TAB_EYE);
          break;
        case 'medical':
          navigateMain('medical', APP_TERMS.TAB_MEDICAL);
          break;
        case 'therapy':
          navigateMain('therapy', APP_TERMS.TAB_THERAPY);
          break;
        case 'agile':
          navigate(ROUTES.TASK_MUSAI_CONSOLE, { state: { initialRequest: query } });
          break;
        case 'code':
          navigateMain('code', APP_TERMS.TAB_CODE);
          break;
        case 'career':
          navigateMain('career', APP_TERMS.TAB_CAREER);
          break;
        case 'chat':
        default:
          navigateMain('chat', APP_TERMS.TAB_CHAT);
          break;
      }
    };

    window.addEventListener('musai-discover-request', handle as EventListener);
    return () => window.removeEventListener('musai-discover-request', handle as EventListener);
  }, [navigate, toggleDevConsole, isDevConsoleOpen]);

  return null;
}

function RouteAwareToaster() {
  return <Toaster />;
}

// Matrix Effect Wrapper Component
function MatrixEffectWrapper() {
  const { isMatrixActive, toggleMatrix } = useMusaiMood();
  const passivePreferred = true;
  // Render as passive background without interaction; allow overlay only when explicitly toggled
  return (
    <MatrixEffect
      isActive={isMatrixActive}
      onClose={toggleMatrix}
      mode={passivePreferred ? 'passive' : 'overlay'}
      density={0.35}
    />
  );
}

// Rainbow Effect Wrapper Component
function RainbowEffectWrapper() {
  const { isRainbowActive, toggleRainbow } = useMusaiMood();
  
  return (
    <RainbowEffect 
      isActive={isRainbowActive} 
      onComplete={toggleRainbow} 
    />
  );
}

// Party Effect Wrapper Component
function PartyEffectWrapper() {
  const { isPartyActive, toggleParty } = useMusaiMood();
  
  return (
    <PartyEffect 
      isActive={isPartyActive} 
      onComplete={toggleParty} 
    />
  );
}

export default App;

// Boot-time side-effects for presence and request metrics, inside providers
function BootMetrics()
{
  const { setStatus } = useMusaiStatus();
  useEffect(() =>
  {
    presenceService.startHeartbeat(30000);
    let activeStreams = 0;

    const onMetrics = (ev: Event) =>
    {
      const detail = (ev as CustomEvent<any>).detail;
      setStatus({
        activeRequests: detail.activeCount + activeStreams,
        queuedRequests: detail.queuedCount,
        maxConcurrentRequests: detail.maxConcurrent,
        totalRequestsStarted: detail.totalStarted,
        totalRequestsCompleted: detail.totalCompleted,
        averageRequestDurationMs: detail.averageDurationMs,
        emaRequestDurationMs: detail.emaDurationMs,
        lastRequestDurationMs: detail.lastDurationMs,
        averageRequestDurationByLabelMs: detail.averageDurationByLabelMs,
      });
    };
    const onPresence = (ev: Event) =>
    {
      const detail = (ev as CustomEvent<any>).detail;
      if (typeof detail?.activeUsers === 'number')
      {
        setStatus({ activeUsers: detail.activeUsers });
      }
    };

    const onStreamStart = () =>
    {
      activeStreams += 1;
      // Nudge activeRequests display; actual value will be refreshed on next metrics event
      setStatus({});
    };
    const onStreamEnd = () =>
    {
      activeStreams = Math.max(0, activeStreams - 1);
      setStatus({});
    };

    attentionalRequestQueue.addEventListener('metrics', onMetrics as EventListener);
    presenceService.addEventListener('presence', onPresence as EventListener);
    window.addEventListener('musai-stream-start', onStreamStart as EventListener);
    window.addEventListener('musai-stream-end', onStreamEnd as EventListener);
    return () =>
    {
      attentionalRequestQueue.removeEventListener('metrics', onMetrics as EventListener);
      presenceService.removeEventListener('presence', onPresence as EventListener);
      presenceService.stopHeartbeat();
      window.removeEventListener('musai-stream-start', onStreamStart as EventListener);
      window.removeEventListener('musai-stream-end', onStreamEnd as EventListener);
    };
  }, [setStatus]);
  return null;
}

// Global hotkey for opening the Dev Console with Shift+Backquote (~)
function DevConsoleHotkey()
{
  const { toggleDevConsole } = useMusaiMood();
  useEffect(() =>
  {
    const onKeyDown = (e: KeyboardEvent) =>
    {
      // Avoid when typing in inputs/textareas/contenteditable
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable))
      {
        return;
      }
      // Only trigger on Shift+Backquote (tilde on US keyboards)
      if (e.code === 'Backquote' && !e.ctrlKey && !e.metaKey && !e.altKey)
      {
        e.preventDefault();
        toggleDevConsole();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleDevConsole]);
  return null;
}

// Conditionally render the status bar based on session/sidebar presence.
// A config flag can force it to show everywhere when needed.
function StatusBarGate()
{
  const [riddleActive, setRiddleActive] = React.useState(false);
  const [overrideActive, setOverrideActive] = React.useState(false);

  React.useEffect(() =>
  {
    const handler = (e: Event) =>
    {
      const detail = (e as CustomEvent).detail as { active?: boolean } | undefined;
      setOverrideActive(Boolean(detail?.active));
    };
    window.addEventListener('musai-status-override', handler as EventListener);
    return () => window.removeEventListener('musai-status-override', handler as EventListener);
  }, []);

  React.useEffect(() =>
  {
    const handler = (e: Event) =>
    {
      const detail = (e as CustomEvent).detail as { active?: boolean } | undefined;
      setRiddleActive(Boolean(detail?.active));
    };
    window.addEventListener('musai-riddle-presence', handler as EventListener);
    return () => window.removeEventListener('musai-riddle-presence', handler as EventListener);
  }, []);

  if (riddleActive || !overrideActive)
  {
    return null;
  }
  return <SystemStatusBar />;
}
