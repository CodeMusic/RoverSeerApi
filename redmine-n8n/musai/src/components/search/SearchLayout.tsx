import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/search/SearchInput";
import { SearchResults } from "@/components/search/SearchResults";
import { SearchSidebar } from "@/components/search/SearchSidebar";
import { PreSearchView } from "@/components/search/PreSearchView";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { TIMEOUTS, createTimeoutController, formatTimeout } from "@/config/timeouts";

interface SearchSession {
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
}

interface SearchLayoutProps {
  onClose: () => void;
  initialQuery?: string;
}

export const SearchLayout = ({ onClose, initialQuery }: SearchLayoutProps) => {
  const [currentQuery, setCurrentQuery] = useState("");
  const [searchSessions, setSearchSessions] = useState<SearchSession[]>([]);


  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const currentSession = searchSessions.find(s => s.id === currentSessionId);
  const hasSearched = currentSessionId !== null;
  
  // Track if we've processed the initial query to prevent re-execution
  const [hasProcessedInitialQuery, setHasProcessedInitialQuery] = useState(false);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setCurrentQuery(query);

    // Manual timeout check as backup - declare at function level
    let manualTimeoutId: NodeJS.Timeout;

    try {
      const startTime = Date.now();
      // Create timeout controller with configured search timeout
      // Temporarily increase timeout for debugging and try without signal
      const { controller, timeoutId, timeout, signal, cleanup } = createTimeoutController(TIMEOUTS.SEARCH_REQUEST * 2); // Double the timeout for testing
      
      console.log(`Starting search with ${formatTimeout(timeout)} timeout`);
      console.log(`Search query: "${query}"`);
      console.log(`Request timestamp: ${new Date().toISOString()}`);
      
      manualTimeoutId = setTimeout(() => {
        console.log(`Manual timeout check: ${Date.now() - startTime}ms elapsed`);
      }, 60000); // Log at 1 minute
      
      // Use the actual n8n musai_search webhook
      // Try without signal first to see if that's the issue
      const response = await fetch('https://n8n.codemusic.ca/webhook/musai_search/c0d3musai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          sessionId: Date.now().toString(),
          timestamp: Date.now()
        }),
        // signal, // Temporarily removed to test if this is causing the issue
      });
      
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
      
      const sessionId = Date.now().toString();
      const newSession: SearchSession = {
        id: sessionId,
        query,
        intent, // Add intent to session
        results: results.map((result, index) => {
          const content = result.text || result.content || result.response || result.answer || "No content available";
          console.log(`Mapping result ${index} content:`, content.substring(0, 100) + "...");
          return {
            title: result.title || `AI Response for: ${query}`,
            content,
            url: result.url || result.source || "",
            snippet: result.snippet || result.summary || "",
            type: intent
          };
        }),
        followUps: [],
        timestamp: Date.now()
      };

      setSearchSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(sessionId);
    } catch (error) {
      console.error("Search error:", error);
      
      // Handle different types of errors
      let errorMessage = `Sorry, there was an error processing your search for "${query}". Please try again.`;
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
      
      // Fallback to a simple error result
      const sessionId = Date.now().toString();
      const errorSession: SearchSession = {
        id: sessionId,
        query,
        intent: 'search',
        results: [{
          title: errorTitle,
          content: errorMessage,
          url: "",
          snippet: "Error occurred during search",
          type: 'search'
        }],
        followUps: [],
        timestamp: Date.now()
      };

      setSearchSessions(prev => [errorSession, ...prev]);
      setCurrentSessionId(sessionId);
    } finally {
      clearTimeout(manualTimeoutId); // Ensure manual timeout is cleared
      setIsLoading(false);
    }
  }, []);

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
      const response = await fetch('https://n8n.codemusic.ca/webhook/musai_search/c0d3musai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: followUpQuery,
          sessionId: currentSessionId,
          isFollowUp: true,
          originalQuery: currentSession.query,
          timestamp: Date.now()
        }),
        signal,
      });
      
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

      setSearchSessions(prev => 
        prev.map(session => 
          session.id === currentSessionId
            ? { ...session, followUps: [...session.followUps, followUpResult] }
            : session
        )
      );
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

      setSearchSessions(prev => 
        prev.map(session => 
          session.id === currentSessionId
            ? { ...session, followUps: [...session.followUps, errorResult] }
            : session
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentSession, currentSessionId]);

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

  const handleViewPreviousSearches = useCallback(() => {
    // If no searches exist, add demo data first
    if (searchSessions.length === 0) {
      const demoSessions: SearchSession[] = [
        {
          id: "demo-1",
          query: "TypeScript best practices",
          intent: "search",
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
      // Don't auto-select any session - let user choose
      setCurrentSessionId(null);
    }
    // When previous searches exist, don't auto-select - show selection screen
  }, [searchSessions]);

  const handleDeleteSession = useCallback((sessionId: string) => {
    setSearchSessions(prev => prev.filter(session => session.id !== sessionId));
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

  return (
    <div className="flex h-[100dvh] relative bg-background">
      {/* Mobile menu button */}
      {isMobile && hasSearched && (
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed top-4 left-16 z-50 p-2 rounded-lg bg-background border shadow-md"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Search Sidebar - only show when there are search sessions */}
      {hasSearched && (
        <div className={cn(
          "transition-all duration-300",
          isMobile ? "ml-12" : "ml-0"
        )}>
          <SearchSidebar
            sessions={searchSessions}
            currentSessionId={currentSessionId}
            isSidebarOpen={isSidebarOpen}
            onSessionSelect={handleSessionSelect}
            onNewSearch={handleNewSearch}
            onClose={onClose}
            onDeleteSession={handleDeleteSession}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className={cn(
        "flex-1 flex flex-col bg-background h-[100dvh] overflow-auto transition-all duration-300",
        hasSearched && !isMobile ? "ml-0" : "ml-0"
      )}>
        {!hasSearched ? (
          <PreSearchView 
            onSearch={handleSearch}
            isLoading={isLoading}
            onClose={onClose}
            onViewPreviousSearches={handleViewPreviousSearches}
          />
        ) : currentSession ? (
          <SearchResults
            session={currentSession}
            onFollowUp={handleFollowUp}
            onNewSearch={handleNewSearch}
            onExport={handleExportSession}
            isLoading={isLoading}
            onClose={onClose}
          />
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