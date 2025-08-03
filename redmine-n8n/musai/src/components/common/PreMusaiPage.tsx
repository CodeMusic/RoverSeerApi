import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Search, MessageSquare, Code, GraduationCap, Bot, Theater, TrendingUp, Clock, Zap, Sparkles, FileText, Play, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MusaiShimmer } from '@/components/effects/MusaiEffects';

export type PreMusaiPageType = 'home' | 'chat' | 'search' | 'code' | 'university' | 'task' | 'narrative';

interface PreMusaiPageProps {
  type: PreMusaiPageType;
  onSubmit: (input: string, mode?: string) => void;
  isLoading?: boolean;
  className?: string;
  // For home page type dropdown
  selectedMode?: string;
  onModeChange?: (mode: string) => void;
  // For customization
  title?: string;
  subtitle?: string;
  placeholder?: string;
  suggestions?: string[];
  quickActions?: Array<{
    icon: React.ComponentType<any>;
    title: string;
    description: string;
    action?: () => void;
  }>;
}

const defaultModeOptions = [
  {
    id: "chat",
    icon: MessageSquare,
    label: "MusaiChat",
    description: "Conversational reflection"
  },
  {
    id: "search", 
    icon: Search,
    label: "MusaiSearch",
    description: "Intelligent discovery"
  },
  {
    id: "code",
    icon: Code,
    label: "CodeMusai",
    description: "Paired AI programming"
  },
  {
    id: "university",
    icon: GraduationCap,
    label: "Musai University",
    description: "Generative emergent learning"
  },
  {
    id: "emergent-narrative",
    icon: Theater,
    label: "MusaiTale",
    description: "Where thoughts become stories"
  },
  {
    id: "task",
    icon: Bot,
    label: "TaskMusai",
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
        title: "MusaiChat",
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
          { icon: MessageSquare, title: "New Conversation", description: "Start fresh discussion" },
          { icon: FileText, title: "Templates", description: "Use conversation templates" },
          { icon: TrendingUp, title: "Popular Questions", description: "See common topics" }
        ]
      };
    
    case 'search':
      return {
        title: "MusaiSearch",
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
          { icon: Code, title: "New Project", description: "Start coding session" },
          { icon: Play, title: "Quick Playground", description: "Test code snippets" },
          { icon: FileText, title: "Code Templates", description: "Common patterns" }
        ]
      };
    
    case 'university':
      return {
        title: "MusaiU",
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
          { icon: GraduationCap, title: "Browse Courses", description: "Explore available courses" },
          { icon: Plus, title: "Create Course", description: "Design custom learning" },
          { icon: Clock, title: "Continue Learning", description: "Resume your progress" }
        ]
      };
    
    case 'task':
      return {
        title: "TaskMusai",
        subtitle: "Automate your workflow with intelligent task management and AI assistance.",
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
          { icon: Bot, title: "New Automation", description: "Create smart workflows" },
          { icon: Clock, title: "My Tasks", description: "View current tasks" },
          { icon: TrendingUp, title: "Templates", description: "Use task templates" }
        ]
      };
    
    case 'narrative':
      return {
        title: "MusaiTale",
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
          { icon: Theater, title: "Begin Emergence", description: "Each engagement steers the plot" },
                      { icon: FileText, title: "Story Becoming", description: "Each insight rewrites the arc" },
          { icon: Sparkles, title: "Narrative Evolution", description: "Fiction evolves into reflection" }
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
  title: customTitle,
  subtitle: customSubtitle,
  placeholder: customPlaceholder,
  suggestions: customSuggestions,
  quickActions: customQuickActions
}) => {
  const [input, setInput] = useState('');
  const config = getPageConfig(type);
  
  const title = customTitle || config.title;
  const subtitle = customSubtitle || config.subtitle;
  const placeholder = customPlaceholder || config.placeholder;
  const suggestions = customSuggestions || config.suggestions;
  const quickActions = customQuickActions || config.quickActions;
  const showModeSelector = config.showModeSelector && type === 'home';

  const selectedModeData = defaultModeOptions.find(m => m.id === selectedMode) || defaultModeOptions[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input.trim(), showModeSelector ? selectedMode : undefined);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    onSubmit(suggestion, showModeSelector ? selectedMode : undefined);
  };

  return (
    <div className={cn("flex-1 flex flex-col", className)}>
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 max-w-4xl mx-auto w-full">
        <MusaiShimmer className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent border-b-2 border-purple-200 dark:border-purple-800 pb-2">
            {title}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        </MusaiShimmer>

        {/* Input Form */}
        <div className="w-full max-w-2xl space-y-6">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
            {/* Mode Selector (only for home page) */}
            {showModeSelector && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex items-center gap-2 px-3 py-3 h-auto rounded-xl border-2 border-purple-500/30 hover:border-purple-500/50 transition-all duration-300"
                    disabled={isLoading}
                  >
                    {(() => {
                      const SelectedIcon = selectedModeData.icon;
                      return <SelectedIcon className="w-5 h-5" />;
                    })()}
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

            {/* Input Field */}
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder={placeholder}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="px-4 py-3 text-lg rounded-xl border-2 border-purple-500/30 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                autoFocus
              />
              {input && (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-6"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Send"
                  )}
                </Button>
              )}
            </div>
          </form>

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
        </div>

        {/* Quick Actions */}
        {quickActions && quickActions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-3 hover:bg-sidebar-accent/50 transition-all duration-200"
                  onClick={action.action}
                  disabled={isLoading}
                >
                  <Icon className="w-6 h-6 text-primary" />
                  <div className="text-center">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs text-muted-foreground">{action.description}</div>
                  </div>
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};