import { useState, useCallback, useEffect } from 'react';
import { DevSession } from '@/types/chat';
import { v4 as uuidv4 } from 'uuid';

export const useDevSessions = () => {
  const [sessions, setSessions] = useState<DevSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Load sessions from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('dev-sessions');
    if (savedSessions) {
      try {
        const parsedSessions = JSON.parse(savedSessions);
        setSessions(parsedSessions);
        
        // Don't auto-select any session - let user choose or show PreMusaiPage
        // This ensures users see the CodeMusai PreMusai interface by default
      } catch (error) {
        console.error('Failed to load dev sessions:', error);
      }
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('dev-sessions', JSON.stringify(sessions));
  }, [sessions]);

  const createNewSession = useCallback(() => {
    const newSession: DevSession = {
      id: uuidv4(),
      name: `Dev Session ${new Date().toLocaleDateString()}`,
      type: 'dev',
      language: 'javascript',
      code: '// Write your code here\nconsole.log("Hello, World!");',
      output: '',
      chatMessages: [],
      lastUpdated: Date.now(),
      favorite: false,
      createdAt: Date.now(),
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

  const updateSession = useCallback((sessionId: string, data: Partial<DevSession>) => {
    setSessions(prev => 
      prev.map(session => 
        session.id === sessionId 
          ? { ...session, ...data, lastUpdated: Date.now() }
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
    updateSession,
    setCurrentSessionId,
    getCurrentSession
  };
}; 