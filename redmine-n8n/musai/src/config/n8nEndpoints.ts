/**
 * N8N API Endpoints Configuration
 * Centralized definitions for all webhook and automation endpoints
 */
import { fetchWithTimeout } from '@/utils/fetchWithTimeout';
import { TIMEOUTS } from '@/config/timeouts';

const resolveBaseUrl = (): string => {
  // Always use the hosted n8n instance
  return 'https://n8n.codemusic.ca/webhook';
};

export const N8N_ENDPOINTS = {
  BASE_URL: resolveBaseUrl(),

  // PreMusai Dynamic Content
  PREMUSAI: {
    GET_CONTENT: '/premusai/{type}',
    UPDATE_CONTENT: '/premusai/{type}',
    ANALYTICS_USAGE: '/premusai/analytics/usage',
    ANALYTICS_CLICKS: '/premusai/analytics/clicks',
    ANALYTICS_POPULAR: '/premusai/analytics/popular',
  },

  // MusaiChat Endpoints
  CHAT: {
    // Conversation management
    GET_CONVERSATION_STARTERS: '/chat/starters',
    GET_POPULAR_TOPICS: '/chat/topics/popular',
    GET_TEMPLATES: '/chat/templates',
    // Generic chat message endpoint (dev-friendly fallback)
    SEND_MESSAGE: '/chat/message',
    SUBMIT_CONVERSATION_FEEDBACK: '/chat/feedback',
    
    // Context and personalization
    ANALYZE_USER_STYLE: '/chat/analysis/style',
    GET_PERSONALIZED_SUGGESTIONS: '/chat/suggestions/personalized',
    TRACK_CONVERSATION_PATTERNS: '/chat/patterns/track',
    
    // AI personality adaptation
    UPDATE_AI_PERSONALITY: '/chat/ai/personality/update',
    GET_AI_MOOD_STATE: '/chat/ai/mood',
    CALIBRATE_RESPONSES: '/chat/ai/calibrate',
  },

  // MusaiSearch Endpoints  
  SEARCH: {
    // Search enhancement
    GET_TRENDING_TOPICS: '/search/trending',
    GET_SEARCH_SUGGESTIONS: '/search/suggestions',
    ENHANCE_QUERY: '/search/query/enhance',
    
    // Results processing
    AGGREGATE_SOURCES: '/search/sources/aggregate',
    FACT_CHECK_RESULTS: '/search/factcheck',
    PERSONALIZE_RESULTS: '/search/personalize',
    
    // Search analytics
    TRACK_SEARCH_PATTERNS: '/search/patterns/track',
    GET_SEARCH_INSIGHTS: '/search/insights',
    UPDATE_SEARCH_WEIGHTS: '/search/weights/update',
  },

  // Eye of Musai Endpoints (vision)
  EYE: {
    // Train a model/class from prompt and/or images
    TRAIN: '/eye/train',
    // Recognize/detect objects in an image
    RECOGNIZE: '/eye/recognize',
  },

  // CodeMusai Endpoints
  CODE: {
    // Code generation and assistance
    GENERATE_CODE_SNIPPETS: '/code/generate/snippets',
    GET_CODE_TEMPLATES: '/code/templates',
    ANALYZE_CODE_PATTERNS: '/code/analysis/patterns',
    
    // Project assistance
    SUGGEST_OPTIMIZATIONS: '/code/optimization/suggest',
    GENERATE_DOCUMENTATION: '/code/docs/generate',
    CODE_REVIEW_INSIGHTS: '/code/review/insights',
    
    // Learning and adaptation
    TRACK_CODING_STYLE: '/code/style/track',
    UPDATE_CODE_PREFERENCES: '/code/preferences/update',
    GET_SKILL_RECOMMENDATIONS: '/code/skills/recommend',
  },

  // MedicalMusai Endpoints
  MEDICAL: {
    // Begin intake with free text
    START_INTAKE: '/medical/intake/start',
    // Upload and ingest documents (pdf/images/text)
    INGEST_DOCUMENTS: '/medical/documents/ingest',
  },

  // MusaiUniversity Endpoints
  UNIVERSITY: {
    // Course and content generation
    GENERATE_COURSE_CONTENT: '/university/courses/generate',
    GET_LECTURE_TEMPLATES: '/university/lectures/templates',
    CREATE_ADAPTIVE_CURRICULUM: '/university/curriculum/adaptive',
    
    // Learning optimization
    TRACK_LEARNING_PROGRESS: '/university/progress/track',
    GET_LEARNING_INSIGHTS: '/university/analytics/insights',
    SUGGEST_NEXT_TOPICS: '/university/analytics/next-topics',
    
    // Content curation
    GET_CURATED_RESOURCES: '/university/resources/curated',
    UPDATE_COURSE_DIFFICULTY: '/university/courses/difficulty',
  },

  // MusaiTale (Narrative) Endpoints
  NARRATIVE: {
    // Story generation
    GET_STORY_SEEDS: '/narrative/seeds',
    GET_CHARACTER_TEMPLATES: '/narrative/characters/templates',
    GENERATE_PLOT_POINTS: '/narrative/plot/generate',
    
    // Emergent narrative
    ANALYZE_USER_THEMES: '/narrative/analysis/themes',
    GET_PERSONALIZED_ARCS: '/narrative/arcs/personalized',
    EVOLVE_CHARACTERS: '/narrative/characters/evolve',
    
    // Interactive elements
    GET_CHOICE_POINTS: '/narrative/choices',
    TRACK_NARRATIVE_DECISIONS: '/narrative/decisions/track',
    GET_ALTERNATIVE_PATHS: '/narrative/paths/alternatives',
  },

  // TherapyMusai Endpoints
  THERAPY: {
    // Journaling
    SAVE_JOURNAL_ENTRY: '/therapy/journal/save',
    LIST_JOURNAL_ENTRIES: '/therapy/journal/list',
    TAG_JOURNAL_ENTRY: '/therapy/journal/tag',
    
    // Sessions
    START_SESSION: '/therapy/session/start',
    UPDATE_SESSION_CONTEXT: '/therapy/session/context/update',
    ADVANCE_ARC: '/therapy/session/arc/advance',
    EXPORT_TO_NARRATIVE: '/therapy/session/export/narrative',
    
    // Metaphor & imagery
    GENERATE_SYMBOLIC_IMAGE: '/therapy/metaphor/image',
    GENERATE_PARTNER_PERSPECTIVE_IMAGE: '/therapy/metaphor/partner-image',
  },

  // AgileMusai (formerly TaskMusai) Endpoints
  TASK: {
    // Workflow automation
    GET_WORKFLOW_TEMPLATES: '/task/workflows/templates',
    GENERATE_AUTOMATION: '/task/automation/generate',
    GET_OPTIMIZATION_SUGGESTIONS: '/task/optimization',
    
    // Task management
    GET_TASK_SUGGESTIONS: '/task/suggestions',
    TRACK_PRODUCTIVITY: '/task/productivity/track',
    GET_EFFICIENCY_INSIGHTS: '/task/efficiency/insights',
    
    // Integration helpers
    GET_TOOL_INTEGRATIONS: '/task/integrations',
    SETUP_WEBHOOKS: '/task/webhooks/setup',

    // AgileMusai sprint orchestration (webhook workflows in n8n)
    START_SPRINT: '/task/sprint/start',
    GET_SPRINT_STATUS: '/task/sprint/status', // expects { sprintId }
    SUBMIT_SPRINT_FEEDBACK: '/task/sprint/feedback',
    STREAM_SPRINT_EVENTS: '/task/sprint/events', // optional: SSE or long-poll via n8n
  },

  // CareerMusai Endpoints
  CAREER: {
    // Scouts (scheduled searches)
    SCHEDULE_SCOUT: '/career/scout/schedule',
    CANCEL_SCOUT: '/career/scout/cancel',
    LIST_SCOUTS: '/career/scout/list',

    // Alerts & materials produced by n8n runs
    LIST_ALERTS: '/career/alerts',
    ACK_ALERT: '/career/alerts/ack',
    GET_MATERIALS: '/career/materials',
  },

  // 🌟 MUSAI'S CURATIONS - The Emergent AI Content System
  CURATIONS: {
    // Main curation content
    GET_CURRENT_CURATIONS: '/curations/current',
    GET_CURATION_HISTORY: '/curations/history',
    TRIGGER_NEW_CURATION: '/curations/generate/trigger',
    
    // Approval workflow
    APPROVE_FOR_PUBLIC: '/curations/approve/public',
    GET_APPROVAL_STATUS: '/curations/approval/status',
    REJECT_CURATIONS: '/curations/approval/reject',
    
    // User pattern analysis (for AI emergence)
    GET_USER_PATTERNS: '/curations/patterns/user',
    GET_AI_EVOLUTION_STATE: '/curations/patterns/ai-evolution',
    UPDATE_AI_LEARNING: '/curations/patterns/update-learning',
    
    // Content generation
    GENERATE_NEWS_DIGEST: '/curations/generate/news',
    GENERATE_IMAGES: '/curations/generate/images', // ComfyUI integration
    GENERATE_INTERACTIVE_CONTENT: '/curations/generate/interactive',
    GENERATE_PHILOSOPHICAL_INSIGHTS: '/curations/generate/philosophy',
    
    // Feedback loops
    SUBMIT_CURATION_FEEDBACK: '/curations/feedback/submit',
    GET_ENGAGEMENT_METRICS: '/curations/feedback/metrics',
    UPDATE_PREFERENCE_WEIGHTS: '/curations/feedback/weights',
    
    // Emergence tracking
    TRACK_AI_PERSONALITY_DRIFT: '/curations/emergence/personality-drift',
    GET_REFLECTION_INSIGHTS: '/curations/emergence/reflections',
    GENERATE_META_COMMENTARY: '/curations/emergence/meta-commentary',
    
    // Content categories
    GET_VISUAL_CONTENT: '/curations/content/visual',
    GET_EXPERIMENTAL_CONTENT: '/curations/content/experiments',
    GET_MUSIC_CURATIONS: '/curations/content/music',
    GET_READING_LISTS: '/curations/content/reading',
    GET_CREATIVE_PROMPTS: '/curations/content/creative-prompts',
  },

  // External Integrations
  INTEGRATIONS: {
    // ComfyUI for image generation
    COMFYUI_GENERATE: '/integrations/comfyui/generate',
    COMFYUI_STATUS: '/integrations/comfyui/status',
    COMFYUI_QUEUE: '/integrations/comfyui/queue',
    
    // News and content aggregation
    NEWS_AGGREGATE: '/integrations/news/aggregate',
    CONTENT_SCRAPE: '/integrations/content/scrape',
    SOCIAL_TRENDS: '/integrations/social/trends',
    
    // AI model integrations
    LLM_GENERATE: '/integrations/llm/generate',
    EMBEDDINGS_CREATE: '/integrations/embeddings/create',
    SEMANTIC_SEARCH: '/integrations/semantic/search',
  },

  // MusaiStudio (Audio generation & TTS)
  STUDIO: {
    GENERATE_MUSIC_LOOP: '/studio/generate/music-loop',
    GENERATE_SFX_LOOP: '/studio/generate/sfx-loop',
    TTS_PIPER: '/studio/tts/piper',
    VOICE_TRAIN: '/studio/voice/train',
  },

  // Analytics and Learning
  ANALYTICS: {
    // User behavior tracking
    USAGE_PATTERNS: '/analytics/usage-patterns',
    AI_ADAPTATION: '/analytics/ai-adaptation',
    USER_JOURNEY: '/analytics/user-journey',
    BEHAVIOR_CHANGES: '/analytics/behavior-changes',
    
    // AI evolution tracking
    PERSONALITY_EVOLUTION: '/analytics/personality-evolution',
    AI_ALIGNMENT: '/analytics/ai-alignment',
    PERFORMANCE: '/analytics/performance',
    
    // System optimization
    UPDATE_WEIGHTS: '/analytics/update-weights',
    CALIBRATE: '/analytics/calibrate',
    TRACK_USER_JOURNEY: '/analytics/track-user-journey',
  }
} as const;

/**
 * N8N API Helper Class
 * Provides convenient methods for interacting with n8n webhooks
 */
class N8NApiHelper {
  private baseUrl: string;

  constructor() {
    this.baseUrl = N8N_ENDPOINTS.BASE_URL;
  }

  // === CareerMusai helpers ===
  async scheduleCareerScout(config: {
    query: string;
    presentation: string;
    email?: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    time?: string;
    userId?: string;
  }): Promise<{ id: string } | null> {
    try {
      const response = await fetchWithTimeout(
        this.getEndpointUrl(N8N_ENDPOINTS.CAREER.SCHEDULE_SCOUT),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...config, timestamp: Date.now() })
        },
        TIMEOUTS.API_REQUEST
      );
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.warn('Failed to schedule career scout:', error);
      return null;
    }
  }

  async listCareerAlerts(userId?: string): Promise<Array<{ id: string; type: string; title: string; description: string; timestamp: number; priority?: string; actionUrl?: string; isRead?: boolean }>> {
    try {
      const url = new URL(this.getEndpointUrl(N8N_ENDPOINTS.CAREER.LIST_ALERTS));
      if (userId) url.searchParams.set('userId', userId);
      const response = await fetchWithTimeout(
        url.toString(),
        { method: 'GET' },
        TIMEOUTS.API_REQUEST
      );
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.warn('Failed to list career alerts:', error);
      return [];
    }
  }

  async acknowledgeCareerAlert(alertId: string): Promise<boolean> {
    try {
      const response = await fetchWithTimeout(
        this.getEndpointUrl(N8N_ENDPOINTS.CAREER.ACK_ALERT),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ alertId, timestamp: Date.now() })
        },
        TIMEOUTS.API_REQUEST
      );
      return response.ok;
    } catch (error) {
      console.warn('Failed to acknowledge career alert:', error);
      return false;
    }
  }

  // Get full URL for any endpoint
  getEndpointUrl(endpoint: string): string {
    return `${this.baseUrl}${endpoint}`;
  }

  // Check if n8n service is available
  async isServiceAvailable(): Promise<boolean> {
    try {
      const response = await fetchWithTimeout(
        `${this.baseUrl}/health`,
        { method: 'GET' },
        TIMEOUTS.API_REQUEST
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  // Trigger curation generation (runs every few hours automatically)
  async triggerCurationGeneration(userContext?: any): Promise<boolean> {
    try {
      const response = await fetchWithTimeout(
        this.getEndpointUrl(N8N_ENDPOINTS.CURATIONS.TRIGGER_NEW_CURATION),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userContext, timestamp: Date.now() })
        },
        TIMEOUTS.API_REQUEST
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  // Submit user interaction for AI learning
  async submitInteraction(toolType: string, action: string, context: any): Promise<void> {
    try {
      await fetchWithTimeout(
        this.getEndpointUrl(N8N_ENDPOINTS.ANALYTICS.TRACK_USER_JOURNEY),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolType, action, context, timestamp: Date.now() })
        },
        TIMEOUTS.API_REQUEST
      );
    } catch (error) {
      console.warn('Failed to submit interaction:', error);
    }
  }

  // Submit curation feedback
  async submitCurationFeedback(curationId: string, feedback: 'like' | 'dislike' | 'love' | 'meh', comment?: string): Promise<boolean> {
    try {
      const response = await fetchWithTimeout(
        this.getEndpointUrl(N8N_ENDPOINTS.CURATIONS.SUBMIT_CURATION_FEEDBACK),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            curationId, 
            feedback, 
            comment, 
            timestamp: Date.now(),
            userAgent: navigator.userAgent 
          })
        },
        TIMEOUTS.API_REQUEST
      );
      return response.ok;
    } catch (error) {
      console.error('Failed to submit curation feedback:', error);
      return false;
    }
  }

  // === MusaiStudio helpers ===
  private async postJsonForBlob(endpoint: string, body: any): Promise<Blob | null>
  {
    try
    {
      const response = await fetchWithTimeout(
        this.getEndpointUrl(endpoint),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, timestamp: Date.now() })
        },
        TIMEOUTS.API_REQUEST
      );
      if (!response.ok) return null;
      return await response.blob();
    }
    catch (error)
    {
      console.warn('Studio request failed:', error);
      return null;
    }
  }

  async generateMusicLoop(prompt: string, seconds: number, style?: string): Promise<Blob | null>
  {
    return this.postJsonForBlob(N8N_ENDPOINTS.STUDIO.GENERATE_MUSIC_LOOP, { prompt, seconds, style });
  }

  async generateSfxLoop(prompt: string, seconds: number): Promise<Blob | null>
  {
    return this.postJsonForBlob(N8N_ENDPOINTS.STUDIO.GENERATE_SFX_LOOP, { prompt, seconds });
  }

  async ttsPiper(text: string, voice?: string, speed?: number): Promise<Blob | null>
  {
    return this.postJsonForBlob(N8N_ENDPOINTS.STUDIO.TTS_PIPER, { text, voice, speed });
  }
}

export const n8nApi = new N8NApiHelper();