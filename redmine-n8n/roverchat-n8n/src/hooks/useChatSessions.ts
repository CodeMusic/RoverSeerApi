
import { useState, useEffect } from "react";
import { Message, ChatSession } from "@/types/chat";
import { v4 as uuidv4 } from 'uuid';
import { useMessageSender } from "./useMessageSender";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const STORAGE_VERSION = "v1";
const STORAGE_KEY = `chat_sessions_${STORAGE_VERSION}`;
const INTERACTION_LIMIT = 5; // Number of interactions before requiring signup
const SECRET_CODE = "c0d3musai";
const UNLOCKED_KEY = "musai_unlocked";

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

console.log('DEFAULT_WELCOME_MESSAGE:', "Welcome to the chat!.");

const WELCOME_MESSAGE = window.env?.VITE_WELCOME_MESSAGE || import.meta.env.VITE_WELCOME_MESSAGE || "Welcome to the chat!";

console.log('WELCOME_MESSAGE sources:');
console.log('- window.env.VITE_WELCOME_MESSAGE:', window.env?.VITE_WELCOME_MESSAGE);
console.log('- import.meta.env.VITE_WELCOME_MESSAGE:', import.meta.env.VITE_WELCOME_MESSAGE);
console.log('Selected WELCOME_MESSAGE:', WELCOME_MESSAGE);

export const useChatSessions = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [hasReachedLimit, setHasReachedLimit] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const queryClient = useQueryClient();

  // Check if user is unlocked on mount
  useEffect(() => {
    const unlocked = localStorage.getItem(UNLOCKED_KEY) === 'true';
    setIsUnlocked(unlocked);
  }, []);

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

  // Calculate total interactions across all sessions
  const getTotalInteractions = () => {
    return sessions.reduce((total, session) => {
      // Count user messages (interactions)
      const userMessages = session.messages.filter(msg => msg.role === 'user');
      return total + userMessages.length;
    }, 0);
  };

  // Check if user has reached the interaction limit
  const checkInteractionLimit = () => {
    // If unlocked, no limit applies
    if (isUnlocked) {
      setHasReachedLimit(false);
      return false;
    }
    
    const totalInteractions = getTotalInteractions();
    const reached = totalInteractions >= INTERACTION_LIMIT;
    setHasReachedLimit(reached);
    return reached;
  };

  // Unlock the user with secret code
  const unlockUser = (code: string) => {
    if (code === SECRET_CODE) {
      setIsUnlocked(true);
      localStorage.setItem(UNLOCKED_KEY, 'true');
      setHasReachedLimit(false);
      toast.success("Access unlocked! You now have unlimited interactions.");
      return true;
    }
    return false;
  };

  useEffect(() => {
    try {
      const savedSessions = localStorage.getItem(STORAGE_KEY);
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setCurrentSessionId(parsed[0].id);
          checkInteractionLimit();
        } else {
          createNewSession();
        }
      } else {
        createNewSession();
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      createNewSession();
    }
  }, [isUnlocked]); // Re-check limit when unlock status changes

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: uuidv4(),
      messages: [{
        id: uuidv4(),
        content: WELCOME_MESSAGE,
        role: "assistant",
        timestamp: Date.now(),
      }],
      createdAt: Date.now(),
      lastUpdated: Date.now(),
    };
    setSessions(prev => {
      const updatedSessions = [newSession, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
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
      checkInteractionLimit();
      
      if (sessionId === currentSessionId) {
        if (remainingSessions.length > 0) {
          setCurrentSessionId(remainingSessions[0].id);
        } else {
          // If no sessions remain, create a new one
          setTimeout(createNewSession, 0);
        }
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
    // Check if user has reached the interaction limit (unless unlocked)
    if (hasReachedLimit && !isUnlocked) {
      toast.error("You've reached the interaction limit. Sign up coming soon!");
      return;
    }

    const currentSession = getCurrentSession();
    if (!currentSession) {
      console.error('No current session found');
      return;
    }
    
    queryClient.setQueryData(['chatSessions', currentSession.id], currentSession.messages);
    
    await sendMessageToWebhook(
      input,
      currentSession.id,
      currentSession.messages,
      file
    );

    // Check limit after sending message
    setTimeout(() => {
      checkInteractionLimit();
    }, 100);
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
    hasReachedLimit,
    isUnlocked,
    getCurrentSession,
    createNewSession,
    deleteSession,
    renameSession,
    sendMessage,
    setCurrentSessionId,
    toggleFavorite,
    unlockUser,
  };
};
