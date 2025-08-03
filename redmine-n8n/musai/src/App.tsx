import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ROUTES from "./config/routes";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Playground from "./pages/Playground";
import CodeMusaiPlaygroundPage from "./pages/CodeMusaiPlayground";
import RoverByte from "./pages/RoverByte";
import MeetMusai from "./pages/MeetMusai";
import Neuroscience from "./pages/Neuroscience";
import FindYourMuse from "./pages/FindYourMuse";
import University from "./pages/University";
import LectureWizard from "./pages/LectureWizard";
import LectureView from "./pages/LectureView";
import CourseCreationPage from "./pages/CourseCreationPage";
import CourseSyllabus from "./components/university/CourseSyllabus";
import NotFound from "./pages/NotFound";
import { usePageTitle } from "./hooks/usePageTitle";
import { ThemeProvider } from "./contexts/ThemeContext";
import { MusaiMoodProvider } from "./contexts/MusaiMoodContext";
import { UserPreferencesProvider } from "./contexts/UserPreferencesContext";
import { MusaiDevConsole } from "./components/developer/MusaiDevConsole";
import { SmartRouter } from "./components/routing/SmartRouter";
import LocalAI from "./pages/LocalAI";
import { v4 as uuidv4 } from 'uuid';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 0,
      queryKeyHashFn: () => uuidv4(),
    },
  },
});

const AppContent = () => {
  usePageTitle();

  return (
    <SmartRouter>
      <Routes>
        <Route path={ROUTES.HOME} element={<Landing />} />
        <Route path={ROUTES.MAIN_APP} element={<Index />} />
        <Route path={ROUTES.PLAYGROUND} element={<Playground />} />
        <Route path={ROUTES.CODE_PLAYGROUND} element={<CodeMusaiPlaygroundPage />} />
        <Route path={ROUTES.ROVERBYTE} element={<RoverByte />} />
        <Route path={ROUTES.MEET_MUSAI} element={<MeetMusai />} />
        <Route path={ROUTES.NEUROSCIENCE} element={<Neuroscience />} />
        <Route path={ROUTES.LOCAL_AI} element={<LocalAI />} />
        <Route path={ROUTES.FIND_YOUR_MUSE} element={<FindYourMuse />} />
        <Route path={ROUTES.UNIVERSITY} element={<University />} />
        <Route path={ROUTES.UNIVERSITY_LECTURE_NEW} element={<LectureWizard />} />
        <Route path={ROUTES.UNIVERSITY_LECTURE_VIEW} element={<LectureView />} />
        <Route path={ROUTES.UNIVERSITY_COURSE_NEW} element={<CourseCreationPage />} />
        <Route path={ROUTES.UNIVERSITY_COURSE_VIEW} element={<CourseSyllabus />} />
        <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
      </Routes>
    </SmartRouter>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MusaiMoodProvider>
          <UserPreferencesProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
              <MusaiDevConsole />
            </TooltipProvider>
          </UserPreferencesProvider>
        </MusaiMoodProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;