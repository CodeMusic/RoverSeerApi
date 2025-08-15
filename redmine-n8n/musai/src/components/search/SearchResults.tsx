import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Plus, ArrowLeft, ExternalLink, Clock, Brain, Link, Cog, Globe, ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer";
import type { SearchSessionModel, SearchResult } from "@/types/search";
import { MysticalTypingIndicator } from "@/components/chat/MysticalTypingIndicator";
import { useTheme } from "@/contexts/ThemeContext";

interface SearchResultsProps {
  session: SearchSessionModel;
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
  const followUpInputRef = useRef<HTMLInputElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll results container to bottom when results or follow-ups change
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    // Smooth scroll to bottom; guard for layout
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    });
  }, [session.results.length, session.followUps.length]);

  // After a follow-up completes, keep the input visible and focused so the user can add more
  useEffect(() => {
    if (!isLoading) {
      const el = scrollContainerRef.current;
      if (el) {
        requestAnimationFrame(() => {
          el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        });
      }
      followUpInputRef.current?.focus();
    }
  }, [isLoading]);
  const [feedback, setFeedback] = useState<Record<number, 'up' | 'down' | undefined>>({});
  const { isDark } = useTheme();
  const isInitialLoading = isLoading && session.results.length === 0 && session.followUps.length === 0;
  const isFollowUpLoading = isLoading && !isInitialLoading;
  const handleFeedback = (index: number, value: 'up' | 'down') => {
    setFeedback(prev => ({ ...prev, [index]: prev[index] === value ? undefined : value }));
    // TODO: send feedback to backend if needed
  };

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
    <div ref={scrollContainerRef} className="flex-1 min-h-0 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-6 border-b-2 border-purple-200 dark:border-purple-800 bg-sidebar/30">
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
              {session.mode === 'research' && (
                <Badge variant="secondary" className="text-xs px-2 py-1">research</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {format(session.timestamp, 'MMM d, h:mm a')} • {session.results.length} results
            </p>
            {Array.isArray(session.sources) && session.sources.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {session.sources.map((s, i) => (
                  <Badge key={i} variant="outline" className="text-[10px]">{s}</Badge>
                ))}
              </div>
            )}
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

      {/* Loading indicator moved near the follow-up input (not shown at the top) */}

      {/* Results Content */}
      <div
        className="relative flex-1 min-h-0 p-6 space-y-6 pb-40"
        style={{ WebkitOverflowScrolling: 'touch', scrollPaddingTop: '80px' }}
      >
        {/* Initial Loading Indicator (overlayed near bottom without shifting layout) */}
        {isInitialLoading && (
          <div className="absolute left-6 bottom-28 pointer-events-none">
            <MysticalTypingIndicator 
              isDarkMode={isDark}
              label={session.mode === 'research' ? 'Musai is researching' : 'Musai is searching'}
              size="default"
            />
          </div>
        )}

        {/* Main Results */}
        <div className="space-y-4">
          {session.results.map((result: SearchResult, index) => (
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
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="secondary">Result {index + 1}</Badge>
                    <button
                      className={cn(
                        "p-1 rounded hover:bg-accent",
                        feedback[index] === 'up' ? "text-green-600" : "text-muted-foreground"
                      )}
                      title="Helpful"
                      onClick={() => handleFeedback(index, 'up')}
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button
                      className={cn(
                        "p-1 rounded hover:bg-accent",
                        feedback[index] === 'down' ? "text-red-600" : "text-muted-foreground"
                      )}
                      title="Not helpful"
                      onClick={() => handleFeedback(index, 'down')}
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>
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
                {/* Source chips */}
                {Array.isArray(result.sourcesUsed) && result.sourcesUsed.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {result.sourcesUsed.map((src, i) => (
                      <Badge key={i} variant="outline">{src}</Badge>
                    ))}
                  </div>
                )}
                {/* Bicameral evidence */}
                {result.bicameral && (
                  <div className="mt-4 grid md:grid-cols-3 gap-3 text-xs">
                    <div className="p-2 rounded border bg-card">
                      <div className="font-medium mb-1">Creative</div>
                      <div className="text-muted-foreground">{result.bicameral.creative?.summary}</div>
                    </div>
                    <div className="p-2 rounded border bg-card">
                      <div className="font-medium mb-1">Logical</div>
                      <div className="text-muted-foreground">{result.bicameral.logical?.summary}</div>
                    </div>
                    <div className="p-2 rounded border bg-card">
                      <div className="font-medium mb-1">Fusion</div>
                      <div className="text-muted-foreground">{result.bicameral.fusion?.summary}</div>
                    </div>
                  </div>
                )}
                {/* Conflict cards */}
                {Array.isArray(result.conflicts) && result.conflicts.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {result.conflicts.map((c, ci) => (
                      <div key={ci} className="p-2 rounded border bg-amber-50 dark:bg-amber-950/20">
                        <div className="text-xs font-medium mb-1">Conflict: {c.title || 'Perspective mismatch'}</div>
                        <div className="text-xs text-muted-foreground">{c.description}</div>
                        {(c.perspectiveA || c.perspectiveB) && (
                          <div className="grid md:grid-cols-2 gap-2 mt-2 text-xs">
                            <div className="p-2 rounded border bg-card"><span className="font-medium">A:</span> {c.perspectiveA}</div>
                            <div className="p-2 rounded border bg-card"><span className="font-medium">B:</span> {c.perspectiveB}</div>
                          </div>
                        )}
                        {c.resolutionHint && (
                          <div className="mt-1 text-[11px] italic text-muted-foreground">Hint: {c.resolutionHint}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {/* Personalization */}
                {result.personalization && (
                  <div className="mt-4 p-2 rounded border bg-card">
                    <div className="text-xs font-medium mb-1">For you</div>
                    <div className="text-xs text-muted-foreground">{result.personalization.summary}</div>
                  </div>
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

        {/* Spacer only; sticky follow-up bar is below */}
      </div>

      {/* Sticky Follow-up Input at Bottom */}
      <div className="sticky bottom-0 z-30 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-5xl w-full p-4" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
          <form onSubmit={handleFollowUpSubmit} className="w-full">
            <div className="flex items-center gap-3 w-full">
              <Plus className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
              <span className="text-sm font-medium whitespace-nowrap text-muted-foreground" onClick={() => followUpInputRef.current?.focus()}>Ask a follow-up</span>
              <Input
                ref={followUpInputRef}
                value={followUpQuery}
                onChange={(e) => setFollowUpQuery(e.target.value)}
                placeholder="What would you like to know more about?"
                className="flex-1 min-w-0"
                disabled={isInitialLoading || isFollowUpLoading}
              />
              <div className="flex items-center gap-2">
                {isFollowUpLoading ? (
                  <MysticalTypingIndicator 
                    isDarkMode={isDark}
                    label={session.mode === 'research' ? 'Musai is researching' : 'Musai is searching'}
                    size="compact"
                  />
                ) : (
                  <Button 
                    type="submit" 
                    disabled={isInitialLoading || !followUpQuery.trim()}
                    className="px-5"
                  >
                    Ask
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};