import { useState, useEffect } from 'react';
import { TherapySession } from '@/types/chat';
import { v4 as uuidv4 } from 'uuid';
import { useMessageSender } from './useMessageSender';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { computeAndStoreClientIpHash, getStoredClientIpHash } from '@/utils/ip';

const STORAGE_VERSION = "v1";
const STORAGE_KEY = `therapy_sessions_${STORAGE_VERSION}`;

export const useTherapySessions = () => {
  const [sessions, setSessions] = useState<TherapySession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [clientIpHash, setClientIpHash] = useState<string | null>(getStoredClientIpHash());
  const queryClient = useQueryClient();

  const updateSession = (sessionId: string, messages: any[]) => {
    setSessions(prev => {
      const updatedSessions = prev.map(session => 
        session.id === sessionId 
          ? { ...session, messages, lastUpdated: Date.now() }
          : session
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
      return updatedSessions;
    });
    queryClient.setQueryData(['therapySessions', sessionId], messages);
  };

  const { sendMessage: sendMessageToWebhook, isLoading, isTyping } = useMessageSender(
    updateSession,
    queryClient
  );

  useEffect(() => {
    computeAndStoreClientIpHash().then(hash => { if (hash) setClientIpHash(hash); });
  }, []);

  // Load sessions from localStorage on mount and when IP hash resolves
  useEffect(() => {
    try {
      console.log('Loading therapy sessions from localStorage');
      const savedSessions = localStorage.getItem(STORAGE_KEY);
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        console.log('Parsed therapy sessions:', parsed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (clientIpHash) {
            const filtered = parsed.filter((s: any) => !s.clientIpHash || s.clientIpHash === clientIpHash);
            setSessions(filtered);
          } else {
            setSessions(parsed);
          }
          setCurrentSessionId("");
          console.log('Loaded existing therapy sessions:', parsed.length);
        } else {
          setSessions([]);
          setCurrentSessionId("");
        }
      } else {
        console.log('No saved therapy sessions');
        setSessions([]);
        setCurrentSessionId("");
      }
    } catch (error) {
      console.error('Error loading therapy sessions:', error);
      setSessions([]);
      setCurrentSessionId("");
    }
  }, [clientIpHash]);

  const createNewSession = () => {
    console.log('Creating new therapy session');
    
    const newSession: TherapySession = {
      id: uuidv4(),
      type: 'therapy',
      messages: [],
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      favorite: false,
      clientIpHash: clientIpHash || undefined,
      therapyContext: {
        sessionGoals: [],
        moodTags: [],
        currentMood: '',
        sessionType: 'general',
        sessionMode: 'standard',
        sessionArc: 'intake',
        privacyLevel: 'private',
        narrativeExports: []
      }
    };

    setSessions(prev => {
      const updatedSessions = [newSession, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
      console.log('Therapy sessions after creating new:', updatedSessions.length);
      return updatedSessions;
    });
    setCurrentSessionId(newSession.id);
    return newSession;
  };

  const getCurrentSession = () => {
    return sessions.find(s => s.id === currentSessionId);
  };

  const deleteSession = (sessionId: string) => {
    setSessions(prev => {
      const remainingSessions = prev.filter(session => session.id !== sessionId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remainingSessions));
      
      if (sessionId === currentSessionId) {
        setCurrentSessionId("");
      }
      
      return remainingSessions;
    });
    toast.success("Therapy session deleted successfully");
  };

  const renameSession = (sessionId: string, newName: string) => {
    setSessions(prev => {
      const updatedSessions = prev.map(session =>
        session.id === sessionId
          ? { ...session, name: newName }
          : session
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
      return updatedSessions;
    });
    toast.success("Therapy session renamed successfully");
  };

  const sendMessage = async (input: string, file?: File) => {
    console.log('Therapy sendMessage called:', { input: input.substring(0, 50) });

    let currentSession = getCurrentSession();
    
    if (!currentSession) {
      console.log('No current therapy session found, creating new one');
      const newSession = createNewSession();
      currentSession = newSession;
    }
    
    queryClient.setQueryData(['therapySessions', currentSession.id], currentSession.messages);
    
    await sendMessageToWebhook(
      input,
      currentSession.id,
      currentSession.messages,
      file
    );
  };

  const toggleFavorite = (sessionId: string) => {
    setSessions(prev => {
      const updatedSessions = prev.map(session =>
        session.id === sessionId
          ? { ...session, favorite: !session.favorite }
          : session
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
      return updatedSessions;
    });
    const session = sessions.find(s => s.id === sessionId);
    toast.success(session?.favorite ? "Session removed from favorites" : "Session added to favorites");
  };

  const updateTherapyContext = (sessionId: string, context: Partial<TherapySession['therapyContext']>) => {
    setSessions(prev => {
      const updatedSessions = prev.map(session =>
        session.id === sessionId
          ? { 
              ...session, 
              therapyContext: { ...session.therapyContext, ...context },
              lastUpdated: Date.now()
            }
          : session
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
      return updatedSessions;
    });
  };

  return {
    sessions,
    currentSessionId,
    isLoading,
    isTyping,
    getCurrentSession,
    createNewSession,
    deleteSession,
    renameSession,
    sendMessage,
    setCurrentSessionId,
    toggleFavorite,
    updateTherapyContext,
  };
};
