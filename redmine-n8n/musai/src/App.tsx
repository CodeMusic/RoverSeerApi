import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { MusaiMoodProvider, useMusaiMood } from "@/contexts/MusaiMoodContext";
import { UserPreferencesProvider } from "@/contexts/UserPreferencesContext";
import { MusaiAlertsProvider } from "@/contexts/MusaiAlertsContext";
import { Toaster } from "@/components/ui/toaster";
import { MatrixEffect } from "@/components/effects/MatrixEffect";
import { RainbowEffect } from "@/components/effects/RainbowEffect";
import { PartyEffect } from "@/components/effects/PartyEffect";
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
import TaskMusaiInfo from "@/pages/info/TaskMusaiInfo";

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
import RoverByte from "@/pages/info/RoverByte";
import { Curations } from "@/pages/Curations";
import { CurationsLocked } from "@/pages/CurationsLocked";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

// Routes
import { ROUTES } from "@/config/routes";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MusaiMoodProvider>
          <UserPreferencesProvider>
            <MusaiAlertsProvider>
              <Router>
                <SmartRouter>
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
                        <Route path={ROUTES.MEET_MUSAI} element={<MeetMusai />} />
                        <Route path={ROUTES.FIND_YOUR_MUSE} element={<FindYourMuse />} />
                        <Route path={ROUTES.EYE_OF_MUSAI} element={<EyeOfMusai />} />
                        <Route path={ROUTES.CAREER_MUSAI} element={<CareerMusaiInfo />} />
                        <Route path={ROUTES.THERAPY_MUSAI} element={<TherapyMusaiInfo />} />
                        <Route path={ROUTES.MEDICAL_MUSAI} element={<MedicalMusaiInfo />} />
                        <Route path={ROUTES.MEDICAL_MUSAI_DEMO} element={<MedicalMusaiDemo />} />
                        <Route path={ROUTES.EMERGENT_NARRATIVE} element={<EmergentNarrativeInfo />} />
                        <Route path={ROUTES.LOCAL_AI} element={<LocalAI />} />
                        <Route path={ROUTES.TASK_MUSAI} element={<TaskMusaiInfo />} />
                        <Route path={ROUTES.ROVERBYTE} element={<RoverByte />} />
                        <Route path={ROUTES.UNIVERSITY} element={<University />} />
                        <Route path={ROUTES.UNIVERSITY_INFO} element={<UniversityInfo />} />
                        <Route path={ROUTES.UNIVERSITY_LECTURE_NEW} element={<LectureWizard />} />
                        <Route path={ROUTES.UNIVERSITY_LECTURE_VIEW} element={<LectureView />} />
                        <Route path={ROUTES.UNIVERSITY_COURSE_NEW} element={<CourseCreationPage />} />
                        <Route path={ROUTES.UNIVERSITY_COURSE_VIEW} element={<University />} />
                        <Route path={ROUTES.CURATIONS} element={<Curations />} />
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
                </SmartRouter>
              </Router>
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
  
  return (
    <MatrixEffect 
      isActive={isMatrixActive} 
      onClose={toggleMatrix} 
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