import { useState, useCallback, useEffect, useRef, useMemo } from "react";
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
import { buildThreadSessionId } from "@/lib/n8nClient";
import { TIMEOUTS, createTimeoutController, formatTimeout } from "@/config/timeouts";
import { getRandomWittyError } from "@/config/messages";
import type { SearchMode, SearchSource, SearchSessionModel, SearchResult } from "@/types/search";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/contexts/ThemeContext";
import { format } from "date-fns";
// Note: Do not show the global Musai Copilot Navigator on the Search screens

interface SearchSession extends SearchSessionModel {}

interface SearchLayoutProps {
  onClose: () => void;
  initialQuery?: string;
  initialMode?: SearchMode;
}

export const SearchLayout = ({ onClose, initialQuery, initialMode }: SearchLayoutProps) => {
  const [currentQuery, setCurrentQuery] = useState("");
  const [searchSessions, setSearchSessions] = useState<SearchSession[]>([]);


  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [clientIpHash, setClientIpHash] = useState<string | null>(getStoredClientIpHash());
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const isMobile = useIsMobile();
  const { preference } = useTheme();

  // MuseEyeSearch parameters
  const [mode, setMode] = useState<SearchMode>(() =>
  {
    // Prefer explicit prop
    if (initialMode)
    {
      return initialMode;
    }
    // Synchronous fallback from sessionStorage to avoid post-mount flips
    try
    {
      const persisted = sessionStorage.getItem('musai-search-initial-mode');
      if (persisted === 'research')
      {
        sessionStorage.removeItem('musai-search-initial-mode');
        return 'research';
      }
    }
    catch
    {
      // ignore storage errors
    }
    return 'standard';
  });
  const hasAppliedInitialMode = useRef(false);
  const [sources, setSources] = useState<SearchSource[]>(['web']);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('musai-search-mode-change', { detail: { mode } }));
  }, [mode]);

  useEffect(() => {
    if (!initialMode || hasAppliedInitialMode.current)
    {
      return;
    }
    hasAppliedInitialMode.current = true;
    setMode(initialMode);
  }, [initialMode]);

  // Fallback: honor a persisted research intent from sessionStorage when navigation state is missing
  useEffect(() =>
  {
    if (hasAppliedInitialMode.current || initialMode)
    {
      return;
    }

    try
    {
      const persisted = sessionStorage.getItem('musai-search-initial-mode');
      if (persisted === 'research')
      {
        hasAppliedInitialMode.current = true;
        setMode('research');
      }
      if (persisted)
      {
        sessionStorage.removeItem('musai-search-initial-mode');
      }
    }
    catch
    {
      // ignore storage errors
    }
  }, [initialMode]);

  const currentSession = searchSessions.find(s => s.id === currentSessionId);
  const hasSearched = currentSessionId !== null;
  const isResearchMode = mode === 'research';
  // Desktop: show based solely on collapse state; Mobile: show when explicitly opened
  const shouldShowSidebar = (!isMobile && !isSidebarCollapsed) || (isMobile && isSidebarOpen);
  const sidebarOpenForChild = isMobile ? isSidebarOpen : true;

  // Compute iframe src for standard mode (must not be inside conditional to respect Rules of Hooks)
  const musaiIframeSrc = useMemo(() => {
    try {
      const url = new URL("https://search.codemusic.ca");
      url.searchParams.set("simple_style", String(preference));
      return url.toString();
    } catch {
      return `https://search.codemusic.ca?simple_style=${encodeURIComponent(String(preference))}`;
    }
  }, [preference]);

  const handleSidebarHeaderToggle = useCallback(() => {
    if (isMobile)
    {
      setIsSidebarOpen(false);
      return;
    }
    setIsSidebarCollapsed(true);
    setIsSidebarOpen(false);
  }, [isMobile]);

  // Listen for global expand requests from BaseLayout hamburger
  useEffect(() => {
    const onExpand = () =>
    {
      setIsSidebarCollapsed(false);
      setIsSidebarOpen(true);
    };
    window.addEventListener('musai-search-expand-sidebar', onExpand as EventListener);
    return () => window.removeEventListener('musai-search-expand-sidebar', onExpand as EventListener);
  }, []);

  // Notify BaseLayout when search sidebar visibility changes so it can show/hide hamburger appropriately
  useEffect(() => {
    const visible = shouldShowSidebar;
    const evt = new CustomEvent('musai-search-visibility-change', { detail: { visible } });
    window.dispatchEvent(evt);
  }, [shouldShowSidebar]);
  
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

  // Prevent storage quota crashes by pruning large payloads on write
  const persistSessions = (updater: (prev: SearchSession[]) => SearchSession[]) => {
    const MAX_SESSIONS_TO_PERSIST = 8;
    const MAX_RESULTS_PER_SESSION = 10;
    const MAX_CONTENT_LENGTH = 4000;

    const pruneSessionsForStorage = (sessions: SearchSession[]): SearchSession[] => {
      const limited = sessions.slice(0, MAX_SESSIONS_TO_PERSIST);
      return limited.map((s) => {
        const safeResults = (s.results || []).slice(0, MAX_RESULTS_PER_SESSION).map((r: any) => ({
          title: r.title,
          content: typeof r.content === 'string' ? r.content.slice(0, MAX_CONTENT_LENGTH) : '',
          url: r.url,
          snippet: r.snippet,
          type: r.type,
          sourcesUsed: r.sourcesUsed,
        }));
        const safeFollowUps = (s.followUps || []).slice(-5).map((f: any) => ({
          query: f.query,
          result: { content: typeof f?.result?.content === 'string' ? f.result.content.slice(0, 1200) : '' },
          timestamp: f.timestamp,
        }));
        return {
          id: s.id,
          query: s.query,
          intent: s.intent,
          mode: s.mode,
          sources: s.sources,
          clientIpHash: s.clientIpHash,
          serverSessionId: s.serverSessionId,
          results: safeResults as any,
          followUps: safeFollowUps as any,
          timestamp: s.timestamp,
          name: (s as any).name,
          favorite: (s as any).favorite,
        } as SearchSession;
      });
    };

    setSearchSessions(prev => {
      const next = updater(prev);
      try {
        localStorage.setItem('search_sessions_v1', JSON.stringify(next));
      } catch (e) {
        // Quota likely exceeded: prune and try again; if it still fails, swallow to avoid crashing UI
        try {
          const pruned = pruneSessionsForStorage(next);
          localStorage.setItem('search_sessions_v1', JSON.stringify(pruned));
        } catch {}
      }
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
          sessionId: buildThreadSessionId(provisionalSessionId),
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
      // Normalize any session id echo returned by backend
      try {
        const { normalizeServerSessionId } = await import('@/lib/n8nClient');
        const echoed = (responseData && (responseData.sessionId || responseData.serverSessionId)) as string | undefined;
        if (echoed) {
          const { base } = normalizeServerSessionId(echoed);
          persistSessions(prev => prev.map(s => s.id === provisionalSessionId ? { ...s, serverSessionId: base } : s));
        }
      } catch {}
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
          console.log(`Mapping result ${index} content:`, String(content).substring(0, 100) + "...");
          const mapped: SearchResult = {
            title: result.title || `AI Response for: ${query}`,
            content,
            url: result.url || result.source || "",
            snippet: result.snippet || result.summary || "",
            type: intent,
            sourcesUsed: result.sourcesUsed || result.sources || effectiveSources,
          } as any;
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
  }, [clientIpHash, mode, sources]);

  // Handle initial query from navigation - placed after handleSearch declaration
  // On refresh, do NOT re-run if we already have a session for this query.
  useEffect(() => {
    if (!initialQuery || hasProcessedInitialQuery) {
      return;
    }

    // Wait for initialMode application when provided, to avoid starting in standard mode
    if (initialMode && !hasAppliedInitialMode.current)
    {
      return;
    }

    const trimmed = initialQuery.trim();
    if (!trimmed) {
      setHasProcessedInitialQuery(true);
      return;
    }

    // If a session already exists for this query, select it instead of re-submitting
    const existing = searchSessions.find(s => s.query === trimmed);
    if (existing) {
      setCurrentSessionId(existing.id);
      setHasProcessedInitialQuery(true);
      return;
    }

    console.log('Auto-executing initial search query:', trimmed, `(mode=${mode})`);
    setHasProcessedInitialQuery(true);
    handleSearch(trimmed);
  }, [initialQuery, initialMode, hasProcessedInitialQuery, handleSearch, searchSessions, mode]);

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

      // Build lightweight conversation history for follow-ups so references like "more" work
      const previousQueries = (currentSession.followUps || []).map(f => f.query).slice(-3);
      const lastResultSnippet = (() => {
        try {
          if (currentSession.followUps && currentSession.followUps.length > 0) {
            const last = currentSession.followUps[currentSession.followUps.length - 1];
            return String(last?.result?.content || '').slice(0, 600);
          }
          if (currentSession.results && currentSession.results.length > 0) {
            return String(currentSession.results[0]?.content || '').slice(0, 600);
          }
        } catch {}
        return undefined;
      })();

      const response = await qf2(url2, {
        method: 'POST',
        headers: authHeaders2({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          sessionId: buildThreadSessionId(String(currentSessionId || '')),
          query: combinedQuery,
          params: {
            module: MUSAI_MODULES.SEARCH,
            debug: true,
            isFollowUp: true,
            originalQuery: currentSession.query,
            conversation: {
              initialQuery: currentSession.query,
              previousQueries,
              lastResultSnippet,
            },
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
      try {
        const { normalizeServerSessionId } = await import('@/lib/n8nClient');
        const echoed = (responseData && (responseData.sessionId || responseData.serverSessionId)) as string | undefined;
        if (echoed) {
          const { base } = normalizeServerSessionId(echoed);
          persistSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, serverSessionId: base } : s));
        }
      } catch {}
      
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
  }, [currentSession, currentSessionId, sources, mode]);

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
          sessionId: buildThreadSessionId(String(currentSessionId || '')),
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
      try {
        const { normalizeServerSessionId } = await import('@/lib/n8nClient');
        const echoed = (responseData && (responseData.sessionId || responseData.serverSessionId)) as string | undefined;
        if (echoed) {
          const { base } = normalizeServerSessionId(echoed);
          persistSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, serverSessionId: base } : s));
        }
      } catch {}
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

  const handleRenameSession = useCallback((sessionId: string, newName: string) => {
    persistSessions(prev => prev.map(s => s.id === sessionId ? { ...s, name: newName } : s));
  }, []);

  const handleToggleFavorite = useCallback((sessionId: string) => {
    persistSessions(prev => prev.map(s => s.id === sessionId ? { ...s, favorite: !s.favorite } : s));
  }, []);

  const handleExportSession = useCallback(() => {
    if (!currentSession)
    {
      return;
    }

    if (typeof window === 'undefined' || typeof document === 'undefined')
    {
      console.warn('Musai research export is only available in the browser runtime.');
      return;
    }

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const toBlockHtml = (value: string | undefined) => {
      if (!value) return '';
      if (/<article[\s>]/i.test(value.trim()))
      {
        return value;
      }
      const escaped = escapeHtml(value);
      return escaped
        .split(/\n{2,}/)
        .map(block => `<p>${block.replace(/\n/g, '<br />')}</p>`)
        .join('');
    };

    const renderBicameral = (bicameral: SearchResult['bicameral']) => {
      if (!bicameral) return '';
      const segments: string[] = [];
      if (bicameral.creative?.summary)
      {
        segments.push(`<div class="bicameral-card"><h4>Creative</h4><p>${escapeHtml(bicameral.creative.summary)}</p></div>`);
      }
      if (bicameral.logical?.summary)
      {
        segments.push(`<div class="bicameral-card"><h4>Logical</h4><p>${escapeHtml(bicameral.logical.summary)}</p></div>`);
      }
      if (bicameral.fusion?.summary || typeof bicameral.fusion?.agreementScore === 'number')
      {
        const fusionPieces: string[] = [];
        if (bicameral.fusion?.summary)
        {
          fusionPieces.push(`<p>${escapeHtml(bicameral.fusion.summary)}</p>`);
        }
        if (typeof bicameral.fusion?.agreementScore === 'number')
        {
          fusionPieces.push(`<p class="faint">Agreement score: ${(bicameral.fusion.agreementScore * 100).toFixed(0)}%</p>`);
        }
        segments.push(`<div class="bicameral-card"><h4>Fusion</h4>${fusionPieces.join('')}</div>`);
      }
      if (segments.length === 0)
      {
        return '';
      }
      return `<div class="result-bicameral">${segments.join('')}</div>`;
    };

    const renderConflicts = (conflicts?: SearchResult['conflicts']) => {
      if (!conflicts || conflicts.length === 0) return '';
      const cards = conflicts.map(conflict => {
        const bodyParts: string[] = [];
        if (conflict.description)
        {
          bodyParts.push(`<p>${escapeHtml(conflict.description)}</p>`);
        }
        const perspectives: string[] = [];
        if (conflict.perspectiveA)
        {
          perspectives.push(`<div><strong>A</strong><span>${escapeHtml(conflict.perspectiveA)}</span></div>`);
        }
        if (conflict.perspectiveB)
        {
          perspectives.push(`<div><strong>B</strong><span>${escapeHtml(conflict.perspectiveB)}</span></div>`);
        }
        if (perspectives.length > 0)
        {
          bodyParts.push(`<div class="conflict-perspectives">${perspectives.join('')}</div>`);
        }
        if (conflict.resolutionHint)
        {
          bodyParts.push(`<p class="faint">Hint: ${escapeHtml(conflict.resolutionHint)}</p>`);
        }
        return `<article class="conflict-card"><h4>${escapeHtml(conflict.title || 'Perspective mismatch')}</h4>${bodyParts.join('')}</article>`;
      });
      return `<div class="result-conflicts">${cards.join('')}</div>`;
    };

    const renderPersonalization = (note?: SearchResult['personalization']) => {
      if (!note?.summary) return '';
      return `<div class="result-personalization"><h4>For you</h4><p>${escapeHtml(note.summary)}</p></div>`;
    };

    const resultHtml = currentSession.results.map((result, index) => {
      const title = escapeHtml(result.title || `Result ${index + 1}`);
      const url = result.url ? `<a class="result-link" href="${escapeHtml(result.url)}">${escapeHtml(result.url)}</a>` : '';
      const snippet = result.snippet ? `<p class="result-snippet">${escapeHtml(result.snippet)}</p>` : '';
      const sources = Array.isArray(result.sourcesUsed) && result.sourcesUsed.length > 0
        ? `<ul class="result-sources">${result.sourcesUsed.map(src => `<li>${escapeHtml(src)}</li>`).join('')}</ul>`
        : '';
      const content = toBlockHtml(result.content);
      return `<section class="result-card">
  <header>
    <div class="result-index">${index + 1}</div>
    <div>
      <h2>${title}</h2>
      ${url}
    </div>
  </header>
  <div class="result-content">${content}</div>
  ${snippet}
  ${sources}
  ${renderBicameral(result.bicameral)}
  ${renderConflicts(result.conflicts)}
  ${renderPersonalization(result.personalization)}
</section>`;
    }).join('\n');

    const followUpsHtml = currentSession.followUps.length > 0
      ? `<section class="followups">
  <h2>Follow-up explorations</h2>
  ${currentSession.followUps.map(followUp => {
        const content = toBlockHtml(followUp.result?.content);
        const timestampLabel = (() => {
          try { return format(followUp.timestamp, 'PPP p'); } catch { return new Date(followUp.timestamp).toLocaleString(); }
        })();
        return `<article class="followup-card">
    <header>
      <h3>${escapeHtml(followUp.query)}</h3>
      <span>${escapeHtml(timestampLabel)}</span>
    </header>
    <div class="followup-content">${content}</div>
  </article>`;
      }).join('')}
</section>`
      : '';

    const sessionTimestamp = (() => {
      try { return format(currentSession.timestamp, 'PPP p'); } catch { return new Date(currentSession.timestamp).toLocaleString(); }
    })();
    const timestampSlug = (() => {
      try { return format(currentSession.timestamp, 'yyyyMMdd-HHmm'); } catch { return String(currentSession.timestamp); }
    })();
    const querySlug = currentSession.query
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
    const fileName = `musai-research-${querySlug || 'session'}-${timestampSlug}.html`;

    const docTitle = `Musai Research • ${escapeHtml(currentSession.query)}`;
    const sessionSources = Array.isArray(currentSession.sources) && currentSession.sources.length > 0
      ? `<div class="session-sources">${currentSession.sources.map(src => `<span>${escapeHtml(src)}</span>`).join('')}</div>`
      : '';
    const modeBadge = currentSession.mode ? `<span class="session-mode">${escapeHtml(currentSession.mode)}</span>` : '';
    const intentBadge = currentSession.intent ? `<span class="session-intent">${escapeHtml(currentSession.intent)}</span>` : '';

    const htmlDocument = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${docTitle}</title>
  <style>
    :root {
      color-scheme: light dark;
      font-family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    body {
      margin: 0;
      padding: 48px 32px 64px;
      background: radial-gradient(circle at top left, #1f1b3a, #0b0f1f 52%);
      color: #f8fafc;
    }
    a {
      color: inherit;
    }
    header.session-header {
      max-width: 920px;
      margin: 0 auto 32px;
      padding: 28px 32px;
      border-radius: 24px;
      background: rgba(15, 23, 42, 0.92);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 22px 60px rgba(15, 23, 42, 0.35);
    }
    header.session-header h1 {
      margin: 0 0 8px;
      font-size: 28px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    header.session-header p {
      margin: 0;
      color: rgba(241, 245, 249, 0.78);
    }
    .session-meta {
      margin-top: 12px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      font-size: 12px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.58);
    }
    .session-meta span {
      padding: 4px 10px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.10);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .session-sources {
      margin-top: 16px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      font-size: 12px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(148, 163, 184, 0.75);
    }
    .session-sources span {
      padding: 4px 12px;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.35);
    }
    main {
      max-width: 920px;
      margin: 0 auto;
      display: grid;
      gap: 24px;
    }
    .result-card {
      padding: 28px 32px;
      border-radius: 24px;
      background: rgba(15, 23, 42, 0.88);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 24px 52px rgba(15, 23, 42, 0.30);
    }
    .result-card header {
      display: flex;
      gap: 18px;
      align-items: center;
      margin-bottom: 16px;
    }
    .result-index {
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(129, 140, 248, 0.75), rgba(236, 72, 153, 0.75));
      font-weight: 600;
      letter-spacing: 0.08em;
    }
    .result-card h2 {
      margin: 0;
      font-size: 20px;
    }
    .result-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-top: 6px;
      font-size: 14px;
      color: rgba(148, 163, 184, 0.9);
      text-decoration: none;
    }
    .result-content {
      font-size: 15px;
      line-height: 1.65;
    }
    .result-content p {
      margin: 0 0 12px;
    }
    .result-snippet {
      margin: 18px 0 0;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 13px;
      font-style: italic;
      color: rgba(226, 232, 240, 0.74);
    }
    .result-sources {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 18px 0 0;
      padding: 0;
      list-style: none;
    }
    .result-sources li {
      padding: 4px 12px;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.3);
      font-size: 12px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .result-bicameral {
      margin-top: 20px;
      display: grid;
      gap: 12px;
    }
    .bicameral-card {
      padding: 14px;
      border-radius: 16px;
      background: rgba(30, 41, 59, 0.85);
      border: 1px solid rgba(129, 140, 248, 0.22);
    }
    .bicameral-card h4 {
      margin: 0 0 6px;
      font-size: 13px;
      letter-spacing: 0.20em;
      text-transform: uppercase;
      color: rgba(129, 140, 248, 0.85);
    }
    .result-conflicts {
      margin-top: 20px;
      display: grid;
      gap: 14px;
    }
    .conflict-card {
      padding: 16px;
      border-radius: 16px;
      background: rgba(120, 53, 15, 0.15);
      border: 1px solid rgba(249, 115, 22, 0.35);
    }
    .conflict-card h4 {
      margin: 0 0 10px;
      font-size: 14px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }
    .conflict-perspectives {
      margin-top: 10px;
      display: grid;
      gap: 8px;
      font-size: 13px;
    }
    .conflict-perspectives div {
      display: grid;
      gap: 4px;
      padding: 8px;
      border-radius: 12px;
      background: rgba(15, 23, 42, 0.65);
      border: 1px solid rgba(249, 115, 22, 0.28);
    }
    .conflict-perspectives strong {
      font-size: 12px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
    }
    .result-personalization {
      margin-top: 18px;
      padding: 14px;
      border-radius: 16px;
      background: rgba(20, 184, 166, 0.12);
      border: 1px solid rgba(45, 212, 191, 0.35);
    }
    .result-personalization h4 {
      margin: 0 0 6px;
      font-size: 13px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
    }
    .followups {
      margin-top: 12px;
    }
    .followups > h2 {
      margin-bottom: 12px;
      font-size: 18px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: rgba(129, 140, 248, 0.9);
    }
    .followup-card {
      padding: 20px 24px;
      border-radius: 20px;
      background: rgba(15, 23, 42, 0.82);
      border: 1px solid rgba(129, 140, 248, 0.18);
      margin-bottom: 12px;
    }
    .followup-card header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .followup-card h3 {
      margin: 0;
      font-size: 16px;
    }
    .followup-card span {
      font-size: 12px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(148, 163, 184, 0.75);
    }
    .followup-content {
      font-size: 14px;
      line-height: 1.6;
    }
    .followup-content p {
      margin: 0 0 12px;
    }
    .faint {
      color: rgba(148, 163, 184, 0.7);
      font-size: 12px;
    }
    footer {
      margin: 48px auto 0;
      max-width: 920px;
      text-align: center;
      font-size: 12px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: rgba(148, 163, 184, 0.65);
    }
    @media print {
      body {
        background: white;
        color: black;
        padding: 24px;
      }
      header.session-header,
      .result-card,
      .followup-card {
        background: white;
        color: black;
        border: 1px solid #cbd5f5;
        box-shadow: none;
      }
      .result-index {
        color: white;
      }
    }
  </style>
</head>
<body>
  <header class="session-header">
    <h1>${escapeHtml(currentSession.query)}</h1>
    <p>Generated ${escapeHtml(sessionTimestamp)}</p>
    <div class="session-meta">
      ${intentBadge}
      ${modeBadge}
      <span>Results ${currentSession.results.length}</span>
    </div>
    ${sessionSources}
  </header>
  <main>
    ${resultHtml}
    ${followUpsHtml}
  </main>
  <footer>Musai Research Copilot</footer>
</body>
</html>`;

    try
    {
      const blob = new Blob([htmlDocument], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    catch (error)
    {
      console.error('Failed to generate Musai research export', error);
    }
  }, [currentSession]);

  // Scroll container for keeping controls visible and scrolling results
  const mainScrollRef = useRef<HTMLDivElement | null>(null);

  // PreMusai custom title for Research mode
  const researchTitleNode = (
    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold pb-2">
      <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-400">Musai</span>
      <span className="mx-1 text-black dark:text-white animate-pulse">RE</span>
      <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-emerald-500">Search</span>
    </h1>
  );

  return (
    <div className="flex h-full relative overflow-x-hidden musai-spa-surface">
      {/* Mobile hamburger: show only when sidebar not visible */}
      {isMobile && !shouldShowSidebar && (
        <button
          onClick={() => { setIsSidebarOpen(true); setIsSidebarCollapsed(false); }}
          className="fixed top-8 left-16 z-50 p-2 rounded-lg bg-background border shadow-md text-muted-foreground"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Desktop: no floating hamburger; use header collapse control within the sidebar */}

      {/* Desktop: rely on sidebar header arrow and the rail opener; no floating hamburger */}

      {/* Search Sidebar (only in Research mode) */}
      {isResearchMode && shouldShowSidebar && (
        <div className={cn(
          "transition-all duration-300 h-full min-h-0 overflow-hidden",
          // On mobile, render as overlay so it doesn't push content width
          // Use higher z-index than the backdrop overlay to keep it clickable
          isMobile ? "fixed inset-y-0 left-0 z-50 w-64 bg-background border-r shadow-lg" : "w-96 flex-shrink-0",
          // Hide when mobile sidebar is not open
          isMobile && !isSidebarOpen ? "-translate-x-full" : undefined
        )}>
          <SearchSidebar
            sessions={searchSessions}
            currentSessionId={currentSessionId}
            isSidebarOpen={sidebarOpenForChild}
            isCollapsed={isSidebarCollapsed}
            onSessionSelect={handleSessionSelect}
            onNewSearch={handleNewSearch}
            onToggleCollapse={handleSidebarHeaderToggle}
            onDeleteSession={handleDeleteSession}
            onRenameSession={handleRenameSession}
            onToggleFavorite={handleToggleFavorite}
            onQuickTopicSearch={(topic) => {
              // Start a new search using the clicked quick topic text
              handleSearch(topic);
              if (isMobile)
              {
                setIsSidebarOpen(false);
              }
            }}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div ref={mainScrollRef} className={cn(
        "flex-1 min-h-0 flex flex-col bg-background h-full overflow-y-auto transition-all duration-300 pb-0",
        isResearchMode && hasSearched && !isMobile && !isSidebarCollapsed ? "ml-0" : "ml-0"
      )}>
        {/* Mode Toggle Header - always visible */}
        <div className="sticky top-0 z-30 px-6 pt-3 pb-2 border-b border-border bg-white/85 dark:bg-slate-950/70 backdrop-blur supports-[backdrop-filter]:bg-white/65 dark:supports-[backdrop-filter]:bg-slate-950/55" style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Label htmlFor="mode-switch" className="text-xs text-muted-foreground">Research mode</Label>
              <Switch id="mode-switch" checked={isResearchMode} onCheckedChange={(v) => setMode(v ? 'research' : 'standard')} aria-label="Toggle research mode" />
              <Badge variant="secondary">{isResearchMode ? 'research' : 'search'}</Badge>
            </div>
            {isResearchMode && (
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
                      
                      aria-label={`Toggle source ${s}`}
                    />
                    <span className="text-xs text-muted-foreground">{s}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Standard Search mode: show only iframe */}
        {!isResearchMode && (
          <div className="flex-1 min-h-0">
            <iframe
              src={musaiIframeSrc}
              title="MusaiSearch"
              className="w-full h-full border-0"
            />
          </div>
        )}

        {/* Research mode: existing behavior with PreMusai and sessions/results */}
        {isResearchMode && (
          !hasSearched ? (
            <PreSearchView 
              onSearch={handleSearch}
              isLoading={isLoading}
              onClose={onClose}
              onViewPreviousSearches={handleViewPreviousSearches}
              onShowTrendingTopics={handleShowTrendingTopics}
              onQuickAnswers={handleQuickAnswers}
              titleNode={researchTitleNode}
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
          )
        )}
      </div>

      {/* Mobile sidebar overlay (only in Research mode) */}
      {isResearchMode && isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* No copilot dock on Search/Research screens */}
    </div>
  );
};
