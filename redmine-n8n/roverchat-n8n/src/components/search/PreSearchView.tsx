import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, TrendingUp, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface PreSearchViewProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  onClose: () => void;
  onViewPreviousSearches?: () => void;
}

export const PreSearchView = ({ onSearch, isLoading, onClose, onViewPreviousSearches }: PreSearchViewProps) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
  };

  const trendingTopics = [
    "AI development trends 2024",
    "n8n automation workflows",
    "TypeScript best practices",
    "React performance optimization",
    "Machine learning applications"
  ];

  const quickActions = [
    {
      icon: TrendingUp,
      title: "Trending Topics",
      description: "Explore what's popular today"
    },
    {
      icon: Clock,
      title: "Recent Searches",
      description: "Your search history"
    },
    {
      icon: Zap,
      title: "Quick Answers",
      description: "Get instant insights"
    }
  ];

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-3">
          <Search className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold">Musai Search</h1>
            <p className="text-sm text-muted-foreground">Intelligent Knowledge Discovery</p>
          </div>
        </div>

      </div>

      {/* Main Search Area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-3xl space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-xl" />
              </div>
              <div className="relative">
                <Search className="w-16 h-16 mx-auto text-primary/60" />
              </div>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">
              What would you like to discover?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Search through vast knowledge bases with intelligent context understanding
            </p>
          </div>

          {/* Search Input */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything... What's on your mind?"
                className="pl-12 pr-4 py-6 text-lg rounded-2xl border-2 focus:border-primary/50 transition-all duration-200"
                disabled={isLoading}
                autoFocus
              />
              {query && (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-6"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Search"
                  )}
                </Button>
              )}
            </div>
          </form>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-3 hover:bg-sidebar-accent/50 transition-all duration-200"
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

          {/* Recent Searches Option - Always Available */}
          <div className="flex justify-center gap-4">
            <Button 
              variant="outline" 
              onClick={onViewPreviousSearches} 
              className="flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Recent Searches
            </Button>
          </div>

          {/* Trending Topics */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Sparkles className="w-4 h-4" />
              Trending searches
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingTopics.map((topic, index) => (
                <Button
                  key={index}
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSuggestionClick(topic)}
                  className="rounded-full text-xs hover:bg-primary hover:text-primary-foreground transition-colors duration-200"
                >
                  {topic}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};