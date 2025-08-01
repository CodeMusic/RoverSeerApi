import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const usePageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const baseTitle = window.env?.VITE_SITE_TITLE || 'MusaiChat';
    
    let pageTitle = baseTitle;
    
    // Set specific titles for different routes
    switch (location.pathname) {
      case '/':
        pageTitle = `${baseTitle} - Reflective AI for Recursive Minds`;
        break;
      case '/chat':
        pageTitle = `Chat - ${baseTitle}`;
        break;
      case '/playground':
        pageTitle = `Code Playground - ${baseTitle}`;
        break;
      case '/roverbyte':
        pageTitle = 'Musai x RoverByte - Creative Automation Stack';
        break;
      case '/meet-musai':
        pageTitle = 'Meet Musai - The AI that Remembers';
        break;
      case '/neuroscience':
        pageTitle = 'Musai: The Neuroscience - Cognitive Foundations';
        break;
      default:
        pageTitle = baseTitle;
    }
    
    document.title = pageTitle;
  }, [location.pathname]);
};