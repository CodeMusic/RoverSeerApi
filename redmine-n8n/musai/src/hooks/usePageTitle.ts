import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const usePageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const base = 'Musai';
    const tagline = 'Reflective AI for Recursive Minds';
    const path = location.pathname;

    // Home: Musai - {tagline}; other pages: Musai - {page}
    const routeToName: Record<string, string> = {
      '/': tagline,
      '/musai': 'App',
      '/playground': 'Code Playground',
      '/code-musai': 'CodeMusai',
      '/code-musai/info': 'CodeMusai',
      '/university': 'Musai University',
      '/university/info': 'Musai University',
      '/emergent-narrative': 'MusaiTale',
      '/therapy-musai': 'TherapyMusai',
      '/medical-musai': 'MedicalMusai',
      '/career-musai': 'CareerMusai',
      '/eye-of-musai': 'The Eye of Musai',
      '/find-your-muse': 'MusaiSearch',
      '/local-ai': 'Local AI Architecture',
      '/cfm': 'Contextual Feedback Model (CFM)',
      '/neuroscience': 'The Neuroscience',
      '/musai-studio': 'MusaiStudio',
      '/musai-studio/info': 'MusaiStudio',
      '/curations': 'MusaiCurations',
      '/curations/info': 'MusaiCurations',
      '/roadmap': 'Roadmap',
    };

    const suffix = routeToName[path] ?? 'App';
    const title = path === '/' ? `${base} - ${tagline}` : `${base} - ${suffix}`;
    document.title = title;
  }, [location.pathname]);
};