// Application-wide constants for consistent naming and labels

export const APP_TERMS = {
  // Tool Names
  CHAT: "MusaiChat",
  SEARCH: "MusaiSearch", 
  CODE: "CodeMusai",
  UNIVERSITY: "Musai U",
  NARRATIVE: "MusaiTale",
  TASK: "AgileMusai",
  CAREER: "CareerMusai",
  THERAPY: "TherapyMusai",
  MEDICAL: "MedicalMusai",
  EYE: "The Eye of Musai",
  SETTINGS: "Settings",
  
  // Badges
  CHAT_BADGE: "Conversational AI",
  SEARCH_BADGE: "Intelligent Discovery",
  CODE_BADGE: "Interactive Playground",
  UNIVERSITY_BADGE: "Generative Learning",
  NARRATIVE_BADGE: "Story Emergence",
  TASK_BADGE: "Agile Orchestration",
  CAREER_BADGE: "Career Development",
  THERAPY_BADGE: "Mental Wellness",
  MEDICAL_BADGE: "Health Navigation",
  EYE_BADGE: "Contextual Vision",
  
  // Descriptions
  CHAT_DESCRIPTION: "Natural dialogue with your AI companion for any topic",
  SEARCH_DESCRIPTION: "AI-powered search with comprehensive insights and analysis",
  CODE_DESCRIPTION: "Write, run, and experiment with code in multiple programming languages",
  UNIVERSITY_DESCRIPTION: "Generative emergent learning",
  NARRATIVE_DESCRIPTION: "Where thoughts become stories through emergent narrative",
  TASK_DESCRIPTION: "Plan sprints, orchestrate tasks, and adapt quickly with AI support",
  CAREER_DESCRIPTION: "AI-powered career development and job search assistance",
  THERAPY_DESCRIPTION: "AI-powered mental wellness support and therapeutic conversations",
  MEDICAL_DESCRIPTION: "A meta-copilot that integrates specialists, GP insights, therapy context, and research into one clear flight plan for your health.",
  EYE_DESCRIPTION: "A contextual vision engine with MusaiDex—index anything, blend YOLO-style vision with language to understand form and meaning.",
  
  // Tab IDs
  TAB_CHAT: "chat",
  TAB_SEARCH: "musai-search",
  TAB_CODE: "code-musai",
  TAB_UNIVERSITY: "musai-university",
  TAB_NARRATIVE: "emergent-narrative",
  TAB_TASK: "agile-musai",
  TAB_CAREER: "career-musai",
  TAB_THERAPY: "therapy-musai",
  TAB_MEDICAL: "medical-musai",
  TAB_EYE: "musai-eye",
  TAB_SETTINGS: "settings",
  
  // PreMusai Types
  PREMUSAI_CHAT: "chat",
  PREMUSAI_SEARCH: "search",
  PREMUSAI_CODE: "code",
  PREMUSAI_UNIVERSITY: "university",
  PREMUSAI_NARRATIVE: "narrative",
  PREMUSAI_TASK: "task",
  PREMUSAI_CAREER: "career",
  PREMUSAI_THERAPY: "therapy",
  PREMUSAI_MEDICAL: "medical",
  PREMUSAI_EYE: "eye",
  
  // Session Types
  SESSION_CHAT: "chat",
  SESSION_NARRATIVE: "narrative",
  SESSION_CODE: "code",
  SESSION_SEARCH: "search",
  SESSION_UNIVERSITY: "university",
  SESSION_CAREER: "career",
  SESSION_THERAPY: "therapy",
  // Eye will initially reuse chat sessions
  
  // Navigation Labels
  NAV_CHAT: "MusaiChat",
  NAV_SEARCH: "MusaiSearch",
  NAV_CODE: "CodeMusai", 
  NAV_UNIVERSITY: "Musai U",
  NAV_NARRATIVE: "MusaiTale",
  NAV_TASK: "AgileMusai",
  NAV_CAREER: "CareerMusai",
  NAV_THERAPY: "TherapyMusai",
  NAV_MEDICAL: "MedicalMusai",
  NAV_EYE: "The Eye of Musai",
  NAV_SETTINGS: "Settings",
  
  // Page Titles
  PAGE_CHAT: "MusaiChat",
  PAGE_SEARCH: "MusaiSearch",
  PAGE_CODE: "CodeMusai",
  PAGE_UNIVERSITY: "Musai U",
  PAGE_NARRATIVE: "MusaiTale",
  PAGE_TASK: "AgileMusai",
  PAGE_CAREER: "CareerMusai",
  PAGE_MEDICAL: "MedicalMusai",
  
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
  PLACEHOLDER_TASK: "Describe your sprint or task...",
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

// Canonical module identifiers for n8n payloads
export const MUSAI_MODULES = {
  CHAT: 'ChatMusai',
  SEARCH: 'SearchMusai',
  CODE: 'CodeMusai',
  UNIVERSITY: 'UniversityMusai',
  NARRATIVE: 'NarrativeMusai',
  TASK: 'TaskMusai',
  CAREER: 'CareerMusai',
  THERAPY: 'TherapyMusai',
  MEDICAL: 'MedicalMusai',
  EYE: 'EyeOfMusai',
} as const;

// Canonical tool order (tab IDs and special pseudo-ids)
// Keep Agile (Task) last. Include Studio and Curations before Agile.
export const CANONICAL_TOOL_ORDER: string[] = [
  APP_TERMS.TAB_CHAT,
  APP_TERMS.TAB_SEARCH,
  APP_TERMS.TAB_EYE,
  APP_TERMS.TAB_CODE,
  APP_TERMS.TAB_UNIVERSITY,
  APP_TERMS.TAB_NARRATIVE,
  APP_TERMS.TAB_MEDICAL,
  APP_TERMS.TAB_THERAPY,
  'curations',
  APP_TERMS.TAB_CAREER,
  'studio',
  APP_TERMS.TAB_TASK,
];

// Type-safe access to constants
export type AppTerm = keyof typeof APP_TERMS;
export type AppTermValue = typeof APP_TERMS[AppTerm];

// Helper function to get constants with fallback
export const getAppTerm = (key: AppTerm, fallback?: string): string => {
  return APP_TERMS[key] || fallback || key;
}; 

// Chromatic systems for tool theming
export type MusaiTone = {
  note: 'C'|'C#'|'Db'|'D'|'D#'|'Eb'|'E'|'F'|'F#'|'Gb'|'G'|'G#'|'Ab'|'A'|'A#'|'Bb'|'B';
  label: string;
  meaning: string;
  hex: string;
};

// Primary 7-tone sequence (true ROYGBIV)
export const MUSAI_CHROMATIC_7: MusaiTone[] = [
  { note: 'C', label: 'Red', meaning: 'Root note, pure energy', hex: '#FF0000' },
  { note: 'D', label: 'Orange', meaning: 'Creative drive, forward motion', hex: '#FFA500' },
  { note: 'E', label: 'Yellow', meaning: 'Illumination, expressive clarity', hex: '#FFFF00' },
  { note: 'F', label: 'Green', meaning: 'Fresh growth, balance, restoration', hex: '#00FF00' },
  { note: 'G', label: 'Blue', meaning: 'Expansive focus, calm precision', hex: '#0000FF' },
  { note: 'A', label: 'Indigo', meaning: 'Intuitive depth, passionate inquiry', hex: '#4B0082' },
  { note: 'B', label: 'Violet', meaning: 'Resolution, completion, transcendence', hex: '#9400D3' },
];

// Extended 12-tone sequence aligned to musical chromatic steps
// Sharps (C#, D#, F#, G#, A#) are dual-valence blends between primaries
export const MUSAI_CHROMATIC_12: MusaiTone[] = [
  { note: 'C',  label: 'Red',            meaning: 'Root note, pure energy',                 hex: '#FF0000' },
  { note: 'C#', label: 'Red-Orange',     meaning: 'Transitional activation between Red→Orange', hex: '#FF4500' },
  { note: 'D',  label: 'Orange',         meaning: 'Creative drive, forward motion',         hex: '#FFA500' },
  { note: 'D#', label: 'Orange-Yellow',  meaning: 'Bright anticipation, Orange→Yellow',     hex: '#FFC300' },
  { note: 'E',  label: 'Yellow',         meaning: 'Illumination, expressive clarity',       hex: '#FFFF00' },
  { note: 'F',  label: 'Green',          meaning: 'Fresh growth, balance, restoration',     hex: '#00FF00' },
  { note: 'F#', label: 'Green-Blue',     meaning: 'Cooling transition, Green→Blue',         hex: '#00B2FF' },
  { note: 'G',  label: 'Blue',           meaning: 'Expansive focus, calm precision',        hex: '#0000FF' },
  { note: 'G#', label: 'Blue-Indigo',    meaning: 'Deepening focus, Blue→Indigo',           hex: '#3A32B8' },
  { note: 'A',  label: 'Indigo',         meaning: 'Intuitive depth, passionate inquiry',    hex: '#4B0082' },
  { note: 'A#', label: 'Indigo-Purple',  meaning: 'Tension before release, Indigo→Purple',  hex: '#6E2CA5' },
  { note: 'B',  label: 'Purple',         meaning: 'Resolution, completion, transcendence',  hex: '#9400D3' },
];

// Assign colors to a list of tool tab IDs using 7-tone if <=7 tools, otherwise 12-tone
export function assignToolColors(toolTabIds: string[]): Record<string, string> {
  const palette = toolTabIds.length <= 7 ? MUSAI_CHROMATIC_7 : MUSAI_CHROMATIC_12;
  const colors: Record<string, string> = {};
  toolTabIds.forEach((id, index) => {
    const tone = palette[index % palette.length];
    colors[id] = tone.hex;
  });
  return colors;
}

// Legacy fixed mapping kept as fallback
export const MUSAI_COLORS: Record<string, string> = {
  [APP_TERMS.TAB_CHAT]: '#FF0000',
  [APP_TERMS.TAB_SEARCH]: '#FF7F00',
  [APP_TERMS.TAB_CODE]: '#FFD400',
  [APP_TERMS.TAB_UNIVERSITY]: '#9ACD32',
  [APP_TERMS.TAB_NARRATIVE]: '#2563EB',
  [APP_TERMS.TAB_CAREER]: '#4B0082',
  [APP_TERMS.TAB_TASK]: '#9400D3',
  [APP_TERMS.TAB_THERAPY]: '#FF69B4',
  [APP_TERMS.TAB_MEDICAL]: '#16A34A',
  [APP_TERMS.TAB_EYE]: '#06B6D4',
  [APP_TERMS.TAB_SETTINGS]: '#808080',
};

// Beta flags for visibility of agent internals
export const DEBUG_FLAGS = {
  // When true, remove or collapse any <think> tags or internal thought content in UI
  hideThinkingTags: (typeof window !== 'undefined' && (window as any).env?.VITE_HIDE_THINKING_TAGS) ?? import.meta.env.VITE_HIDE_THINKING_TAGS ?? 'true',
  // When true, hide bicameral intermediate outputs; when false (beta), show them
  hideBicameralVoiceOutput: (typeof window !== 'undefined' && (window as any).env?.VITE_HIDE_BICAMERAL_VOICE_OUTPUT) ?? import.meta.env.VITE_HIDE_BICAMERAL_VOICE_OUTPUT ?? 'false',
  // When true, always show the system status bar on public/info pages as well.
  // Default is false so the status bar only appears within the gated app experience.
  showStatusBarOutsideApp: (typeof window !== 'undefined' && (window as any).env?.VITE_SHOW_STATUS_BAR_OUTSIDE_APP) ?? import.meta.env.VITE_SHOW_STATUS_BAR_OUTSIDE_APP ?? 'false',
};