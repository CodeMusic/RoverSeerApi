import { useState, useCallback, useEffect } from 'react';
import { EyeSession } from '@/types/chat';
import { v4 as uuidv4 } from 'uuid';
import { computeAndStoreClientIpHash, getStoredClientIpHash } from '@/utils/ip';

export const useEyeSessions = () =>
{
  const [sessions, setSessions] = useState<EyeSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [clientIpHash, setClientIpHash] = useState<string | null>(getStoredClientIpHash());

  useEffect(() =>
  {
    computeAndStoreClientIpHash().then(hash => { if (hash) setClientIpHash(hash); });
  }, []);

  useEffect(() =>
  {
    const saved = localStorage.getItem('eye-sessions');
    if (saved)
    {
      try
      {
        const parsed = JSON.parse(saved) as EyeSession[];
        if (clientIpHash)
        {
          setSessions(parsed.filter(s => !s.clientIpHash || s.clientIpHash === clientIpHash));
        }
        else
        {
          setSessions(parsed);
        }
        if (parsed.length > 0)
        {
          const mostRecent = parsed.reduce((latest: EyeSession, cur: EyeSession) => cur.lastUpdated > latest.lastUpdated ? cur : latest);
          setCurrentSessionId(mostRecent.id);
        }
      }
      catch
      {
        // ignore
      }
    }
  }, [clientIpHash]);

  useEffect(() =>
  {
    localStorage.setItem('eye-sessions', JSON.stringify(sessions));
  }, [sessions]);

  const createNewSession = useCallback((mode: 'perceive' | 'recognize' = 'perceive') =>
  {
    const now = Date.now();
    const s: EyeSession = {
      id: uuidv4(),
      type: 'eye',
      name: mode === 'perceive' ? 'Perceive' : 'Recognize',
      lastUpdated: now,
      favorite: false,
      createdAt: now,
      clientIpHash: clientIpHash || undefined,
      mode,
      prompts: [],
    };
    setSessions(prev => [s, ...prev]);
    setCurrentSessionId(s.id);
    return s.id;
  }, [clientIpHash]);

  const updateSession = useCallback((id: string, data: Partial<EyeSession>) =>
  {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...data, lastUpdated: Date.now() } : s));
  }, []);

  const appendPrompt = useCallback((id: string, compositePrompt: string) =>
  {
    setSessions(prev => prev.map(s => s.id === id ? {
      ...s,
      prompts: [...(s.prompts || []), compositePrompt].slice(-20),
      name: `${s.mode.charAt(0).toUpperCase() + s.mode.slice(1)}: ${compositePrompt.slice(0, 32)}${compositePrompt.length > 32 ? '…' : ''}`,
      lastUpdated: Date.now()
    } : s));
  }, []);

  const deleteSession = useCallback((id: string) =>
  {
    setSessions(prev => prev.filter(s => s.id !== id));
    setCurrentSessionId(prev => prev === id ? '' : prev);
  }, []);

  const renameSession = useCallback((id: string, name: string) => updateSession(id, { name }), [updateSession]);
  const toggleFavorite = useCallback((id: string) =>
  {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, favorite: !s.favorite } : s));
  }, []);

  const getCurrentSession = useCallback(() => sessions.find(s => s.id === currentSessionId), [sessions, currentSessionId]);

  return {
    sessions,
    currentSessionId,
    isLoading,
    createNewSession,
    deleteSession,
    renameSession,
    toggleFavorite,
    updateSession,
    setCurrentSessionId,
    getCurrentSession,
    appendPrompt,
  };
};


