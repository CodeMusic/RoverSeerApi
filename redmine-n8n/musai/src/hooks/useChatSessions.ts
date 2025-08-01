
import { useState, useEffect } from "react";
import { Message, ChatSession } from "@/types/chat";
import { v4 as uuidv4 } from 'uuid';
import { useMessageSender } from "./useMessageSender";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const queryClient = useQueryClient();



  const updateSession = (sessionId: string, messages: Message[]) => {
    setSessions(prev => {
      const updatedSessions = prev.map(session => 
        session.id === sessionId 
          ? { ...session, messages, lastUpdated: Date.now() }
          : session
      );
      // Immediately persist to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
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
    try {
      console.log('Loading sessions from localStorage');
      const savedSessions = localStorage.getItem(STORAGE_KEY);
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        console.log('Parsed sessions:', parsed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
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
  }, []); // Load sessions once on mount

  const createNewSession = () => {
    console.log('Creating new session');
    const newSession: ChatSession = {
      id: uuidv4(),
      type: 'chat',
      messages: [], // Start with empty messages to show PreMusaiPage
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      favorite: false
    };
    setSessions(prev => {
      const updatedSessions = [newSession, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
      console.log('Sessions after creating new:', updatedSessions.length);
      return updatedSessions;
    });
    setCurrentSessionId(newSession.id);
    return newSession.id;
  };

  const getCurrentSession = () => {
    return sessions.find(s => s.id === currentSessionId);
  };

  const deleteSession = (sessionId: string) => {
    setSessions(prev => {
      const remainingSessions = prev.filter(session => session.id !== sessionId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remainingSessions));
      
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
      return updatedSessions;
    });
    toast.success("Chat renamed successfully");
  };

  const sendMessage = async (input: string, file?: File) => {
    console.log('sendMessage called:', { input: input.substring(0, 50) });

    let currentSession = getCurrentSession();
    
    // If no current session exists, create one automatically when user sends message
    if (!currentSession) {
      console.log('No current session found, creating new one for message');
      const newSessionId = createNewSession();
      currentSession = sessions.find(s => s.id === newSessionId);
      if (!currentSession) {
        console.error('Failed to create new session');
        return;
      }
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
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
    deleteSession,
    renameSession,
    sendMessage,
    setCurrentSessionId,
    toggleFavorite,
    clearAllData,
    debugState,
  };
};
