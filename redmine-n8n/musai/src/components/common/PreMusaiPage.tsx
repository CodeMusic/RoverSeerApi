import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Search, MessageSquare, Code, GraduationCap, Bot, Theater, TrendingUp, Clock, Zap, Sparkles, FileText, Play, Plus, HelpCircle, MessageCircle, MessageSquare as MessageSquareIcon, Search as SearchIcon, Zap as ZapIcon, Sparkles as SparklesIcon, BookOpen, Target, Star, Sparkle, ArrowRight, ArrowLeft, Circle, Square, Diamond, Hexagon, Eye, Image as ImageIcon, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_TERMS } from '@/config/constants';
import { MusaiShimmer } from '@/components/effects/MusaiEffects';
import { preMusaiApi, PreMusaiContent, PreMusaiQuickAction } from '@/lib/preMusaiApi';

export type PreMusaiPageType = 'home' | 'chat' | 'search' | 'code' | 'university' | 'task' | 'narrative' | 'career' | 'therapy' | 'medical' | 'eye';

interface PreMusaiPageProps {
  type: PreMusaiPageType;
  onSubmit: (input: string, file?: File, mode?: string) => void;
  isLoading?: boolean;
  className?: string;
  // For home page type dropdown
  selectedMode?: string;
  onModeChange?: (mode: string) => void;
  // Skip fetching dynamic content from n8n for this instance
  skipDynamicContent?: boolean;
  // For customization
  title?: string;
  titleNode?: React.ReactNode;
  subtitle?: string;
  placeholder?: string;
  suggestions?: string[];
  quickActions?: Array<{
    icon: React.ComponentType<any>;
    title: string;
    description: string;
    action?: () => void;
  }>;
  // For custom action handlers
  onQuickAction?: (actionId: string, actionType: string, actionData?: any) => void;
}

const defaultModeOptions = [
  {
    id: APP_TERMS.PREMUSAI_CHAT,
    icon: MessageSquare,
    label: APP_TERMS.NAV_CHAT,
    description: "Conversational reflection"
  },
  {
    id: APP_TERMS.PREMUSAI_SEARCH, 
    icon: Search,
    label: APP_TERMS.NAV_SEARCH,
    description: "Intelligent discovery"
  },
  {
    id: APP_TERMS.PREMUSAI_CODE,
    icon: Code,
    label: APP_TERMS.NAV_CODE,
    description: "Paired AI programming"
  },
  {
    id: APP_TERMS.PREMUSAI_UNIVERSITY,
    icon: GraduationCap,
    label: APP_TERMS.NAV_UNIVERSITY,
    description: "Generative emergent learning"
  },
  {
    id: APP_TERMS.PREMUSAI_NARRATIVE,
    icon: Theater,
    label: APP_TERMS.NAV_NARRATIVE,
    description: "Where thoughts become stories"
  },
  {
    id: APP_TERMS.PREMUSAI_TASK,
    icon: Bot,
    label: APP_TERMS.NAV_TASK,
    description: "Orchestrated achievement"
  }
];

const getPageConfig = (type: PreMusaiPageType) => {
  switch (type) {
    case 'home':
      return {
        title: "Welcome to Musai",
        subtitle: "Your AI-powered creative companion. Start a conversation, search for insights, or create something amazing.",
        placeholder: "Start a new conversation...",
        showModeSelector: true,
        suggestions: [
          "Help me build a React component",
          "Explain quantum computing simply",
          "Create a story about time travel",
          "Plan a project roadmap",
          "Debug my JavaScript code"
        ],
        quickActions: [
          { icon: TrendingUp, title: "Popular Topics", description: "See what's trending today" },
          { icon: Clock, title: "Recent Activity", description: "Continue where you left off" },
          { icon: Sparkles, title: "AI Features", description: "Explore Musai's capabilities" }
        ]
      };
    
    case 'chat':
      return {
        title: APP_TERMS.CHAT,
        subtitle: "Start a natural conversation with your AI assistant. Ask questions, brainstorm ideas, or just chat.",
        placeholder: "What's on your mind?",
        showModeSelector: false,
        suggestions: [
          "Explain a complex topic",
          "Help me brainstorm ideas",
          "Review my writing",
          "Answer a question",
          "Provide advice on..."
        ],
        quickActions: [
          { icon: MessageSquare, title: "Start Chat", description: "Begin a new conversation", id: "chat-new", actionType: "function" },
          { icon: FileText, title: "Templates", description: "Use conversation templates", id: "chat-templates", actionType: "submit", actionData: "Show me conversation templates" },
          { icon: TrendingUp, title: "Popular Questions", description: "See common topics", id: "chat-popular", actionType: "submit", actionData: "What are popular conversation topics?" }
        ]
      };
    
    case 'search':
      return {
        title: APP_TERMS.SEARCH,
        subtitle: "Intelligent search powered by AI. Get comprehensive answers and insights on any topic.",
        placeholder: "Ask anything... What's on your mind?",
        showModeSelector: false,
        suggestions: [
          "AI development trends 2024",
          "n8n automation workflows", 
          "TypeScript best practices",
          "React performance optimization",
          "Machine learning applications"
        ],
        quickActions: [
          { icon: MessageSquare, title: "Start Chat", description: "Begin a new conversation", id: "search-chat", actionType: "function" },
          { icon: TrendingUp, title: "Trending Topics", description: "Explore what's popular today" },
          { icon: Clock, title: "Recent Searches", description: "Your search history" },
          { icon: Zap, title: "Quick Answers", description: "Get instant insights" }
        ]
      };
    
    case 'code':
      return {
        title: "CodeMusai",
        subtitle: "Your AI programming companion. Write, debug, and learn code with intelligent assistance.",
        placeholder: "Describe what you want to build or ask for help...",
        showModeSelector: false,
        suggestions: [
          "Create a React component",
          "Debug my JavaScript",
          "Explain this algorithm",
          "Code review request",
          "Best practices for..."
        ],
        quickActions: [
          { icon: MessageSquare, title: "Start Chat", description: "Begin a new conversation", id: "code-chat", actionType: "function" },
          { icon: Code, title: "New Project", description: "Start coding session", id: "code-new", actionType: "function" },
          { icon: Play, title: "Quick Playground", description: "Test code snippets", id: "code-playground", actionType: "function" },
          { 
            icon: FileText, 
            title: "Code Templates", 
            description: "Common patterns", 
            id: "code-templates", 
            actionType: "submit", 
            actionData: `// Starter template\nfunction greet(name) {\n  console.log('Hello, ' + name + '!');\n}\n\ngreet('Musai');`
          }
        ]
      };
    
    case 'university':
      return {
        title: APP_TERMS.UNIVERSITY,
        subtitle: "Learn anything with AI-powered courses and personalized education paths.",
        placeholder: "What would you like to learn today?",
        showModeSelector: false,
        suggestions: [
          "Create a course on React",
          "Learn machine learning basics",
          "JavaScript fundamentals",
          "Data structures explained",
          "Web development bootcamp"
        ],
        quickActions: [
          { icon: MessageSquare, title: "Start Chat", description: "Begin a new conversation", id: "university-chat", actionType: "function" },
          { icon: GraduationCap, title: "Browse Courses", description: "Explore available courses" },
          { icon: Plus, title: "Create Course", description: "Design custom learning" },
          { icon: Clock, title: "Continue Learning", description: "Resume your progress" }
        ]
      };
    
    case 'task':
      return {
        title: APP_TERMS.TASK,
        subtitle: APP_TERMS.TASK_DESCRIPTION,
        placeholder: "What task would you like to automate or manage?",
        showModeSelector: false,
        suggestions: [
          "Create a workflow automation",
          "Plan my daily schedule",
          "Set up project tasks",
          "Organize my workspace",
          "Build a task template"
        ],
        quickActions: [
          { icon: MessageSquare, title: "Start Chat", description: "Begin a new conversation", id: "task-chat", actionType: "function" },
          { icon: Bot, title: "New Automation", description: "Create smart workflows", id: "task-auto", actionType: "submit", actionData: "Create a new automation workflow" },
          { icon: Clock, title: "My Tasks", description: "View current tasks", id: "task-view", actionType: "function" },
          { icon: TrendingUp, title: "Templates", description: "Use task templates", id: "task-templates", actionType: "submit", actionData: "Show me available task templates" }
        ]
      };
    
    case 'narrative':
      return {
        title: APP_TERMS.NARRATIVE,
        subtitle: "Where your thoughts become stories. Your emergent narrative engine—shaped by your interactions, perspectives, and decisions. Stories unfold not from a script, but from you.",
        placeholder: "What narrative emerges from your thoughts today?",
        showModeSelector: false,
        suggestions: [
          "Begin an emergent story exploration",
          "Create characters that think and evolve", 
          "Let narrative emerge from dialogue",
          "Explore perspectives and consciousness",
          "Watch stories become through interaction"
        ],
        quickActions: [
          { icon: MessageSquare, title: "Start Chat", description: "Begin a new conversation", id: "narrative-chat", actionType: "function" },
          { icon: Theater, title: "Begin Emergence", description: "Each engagement steers the plot" },
          { icon: FileText, title: "Story Becoming", description: "Each insight rewrites the arc" },
          { icon: Sparkles, title: "Narrative Evolution", description: "Fiction evolves into reflection" }
        ]
      };
    
    case 'career':
      return {
        title: "Career Musai",
        subtitle: "Your AI-powered career companion. Get insights, plan, and navigate your professional journey.",
        placeholder: "What's on your career mind?",
        showModeSelector: false,
        suggestions: [
          "What are the top skills for 2024?",
          "How to prepare for a job interview?",
          "What are the best companies to work for?",
          "How to negotiate a salary?",
          "What are the latest trends in tech?"
        ],
        quickActions: [
          { icon: MessageSquare, title: "Start Chat", description: "Begin a new conversation", id: "career-chat", actionType: "function" },
          { icon: TrendingUp, title: "Career Insights", description: "Stay updated on trends" },
          { icon: Clock, title: "Recent Activity", description: "Your career history" },
          { icon: Zap, title: "Quick Answers", description: "Get instant insights" }
        ]
      };
    
    case 'therapy':
      return {
        title: APP_TERMS.NAV_THERAPY,
        subtitle: 'Reflective dialogue focused on wellness and growth. Optionally set goals before you begin.',
        placeholder: 'Share what you want to explore today... ',
        showModeSelector: false,
        suggestions: [
          'I want to practice a calming technique',
          'Help me reflect on a recent experience',
          'Guide me through reframing a thought',
          'Walk me through a grounding exercise',
        ],
        quickActions: [
          { icon: MessageSquare, title: 'Start Session', description: 'Begin a wellness chat', id: 'therapy-start', actionType: 'function' },
          { icon: Star, title: 'Set Goals', description: 'Define session goals', id: 'therapy-goals', actionType: 'function' },
          { icon: FileText, title: 'Journal Entry', description: 'Quick journal with mood tags', id: 'therapy-journal', actionType: 'submit', actionData: 'Start a journal entry: ' },
        ]
      };
    case 'medical':
      return {
        title: APP_TERMS.MEDICAL,
        subtitle: APP_TERMS.MEDICAL_DESCRIPTION,
        placeholder: 'What brings you here today? (briefly describe)',
        showModeSelector: false,
        suggestions: [
          'Summarize my recent lab results',
          'Help me prepare questions for my doctor',
          'Compare treatment options for my condition',
          'Create a clear action plan from my notes',
        ],
        quickActions: [
          { icon: MessageSquare, title: 'Start Health Plan', description: 'Outline goals and concerns', id: 'medical-plan', actionType: 'submit', actionData: 'Create a concise health plan from these concerns: ' },
          { icon: FileText, title: 'Summarize Labs', description: 'Paste labs for plain-language summary', id: 'medical-labs', actionType: 'submit', actionData: 'Summarize these labs and flag notable values: ' },
        ]
      };
    case 'eye':
      return {
        title: APP_TERMS.NAV_EYE,
        subtitle: APP_TERMS.EYE_DESCRIPTION,
        placeholder: 'What do you want to index or generate?',
        showModeSelector: false,
        suggestions: [
          'Index my design components',
          'Catalog my hardware inventory',
          'Track bird species in my area',
          'Build a dataset for recipes',
          'Create a MusaiDex for tools'
        ],
        quickActions: [
          { icon: Eye, title: 'Analyze Image', description: 'Upload and classify', id: 'eye-analyze', actionType: 'function' },
          { icon: Zap, title: 'Generate from Text', description: 'Create an image from a prompt', id: 'eye-generate', actionType: 'submit', actionData: 'Generate an image: ' }
        ]
      };
    default:
      return getPageConfig('home');
  }
};

export const PreMusaiPage: React.FC<PreMusaiPageProps> = ({
  type,
  onSubmit,
  isLoading = false,
  className,
  selectedMode = 'chat',
  onModeChange,
  skipDynamicContent,
  title: customTitle,
  titleNode,
  subtitle: customSubtitle,
  placeholder: customPlaceholder,
  suggestions: customSuggestions,
  quickActions: customQuickActions,
  onQuickAction
}) => {
  const [input, setInput] = useState('');
  const [dynamicContent, setDynamicContent] = useState<PreMusaiContent | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Announce PreMusai visibility so the base layout can hide the sidebar hamburger
  useEffect(() => {
    const showEvt = new CustomEvent('musai-premusai-visibility-change', { detail: { visible: true } });
    window.dispatchEvent(showEvt);
    return () => {
      const hideEvt = new CustomEvent('musai-premusai-visibility-change', { detail: { visible: false } });
      window.dispatchEvent(hideEvt);
    };
  }, []);

  // Load dynamic content from n8n API
  useEffect(() => {
    const loadContent = async () => {
      if (type === 'home') return; // Skip for home page
      if (skipDynamicContent) return; // Explicitly skip external calls when requested
      
      setIsLoadingContent(true);
      try {
        const content = await preMusaiApi.getPreMusaiContent(type);
        setDynamicContent(content);
      } catch (error) {
        console.error('Failed to load PreMusai content:', error);
        setDynamicContent(preMusaiApi.getDefaultContent(type));
      } finally {
        setIsLoadingContent(false);
      }
    };

    loadContent();
  }, [type, skipDynamicContent]);

  const config = getPageConfig(type);
  const useContent = dynamicContent || config;
  
  const title = customTitle || useContent.title;
  const subtitle = customSubtitle || useContent.subtitle;
  const placeholder = customPlaceholder || useContent.placeholder;
  const suggestions = customSuggestions || (dynamicContent ? dynamicContent.examples.map(ex => ex.text) : config.suggestions);
  const showModeSelector = config.showModeSelector && type === 'home';

  // Map icon names to actual icon components
  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      MessageSquare, Search, Code, GraduationCap, Bot, Theater, 
      TrendingUp, Clock, Zap, Sparkles, FileText, Play, Plus, HelpCircle,
      Eye, ImageIcon, Upload
    };
    return iconMap[iconName] || HelpCircle;
  };

  const selectedModeData = defaultModeOptions.find(m => m.id === selectedMode) || defaultModeOptions[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'eye') {
      if (selectedImage && !input.trim()) {
        onSubmit('Analyze this image', selectedImage);
        return;
      }
      if (input.trim()) {
        onSubmit(input.trim(), undefined, showModeSelector ? selectedMode : undefined);
        return;
      }
      return;
    }
    if (input.trim()) {
      onSubmit(input.trim(), undefined, showModeSelector ? selectedMode : undefined);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    onSubmit(suggestion, undefined, showModeSelector ? selectedMode : undefined);
  };

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleQuickActionClick = (action: PreMusaiQuickAction) => {
    if (onQuickAction) {
      onQuickAction(action.id, action.actionType, action.actionData);
    } else {
      switch (action.actionType) {
        case 'submit':
          if (action.actionData) {
            onSubmit(action.actionData, undefined, showModeSelector ? selectedMode : undefined);
          }
          break;
        case 'function':
          if (type === 'eye' && action.id === 'eye-analyze') {
            openFilePicker();
          }
          if (type === 'therapy') {
            if (action.id === 'therapy-start') {
              onSubmit('Let us begin with intake. I want to talk about...');
            }
            if (action.id === 'therapy-goals') {
              onSubmit('Session goals: ');
            }
          }
          break;
        default:
          break;
      }
    }
  };

  return (
    <div className={cn("flex-1 flex flex-col", className)}>
      {/* Hero Section */}
      <div className={cn(
        // Standardize hero vertical position across all PreMusai screens
        "flex-1 flex flex-col items-center justify-start pt-10 md:pt-16 p-6 space-y-8 max-w-4xl mx-auto w-full"
      )}>
        <MusaiShimmer className="text-center p-6 rounded-lg flex flex-col items-center justify-center h-48 md:h-56 overflow-hidden">
          <div className="relative">
            {/* Dynamic glyphs based on Musai type */}
            {type === 'chat' && (
              <>
                <div className="absolute -top-2 -left-2 text-red-400/40 text-sm glyph-pulse">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="absolute -top-2 -right-2 text-red-400/40 text-sm glyph-float delay-100">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="absolute -bottom-2 -left-2 text-red-400/40 text-sm glyph-pulse delay-200">
                  <MessageCircle className="w-3 h-3" />
                </div>
                <div className="absolute -bottom-2 -right-2 text-red-400/40 text-sm glyph-float delay-300">
                  <MessageSquare className="w-3 h-3" />
                </div>
                <div className="absolute top-1/2 -left-4 text-red-400/30 text-xs glyph-spin">
                  <Circle className="w-2 h-2" />
                </div>
                <div className="absolute top-1/2 -right-4 text-red-400/30 text-xs glyph-spin delay-500">
                  <Circle className="w-2 h-2" />
                </div>
              </>
            )}
            {type === 'search' && (
              <>
                <div className="absolute -top-2 -left-2 text-orange-400/40 text-sm glyph-pulse">
                  <SearchIcon className="w-4 h-4" />
                </div>
                <div className="absolute -top-2 -right-2 text-orange-400/40 text-sm glyph-float delay-100">
                  <SearchIcon className="w-4 h-4" />
                </div>
                <div className="absolute -bottom-2 -left-2 text-orange-400/40 text-sm glyph-pulse delay-200">
                  <TrendingUp className="w-3 h-3" />
                </div>
                <div className="absolute -bottom-2 -right-2 text-orange-400/40 text-sm glyph-float delay-300">
                  <TrendingUp className="w-3 h-3" />
                </div>
                <div className="absolute top-1/2 -left-4 text-orange-400/30 text-xs glyph-spin">
                  <Diamond className="w-2 h-2" />
                </div>
                <div className="absolute top-1/2 -right-4 text-orange-400/30 text-xs glyph-spin delay-500">
                  <Diamond className="w-2 h-2" />
                </div>
              </>
            )}
            {type === 'code' && (
              <>
                <div className="absolute -top-2 -left-2 text-yellow-400/40 text-sm glyph-pulse">
                  <ZapIcon className="w-4 h-4" />
                </div>
                <div className="absolute -top-2 -right-2 text-yellow-400/40 text-sm glyph-float delay-100">
                  <Code className="w-4 h-4" />
                </div>
                <div className="absolute -bottom-2 -left-2 text-yellow-400/40 text-sm glyph-pulse delay-200">
                  <Code className="w-3 h-3" />
                </div>
                <div className="absolute -bottom-2 -right-2 text-yellow-400/40 text-sm glyph-float delay-300">
                  <ZapIcon className="w-3 h-3" />
                </div>
                <div className="absolute top-1/2 -left-4 text-yellow-400/30 text-xs glyph-spin">
                  <Square className="w-2 h-2" />
                </div>
                <div className="absolute top-1/2 -right-4 text-yellow-400/30 text-xs glyph-spin delay-500">
                  <Square className="w-2 h-2" />
                </div>
              </>
            )}
            {type === 'university' && (
              <>
                <div className="absolute -top-2 -left-2 text-green-400/40 text-sm glyph-pulse">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="absolute -top-2 -right-2 text-green-400/40 text-sm glyph-float delay-100">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="absolute -bottom-2 -left-2 text-green-400/40 text-sm glyph-pulse delay-200">
                  <Target className="w-3 h-3" />
                </div>
                <div className="absolute -bottom-2 -right-2 text-green-400/40 text-sm glyph-float delay-300">
                  <BookOpen className="w-3 h-3" />
                </div>
                <div className="absolute top-1/2 -left-4 text-green-400/30 text-xs glyph-spin">
                  <Circle className="w-2 h-2" />
                </div>
                <div className="absolute top-1/2 -right-4 text-green-400/30 text-xs glyph-spin delay-500">
                  <Circle className="w-2 h-2" />
                </div>
              </>
            )}
            {type === 'narrative' && (
              <>
                <div className="absolute -top-2 -left-2 text-blue-400/40 text-sm glyph-pulse">
                  <Theater className="w-4 h-4" />
                </div>
                <div className="absolute -top-2 -right-2 text-blue-400/40 text-sm glyph-float delay-100">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="absolute -bottom-2 -left-2 text-blue-400/40 text-sm glyph-pulse delay-200">
                  <SparklesIcon className="w-3 h-3" />
                </div>
                <div className="absolute -bottom-2 -right-2 text-blue-400/40 text-sm glyph-float delay-300">
                  <Star className="w-3 h-3" />
                </div>
                <div className="absolute top-1/2 -left-4 text-blue-400/30 text-xs glyph-spin">
                  <Hexagon className="w-2 h-2" />
                </div>
                <div className="absolute top-1/2 -right-4 text-blue-400/30 text-xs glyph-spin delay-500">
                  <Hexagon className="w-2 h-2" />
                </div>
              </>
            )}
            {type === 'task' && (
              <>
                <div className="absolute -top-2 -left-2 text-violet-400/40 text-sm glyph-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="absolute -top-2 -right-2 text-violet-400/40 text-sm glyph-float delay-100">
                  <ZapIcon className="w-4 h-4" />
                </div>
                <div className="absolute -bottom-2 -left-2 text-violet-400/40 text-sm glyph-pulse delay-200">
                  <Target className="w-3 h-3" />
                </div>
                <div className="absolute -bottom-2 -right-2 text-violet-400/40 text-sm glyph-float delay-300">
                  <Code className="w-3 h-3" />
                </div>
                <div className="absolute top-1/2 -left-4 text-violet-400/30 text-xs glyph-spin">
                  <Square className="w-2 h-2" />
                </div>
                <div className="absolute top-1/2 -right-4 text-violet-400/30 text-xs glyph-spin delay-500">
                  <Square className="w-2 h-2" />
                </div>
              </>
            )}
            {type === 'career' && (
              <>
                <div className="absolute -top-2 -left-2 text-indigo-400/40 text-sm glyph-pulse">
                  <Target className="w-4 h-4" />
                </div>
                <div className="absolute -top-2 -right-2 text-indigo-400/40 text-sm glyph-float delay-100">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="absolute -bottom-2 -left-2 text-indigo-400/40 text-sm glyph-pulse delay-200">
                  <BookOpen className="w-3 h-3" />
                </div>
                <div className="absolute -bottom-2 -right-2 text-indigo-400/40 text-sm glyph-float delay-300">
                  <ZapIcon className="w-3 h-3" />
                </div>
                <div className="absolute top-1/2 -left-4 text-indigo-400/30 text-xs glyph-spin">
                  <Diamond className="w-2 h-2" />
                </div>
                <div className="absolute top-1/2 -right-4 text-indigo-400/30 text-xs glyph-spin delay-500">
                  <Diamond className="w-2 h-2" />
                </div>
              </>
            )}
            {type === 'therapy' && (
              <>
                <div className="absolute -top-2 -left-2 text-purple-400/40 text-sm glyph-pulse">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="absolute -top-2 -right-2 text-purple-400/40 text-sm glyph-float delay-100">
                  <Star className="w-4 h-4" />
                </div>
                <div className="absolute -bottom-2 -left-2 text-purple-400/40 text-sm glyph-pulse delay-200">
                  <MessageSquare className="w-3 h-3" />
                </div>
                <div className="absolute -bottom-2 -right-2 text-purple-400/40 text-sm glyph-float delay-300">
                  <Star className="w-3 h-3" />
                </div>
                <div className="absolute top-1/2 -left-4 text-purple-400/30 text-xs glyph-spin">
                  <Circle className="w-2 h-2" />
                </div>
                <div className="absolute top-1/2 -right-4 text-purple-400/30 text-xs glyph-spin delay-500">
                  <Circle className="w-2 h-2" />
                </div>
              </>
            )}
            {type === 'eye' && (
              <>
                <div className="absolute -top-2 -left-2 text-cyan-400/40 text-sm glyph-pulse">
                  <Eye className="w-4 h-4" />
                </div>
                <div className="absolute -top-2 -right-2 text-cyan-400/40 text-sm glyph-float delay-100">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="absolute -bottom-2 -left-2 text-cyan-400/40 text-sm glyph-pulse delay-200">
                  <SparklesIcon className="w-3 h-3" />
                </div>
                <div className="absolute -bottom-2 -right-2 text-cyan-400/40 text-sm glyph-float delay-300">
                  <Target className="w-3 h-3" />
                </div>
                <div className="absolute top-1/2 -left-4 text-cyan-400/30 text-xs glyph-spin">
                  <Diamond className="w-2 h-2" />
                </div>
                <div className="absolute top-1/2 -right-4 text-cyan-400/30 text-xs glyph-spin delay-500">
                  <Diamond className="w-2 h-2" />
                </div>
              </>
            )}
            
            {titleNode ? (
              titleNode
            ) : (
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent border-b-2 border-purple-200 dark:border-purple-800 pb-2">
                {title}
              </h1>
            )}
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        </MusaiShimmer>

        {/* Input/Form Area */}
        <div className="w-full max-w-2xl space-y-6">
          {/* Eye of Musai image tools */}
          {type === 'eye' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Input
                  type="text"
                  placeholder={placeholder}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 text-lg rounded-xl border-2 border-cyan-500/30 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300 mystical-glow"
                />
                <Button type="button" variant="outline" onClick={openFilePicker} className="rounded-xl">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleImageSelect(file);
                  }}
                />
              </div>
              {imagePreviewUrl && (
                <div className="rounded-xl border border-cyan-500/20 p-3 bg-background/50">
                  <div className="text-xs text-muted-foreground mb-2">Selected image preview</div>
                  <img src={imagePreviewUrl} alt="Selected" className="max-h-60 rounded-md object-contain mx-auto" />
                  <div className="mt-3 flex gap-2">
                    <Button onClick={() => onSubmit('Analyze this image', selectedImage!)} className="rounded-xl">
                      <Eye className="w-4 h-4 mr-2" /> Analyze
                    </Button>
                    <Button variant="secondary" onClick={() => onSubmit(`TRAIN:${input || ''}`, selectedImage!)} className="rounded-xl">
                      Train
                    </Button>
                    <Button variant="outline" onClick={() => { setSelectedImage(null); setImagePreviewUrl(null); }} className="rounded-xl">
                      Clear
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={(e) => { e.preventDefault(); onSubmit(input || 'Generate an image from this prompt', undefined); }} disabled={isLoading} className="rounded-xl">
                  <ImageIcon className="w-4 h-4 mr-2" /> Generate from Text
                </Button>
              </div>
            </div>
          )}

          {/* Default input form for other types (with Medical upload option) */}
          {type !== 'eye' && (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
              {showModeSelector && (
                // existing dropdown
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" className="flex items-center gap-2 px-3 py-3 h-auto rounded-xl border-2 border-purple-500/30 hover:border-purple-500/50 transition-all duration-300" disabled={isLoading}>
                      {(() => { const SelectedIcon = (MessageSquare as any); return <SelectedIcon className="w-5 h-5" /> })()}
                      <ChevronDown className="w-4 h-4 opacity-60" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {defaultModeOptions.map((mode) => {
                      const Icon = mode.icon;
                      const isComingSoon = mode.id === "narrative" || mode.id === "task";
                      return (
                        <DropdownMenuItem
                          key={mode.id}
                          onClick={() => onModeChange?.(mode.id)}
                          className={cn(
                            "flex items-center gap-3 p-3 cursor-pointer",
                            selectedMode === mode.id && "bg-purple-500/10",
                            isComingSoon && "opacity-60"
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          <div className="flex flex-col">
                            <span className="font-medium">{mode.label}</span>
                            <span className="text-xs text-muted-foreground">{mode.description}</span>
                          </div>
                          {isComingSoon && (
                            <span className="ml-auto text-xs text-yellow-600 dark:text-yellow-400">Soon</span>
                          )}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder={placeholder}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                  className="px-4 py-3 text-lg rounded-xl border-2 border-purple-500/30 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 mystical-glow"
                  autoFocus
                />
                {input && (
                  <Button type="submit" disabled={isLoading} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-6">{isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Send'}</Button>
                )}
              </div>
              {type === 'medical' && (
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" onClick={openFilePicker} className="rounded-xl" disabled={isLoading}>
                    <Upload className="w-4 h-4 mr-2" /> Upload docs
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.txt,.md,.rtf"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handleImageSelect(file);
                    }}
                  />
                </div>
              )}
            </form>
          )}

          {/* Suggestions */}
          {suggestions && suggestions.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">Try asking:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-sm hover:bg-sidebar-accent/50 transition-all duration-200"
                    disabled={isLoading}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {((customQuickActions && customQuickActions.length > 0) || (dynamicContent && dynamicContent.quickActions.length > 0)) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
              {customQuickActions ? (
                // Use custom quick actions (legacy support)
                customQuickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center gap-3 hover:bg-sidebar-accent/50 transition-all duration-200"
                      onClick={action.action}
                      disabled={isLoading || isLoadingContent}
                    >
                      <Icon className="w-6 h-6 text-primary" />
                      <div className="text-center">
                        <div className="font-medium">{action.title}</div>
                        <div className="text-xs text-muted-foreground">{action.description}</div>
                      </div>
                    </Button>
                  );
                })
              ) : (
                // Use static or dynamic quick actions
                (dynamicContent?.quickActions || config.quickActions || []).map((action, index) => {
                  // Handle both string icon names (from dynamic content) and React components (from static config)
                  const Icon = typeof action.icon === 'string' ? getIconComponent(action.icon) : action.icon;
                  return (
                    <Button
                      key={action.id || index}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center gap-3 hover:bg-sidebar-accent/50 transition-all duration-200"
                      onClick={() => handleQuickActionClick(action)}
                      disabled={isLoading || isLoadingContent}
                    >
                      <Icon className="w-6 h-6 text-primary" />
                      <div className="text-center">
                        <div className="font-medium">{action.title}</div>
                        <div className="text-xs text-muted-foreground">{action.description}</div>
                      </div>
                    </Button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};