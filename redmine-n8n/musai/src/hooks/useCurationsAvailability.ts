import { useState, useEffect } from 'react';
import { N8N_ENDPOINTS } from '@/config/n8nEndpoints';
import { fetchWithTimeout } from '@/utils/fetchWithTimeout';

interface CurationAvailability {
  isAvailable: boolean;
  isLoading: boolean;
  lastChecked: number | null;
}

/**
 * Hook to check if Musai's Curations content is available
 * Used to conditionally show curations navigation and home page logo
 */
export const useCurationsAvailability = (checkInterval: number = 5 * 60 * 1000) => {
  const [availability, setAvailability] = useState<CurationAvailability>({
    isAvailable: false,
    isLoading: true,
    lastChecked: null,
  });

  const checkCurationsAvailability = async (): Promise<boolean> => {
    try {
      const baseUrl = N8N_ENDPOINTS.BASE_URL;
      const response = await fetchWithTimeout(
        `${baseUrl}${N8N_ENDPOINTS.CURATIONS.GET_CURRENT_CURATIONS}`,
        {},
        5000
      );

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      
      // Check if there's actual content available
      // Curations should have at least one item with content
      return Array.isArray(data) && data.length > 0 && 
             data.some(item => item && item.content && item.content.trim().length > 0);
             
    } catch (error) {
      console.debug('Curations availability check failed:', error);
      return false;
    }
  };

  const performCheck = async () => {
    setAvailability(prev => ({ ...prev, isLoading: true }));
    
    const isAvailable = await checkCurationsAvailability();
    
    setAvailability({
      isAvailable,
      isLoading: false,
      lastChecked: Date.now(),
    });
  };

  useEffect(() => {
    // Initial check
    performCheck();

    // Set up periodic checks
    const interval = setInterval(performCheck, checkInterval);

    return () => {
      clearInterval(interval);
    };
  }, [checkInterval]);

  return {
    ...availability,
    refetch: performCheck,
  };
};