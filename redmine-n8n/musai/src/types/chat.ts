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

// Base interface for all session types
export interface BaseSession {
  id: string;
  name?: string;
  lastUpdated: number;
  favorite: boolean;
  createdAt: number;
  type: 'chat' | 'dev' | 'search' | 'university' | 'task' | 'narrative' | 'career' | 'therapy';
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

export interface CareerSession extends BaseSession {
  type: 'career';
  messages: Message[];
  careerContext?: {
    currentRole?: string;
    targetRole?: string;
    skills?: string[];
    experience?: string;
    location?: string;
    salaryRange?: string;
    preferences?: string[];
  };
}

export interface TherapySession extends BaseSession {
  type: 'therapy';
  messages: Message[];
  therapyContext?: {
    sessionGoals?: string[];
    moodTags?: string[];
    currentMood?: string;
    sessionType?: 'reflection' | 'problem-solving' | 'general' | 'crisis';
    privacyLevel?: 'private' | 'exportable';
    narrativeExports?: string[]; // IDs of exported tales
  };
}

// Union type for all session types
export type AllSessions = ChatSession | CareerSession | NarrativeSession | DevSession | SearchSession | UniversitySession | TaskSession | TherapySession;