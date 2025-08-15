import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/search/SearchInput";
import { SearchResults } from "@/components/search/SearchResults";
import { SearchSidebar } from "@/components/search/SearchSidebar";
import { PreSearchView } from "@/components/search/PreSearchView";
import { ToolHeader } from "@/components/common/ToolHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { computeAndStoreClientIpHash, getStoredClientIpHash } from "@/utils/ip";
import { Menu, Search, Plus, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_TERMS, MUSAI_MODULES } from "@/config/constants";
import { TIMEOUTS, createTimeoutController, formatTimeout } from "@/config/timeouts";
import { getRandomWittyError } from "@/config/messages";
import type { SearchMode, SearchSource, SearchSessionModel, SearchResult } from "@/types/search";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface SearchSession extends SearchSessionModel {}

interface SearchLayoutProps {
  onClose: () => void;
  initialQuery?: string;
}

export const SearchLayout = ({ onClose, initialQuery }: SearchLayoutProps) => {
  const [currentQuery, setCurrentQuery] = useState("");
  const [searchSessions, setSearchSessions] = useState<SearchSession[]>([]);


  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [clientIpHash, setClientIpHash] = useState<string | null>(getStoredClientIpHash());
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();

  // MuseEyeSearch parameters
  const [mode, setMode] = useState<SearchMode>('standard');
  const [sources, setSources] = useState<SearchSource[]>(['web']);

  const currentSession = searchSessions.find(s => s.id === currentSessionId);
  const hasSearched = currentSessionId !== null;
  
  // Track if we've processed the initial query to prevent re-execution
  const [hasProcessedInitialQuery, setHasProcessedInitialQuery] = useState(false);
  // Ensure we only initialize selection from storage once to avoid overriding "New Search" state
  const [hasInitializedFromStorage, setHasInitializedFromStorage] = useState(false);

  // Load sessions from localStorage filtered by client IP hash
  useEffect(() => {
    try {
      const raw = localStorage.getItem('search_sessions_v1');
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        const filtered = clientIpHash ? parsed.filter((s: any) => !s.clientIpHash || s.clientIpHash === clientIpHash) : parsed;
        // Only initialize from storage if we don't already have sessions in memory
        setSearchSessions(prev => (prev && prev.length > 0) ? prev : filtered);
        // Only set a default current session on the very first hydration
        if (!hasInitializedFromStorage) {
          setCurrentSessionId(prevId => prevId !== null ? prevId : (filtered.length > 0 ? filtered[0].id : null));
          setHasInitializedFromStorage(true);
        }
      }
    } catch (e) {
      console.warn('Failed to load search sessions from storage', e);
    }
  }, [clientIpHash, hasInitializedFromStorage]);

  // Resolve client IP hash once and store
  useEffect(() => {
    computeAndStoreClientIpHash().then(hash => { if (hash) setClientIpHash(hash); });
  }, []);

  const persistSessions = (updater: (prev: SearchSession[]) => SearchSession[]) => {
    setSearchSessions(prev => {
      const next = updater(prev);
      localStorage.setItem('search_sessions_v1', JSON.stringify(next));
      return next;
    });
  };

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setCurrentQuery(query);

    // Manual timeout check as backup - declare at function level
    let manualTimeoutId: NodeJS.Timeout;

    // Prepare a new session immediately so UI navigates to results screen
    const provisionalSessionId = `${Date.now()}`;
    const effectiveSources: SearchSource[] = (sources && sources.length > 0) ? sources : (['web'] as SearchSource[]);
    const provisional: SearchSession = {
      id: provisionalSessionId,
      query,
      intent: 'llm',
      mode,
      sources: effectiveSources,
      clientIpHash: clientIpHash || undefined,
      serverSessionId: clientIpHash || provisionalSessionId,
      results: [],
      followUps: [],
      timestamp: Date.now(),
    };
    persistSessions(prev => [provisional, ...prev]);
    setCurrentSessionId(provisionalSessionId);

    try {

      const startTime = Date.now();
      // Create timeout controller with configured search timeout (10 minutes minimum)
      const { controller, timeoutId, timeout, signal, cleanup } = createTimeoutController(TIMEOUTS.SEARCH_REQUEST);
      
      console.log(`Starting search with ${formatTimeout(timeout)} timeout`);
      console.log(`Search query: "${query}"`);
      console.log(`Request timestamp: ${new Date().toISOString()}`);
      
      manualTimeoutId = setTimeout(() => {
        console.log(`Manual timeout check: ${Date.now() - startTime}ms elapsed`);
      }, 60000); // Log at 1 minute
      
      // Use the configured Musai Search endpoint with Basic Auth
      const { N8N_ENDPOINTS } = await import('@/config/n8nEndpoints');
      const { withN8nAuthHeaders } = await import('@/lib/n8nClient');
      const { queuedFetch } = await import('@/lib/AttentionalRequestQueue');
      const url = `${N8N_ENDPOINTS.BASE_URL}${N8N_ENDPOINTS.SEARCH.ENHANCE_QUERY}`;
      const headers = withN8nAuthHeaders({ 'Content-Type': 'application/json' });
      // Format query with explicit tags for mode/sources without altering the stored UI query
      const formattedQuery = [
        query,
        mode === 'research' ? '[mode: research]' : '[mode: search]',
        effectiveSources && effectiveSources.length > 0
          ? `[sources: ${effectiveSources.join(', ')}]`
          : undefined,
      ].filter(Boolean).join(' ');

      // Single-shot request (no retries)
      const response = await queuedFetch(url, {
        method: 'POST',
        headers,
        cache: 'no-store',
        body: JSON.stringify({
          sessionId: clientIpHash || provisionalSessionId,
          query: formattedQuery,
          params: {
            module: MUSAI_MODULES.SEARCH,
            debug: true,
            timestamp: Date.now(),
            mode,
            sources: effectiveSources,
          }
        }),
      }, TIMEOUTS.SEARCH_REQUEST);
      
      console.log(`Fetch completed, status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log(`Starting to parse response JSON...`);
      const responseData = await response.json();
      console.log(`JSON parsing completed`);
      
      cleanup(); // Clear timeout after response is fully processed
      clearTimeout(manualTimeoutId); // Clear manual timeout check
      
              // Log the response to understand the structure from your musai backend
        console.log("Search response received from musai n8n backend:", responseData);
      console.log(`Response timestamp: ${new Date().toISOString()}`);
      console.log(`Total request time: ${Date.now() - startTime}ms`);
      console.log(`Query sent: "${query}"`);
      console.log(`Current query state: "${currentQuery}"`);
      
              // Process the response from musai n8n backend - handle your specific format
      const results = Array.isArray(responseData) ? responseData : [responseData];
      
      // Extract intent if provided by backend
      const intent = responseData.intent || responseData.category || 'llm';
      
      // Log each result to debug content mismatch
      results.forEach((result, index) => {
        console.log(`Result ${index}:`, {
          title: result.title,
          text: result.text,
          content: result.content,
          response: result.response,
          answer: result.answer
        });
      });
      
      // Update the provisional session with final results
      persistSessions(prev => prev.map((s) => {
        if (s.id !== provisionalSessionId) return s;
        const mappedResults = results.map((result, index) => {
          const content = result.text || result.content || result.response || result.answer || "No content available";
          console.log(`Mapping result ${index} content:`, content.substring(0, 100) + "...");
          const mapped: SearchResult = {
            title: result.title || `AI Response for: ${query}`,
            content,
            url: result.url || result.source || "",
            snippet: result.snippet || result.summary || "",
            type: intent,
            sourcesUsed: result.sourcesUsed || result.sources || effectiveSources,
            bicameral: result.bicameral,
            conflicts: result.conflicts,
            personalization: result.personalization,
            raw: result,
          };
          return mapped;
        });
        return { ...s, intent, results: mappedResults, timestamp: Date.now() };
      }));
    } catch (error) {
      console.error("Search error:", error);
      
      // Handle different types of errors
      let errorMessage = getRandomWittyError();
      let errorTitle = "Search Error";
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorTitle = "Search Timeout";
          errorMessage = `Your search for "${query}" took too long to complete (over ${formatTimeout(TIMEOUTS.SEARCH_REQUEST)}). The musai workflow is processing your request but it's taking longer than expected. You can try again or simplify your query.`;
        } else if (error.message.includes('Failed to fetch')) {
          errorTitle = "Connection Error";
          errorMessage = `Unable to connect to the search service. Please check your internet connection and try again.`;
        }
      }
      
      // Update the provisional session with error result
      persistSessions(prev => prev.map((s) => {
        if (s.id !== provisionalSessionId) return s;
        return {
          ...s,
          intent: 'search',
          results: [{
            title: errorTitle,
            content: errorMessage,
            url: "",
            snippet: "Error occurred during search",
            type: 'search'
          }],
          timestamp: Date.now(),
        };
      }));
    } finally {
      clearTimeout(manualTimeoutId); // Ensure manual timeout is cleared
      setIsLoading(false);
    }
  }, [clientIpHash]);

  // Handle initial query from navigation - placed after handleSearch declaration
  useEffect(() => {
    if (initialQuery && !hasProcessedInitialQuery) {
      console.log('Auto-executing initial search query:', initialQuery);
      setHasProcessedInitialQuery(true);
      handleSearch(initialQuery);
    }
  }, [initialQuery, hasProcessedInitialQuery, handleSearch]);

  const handleFollowUp = useCallback(async (followUpQuery: string) => {
    if (!currentSession || !followUpQuery.trim()) return;

    setIsLoading(true);

    try {
      // Create timeout controller with configured follow-up timeout
      const { controller, timeoutId, timeout, signal, cleanup } = createTimeoutController(TIMEOUTS.SEARCH_FOLLOWUP);
      
      console.log(`Starting follow-up search with ${formatTimeout(timeout)} timeout`);
      
      // Use the same n8n endpoint for follow-up queries
      const effectiveSources: SearchSource[] = (sources && sources.length > 0) ? sources : (['web'] as SearchSource[]);
      const { N8N_ENDPOINTS: ENDPOINTS2 } = await import('@/config/n8nEndpoints');
      const { withN8nAuthHeaders: authHeaders2 } = await import('@/lib/n8nClient');
      const { queuedFetch: qf2 } = await import('@/lib/AttentionalRequestQueue');
      const url2 = `${ENDPOINTS2.BASE_URL}${ENDPOINTS2.SEARCH.ENHANCE_QUERY}`;
      // Keep follow-up format consistent with initial: plain query augmented with square-bracket tags
      const tags = [
        `mode: ${mode === 'research' ? 'research' : 'search'}`,
        effectiveSources && effectiveSources.length > 0 ? `sources: ${effectiveSources.join(', ')}` : undefined,
      ].filter(Boolean).map(t => `[${t}]`).join(' ');

      const combinedQuery = [followUpQuery, tags].filter(Boolean).join(' ');

      const response = await qf2(url2, {
        method: 'POST',
        headers: authHeaders2({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          sessionId: currentSessionId,
          query: combinedQuery,
          params: {
            module: MUSAI_MODULES.SEARCH,
            debug: true,
            isFollowUp: true,
            originalQuery: currentSession.query,
            timestamp: Date.now(),
            mode,
            sources: effectiveSources,
          }
        }),
      }, TIMEOUTS.SEARCH_FOLLOWUP);
      
      cleanup(); // Clear timeout if request completes

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      
      // Handle the same response format for follow-ups
      const results = Array.isArray(responseData) ? responseData : [responseData];
      const firstResult = results[0] || {};
      
      const followUpResult = {
        query: followUpQuery,
        result: {
          content: firstResult.text || firstResult.content || firstResult.response || firstResult.answer || "No content available"
        },
        timestamp: Date.now()
      };

      persistSessions(prev => prev.map(session => session.id === currentSessionId
        ? { ...session, followUps: [...session.followUps, followUpResult] }
        : session
      ));
    } catch (error) {
      console.error("Follow-up error:", error);
      
      // Handle different types of errors for follow-ups
      let errorMessage = `Sorry, there was an error processing your follow-up question "${followUpQuery}". Please try again.`;
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = `Your follow-up question "${followUpQuery}" took too long to complete (over ${formatTimeout(TIMEOUTS.SEARCH_FOLLOWUP)}). Please try again or ask a simpler question.`;
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = `Unable to connect to the search service for your follow-up. Please check your internet connection and try again.`;
        }
      }
      
      // Fallback error result
      const errorResult = {
        query: followUpQuery,
        result: {
          content: errorMessage
        },
        timestamp: Date.now()
      };

      persistSessions(prev => prev.map(session => session.id === currentSessionId
        ? { ...session, followUps: [...session.followUps, errorResult] }
        : session
      ));
    } finally {
      setIsLoading(false);
    }
  }, [currentSession, currentSessionId]);

  // Retry the initial search in-place: clear previous error/results, show initial loader, and replace on success/fail
  const handleRetryInitial = useCallback(async () => {
    if (!currentSession) return;

    // Clear previous results to trigger initial loading indicator placement
    persistSessions(prev => prev.map(s => s.id === currentSession.id
      ? { ...s, results: [], followUps: [] }
      : s
    ));

    setIsLoading(true);

    try {
      const { controller, timeoutId, timeout, signal, cleanup } = createTimeoutController(TIMEOUTS.SEARCH_REQUEST);

      const effectiveSources: SearchSource[] = (sources && sources.length > 0) ? sources : (['web'] as SearchSource[]);
      const { N8N_ENDPOINTS } = await import('@/config/n8nEndpoints');
      const { withN8nAuthHeaders } = await import('@/lib/n8nClient');
      const { queuedFetch } = await import('@/lib/AttentionalRequestQueue');
      const url = `${N8N_ENDPOINTS.BASE_URL}${N8N_ENDPOINTS.SEARCH.ENHANCE_QUERY}`;
      const headers = withN8nAuthHeaders({ 'Content-Type': 'application/json' });

      const tags = [
        `mode: ${mode === 'research' ? 'research' : 'search'}`,
        effectiveSources && effectiveSources.length > 0 ? `sources: ${effectiveSources.join(', ')}` : undefined,
      ].filter(Boolean).map(t => `[${t}]`).join(' ');

      const formattedQuery = [currentSession.query, tags].filter(Boolean).join(' ');

      const response = await queuedFetch(url, {
        method: 'POST',
        headers,
        cache: 'no-store',
        body: JSON.stringify({
          sessionId: currentSession.serverSessionId || currentSessionId,
          query: formattedQuery,
          params: {
            module: MUSAI_MODULES.SEARCH,
            debug: true,
            timestamp: Date.now(),
            mode,
            sources: effectiveSources,
          }
        }),
      }, TIMEOUTS.SEARCH_REQUEST);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      const results = Array.isArray(responseData) ? responseData : [responseData];
      const intent = responseData.intent || responseData.category || 'llm';

      persistSessions(prev => prev.map((s) => {
        if (s.id !== currentSession.id) return s;
        const mappedResults = results.map((result, index) => {
          const content = result.text || result.content || result.response || result.answer || "No content available";
          const mapped: SearchResult = {
            title: result.title || `AI Response for: ${currentSession.query}`,
            content,
            url: result.url || result.source || "",
            snippet: result.snippet || result.summary || "",
            type: intent,
            sourcesUsed: result.sourcesUsed || result.sources || effectiveSources,
            bicameral: result.bicameral,
            conflicts: result.conflicts,
            personalization: result.personalization,
            raw: result,
          } as any;
          return mapped;
        });
        return { ...s, intent, results: mappedResults, timestamp: Date.now() } as any;
      }));

      setIsLoading(false);
    } catch (error) {
      console.error('Retry initial search failed:', error);
      // Replace with a single error panel (do not stack)
      persistSessions(prev => prev.map((s) => {
        if (!currentSession || s.id !== currentSession.id) return s;
        return {
          ...s,
          intent: 'search',
          results: [{
            title: 'Search Error',
            content: getRandomWittyError(),
            url: '',
            snippet: 'Error occurred during search',
            type: 'search'
          } as any],
          followUps: [],
          timestamp: Date.now(),
        } as any;
      }));
      setIsLoading(false);
    }
  }, [currentSession, currentSessionId, sources, mode]);

  const handleSessionSelect = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile]);

  const handleNewSearch = useCallback(() => {
    // Clear current session and query to start fresh
    console.log("Starting new search - clearing current session");
    setCurrentSessionId(null);
    setCurrentQuery("");
  }, []);

  // Handler for trending topics quick action
  const handleShowTrendingTopics = useCallback(() => {
    console.log('🔥 Showing trending topics');
    const trendingQuery = "Show me trending topics in technology, AI, and programming today";
    handleSearch(trendingQuery);
  }, [handleSearch]);

  // Handler for quick answers action
  const handleQuickAnswers = useCallback(() => {
    console.log('⚡ Getting quick answers');
    const quickQuery = "Give me quick insights on current tech trends, AI developments, and programming news";
    handleSearch(quickQuery);
  }, [handleSearch]);

  const handleViewPreviousSearches = useCallback(() => {
    // If no searches exist, add demo data first
    if (searchSessions.length === 0) {
      const demoSessions: SearchSession[] = [
        {
          id: "demo-1",
          query: "TypeScript best practices",
          intent: "search",
          mode: 'standard',
          sources: ['web'],
          results: [
            {
              title: "TypeScript Best Practices Guide",
              content: "A comprehensive guide to writing better TypeScript code with proven patterns and techniques.",
              url: "https://example.com/typescript-guide",
              snippet: "Learn about type safety, interfaces, and modern TypeScript features...",
              type: "search"
            }
          ],
          followUps: [
            {
              query: "How to handle async/await in TypeScript?",
              result: {
                content: "TypeScript provides excellent support for async/await patterns with proper type inference..."
              },
              timestamp: Date.now() - 300000
            }
          ],
          timestamp: Date.now() - 3600000
        },
        {
          id: "demo-2", 
          query: "Explain machine learning basics",
          intent: "llm",
          mode: 'standard',
          sources: ['web'],
          results: [
            {
              title: "AI Response: Machine Learning Basics",
              content: "Machine learning is a subset of artificial intelligence that enables computers to learn patterns from data without being explicitly programmed for each task.",
              url: "",
              snippet: "Understanding the fundamentals of ML algorithms and their applications...",
              type: "llm"
            }
          ],
          followUps: [],
          timestamp: Date.now() - 7200000
        },
        {
          id: "demo-3",
          query: "Summarize https://example.com/ai-article",
          intent: "summarize", 
          mode: 'standard',
          sources: ['web'],
          results: [
            {
              title: "Article Summary: The Future of AI",
              content: "The article discusses the rapid advancement of AI technology and its potential impact on various industries over the next decade.",
              url: "https://example.com/ai-article",
              snippet: "Key points about AI development, ethical considerations, and market predictions...",
              type: "summarize"
            }
          ],
          followUps: [],
          timestamp: Date.now() - 10800000
        },
        {
          id: "demo-4",
          query: "Create a weekly reminder for team meeting",
          intent: "tool",
          mode: 'standard',
          sources: ['web'],
          results: [
            {
              title: "Tool Action: Reminder Created",
              content: "Successfully created a weekly reminder for your team meeting. You will be notified every Monday at 9:00 AM.",
              url: "",
              snippet: "Workflow automation completed - reminder set in your calendar system...",
              type: "tool"
            }
          ],
          followUps: [],
          timestamp: Date.now() - 14400000
        }
      ];
      setSearchSessions(demoSessions);
    }
    // Show the search sessions by setting hasSearched to true
    setCurrentSessionId(null);
  }, [searchSessions]);

  const handleDeleteSession = useCallback((sessionId: string) => {
    persistSessions(prev => prev.filter(session => session.id !== sessionId));
    // If we're deleting the current session, reset to no selection
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
    }
  }, [currentSessionId]);

  const handleExportSession = useCallback(() => {
    if (!currentSession) return;

    // TODO: Implement HTML export functionality
    console.log("Exporting session:", currentSession);
  }, [currentSession]);

  // Scroll container for keeping controls visible and scrolling results
  const mainScrollRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="flex h-[100dvh] relative bg-background overflow-x-hidden">
      {/* Mobile menu button */}
      {isMobile && hasSearched && (
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed top-8 left-16 z-50 p-2 rounded-lg bg-background border shadow-md"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Desktop collapse toggle button */}
      {hasSearched && !isMobile && (
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="fixed top-8 left-4 z-50 p-2 rounded-lg bg-background border shadow-md hover:bg-accent transition-colors"
          title={isSidebarCollapsed ? "Show search history" : "Hide search history"}
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Search Sidebar - only show when there are search sessions */}
      {hasSearched && !isSidebarCollapsed && (
        <div className={cn(
          "transition-all duration-300 h-[100dvh] min-h-0 overflow-hidden",
          // On mobile, render as overlay so it doesn't push content width
          // Use higher z-index than the backdrop overlay to keep it clickable
          isMobile ? "fixed inset-y-0 left-0 z-50 w-64 bg-background border-r shadow-lg" : "ml-0",
          // Hide when mobile sidebar is not open
          isMobile && !isSidebarOpen ? "-translate-x-full" : undefined
        )}>
          <SearchSidebar
            sessions={searchSessions}
            currentSessionId={currentSessionId}
            isSidebarOpen={isSidebarOpen}
            isCollapsed={isSidebarCollapsed}
            onSessionSelect={handleSessionSelect}
            onNewSearch={handleNewSearch}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            onDeleteSession={handleDeleteSession}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div ref={mainScrollRef} className={cn(
        "flex-1 min-h-0 flex flex-col bg-background h-[100dvh] overflow-y-auto transition-all duration-300",
        hasSearched && !isMobile && !isSidebarCollapsed ? "ml-0" : "ml-0"
      )}>
        {/* Always show header */}
        <ToolHeader
          icon={Search}
          title={APP_TERMS.SEARCH}
          badge={APP_TERMS.SEARCH_BADGE}
          badgeIcon={Zap}
          description={APP_TERMS.SEARCH_DESCRIPTION}
          size="compact"
        />
        {/* Search controls: show after first search so PreMusai sits higher initially */}
        {hasSearched && (
          <div className="sticky top-0 z-30 px-6 pt-2 pb-1 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60" style={{ paddingTop: 'max(env(safe-area-inset-top), 8px)' }}>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Label htmlFor="mode-switch" className="text-xs text-muted-foreground">Research mode</Label>
                <Switch id="mode-switch" checked={mode === 'research'} onCheckedChange={(v) => setMode(v ? 'research' : 'standard')} disabled={isLoading} aria-label="Toggle research mode" />
                <Badge variant="secondary">{mode}</Badge>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-muted-foreground">Sources:</span>
                {(['web','news','academic','github','docs','redmine','social'] as SearchSource[]).map((s) => (
                  <label key={s} className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <Checkbox
                      checked={sources.includes(s)}
                      onCheckedChange={(v) => {
                        setSources((prev) => {
                          const isChecked = Boolean(v);
                          if (isChecked) return prev.includes(s) ? prev : [...prev, s];
                          return prev.filter((x) => x !== s);
                        });
                      }}
                      disabled={isLoading}
                      aria-label={`Toggle source ${s}`}
                    />
                    <span className="text-xs text-muted-foreground">{s}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {!hasSearched ? (
          <PreSearchView 
            onSearch={handleSearch}
            isLoading={isLoading}
            onClose={onClose}
            onViewPreviousSearches={handleViewPreviousSearches}
            onShowTrendingTopics={handleShowTrendingTopics}
            onQuickAnswers={handleQuickAnswers}
          />
        ) : currentSession ? (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <SearchResults
              session={currentSession}
              onFollowUp={handleFollowUp}
              onNewSearch={handleNewSearch}
              onExport={handleExportSession}
              isLoading={isLoading}
              onClose={onClose}
              onRetryInitial={handleRetryInitial}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Select a Search</h2>
                <p className="text-muted-foreground">
                  Choose a previous search from the sidebar or start a new one
                </p>
              </div>
              <Button onClick={handleNewSearch} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Search
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile sidebar overlay */}
      {isMobile && isSidebarOpen && hasSearched && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};