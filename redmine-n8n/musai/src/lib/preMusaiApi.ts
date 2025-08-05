import { fetchWithTimeout } from '@/utils/fetchWithTimeout';

// Clean object structures for PreMusai content
export interface PreMusaiExample {
  id: string;
  text: string;
  category?: string;
  popularity?: number;
}

export interface PreMusaiQuickAction {
  id: string;
  icon: string; // Icon name as string for n8n compatibility
  title: string;
  description: string;
  actionType: 'submit' | 'navigate' | 'function';
  actionData?: any; // For submit text, navigation path, etc.
}

export interface PreMusaiContent {
  type: string;
  title: string;
  subtitle: string;
  placeholder: string;
  examples: PreMusaiExample[];
  quickActions: PreMusaiQuickAction[];
}

// Default/fallback content with working actions
const defaultContent: Record<string, PreMusaiContent> = {
  chat: {
    type: 'chat',
    title: 'MusaiChat',
    subtitle: 'Start a natural conversation with your AI assistant. Ask questions, brainstorm ideas, or just chat.',
    placeholder: "What's on your mind?",
    examples: [
      { id: 'chat-1', text: 'Explain a complex topic', category: 'learning' },
      { id: 'chat-2', text: 'Help me brainstorm ideas', category: 'creativity' },
      { id: 'chat-3', text: 'Review my writing', category: 'productivity' },
      { id: 'chat-4', text: 'Answer a question', category: 'general' },
      { id: 'chat-5', text: 'Provide advice on personal decisions', category: 'advice' }
    ],
    quickActions: [
      {
        id: 'chat-new',
        icon: 'MessageSquare',
        title: 'New Conversation',
        description: 'Start fresh discussion',
        actionType: 'function'
      },
      {
        id: 'chat-templates',
        icon: 'FileText', 
        title: 'Templates',
        description: 'Use conversation templates',
        actionType: 'submit',
        actionData: 'Show me conversation templates'
      },
      {
        id: 'chat-popular',
        icon: 'TrendingUp',
        title: 'Popular Questions', 
        description: 'See common topics',
        actionType: 'submit',
        actionData: 'What are the most popular topics people ask about?'
      }
    ]
  },
  
  search: {
    type: 'search',
    title: 'MusaiSearch',
    subtitle: 'Intelligent search powered by AI. Get comprehensive answers and insights on any topic.',
    placeholder: 'Ask anything... What\'s on your mind?',
    examples: [
      { id: 'search-1', text: 'AI development trends 2024', category: 'technology' },
      { id: 'search-2', text: 'n8n automation workflows', category: 'tools' },
      { id: 'search-3', text: 'TypeScript best practices', category: 'programming' },
      { id: 'search-4', text: 'React performance optimization', category: 'development' },
      { id: 'search-5', text: 'Machine learning applications', category: 'ai' }
    ],
    quickActions: [
      {
        id: 'search-trending',
        icon: 'TrendingUp',
        title: 'Trending Topics',
        description: 'Explore what\'s popular today',
        actionType: 'submit',
        actionData: 'Show me trending topics today'
      },
      {
        id: 'search-recent',
        icon: 'Clock',
        title: 'Recent Searches',
        description: 'Your search history',
        actionType: 'function'
      },
      {
        id: 'search-quick',
        icon: 'Zap',
        title: 'Quick Answers',
        description: 'Get instant insights',
        actionType: 'submit',
        actionData: 'Give me quick insights on current tech trends'
      }
    ]
  },

  code: {
    type: 'code',
    title: 'CodeMusai',
    subtitle: 'Your AI programming companion. Write, debug, and learn code with intelligent assistance.',
    placeholder: 'Describe what you want to build or ask for help...',
    examples: [
      { id: 'code-1', text: 'Create a React component', category: 'react' },
      { id: 'code-2', text: 'Debug my JavaScript', category: 'debugging' },
      { id: 'code-3', text: 'Explain this algorithm', category: 'algorithms' },
      { id: 'code-4', text: 'Code review request', category: 'review' },
      { id: 'code-5', text: 'Best practices for TypeScript', category: 'best-practices' }
    ],
    quickActions: [
      {
        id: 'code-new',
        icon: 'Code',
        title: 'New Project',
        description: 'Start coding session',
        actionType: 'submit',
        actionData: 'Help me start a new coding project'
      },
      {
        id: 'code-playground',
        icon: 'Play',
        title: 'Quick Playground',
        description: 'Test code snippets',
        actionType: 'function'
      },
      {
        id: 'code-templates',
        icon: 'FileText',
        title: 'Code Templates',
        description: 'Common patterns',
        actionType: 'submit',
        actionData: 'Show me common code templates and patterns'
      }
    ]
  },

  university: {
    type: 'university',
    title: 'MusaiUniversity',
    subtitle: 'Learn anything with AI-powered courses and personalized education paths.',
    placeholder: 'What would you like to learn today?',
    examples: [
      { id: 'uni-1', text: 'Create a course on React', category: 'web-development' },
      { id: 'uni-2', text: 'Learn machine learning basics', category: 'ai-ml' },
      { id: 'uni-3', text: 'JavaScript fundamentals', category: 'programming' },
      { id: 'uni-4', text: 'Data structures explained', category: 'computer-science' },
      { id: 'uni-5', text: 'Web development bootcamp', category: 'bootcamp' }
    ],
    quickActions: [
      {
        id: 'uni-browse',
        icon: 'GraduationCap',
        title: 'Browse Courses',
        description: 'Explore available courses',
        actionType: 'function'
      },
      {
        id: 'uni-create',
        icon: 'Plus',
        title: 'Create Course',
        description: 'Design custom learning',
        actionType: 'function'
      },
      {
        id: 'uni-continue',
        icon: 'Clock',
        title: 'Continue Learning',
        description: 'Resume your progress',
        actionType: 'function'
      }
    ]
  },

  narrative: {
    type: 'narrative',
    title: 'MusaiTale',
    subtitle: 'Where your thoughts become stories. Your emergent narrative engine—shaped by your interactions, perspectives, and decisions. Stories unfold not from a script, but from you.',
    placeholder: 'What narrative emerges from your thoughts today?',
    examples: [
      { id: 'narr-1', text: 'Begin an emergent story exploration', category: 'exploration' },
      { id: 'narr-2', text: 'Create characters that think and evolve', category: 'character-development' },
      { id: 'narr-3', text: 'Let narrative emerge from dialogue', category: 'dialogue' },
      { id: 'narr-4', text: 'Explore perspectives and consciousness', category: 'consciousness' },
      { id: 'narr-5', text: 'Watch stories become through interaction', category: 'emergence' }
    ],
    quickActions: [
      {
        id: 'narr-begin',
        icon: 'Theater',
        title: 'Begin Emergence',
        description: 'Each engagement steers the plot',
        actionType: 'function'
      },
      {
        id: 'narr-story',
        icon: 'FileText',
        title: 'Story Becoming',
        description: 'Each insight rewrites the arc',
        actionType: 'submit',
        actionData: 'Help me begin a story that evolves through our interaction'
      },
      {
        id: 'narr-evolution',
        icon: 'Sparkles',
        title: 'Narrative Evolution',
        description: 'Fiction evolves into reflection',
        actionType: 'submit',
        actionData: 'Create a narrative that reflects my thoughts and evolves with my input'
      }
    ]
  },

  task: {
    type: 'task',
    title: 'TaskMusai',
    subtitle: 'Automate your workflow with intelligent task management and AI assistance.',
    placeholder: 'What task would you like to automate or manage?',
    examples: [
      { id: 'task-1', text: 'Create a workflow automation', category: 'automation' },
      { id: 'task-2', text: 'Plan my daily schedule', category: 'planning' },
      { id: 'task-3', text: 'Set up project tasks', category: 'project-management' },
      { id: 'task-4', text: 'Organize my workspace', category: 'organization' },
      { id: 'task-5', text: 'Build a task template', category: 'templates' }
    ],
    quickActions: [
      {
        id: 'task-auto',
        icon: 'Bot',
        title: 'New Automation',
        description: 'Create smart workflows',
        actionType: 'submit',
        actionData: 'Help me create a workflow automation'
      },
      {
        id: 'task-view',
        icon: 'Clock',
        title: 'My Tasks',
        description: 'View current tasks',
        actionType: 'function'
      },
      {
        id: 'task-templates',
        icon: 'TrendingUp',
        title: 'Templates',
        description: 'Use task templates',
        actionType: 'submit',
        actionData: 'Show me task management templates'
      }
    ]
  },
  
  career: {
    type: 'career',
    title: 'Career Musai',
    subtitle: 'Your AI-powered career companion. Get insights, plan, and navigate your professional journey.',
    placeholder: "What's on your career mind?",
    examples: [
      { id: 'career-1', text: 'What are the top skills for 2025?', category: 'skills' },
      { id: 'career-2', text: 'How to prepare for a job interview?', category: 'interview' },
      { id: 'career-3', text: 'What are the best companies to work for?', category: 'companies' },
      { id: 'career-4', text: 'How to negotiate a salary?', category: 'negotiation' },
      { id: 'career-5', text: 'What are the latest trends in tech?', category: 'trends' }
    ],
    quickActions: [
      {
        id: 'career-chat',
        icon: 'MessageSquare',
        title: 'Start Chat',
        description: 'Begin a new conversation',
        actionType: 'function'
      },
      {
        id: 'career-insights',
        icon: 'TrendingUp',
        title: 'Career Insights',
        description: 'Stay updated on trends',
        actionType: 'submit',
        actionData: 'Show me the latest career insights and trends'
      },
      {
        id: 'career-recent',
        icon: 'Clock',
        title: 'Recent Activity',
        description: 'Your career history',
        actionType: 'submit',
        actionData: 'What are my recent career activities and progress?'
      },
      {
        id: 'career-answers',
        icon: 'Zap',
        title: 'Quick Answers',
        description: 'Get instant insights',
        actionType: 'submit',
        actionData: 'Give me quick career advice and answers'
      }
    ]
  }
};

class PreMusaiApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_N8N_BASE_URL || '/api/n8n';
  }

  async getPreMusaiContent(type: string): Promise<PreMusaiContent> {
    try {
      // Try to fetch from n8n endpoint
      const response = await fetchWithTimeout(`${this.baseUrl}/premusai/${type}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }, 5000); // 5 second timeout

      if (response.ok) {
        const data = await response.json();
        return this.validateAndCleanContent(data);
      }
    } catch (error) {
      console.warn(`Failed to fetch PreMusai content from n8n for ${type}:`, error);
    }

    // Fallback to default content
    return defaultContent[type] || defaultContent.chat;
  }

  async updatePreMusaiContent(type: string, content: PreMusaiContent): Promise<boolean> {
    try {
      const response = await fetchWithTimeout(`${this.baseUrl}/premusai/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(content),
      });

      return response.ok;
    } catch (error) {
      console.error(`Failed to update PreMusai content for ${type}:`, error);
      return false;
    }
  }

  private validateAndCleanContent(data: any): PreMusaiContent {
    // Ensure data has required structure
    return {
      type: data.type || 'chat',
      title: data.title || 'Musai',
      subtitle: data.subtitle || 'AI-powered assistant',
      placeholder: data.placeholder || 'What can I help you with?',
      examples: Array.isArray(data.examples) ? data.examples.map(this.validateExample) : [],
      quickActions: Array.isArray(data.quickActions) ? data.quickActions.map(this.validateQuickAction) : []
    };
  }

  private validateExample(example: any): PreMusaiExample {
    return {
      id: example.id || `example-${Date.now()}`,
      text: example.text || '',
      category: example.category,
      popularity: example.popularity
    };
  }

  private validateQuickAction(action: any): PreMusaiQuickAction {
    return {
      id: action.id || `action-${Date.now()}`,
      icon: action.icon || 'HelpCircle',
      title: action.title || 'Quick Action',
      description: action.description || '',
      actionType: action.actionType || 'submit',
      actionData: action.actionData
    };
  }

  getDefaultContent(type: string): PreMusaiContent {
    return defaultContent[type] || defaultContent.chat;
  }
}

export const preMusaiApi = new PreMusaiApiService();