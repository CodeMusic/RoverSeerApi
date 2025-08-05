// Application-wide constants for consistent naming and labels

export const APP_TERMS = {
  // Tool Names
  CHAT: "MusaiChat",
  SEARCH: "MusaiSearch", 
  CODE: "CodeMusai",
  UNIVERSITY: "Musai U",
  NARRATIVE: "MusaiTale",
  TASK: "TaskMusai",
  CAREER: "CareerMusai",
  SETTINGS: "Settings",
  
  // Badges
  CHAT_BADGE: "Conversational AI",
  SEARCH_BADGE: "Intelligent Discovery",
  CODE_BADGE: "Interactive Playground",
  UNIVERSITY_BADGE: "Generative Learning",
  NARRATIVE_BADGE: "Story Emergence",
  TASK_BADGE: "Intelligent Automation",
  CAREER_BADGE: "Career Development",
  
  // Descriptions
  CHAT_DESCRIPTION: "Natural dialogue with your AI companion for any topic",
  SEARCH_DESCRIPTION: "AI-powered search with comprehensive insights and analysis",
  CODE_DESCRIPTION: "Write, run, and experiment with code in multiple programming languages",
  UNIVERSITY_DESCRIPTION: "Generative emergent learning",
  NARRATIVE_DESCRIPTION: "Where thoughts become stories through emergent narrative",
  TASK_DESCRIPTION: "Automate your workflow with intelligent task management and AI assistance",
  CAREER_DESCRIPTION: "AI-powered career development and job search assistance",
  
  // Tab IDs
  TAB_CHAT: "chat",
  TAB_SEARCH: "musai-search",
  TAB_CODE: "code-musai",
  TAB_UNIVERSITY: "musai-university",
  TAB_NARRATIVE: "emergent-narrative",
  TAB_TASK: "task-musai",
  TAB_CAREER: "career-musai",
  TAB_SETTINGS: "settings",
  
  // PreMusai Types
  PREMUSAI_CHAT: "chat",
  PREMUSAI_SEARCH: "search",
  PREMUSAI_CODE: "code",
  PREMUSAI_UNIVERSITY: "university",
  PREMUSAI_NARRATIVE: "narrative",
  PREMUSAI_TASK: "task",
  PREMUSAI_CAREER: "career",
  
  // Session Types
  SESSION_CHAT: "chat",
  SESSION_NARRATIVE: "narrative",
  SESSION_CODE: "code",
  SESSION_SEARCH: "search",
  SESSION_UNIVERSITY: "university",
  SESSION_CAREER: "career",
  
  // Navigation Labels
  NAV_CHAT: "MusaiChat",
  NAV_SEARCH: "MusaiSearch",
  NAV_CODE: "CodeMusai", 
  NAV_UNIVERSITY: "Musai U",
  NAV_NARRATIVE: "MusaiTale",
  NAV_TASK: "TaskMusai",
  NAV_CAREER: "CareerMusai",
  NAV_SETTINGS: "Settings",
  
  // Page Titles
  PAGE_CHAT: "MusaiChat",
  PAGE_SEARCH: "MusaiSearch",
  PAGE_CODE: "CodeMusai",
  PAGE_UNIVERSITY: "Musai U",
  PAGE_NARRATIVE: "MusaiTale",
  PAGE_TASK: "TaskMusai",
  PAGE_CAREER: "CareerMusai",
  
  // Common Actions
  ACTION_NEW: "New",
  ACTION_CREATE: "Create",
  ACTION_DELETE: "Delete",
  ACTION_RENAME: "Rename",
  ACTION_SAVE: "Save",
  ACTION_CANCEL: "Cancel",
  ACTION_CLOSE: "Close",
  
  // Status Messages
  STATUS_LOADING: "Loading...",
  STATUS_SAVING: "Saving...",
  STATUS_ERROR: "Error",
  STATUS_SUCCESS: "Success",
  
  // Placeholder Text
  PLACEHOLDER_SEARCH: "Search for anything...",
  PLACEHOLDER_CHAT: "Type your message...",
  PLACEHOLDER_CODE: "Enter your code...",
  PLACEHOLDER_NARRATIVE: "Start your story...",
  PLACEHOLDER_TASK: "Describe your task...",
  PLACEHOLDER_CAREER: "What job are you looking for?",
  
  // Error Messages
  ERROR_GENERIC: "Something went wrong",
  ERROR_NETWORK: "Network error",
  ERROR_TIMEOUT: "Request timed out",
  ERROR_VALIDATION: "Please check your input",
  
  // Success Messages
  SUCCESS_SAVED: "Saved successfully",
  SUCCESS_CREATED: "Created successfully",
  SUCCESS_DELETED: "Deleted successfully",
  SUCCESS_UPDATED: "Updated successfully",
} as const;

// Type-safe access to constants
export type AppTerm = keyof typeof APP_TERMS;
export type AppTermValue = typeof APP_TERMS[AppTerm];

// Helper function to get constants with fallback
export const getAppTerm = (key: AppTerm, fallback?: string): string => {
  return APP_TERMS[key] || fallback || key;
}; 