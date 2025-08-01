import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Playground from "./pages/Playground";
import CodeMusaiPlaygroundPage from "./pages/CodeMusaiPlayground";
import RoverByte from "./pages/RoverByte";
import MeetMusai from "./pages/MeetMusai";
import Neuroscience from "./pages/Neuroscience";
import University from "./pages/University";
import UniversityNew from "./pages/UniversityNew";
import LectureView from "./pages/LectureView";
import CourseCreationPage from "./pages/CourseCreationPage";
import CourseSyllabus from "./components/university/CourseSyllabus";
import NotFound from "./pages/NotFound";
import { usePageTitle } from "./hooks/usePageTitle";
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

  useEffect(() => {
    const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/chat" element={<Index />} />
      <Route path="/playground" element={<Playground />} />
      <Route path="/code-musai" element={<CodeMusaiPlaygroundPage />} />
      <Route path="/roverbyte" element={<RoverByte />} />
      <Route path="/meet-musai" element={<MeetMusai />} />
      <Route path="/neuroscience" element={<Neuroscience />} />
      <Route path="/university" element={<University />} />
      <Route path="/university/new" element={<UniversityNew />} />
      <Route path="/university/lecture/:id" element={<LectureView />} />
      <Route path="/university/course/new" element={<CourseCreationPage />} />
      <Route path="/university/course/:courseId" element={<CourseSyllabus />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename="/chat">
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;