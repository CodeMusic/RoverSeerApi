
import { useState, useEffect } from "react";
import { Message, ChatSession, CareerSession } from "@/types/chat";
import { v4 as uuidv4 } from 'uuid';
import { useMessageSender } from "./useMessageSender";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { computeAndStoreClientIpHash, getStoredClientIpHash } from "@/utils/ip";

const STORAGE_VERSION = "v1";
const STORAGE_KEY = `chat_sessions_${STORAGE_VERSION}`;

// Fallback to import.meta.env if window.env is not available
console.log('Configuration Sources:');
console.log('window.env:', {
  VITE_N8N_WEBHOOK_URL: window.env?.VITE_N8N_WEBHOOK_URL ? '[CONFIGURED]' : '[NOT SET]',
  VITE_WELCOME_MESSAGE: window.env?.VITE_WELCOME_MESSAGE,
  VITE_SITE_TITLE: window.env?.VITE_SITE_TITLE,
  VITE_N8N_WEBHOOK_USERNAME: window.env?.VITE_N8N_WEBHOOK_USERNAME ? '[CONFIGURED]' : '[NOT SET]',
  VITE_N8N_WEBHOOK_SECRET: window.env?.VITE_N8N_WEBHOOK_SECRET ? '[CONFIGURED]' : '[NOT SET]',
  VITE_ASSISTANT_NAME: window.env?.VITE_ASSISTANT_NAME,
});

console.log('import.meta.env:', {
  VITE_N8N_WEBHOOK_URL: import.meta.env.VITE_N8N_WEBHOOK_URL ? '[CONFIGURED]' : '[NOT SET]',
  VITE_WELCOME_MESSAGE: import.meta.env.VITE_WELCOME_MESSAGE,
  VITE_SITE_TITLE: import.meta.env.VITE_SITE_TITLE,
  VITE_N8N_WEBHOOK_USERNAME: import.meta.env.VITE_N8N_WEBHOOK_USERNAME ? '[CONFIGURED]' : '[NOT SET]',
  VITE_N8N_WEBHOOK_SECRET: import.meta.env.VITE_N8N_WEBHOOK_SECRET ? '[CONFIGURED]' : '[NOT SET]',
  VITE_ASSISTANT_NAME: import.meta.env.VITE_ASSISTANT_NAME,
});

console.log('DEFAULT_WELCOME_MESSAGE:', "Welcome to Musai!.");

const WELCOME_MESSAGE = window.env?.VITE_WELCOME_MESSAGE || import.meta.env.VITE_WELCOME_MESSAGE || "Welcome to the chat!";

console.log('WELCOME_MESSAGE sources:');
console.log('- window.env.VITE_WELCOME_MESSAGE:', window.env?.VITE_WELCOME_MESSAGE);
console.log('- import.meta.env.VITE_WELCOME_MESSAGE:', import.meta.env.VITE_WELCOME_MESSAGE);
console.log('Selected WELCOME_MESSAGE:', WELCOME_MESSAGE);

export const useChatSessions = () => {
  const [sessions, setSessions] = useState<(ChatSession | CareerSession)[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [clientIpHash, setClientIpHash] = useState<string | null>(getStoredClientIpHash());
  const queryClient = useQueryClient();



  // Prune and safely persist sessions to avoid quota errors
  const safePersistSessions = (list: (ChatSession | CareerSession)[]) => {
    const MAX_SESSIONS = 12;
    const MAX_MESSAGES = 50;
    const MAX_TEXT = 4000;
    const prune = (input: (ChatSession | CareerSession)[]) => {
      return input.slice(0, MAX_SESSIONS).map((s) => {
        if (s.type === 'career')
        {
          const cs = s as CareerSession;
          return {
            ...cs,
            messages: (cs.messages || []).slice(-MAX_MESSAGES).map(m => ({
              ...m,
              content: typeof m.content === 'string' ? m.content.slice(0, MAX_TEXT) : m.content
            }))
          } as CareerSession;
        }
        const ch = s as ChatSession;
        return {
          ...ch,
          messages: (ch.messages || []).slice(-MAX_MESSAGES).map(m => ({
            ...m,
            content: typeof m.content === 'string' ? m.content.slice(0, MAX_TEXT) : m.content
          }))
        } as ChatSession;
      });
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prune(list)));
      } catch {}
    }
  };

  const updateSession = (sessionId: string, messages: Message[]) => {
    setSessions(prev => {
      const updatedSessions = prev.map(session => 
        session.id === sessionId 
          ? { ...session, messages, lastUpdated: Date.now() }
          : session
      );
      safePersistSessions(updatedSessions);
      return updatedSessions;
    });
    queryClient.setQueryData(['chatSessions', sessionId], messages);
  };

  const { sendMessage: sendMessageToWebhook, isLoading, isTyping } = useMessageSender(
    updateSession,
    queryClient
  );









  // Clear all data for testing purposes
  const clearAllData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSessions([]);
    setCurrentSessionId("");
    createNewSession();
    toast.success("All data cleared for testing");
  };



  // Debug function to show current state
  const debugState = () => {
    console.log('=== DEBUG STATE ===');
    console.log('Sessions count:', sessions.length);
    console.log('Current session ID:', currentSessionId);
    console.log('==================');
  };

  useEffect(() => {
    // Resolve client IP hash once (best-effort)
    computeAndStoreClientIpHash().then(hash => {
      if (hash) setClientIpHash(hash);
    });
  }, []);

  useEffect(() => {
    try {
      console.log('Loading sessions from localStorage');
      const savedSessions = localStorage.getItem(STORAGE_KEY);
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        console.log('Parsed sessions:', parsed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If we have a clientIpHash, only show sessions that match or are untagged (backfill later)
          if (clientIpHash) {
            const filtered = parsed.filter((s: any) => !s.clientIpHash || s.clientIpHash === clientIpHash);
            setSessions(filtered);
          } else {
            setSessions(parsed);
          }
          // Don't auto-select any session - let user choose
          setCurrentSessionId("");
          console.log('Loaded existing sessions:', parsed.length);
        } else {
          console.log('No valid sessions found, starting with empty state');
          setSessions([]);
          setCurrentSessionId("");
        }
      } else {
        console.log('No saved sessions, starting with empty state');
        setSessions([]);
        setCurrentSessionId("");
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      setSessions([]);
      setCurrentSessionId("");
    }
  }, [clientIpHash]); // Reload when IP hash becomes available to filter

  const createNewSession = (sessionType: 'chat' | 'career' = 'chat') => {
    console.log('Creating new session of type:', sessionType);
    
    if (sessionType === 'career') {
      const newSession: CareerSession = {
        id: uuidv4(),
        type: 'career',
        messages: [], // Start with empty messages to show PreMusaiPage
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        favorite: false,
        clientIpHash: clientIpHash || undefined,
        careerContext: {
          currentRole: '',
          targetRole: '',
          skills: [],
          experience: '',
          location: '',
          salaryRange: '',
          preferences: []
        }
      };
      setSessions(prev => {
        const updatedSessions = [newSession, ...prev];
        safePersistSessions(updatedSessions);
        console.log('Career sessions after creating new:', updatedSessions.length);
        return updatedSessions;
      });
      setCurrentSessionId(newSession.id);
      return newSession;
    } else {
      const newSession: ChatSession = {
        id: uuidv4(),
        type: 'chat',
        messages: [], // Start with empty messages to show PreMusaiPage
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        favorite: false,
        clientIpHash: clientIpHash || undefined,
      };
      setSessions(prev => {
        const updatedSessions = [newSession, ...prev];
        safePersistSessions(updatedSessions);
        console.log('Sessions after creating new:', updatedSessions.length);
        return updatedSessions;
      });
      setCurrentSessionId(newSession.id);
      return newSession;
    }
  };

  const createNewCareerSession = () => {
    return createNewSession('career') as CareerSession;
  };

  const getCurrentSession = () => {
    return sessions.find(s => s.id === currentSessionId);
  };

  const deleteSession = (sessionId: string) => {
    setSessions(prev => {
      const remainingSessions = prev.filter(session => session.id !== sessionId);
      safePersistSessions(remainingSessions);
      
      // Clean up localStorage entries for the deleted session
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`sent_initial_${sessionId}-`)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      

      
      if (sessionId === currentSessionId) {
        // Don't auto-select any session - let user choose or show PreMusaiPage
        setCurrentSessionId("");
      }
      
      return remainingSessions;
    });
    toast.success("Chat deleted successfully");
  };

  const renameSession = (sessionId: string, newName: string) => {
    setSessions(prev => {
      const updatedSessions = prev.map(session =>
        session.id === sessionId
          ? { ...session, name: newName }
          : session
      );
      safePersistSessions(updatedSessions);
      return updatedSessions;
    });
    toast.success("Chat renamed successfully");
  };

  const updateCareerContext = (sessionId: string, context: Partial<CareerSession['careerContext']>) => {
    setSessions(prev => {
      const updatedSessions = prev.map(session => {
        if (session.id !== sessionId || session.type !== 'career')
        {
          return session;
        }
        return {
          ...session,
          careerContext: {
            ...session.careerContext,
            ...context,
          },
          lastUpdated: Date.now(),
        } as CareerSession;
      });
      safePersistSessions(updatedSessions);
      return updatedSessions;
    });
  };

  const sendMessage = async (input: string, file?: File) => {
    console.log('sendMessage called:', { input: input.substring(0, 50) });

    let currentSession = getCurrentSession();
    
    // If no current session exists, create one automatically when user sends message
    if (!currentSession) {
      console.log('No current session found, creating new one for message');
      const newSession = createNewSession();
      
      queryClient.setQueryData(['chatSessions', newSession.id], newSession.messages);
      
      await sendMessageToWebhook(
        input,
        newSession.id,
        newSession.messages,
        file
      );
      return;
    }
    
    queryClient.setQueryData(['chatSessions', currentSession.id], currentSession.messages);
    
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
      safePersistSessions(updatedSessions);
      return updatedSessions;
    });
    const session = sessions.find(s => s.id === sessionId);
    toast.success(session?.favorite ? "Chat removed from favorites" : "Chat added to favorites");
  };

  return {
    sessions,
    currentSessionId,
    isLoading,
    isTyping,
    getCurrentSession,
    createNewSession,
    createNewCareerSession,
    deleteSession,
    renameSession,
    sendMessage,
    setCurrentSessionId,
    toggleFavorite,
    updateCareerContext,
    clearAllData,
    debugState,
  };
};
