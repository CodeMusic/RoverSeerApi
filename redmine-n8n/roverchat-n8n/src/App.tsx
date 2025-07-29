import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Playground from "./pages/Playground";
import RoverByte from "./pages/RoverByte";
import MeetMusai from "./pages/MeetMusai";
import Neuroscience from "./pages/Neuroscience";
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
      <Route path="/roverbyte" element={<RoverByte />} />
      <Route path="/meet-musai" element={<MeetMusai />} />
      <Route path="/neuroscience" element={<Neuroscience />} />
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