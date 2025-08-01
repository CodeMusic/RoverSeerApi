export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
  thoughts?: string; // AI internal thoughts for think tags
  imageData?: {
    data: string;
    mimeType: string;
    fileName: string;
  };
}

export interface ChatSession {
  id: string;
  name?: string;
  messages: Message[];
  createdAt: number;
  lastUpdated: number;
  favorite?: boolean;
}

// Base interface for all session types
export interface BaseSession {
  id: string;
  name?: string;
  lastUpdated: number;
  favorite: boolean;
  createdAt: number;
  type: 'chat' | 'dev' | 'search' | 'university' | 'task' | 'narrative';
}

export interface ChatSession extends BaseSession {
  type: 'chat';
  messages: Message[];
}

export interface DevSession extends BaseSession {
  type: 'dev';
  language: string;
  code: string;
  output?: string;
  chatMessages: Message[];
}

export interface SearchSession extends BaseSession {
  type: 'search';
  queries: string[];
  results?: any[];
}

export interface UniversitySession extends BaseSession {
  type: 'university';
  courseId?: string;
  lectureId?: string;
  progress?: number;
}

export interface TaskSession extends BaseSession {
  type: 'task';
  tasks: any[];
  status: 'active' | 'completed' | 'paused';
}

export interface NarrativeSession extends BaseSession {
  type: 'narrative';
  storyData: any[];
  currentChapter?: number;
}

// Legacy interface - update to extend BaseSession
export interface ChatSessionLegacy {
  id: string;
  name?: string;
  messages: Message[];
  createdAt: number;
  lastUpdated: number;
  favorite?: boolean;
}