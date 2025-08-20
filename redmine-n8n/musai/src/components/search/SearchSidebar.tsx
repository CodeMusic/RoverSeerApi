import { Button } from "@/components/ui/button";
import { Search, Plus, Brain, Link, Cog, Globe, RefreshCcw } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useMemo, useEffect, useState } from "react";
import type { SearchSessionModel } from "@/types/search";
import { BaseSessionSidebar } from "@/components/common/BaseSessionSidebar";
import type { BaseSession } from "@/types/chat";
import { UI_STRINGS } from "@/config/uiStrings";
import { APP_TERMS } from "@/config/constants";

type SearchSession = SearchSessionModel;

interface SearchSidebarProps {
  sessions: SearchSession[];
  currentSessionId: string | null;
  isSidebarOpen: boolean;
  isCollapsed: boolean;
  onSessionSelect: (sessionId: string) => void;
  onNewSearch: () => void;
  onToggleCollapse: () => void;
  onDeleteSession?: (sessionId: string) => void;
  onRenameSession?: (sessionId: string, newName: string) => void;
  onToggleFavorite?: (sessionId: string) => void;
  onQuickTopicSearch?: (topic: string) => void;
}

export const SearchSidebar = ({
  sessions,
  currentSessionId,
  isSidebarOpen,
  isCollapsed,
  onSessionSelect,
  onNewSearch,
  onToggleCollapse,
  onDeleteSession,
  onRenameSession,
  onToggleFavorite,
  onQuickTopicSearch,
}: SearchSidebarProps) => {
  type SearchSidebarSession = SearchSession & BaseSession;
  const adaptedSessions: SearchSidebarSession[] = useMemo(() => {
    return sessions.map((s) => ({
      ...s,
      lastUpdated: s.timestamp,
      createdAt: s.timestamp,
      favorite: Boolean(s.favorite),
      type: 'search' as const,
    })) as SearchSidebarSession[];
  }, [sessions]);

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

  const getSessionIcon = (session: SearchSidebarSession) => {
    const IconComponent = getIntentIcon(session.intent);
    return <IconComponent className="w-4 h-4" />;
  };

  // Quick topics: select 3 random topics once on mount (no timer rotation)
  const allTopics = useMemo(() => (
    [
      "AI safety",
      "LLM hallucinations",
      "TypeScript best practices",
      "React accessibility",
      "Prompt engineering",
      "Vector databases",
      "n8n workflow tips",
      "Redmine integrations",
      "Docker Compose patterns",
      "Kubernetes basics",
      "Neuroscience of attention",
      "Cognitive biases in UX",
      "Agile retrospectives",
      "GraphQL vs REST",
      "Edge computing",
      "RAG architectures",
      "OpenAI function calling",
      "Healthcare AI compliance",
      "Search ranking algorithms",
      "Web performance tuning"
    ]
  ), []);
  const [visibleTopics, setVisibleTopics] = useState<string[]>([]);

  const getRandomTopics = (count: number): string[] => {
    if (!allTopics || allTopics.length === 0) return [] as string[];
    const topics = [...allTopics];
    for (let i = topics.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [topics[i], topics[j]] = [topics[j], topics[i]];
    }
    return topics.slice(0, Math.min(count, topics.length));
  };

  useEffect(() => {
    setVisibleTopics(getRandomTopics(3));
  }, [allTopics]);

  return (
    <BaseSessionSidebar
      sessions={adaptedSessions}
      currentSessionId={currentSessionId ?? ''}
      isSidebarOpen={isSidebarOpen}
      title={UI_STRINGS.musai[APP_TERMS.TAB_SEARCH]?.sidebarTitle || UI_STRINGS.defaults.sidebarTitle}
      newSessionText={UI_STRINGS.musai[APP_TERMS.TAB_SEARCH]?.newSessionText || UI_STRINGS.defaults.newSessionText}
      getSessionIcon={getSessionIcon}
      getSessionName={(session: SearchSidebarSession) => {
        const raw = session.name || session.query || "";
        const maxLen = 60;
        return raw.length > maxLen ? raw.slice(0, maxLen) + "…" : raw;
      }}
      getSessionSubtitle={(session: SearchSidebarSession) => {
        const results = session.results?.length ?? 0;
        const followUps = session.followUps?.length ?? 0;
        const time = format((session as any).timestamp ?? (session as any).lastUpdated, 'MMM d, h:mm a');
        const mode = session.mode === 'research' ? ' • research' : '';
        const follow = followUps > 0 ? ` • ${followUps} follow-up${followUps !== 1 ? 's' : ''}` : '';
        return `${results} result${results !== 1 ? 's' : ''}${follow} • ${time}${mode}`;
      }}
      onNewSession={onNewSearch}
      onSessionSelect={onSessionSelect}
      onDeleteSession={(id) => onDeleteSession?.(id)}
      onRenameSession={(id, name) => onRenameSession?.(id, name)}
      onToggleFavorite={(id) => onToggleFavorite?.(id)}
      onToggleCollapse={onToggleCollapse}
      renderTopSection={(
        <div className="p-4 pt-0">
          <div className="mt-2 border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">Quick Topics</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground"
                title="Shuffle topics"
                onClick={() => setVisibleTopics(getRandomTopics(3))}
              >
                <RefreshCcw className="w-3 h-3" />
              </Button>
            </div>
            <div className="space-y-1 pb-2">
              {visibleTopics.map((topic) => (
                <Button
                  key={topic}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => onQuickTopicSearch?.(topic)}
                >
                  <Search className="w-3 h-3 mr-2" />
                  {topic}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    />
  );
};