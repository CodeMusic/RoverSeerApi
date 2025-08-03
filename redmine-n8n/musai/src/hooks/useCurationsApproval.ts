import { useState, useEffect } from 'react';
import { N8N_ENDPOINTS } from '@/config/n8nEndpoints';
import { fetchWithTimeout } from '@/utils/fetchWithTimeout';

interface CurationsApprovalState {
  isPublic: boolean;
  requiresApproval: boolean;
  pendingApproval: boolean;
  isLoading: boolean;
  error: string | null;
}

interface CurationsSettings {
  requireApprovalBeforePublic: boolean;
  autoApprove: boolean;
  approvalUsers: string[];
}

/**
 * Hook to manage curations approval workflow
 * Handles public/private state and approval requirements
 */
export const useCurationsApproval = () => {
  const [state, setState] = useState<CurationsApprovalState>({
    isPublic: false,
    requiresApproval: false,
    pendingApproval: false,
    isLoading: true,
    error: null,
  });

  const [settings, setSettings] = useState<CurationsSettings>({
    requireApprovalBeforePublic: true, // Default to requiring approval
    autoApprove: false,
    approvalUsers: [],
  });

  // Check current curations approval status
  const checkApprovalStatus = async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const baseUrl = import.meta.env.VITE_N8N_BASE_URL || '/api/n8n';
      
      // Check if curations are public
      const publicResponse = await fetchWithTimeout(
        `${baseUrl}${N8N_ENDPOINTS.CURATIONS.GET_CURRENT_CURATIONS}?type=public`,
        { timeout: 5000 }
      );
      
      // Check if there are pending curations
      const pendingResponse = await fetchWithTimeout(
        `${baseUrl}${N8N_ENDPOINTS.CURATIONS.GET_CURRENT_CURATIONS}?type=pending`,
        { timeout: 5000 }
      );

      const publicData = publicResponse.ok ? await publicResponse.json() : [];
      const pendingData = pendingResponse.ok ? await pendingResponse.json() : [];

      const hasPublicContent = Array.isArray(publicData) && publicData.length > 0;
      const hasPendingContent = Array.isArray(pendingData) && pendingData.length > 0;

      setState(prev => ({
        ...prev,
        isPublic: hasPublicContent,
        pendingApproval: hasPendingContent && settings.requireApprovalBeforePublic,
        requiresApproval: settings.requireApprovalBeforePublic,
        isLoading: false,
      }));

    } catch (error) {
      console.error('Failed to check curations approval status:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to check approval status',
      }));
    }
  };

  // Approve curations for public display
  const approveCurations = async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const baseUrl = import.meta.env.VITE_N8N_BASE_URL || '/api/n8n';
      const response = await fetchWithTimeout(
        `${baseUrl}${N8N_ENDPOINTS.CURATIONS.APPROVE_FOR_PUBLIC}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            approvedBy: 'user', // Could be enhanced with actual user ID
            timestamp: Date.now() 
          }),
          timeout: 10000
        }
      );

      if (response.ok) {
        setState(prev => ({
          ...prev,
          isPublic: true,
          pendingApproval: false,
          isLoading: false,
        }));
        return true;
      } else {
        throw new Error('Approval request failed');
      }

    } catch (error) {
      console.error('Failed to approve curations:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to approve curations',
      }));
      return false;
    }
  };

  // Update approval settings
  const updateSettings = (newSettings: Partial<CurationsSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    // Save to localStorage for persistence
    localStorage.setItem('curations-settings', JSON.stringify({ ...settings, ...newSettings }));
  };

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('curations-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.warn('Failed to parse saved curations settings:', error);
      }
    }
  }, []);

  // Check approval status when settings change
  useEffect(() => {
    checkApprovalStatus();
  }, [settings.requireApprovalBeforePublic]);

  return {
    ...state,
    settings,
    checkApprovalStatus,
    approveCurations,
    updateSettings,
  };
};