import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
import { attentionalRequestQueue } from '@/lib/AttentionalRequestQueue';
import { presenceService } from '@/lib/PresenceService';
import { MusaiDevConsole } from "@/components/developer/MusaiDevConsole";
import { AttentionalScrollReset } from "@/components/routing/AttentionalScrollReset";
import { SmartRouter } from "@/components/routing/SmartRouter";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import EyeOfMusai from "@/pages/info/EyeOfMusai";
import CareerMusaiInfo from "@/pages/info/CareerMusaiInfo";
import TherapyMusaiInfo from "@/pages/info/TherapyMusaiInfo";
import MedicalMusaiInfo from "@/pages/info/MedicalMusaiInfo";
import MedicalMusaiDemo from "@/pages/MedicalMusaiDemo";
import EmergentNarrativeInfo from "@/pages/info/EmergentNarrativeInfo";
import RiddleGate from "@/components/common/RiddleGate";
import AgileMusaiInfo from "@/pages/info/AgileMusaiInfo";

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
import { Curations } from "@/pages/Curations";
import { CurationsLocked } from "@/pages/CurationsLocked";
import MusaiCurationsInfo from "@/pages/info/MusaiCurationsInfo";
import MusaiStudioInfo from "@/pages/info/MusaiStudioInfo";
import MusaiStudio from "@/pages/MusaiStudio";
import Roadmap from "@/pages/Roadmap";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";
import CFMInfo from "@/pages/info/CFMInfo";

// Routes
import { ROUTES } from "@/config/routes";

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
                  <AttentionalScrollReset />
                  <ErrorBoundary>
                    <div className="min-h-screen">
                      <Routes>
                        <Route path={ROUTES.HOME} element={<Landing />} />
                        <Route path={ROUTES.MAIN_APP} element={<RiddleGate><Index /></RiddleGate>} />
                        <Route path={ROUTES.PLAYGROUND} element={<Playground />} />
                        <Route path={ROUTES.CODE_PLAYGROUND} element={<CodeMusaiPlayground />} />
                        <Route path={ROUTES.CODE_MUSAI_INFO} element={<CodeMusaiInfo />} />
                        <Route path={ROUTES.NEUROSCIENCE} element={<Neuroscience />} />
                        <Route path={ROUTES.CFM_INFO} element={<CFMInfo />} />
                        <Route path={ROUTES.MEET_MUSAI} element={<MeetMusai />} />
                        <Route path={ROUTES.FIND_YOUR_MUSE} element={<FindYourMuse />} />
                        <Route path={ROUTES.EYE_OF_MUSAI} element={<EyeOfMusai />} />
                        <Route path={ROUTES.CAREER_MUSAI} element={<CareerMusaiInfo />} />
                        <Route path={ROUTES.THERAPY_MUSAI} element={<TherapyMusaiInfo />} />
                        <Route path={ROUTES.MEDICAL_MUSAI} element={<MedicalMusaiInfo />} />
                        <Route path={ROUTES.MEDICAL_MUSAI_DEMO} element={<MedicalMusaiDemo />} />
                        <Route path={ROUTES.EMERGENT_NARRATIVE} element={<EmergentNarrativeInfo />} />
                        <Route path={ROUTES.LOCAL_AI} element={<LocalAI />} />
                        <Route path={ROUTES.TASK_MUSAI} element={<AgileMusaiInfo />} />
                        <Route path={ROUTES.UNIVERSITY} element={<University />} />
                        <Route path={ROUTES.UNIVERSITY_INFO} element={<UniversityInfo />} />
                        <Route path={ROUTES.UNIVERSITY_LECTURE_NEW} element={<LectureWizard />} />
                        <Route path={ROUTES.UNIVERSITY_LECTURE_VIEW} element={<LectureView />} />
                        <Route path={ROUTES.UNIVERSITY_COURSE_NEW} element={<CourseCreationPage />} />
                        <Route path={ROUTES.UNIVERSITY_COURSE_VIEW} element={<University />} />
                        <Route path={ROUTES.CURATIONS} element={<Curations />} />
                        <Route path={ROUTES.CURATIONS_INFO} element={<MusaiCurationsInfo />} />
                        <Route path={ROUTES.MUSAI_STUDIO_INFO} element={<MusaiStudioInfo />} />
                        <Route path={ROUTES.MUSAI_STUDIO} element={<MusaiStudio />} />
                        <Route path={ROUTES.ROADMAP} element={<Roadmap />} />
                        <Route path="/curations/locked" element={<CurationsLocked />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
                      </Routes>
                    </div>
                  </ErrorBoundary>
                  <Toaster />
                  <MusaiDevConsole />
                  <MatrixEffectWrapper />
                  <RainbowEffectWrapper />
                  <PartyEffectWrapper />
                  <KnowledgePopin />
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

    const onMetrics = (ev: Event) =>
    {
      const detail = (ev as CustomEvent<any>).detail;
      setStatus({
        activeRequests: detail.activeCount,
        queuedRequests: detail.queuedCount,
        maxConcurrentRequests: detail.maxConcurrent,
        totalRequestsStarted: detail.totalStarted,
        totalRequestsCompleted: detail.totalCompleted,
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

    attentionalRequestQueue.addEventListener('metrics', onMetrics as EventListener);
    presenceService.addEventListener('presence', onPresence as EventListener);
    return () =>
    {
      attentionalRequestQueue.removeEventListener('metrics', onMetrics as EventListener);
      presenceService.removeEventListener('presence', onPresence as EventListener);
      presenceService.stopHeartbeat();
    };
  }, [setStatus]);
  return null;
}