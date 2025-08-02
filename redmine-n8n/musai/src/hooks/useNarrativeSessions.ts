import { useState, useCallback, useEffect } from 'react';
import { NarrativeSession } from '@/types/chat';
import { v4 as uuidv4 } from 'uuid';

export const useNarrativeSessions = () => {
  const [sessions, setSessions] = useState<NarrativeSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Load sessions from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('narrative-sessions');
    if (savedSessions) {
      try {
        const parsedSessions = JSON.parse(savedSessions);
        setSessions(parsedSessions);
        
        // Set current session to the most recent one
        if (parsedSessions.length > 0) {
          const mostRecent = parsedSessions.reduce((latest: NarrativeSession, current: NarrativeSession) => 
            current.lastUpdated > latest.lastUpdated ? current : latest
          );
          setCurrentSessionId(mostRecent.id);
        }
      } catch (error) {
        console.error('Failed to load narrative sessions:', error);
      }
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('narrative-sessions', JSON.stringify(sessions));
  }, [sessions]);

  const createNewSession = useCallback(() => {
    const newSession: NarrativeSession = {
      id: uuidv4(),
      name: `Narrative ${new Date().toLocaleDateString()}`,
      type: 'narrative',
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      favorite: false,
      storyData: {
        concept: null,
        characters: [],
        acts: []
      }
    };

    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(session => session.id !== sessionId));
    
    // If we deleted the current session, select the first available one
    if (currentSessionId === sessionId) {
      setSessions(prev => {
        if (prev.length > 0) {
          setCurrentSessionId(prev[0].id);
        } else {
          setCurrentSessionId('');
        }
        return prev;
      });
    }
  }, [currentSessionId]);

  const renameSession = useCallback((sessionId: string, newName: string) => {
    setSessions(prev => 
      prev.map(session => 
        session.id === sessionId 
          ? { ...session, name: newName, lastUpdated: Date.now() }
          : session
      )
    );
  }, []);

  const toggleFavorite = useCallback((sessionId: string) => {
    setSessions(prev => 
      prev.map(session => 
        session.id === sessionId 
          ? { ...session, favorite: !session.favorite, lastUpdated: Date.now() }
          : session
      )
    );
  }, []);

  const updateNarrative = useCallback((sessionId: string, data: any) => {
    setSessions(prev => 
      prev.map(session => 
        session.id === sessionId 
          ? { 
              ...session, 
              storyData: { ...session.storyData, ...data },
              lastUpdated: Date.now() 
            }
          : session
      )
    );
  }, []);

  const getCurrentSession = useCallback(() => {
    return sessions.find(session => session.id === currentSessionId);
  }, [sessions, currentSessionId]);

  return {
    sessions,
    currentSessionId,
    isLoading,
    createNewSession,
    deleteSession,
    renameSession,
    toggleFavorite,
    updateNarrative,
    setCurrentSessionId,
    getCurrentSession
  };
}; 