/**
 * Application-wide configuration
 * Central place for all configurable values
 */

import ROUTES from './routes';

export const APP_CONFIG = {
  // Application Info
  APP_NAME: 'Musai',
  APP_DESCRIPTION: 'Your AI-powered creative companion',
  
  // Main Routes
  MAIN_APP_ROUTE: ROUTES.MAIN_APP,
  
  // API Configuration
  API_TIMEOUT: 30000, // 30 seconds
  
  // UI Configuration
  NAVIGATION_TRANSITION_DURATION: 300, // milliseconds
  
  // Feature Flags
  FEATURES: {
    UNIVERSITY_MODULE: true,
    NARRATIVE_MODULE: true,
    SEARCH_MODULE: true,
    CODE_MODULE: true,
  },
  
  // Tool Configuration
  TOOLS: {
    CHAT: {
      NAME: 'MusaiChat',
      BADGE: 'Conversational AI',
      DESCRIPTION: 'Natural dialogue with your AI companion for any topic'
    },
    SEARCH: {
      NAME: 'MusaiSearch', 
      BADGE: 'Intelligent Discovery',
      DESCRIPTION: 'AI-powered search with comprehensive insights and analysis'
    },
    CODE: {
      NAME: 'CodeMusai',
      BADGE: 'Interactive Playground', 
      DESCRIPTION: 'Write, run, and experiment with code in multiple programming languages'
    },
    UNIVERSITY: {
      NAME: 'MusaiUniversity',
      BADGE: 'Generative Learning',
      DESCRIPTION: 'Create and explore AI-powered courses and educational content'
    },
    NARRATIVE: {
      NAME: 'MusaiTale',
      BADGE: 'Story Emergence',
      DESCRIPTION: 'Where thoughts become stories through emergent narrative'
    }
  }
} as const;

export default APP_CONFIG;