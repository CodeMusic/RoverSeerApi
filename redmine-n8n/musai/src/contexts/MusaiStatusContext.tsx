import React, { createContext, useContext, useState, useCallback } from 'react';

export type MusaiAchievement =
{
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
};

export type MusaiQuickAction =
{
  id: string;
  label: string;
  payload?: unknown;
};

export type MusaiStatus =
{
  header?: string;
  statusHtml?: string;
  progressPercent?: number; // 0..100
  symbolUrl?: string; // small icon/glyph
  achievements?: MusaiAchievement[];
  quickActions?: MusaiQuickAction[];
  // Operational metrics
  activeRequests?: number;
  maxConcurrentRequests?: number;
  queuedRequests?: number;
  totalRequestsStarted?: number;
  totalRequestsCompleted?: number;
  // Timing metrics (ms)
  averageRequestDurationMs?: number;
  emaRequestDurationMs?: number;
  lastRequestDurationMs?: number;
  averageRequestDurationByLabelMs?: Record<string, number>;
  // Social presence metrics
  activeUsers?: number;
};

type MusaiStatusContextType =
{
  status: MusaiStatus;
  setStatus: (next: Partial<MusaiStatus>) => void;
  clearStatus: () => void;
  addAchievement: (a: MusaiAchievement) => void;
  setQuickActions: (actions: MusaiQuickAction[]) => void;
  emitQuickAction: (actionId: string, payload?: unknown) => void;
};

const MusaiStatusContext = createContext<MusaiStatusContextType | undefined>(undefined);

const defaultStatus: MusaiStatus =
{
  header: undefined,
  statusHtml: undefined,
  progressPercent: undefined,
  symbolUrl: undefined,
  achievements: [],
  quickActions: [],
};

export function MusaiStatusProvider({ children }: { children: React.ReactNode })
{
  const [status, setStatusState] = useState<MusaiStatus>(defaultStatus);

  const setStatus = useCallback((next: Partial<MusaiStatus>) =>
  {
    setStatusState(prev => ({ ...prev, ...next }));
  }, []);

  const clearStatus = useCallback(() =>
  {
    setStatusState(defaultStatus);
  }, []);

  const addAchievement = useCallback((a: MusaiAchievement) =>
  {
    setStatusState(prev => ({ ...prev, achievements: [...(prev.achievements || []), a] }));
  }, []);

  const setQuickActions = useCallback((actions: MusaiQuickAction[]) =>
  {
    setStatusState(prev => ({ ...prev, quickActions: actions }));
  }, []);

  const emitQuickAction = useCallback((actionId: string, payload?: unknown) =>
  {
    const event = new CustomEvent('musai-quick-action', { detail: { id: actionId, payload } });
    window.dispatchEvent(event);
  }, []);

  const value: MusaiStatusContextType = {
    status,
    setStatus,
    clearStatus,
    addAchievement,
    setQuickActions,
    emitQuickAction,
  };

  return (
    <MusaiStatusContext.Provider value={value}>
      {children}
    </MusaiStatusContext.Provider>
  );
}

export function useMusaiStatus()
{
  const ctx = useContext(MusaiStatusContext);
  if (!ctx)
  {
    throw new Error('useMusaiStatus must be used within a MusaiStatusProvider');
  }
  return ctx;
}


