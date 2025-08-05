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
import Playground from "@/pages/Playground";
import Neuroscience from "@/pages/Neuroscience";
import MeetMusai from "@/pages/MeetMusai";
import FindYourMuse from "@/pages/FindYourMuse";
import LocalAI from "@/pages/LocalAI";
import University from "@/pages/University";
import LectureWizard from "@/pages/LectureWizard";
import LectureView from "@/pages/LectureView";
import CourseCreationPage from "@/pages/CourseCreationPage";
import RoverByte from "@/pages/RoverByte";
import { Curations } from "@/pages/Curations";
import { CurationsLocked } from "@/pages/CurationsLocked";
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
              <div className="min-h-screen">
                <Routes>
                  <Route path={ROUTES.HOME} element={<Landing />} />
                  <Route path={ROUTES.MAIN_APP} element={<Index />} />
                  <Route path={ROUTES.PLAYGROUND} element={<Playground />} />
                  <Route path={ROUTES.CODE_PLAYGROUND} element={<CodeMusaiPlayground />} />
                  <Route path={ROUTES.NEUROSCIENCE} element={<Neuroscience />} />
                  <Route path={ROUTES.MEET_MUSAI} element={<MeetMusai />} />
                  <Route path={ROUTES.FIND_YOUR_MUSE} element={<FindYourMuse />} />
                  <Route path={ROUTES.LOCAL_AI} element={<LocalAI />} />
                  <Route path={ROUTES.ROVERBYTE} element={<RoverByte />} />
                  
                  {/* University routes */}
                  <Route path={ROUTES.UNIVERSITY} element={<University />} />
                  <Route path={ROUTES.UNIVERSITY_LECTURE_NEW} element={<LectureWizard />} />
                  <Route path={ROUTES.UNIVERSITY_LECTURE_VIEW} element={<LectureView />} />
                  <Route path={ROUTES.UNIVERSITY_COURSE_NEW} element={<CourseCreationPage />} />
                  <Route path={ROUTES.UNIVERSITY_COURSE_VIEW} element={<University />} />
                  
                  {/* AI Curations */}
                  <Route path={ROUTES.CURATIONS} element={<Curations />} />
                  <Route path="/curations/locked" element={<CurationsLocked />} />
                  
                  {/* Catch all */}
                  <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
                </Routes>
              </div>
              <Toaster />
              <MusaiDevConsole />
              <MatrixEffectWrapper />
              <RainbowEffectWrapper />
              <PartyEffectWrapper />
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