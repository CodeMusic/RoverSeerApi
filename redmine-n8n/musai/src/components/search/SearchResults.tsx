import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Plus, ArrowLeft, ExternalLink, Clock, Brain, Link, Cog, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer";

interface SearchResultsProps {
  session: {
    id: string;
    query: string;
    intent?: string; // 'search' | 'llm' | 'summarize' | 'tool'
    results: any[];
    followUps: Array<{
      query: string;
      result: any;
      timestamp: number;
    }>;
    timestamp: number;
  };
  onFollowUp: (query: string) => void;
  onNewSearch: () => void;
  onExport: () => void;
  isLoading: boolean;
  onClose: () => void;
}

export const SearchResults = ({ 
  session, 
  onFollowUp, 
  onNewSearch, 
  onExport, 
  isLoading,
  onClose 
}: SearchResultsProps) => {
  const [followUpQuery, setFollowUpQuery] = useState("");

  const getIntentIcon = (intent?: string) => {
    switch (intent) {
      case 'search':
        return Globe;
      case 'llm':
        return Brain;
      case 'summarize':
        return Link;
      case 'tool':
        return Cog;
      default:
        return Search;
    }
  };

  const getIntentLabel = (intent?: string) => {
    switch (intent) {
      case 'search':
        return 'Search Results';
      case 'llm':
        return 'AI Response';
      case 'summarize':
        return 'Summary';
      case 'tool':
        return 'Tool Action';
      default:
        return 'Results';
    }
  };

  const getIntentColor = (intent?: string) => {
    switch (intent) {
      case 'search':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'llm':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'summarize':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'tool':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (followUpQuery.trim()) {
      onFollowUp(followUpQuery.trim());
      setFollowUpQuery("");
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b-2 border-purple-200 dark:border-purple-800 bg-sidebar/30">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {(() => {
            const IconComponent = getIntentIcon(session.intent);
            return <IconComponent className="w-5 h-5 text-primary flex-shrink-0" />;
          })()}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-semibold truncate">{session.query}</h1>
              <Badge className={cn("text-xs px-2 py-1", getIntentColor(session.intent))}>
                {getIntentLabel(session.intent)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {format(session.timestamp, 'MMM d, h:mm a')} • {session.results.length} results
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onExport} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={onNewSearch} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Search
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
      </div>

      {/* Results Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Main Results */}
        <div className="space-y-4">
          {session.results.map((result, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <CardTitle className="text-lg hover:text-primary transition-colors cursor-pointer">
                      {result.title}
                    </CardTitle>
                    {result.url && (
                      <CardDescription className="flex items-center gap-1 text-xs">
                        <ExternalLink className="w-3 h-3" />
                        {result.url}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant="secondary" className="flex-shrink-0">
                    Result {index + 1}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                  <MarkdownRenderer content={result.content} />
                </div>
                {result.snippet && (
                  <p className="text-xs text-muted-foreground mt-3 italic border-t pt-2">
                    {result.snippet}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Follow-up Results */}
        {session.followUps.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="w-4 h-4" />
              Follow-up searches
            </div>
            {session.followUps.map((followUp, index) => (
              <Card key={index} className="border-l-4 border-l-primary/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{followUp.query}</CardTitle>
                  <CardDescription>
                    {format(followUp.timestamp, 'h:mm a')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                    <MarkdownRenderer content={followUp.result.content} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Follow-up Input */}
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <form onSubmit={handleFollowUpSubmit} className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Plus className="w-4 h-4" />
                Ask a follow-up question
              </div>
              <div className="flex gap-2">
                <Input
                  value={followUpQuery}
                  onChange={(e) => setFollowUpQuery(e.target.value)}
                  placeholder="What would you like to know more about?"
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button 
                  type="submit" 
                  disabled={!followUpQuery.trim() || isLoading}
                  className="px-6"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Ask"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};