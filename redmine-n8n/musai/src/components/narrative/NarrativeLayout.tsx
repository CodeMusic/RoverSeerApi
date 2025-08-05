import { useState, useCallback, useEffect } from "react";
import { NarrativeSidebar } from "./NarrativeSidebar";
import { ConceptSeedingPanel } from "./ConceptSeedingPanel";
import { CharacterCreationPanel } from "./CharacterCreationPanel";
import { ArcGenerationPanel } from "./ArcGenerationPanel";
import { SceneRunner } from "./SceneRunner";
import { NarrativeSession } from "@/types/chat";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, Theater, Sparkles, Plus, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PreMusaiPage } from "@/components/common/PreMusaiPage";
import { ToolHeader } from "@/components/common/ToolHeader";
import { APP_TERMS } from "@/config/constants";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";

interface NarrativeLayoutProps {
  sessions: NarrativeSession[];
  currentSessionId: string;
  isLoading: boolean;
  onNewNarrative: () => void;
  onSessionSelect: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newName: string) => void;
  onToggleFavorite: (sessionId: string) => void;
  onUpdateNarrative: (sessionId: string, data: any) => void;
}

export const NarrativeLayout = ({
  sessions,
  currentSessionId,
  isLoading,
  onNewNarrative,
  onSessionSelect,
  onDeleteSession,
  onRenameSession,
  onToggleFavorite,
  onUpdateNarrative,
}: NarrativeLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentStep, setCurrentStep] = useState<'concept' | 'characters' | 'arc' | 'scenes'>('concept');
  
  const isMobile = useIsMobile();
  const { preferences, recordLastSession, getLastSession } = useUserPreferences();
  const currentSession = sessions.find(s => s.id === currentSessionId);

  // Smart auto-navigation: use last session first, fallback to first session
  useEffect(() => {
    if (preferences.autoSelectFirstItem && sessions.length > 0 && !currentSessionId) {
      const lastSession = getLastSession('narrative');
      
      // Priority 1: Navigate to last used narrative if it exists
      if (lastSession?.narrativeId) {
        const lastNarrative = sessions.find(session => session.id === lastSession.narrativeId);
        if (lastNarrative) {
          console.log('🎭 Navigating to last used narrative:', lastNarrative.name || lastNarrative.id);
          onSessionSelect(lastSession.narrativeId);
          return;
        }
      }
      
      // Priority 2: Fallback to first session if auto-select is enabled
      console.log('🎭 No last session found, navigating to first narrative:', sessions[0].name || sessions[0].id);
      onSessionSelect(sessions[0].id);
    }
  }, [preferences.autoSelectFirstItem, sessions, currentSessionId, onSessionSelect, getLastSession]);

  const handleNewNarrative = useCallback(() => {
    onNewNarrative();
  }, [onNewNarrative]);

  const handleSessionClick = useCallback((sessionId: string) => {
    // Record this as the last used narrative session
    recordLastSession('narrative', {
      narrativeId: sessionId,
      view: 'narrative'
    });
    onSessionSelect(sessionId);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile, onSessionSelect]);

  const handleStepChange = useCallback((step: typeof currentStep) => {
    setCurrentStep(step);
  }, []);

  const renderMainContent = () => {
    // Show narrative PreMusai interface if no sessions exist or no current session
    if (sessions.length === 0 || !currentSession) {
      return (
        <div className="h-full flex flex-col">
          <PreMusaiPage
            type="narrative"
            onSubmit={(input) => {
              // Create a new narrative session with the input
              handleNewNarrative();
              // Handle narrative creation - you might want to pass this to narrative creation
              // For now, just create the session
            }}
            onQuickAction={(actionId, actionType, actionData) => {
              switch (actionId) {
                case 'narrative-chat':
                  handleNewNarrative();
                  break;
                case 'narr-begin':
                  handleNewNarrative();
                  break;
                case 'narr-story':
                case 'narr-evolution':
                  // Create new narrative with specific starting content
                  handleNewNarrative();
                  break;
                default:
                  console.log('Narrative quick action:', actionId, actionType, actionData);
              }
            }}
            isLoading={false}
            className="h-full"
          />
        </div>
      );
    }

    // Render the appropriate panel based on current step
    switch (currentStep) {
      case 'concept':
        return (
          <ConceptSeedingPanel
            session={currentSession}
            onNext={() => setCurrentStep('characters')}
            onUpdate={(data) => onUpdateNarrative(currentSession.id, data)}
          />
        );
      case 'characters':
        return (
          <CharacterCreationPanel
            session={currentSession}
            onNext={() => setCurrentStep('arc')}
            onBack={() => setCurrentStep('concept')}
            onUpdate={(data) => onUpdateNarrative(currentSession.id, data)}
          />
        );
      case 'arc':
        return (
          <ArcGenerationPanel
            session={currentSession}
            onNext={() => setCurrentStep('scenes')}
            onBack={() => setCurrentStep('characters')}
            onUpdate={(data) => onUpdateNarrative(currentSession.id, data)}
          />
        );
      case 'scenes':
        return (
          <SceneRunner
            session={currentSession}
            onBack={() => setCurrentStep('arc')}
            onUpdate={(data) => onUpdateNarrative(currentSession.id, data)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-[100dvh] relative">
      {/* Beautiful Background - matching home page theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />
      
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-300/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-orange-400/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Main Layout */}
      <div className="flex-1 relative z-10">
        <div className="h-[100dvh] flex">
          {/* Sidebar Panel - only show when sessions exist */}
          {sessions.length > 0 && !isSidebarCollapsed && (
            <>
              <div 
                className={cn(
                  "transition-all duration-300 w-80 flex-shrink-0",
                  isMobile && !isSidebarOpen ? "hidden" : ""
                )}
              >
                <div className="h-full bg-background/95 backdrop-blur-sm rounded-lg shadow-lg">
                  <NarrativeSidebar
                    sessions={sessions}
                    currentSessionId={currentSessionId}
                    isSidebarOpen={isSidebarOpen}
                    isCollapsed={isSidebarCollapsed}
                    onNewNarrative={handleNewNarrative}
                    onSessionSelect={handleSessionClick}
                    onDeleteSession={onDeleteSession}
                    onRenameSession={onRenameSession}
                    onToggleFavorite={onToggleFavorite}
                    onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    currentStep={currentStep}
                    onStepChange={handleStepChange}
                  />
                </div>
              </div>


            </>
          )}

          {/* Main Content Panel */}
          <div className="flex-1">
            <div className="h-full bg-background/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden flex flex-col">
              {/* Always show header */}
              <ToolHeader
                icon={Theater}
                title={APP_TERMS.NARRATIVE}
                badge={APP_TERMS.NARRATIVE_BADGE}
                badgeIcon={Sparkles}
                description={APP_TERMS.NARRATIVE_DESCRIPTION}
              />
              <div className="flex-1 overflow-hidden">
                {renderMainContent()}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile sidebar toggle - only show when sessions exist */}
        {isMobile && sessions.length > 0 && (
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="fixed top-8 left-4 z-50 p-2 rounded-lg bg-background border shadow-md"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Desktop collapse toggle button */}
        {sessions.length > 0 && !isMobile && isSidebarCollapsed && (
          <button
            onClick={() => setIsSidebarCollapsed(false)}
            className="fixed top-8 left-4 z-50 p-2 rounded-lg bg-background border shadow-md hover:bg-accent transition-colors"
            title="Show narrative library"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Mobile sidebar overlay */}
        {isMobile && isSidebarOpen && sessions.length > 0 && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

 