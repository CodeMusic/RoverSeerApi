
import React, { useState, useCallback, useEffect } from 'react';
import { MessageSquare, Sparkles, Menu, Bot, Theater } from 'lucide-react';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { PreMusaiPage } from '@/components/common/PreMusaiPage';
import { ToolHeader } from '@/components/common/ToolHeader';
import { NavigationBar } from '@/components/common/NavigationBar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { APP_TERMS } from '@/config/constants';
import { ChatSession, NarrativeSession } from '@/types/chat';
import { SettingsPanel } from "@/components/chat/SettingsPanel";
import { ComingSoonPanel } from "@/components/chat/ComingSoonPanel";
import { SearchLayout } from "@/components/search/SearchLayout";
import { CodeMusaiLayout } from "@/components/code/CodeMusaiLayout";
import { NarrativeLayout } from "@/components/narrative/NarrativeLayout";
import { UniversityContent } from "@/components/university/UniversityContent";
import { useToast } from "@/hooks/use-toast";
import { Check, Plus, BookOpen } from "lucide-react";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";

interface ChatLayoutProps {
  sessions: ChatSession[];
  currentSessionId: string;
  isLoading: boolean;
  isTyping: boolean;
  onNewChat: () => void;
  onSessionSelect: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newName: string) => void;
  onToggleFavorite: (sessionId: string) => void;
  onSendMessage: (message: string, file?: File) => void;
  initialTab?: string;
  initialQuery?: string;
  // Narrative props
  narrativeSessions?: NarrativeSession[];
  narrativeCurrentSessionId?: string;
  onNewNarrative?: () => void;
  onUpdateNarrative?: (sessionId: string, data: any) => void;
  onNarrativeSessionSelect?: (sessionId: string) => void;
  onDeleteNarrativeSession?: (sessionId: string) => void;
  onRenameNarrativeSession?: (sessionId: string, newName: string) => void;
  onToggleNarrativeFavorite?: (sessionId: string) => void;
}

export const ChatLayout = ({
  sessions,
  currentSessionId,
  isLoading,
  isTyping,
  onNewChat,
  onSessionSelect,
  onDeleteSession,
  onRenameSession,
  onToggleFavorite,
  onSendMessage,
  initialTab,
  initialQuery,
  narrativeSessions = [],
  narrativeCurrentSessionId = "",
  onNewNarrative = () => {},
  onUpdateNarrative = () => {},
  onNarrativeSessionSelect = () => {},
  onDeleteNarrativeSession = () => {},
  onRenameNarrativeSession = () => {},
  onToggleNarrativeFavorite = () => {},
}: ChatLayoutProps) => {
  const [input, setInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [currentTab, setCurrentTab] = useState(initialTab || APP_TERMS.TAB_CHAT);
  const [isNavigationExpanded, setIsNavigationExpanded] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { preferences } = useUserPreferences();
  
  const currentSession = sessions.find(s => s.id === currentSessionId);

  // Set initial sidebar state based on user preferences
  useEffect(() => {
    if (currentTab === APP_TERMS.TAB_CHAT && sessions.length > 0) {
      // If auto-select is disabled, start with sidebar collapsed
      if (!preferences.autoSelectFirstItem) {
        setIsSidebarCollapsed(true);
      }
    }
  }, [currentTab, sessions.length, preferences.autoSelectFirstItem]);

  const handleNewChat = useCallback(() => {
    onNewChat();
  }, [onNewChat]);

  const handleSend = useCallback(async (e: React.FormEvent, file?: File): Promise<boolean> => {
    e.preventDefault();
    
    if (!input.trim() && !file) {
      toast({
        description: "Please enter a message or attach an image",
        variant: "destructive",
      });
      return false;
    }

    try {
      await onSendMessage(input, file);
      setInput("");
      return true;
    } catch (error) {
      toast({
        description: "Failed to send message",
        variant: "destructive",
      });
      return false;
    }
  }, [input, onSendMessage, toast]);

  const handleImageSelect = useCallback((file: File) => {
    console.log('Image selected:', file.name);
  }, []);

  const handleSessionClick = useCallback((sessionId: string) => {
    onSessionSelect(sessionId);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile, onSessionSelect]);

  const handleTabChange = useCallback((tab: string) => {
    setCurrentTab(tab);
    // All tabs are now properly handled with their own components
  }, []);

  const handleToggleExpanded = useCallback(() => {
    setIsNavigationExpanded(!isNavigationExpanded);
  }, [isNavigationExpanded]);

  const handleCloseSettings = useCallback(() => {
    setCurrentTab(APP_TERMS.TAB_CHAT);
  }, []);

  const handleCloseComingSoon = useCallback(() => {
    setCurrentTab(APP_TERMS.TAB_CHAT);
  }, []);

  const renderMainContent = () => {
    // Handle emergent-narrative tab
    if (currentTab === APP_TERMS.TAB_NARRATIVE) {
      return (
        <div className="h-full flex flex-col">
          <ToolHeader
            icon={Theater}
            title={APP_TERMS.NARRATIVE}
            badge={APP_TERMS.NARRATIVE_BADGE}
            badgeIcon={Sparkles}
            description={APP_TERMS.NARRATIVE_DESCRIPTION}
          />
          <div className="flex-1 overflow-hidden">
            <PreMusaiPage
              type="narrative"
              onSubmit={(input) => {
                // Create a new narrative session with the input
                onNewNarrative();
                // Handle narrative creation - you might want to pass this to narrative creation
                // For now, just create the session
              }}
              onQuickAction={(actionId, actionType, actionData) => {
                switch (actionId) {
                  case 'narr-begin':
                    onNewNarrative();
                    break;
                  case 'narr-story':
                  case 'narr-evolution':
                    // Create new narrative with specific starting content
                    onNewNarrative();
                    break;
                  default:
                    console.log('Narrative quick action:', actionId, actionType, actionData);
                }
              }}
              isLoading={false}
              className="h-full"
            />
          </div>
        </div>
      );
    }

    // Handle code-musai tab
    if (currentTab === APP_TERMS.TAB_CODE) {
      return (
        <CodeMusaiLayout
          onClose={() => setCurrentTab(APP_TERMS.TAB_CHAT)}
        />
      );
    }

    // Handle musai-search tab
    if (currentTab === APP_TERMS.TAB_SEARCH) {
      return (
        <SearchLayout 
          onClose={() => setCurrentTab(APP_TERMS.TAB_CHAT)}
        />
      );
    }

    // Handle musai-university tab
    if (currentTab === APP_TERMS.TAB_UNIVERSITY) {
      return (
        <div className="h-full flex flex-col">
          <ToolHeader
            icon={Bot}
            title={APP_TERMS.UNIVERSITY}
            badge="Generative Learning"
            badgeIcon={Sparkles}
            description="Create and explore AI-powered courses and educational content"
          />
          <div className="flex-1 overflow-hidden">
            <PreMusaiPage
              type="university"
              onSubmit={(input) => {
                // Create a new chat session for university content
                onNewChat();
                setTimeout(() => {
                  onSendMessage(input);
                }, 100);
              }}
              onQuickAction={(actionId, actionType, actionData) => {
                switch (actionId) {
                  case 'university-courses':
                  case 'university-create':
                  case 'university-continue':
                    if (actionData) {
                      onNewChat();
                      setTimeout(() => {
                        onSendMessage(actionData);
                      }, 100);
                    }
                    break;
                  default:
                    console.log('University quick action:', actionId, actionType, actionData);
                }
              }}
              isLoading={isTyping}
              className="h-full"
            />
          </div>
        </div>
      );
    }

    // Handle task-musai tab
    if (currentTab === APP_TERMS.TAB_TASK) {
      return (
        <div className="h-full flex flex-col">
          <ToolHeader
            icon={Bot}
            title={APP_TERMS.TASK}
            badge="Intelligent Automation"
            badgeIcon={Sparkles}
            description="Automate your workflow with intelligent task management and AI assistance"
          />
          <div className="flex-1 overflow-hidden">
            <PreMusaiPage
              type="task"
              onSubmit={(input) => {
                // Create a new chat session for task management
                onNewChat();
                setTimeout(() => {
                  onSendMessage(input);
                }, 100);
              }}
              onQuickAction={(actionId, actionType, actionData) => {
                switch (actionId) {
                  case 'task-auto':
                  case 'task-templates':
                    if (actionData) {
                      onNewChat();
                      setTimeout(() => {
                        onSendMessage(actionData);
                      }, 100);
                    }
                    break;
                  case 'task-view':
                    // Could show task management UI in future
                    console.log('Task view requested');
                    break;
                  default:
                    console.log('Task quick action:', actionId, actionType, actionData);
                }
              }}
              isLoading={isTyping}
              className="h-full"
            />
          </div>
        </div>
      );
    }

    // Handle settings tab
    if (currentTab === APP_TERMS.TAB_SETTINGS) {
      return (
        <SettingsPanel
          onClose={handleCloseSettings}
        />
      );
    }

    // Show PreMusaiPage if no sessions exist or no current session selected
    if ((sessions.length === 0 && narrativeSessions.length === 0) || !currentSession) {
      if (currentTab === APP_TERMS.TAB_NARRATIVE) {
        return (
          <div className="h-full flex flex-col">
            <PreMusaiPage
              type="narrative"
              onSubmit={(input) => {
                // Create a new narrative session with the input
                onNewNarrative();
                // Handle narrative creation - you might want to pass this to narrative creation
                // For now, just create the session
              }}
              onQuickAction={(actionId, actionType, actionData) => {
                switch (actionId) {
                  case 'narr-begin':
                    onNewNarrative();
                    break;
                  case 'narr-story':
                  case 'narr-evolution':
                    // Create new narrative with specific starting content
                    onNewNarrative();
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
      } else if (currentTab === APP_TERMS.TAB_UNIVERSITY) {
        return (
          <div className="h-full flex flex-col">
            <PreMusaiPage
              type="university"
              onSubmit={(input) => {
                // Create a new university session with the input
                // For now, just create a chat session
                onNewChat();
                setTimeout(() => {
                  onSendMessage(input);
                }, 100);
              }}
              onQuickAction={(actionId, actionType, actionData) => {
                switch (actionId) {
                  case 'univ-courses':
                    // Navigate to course creation
                    console.log('Course creation requested');
                    break;
                  case 'univ-learn':
                    if (actionData) {
                      onNewChat();
                      setTimeout(() => {
                        onSendMessage(actionData);
                      }, 100);
                    }
                    break;
                  default:
                    console.log('University quick action:', actionId, actionType, actionData);
                }
              }}
              isLoading={false}
              className="h-full"
            />
          </div>
        );
      } else {
        return (
          <div className="h-full flex flex-col">
            <ToolHeader
              icon={MessageSquare}
              title={APP_TERMS.CHAT}
              badge={APP_TERMS.CHAT_BADGE}
              badgeIcon={Sparkles}
              description={APP_TERMS.CHAT_DESCRIPTION}
            />
            <div className="flex-1 overflow-hidden">
              <PreMusaiPage
                type="chat"
                onSubmit={(input) => {
                  // Create a new chat session with the input
                  onNewChat();
                  // Send the message after a brief delay to ensure session is created
                  setTimeout(() => {
                    onSendMessage(input);
                  }, 100);
                }}
                onQuickAction={(actionId, actionType, actionData) => {
                  switch (actionId) {
                    case 'chat-new':
                      onNewChat();
                      break;
                    case 'chat-templates':
                    case 'chat-popular':
                      if (actionData) {
                        onNewChat();
                        setTimeout(() => {
                          onSendMessage(actionData);
                        }, 100);
                      }
                      break;
                    default:
                      console.log('Chat quick action:', actionId, actionType, actionData);
                  }
                }}
                isLoading={isTyping}
                className="h-full"
              />
            </div>
          </div>
        );
      }
    }

    // Show session selection if no current session
    if (!currentSession) {
      // Handle different modes for session selection
      if (currentTab === "emergent-narrative") {
        const currentNarrativeSession = narrativeSessions.find(s => s.id === narrativeCurrentSessionId);
        if (!currentNarrativeSession) {
          return (
            <div className="h-full flex flex-col">
              <PreMusaiPage
                type="narrative"
                onSubmit={(input) => {
                  // Create a new narrative session with the input
                  onNewNarrative();
                  // Handle narrative creation - you might want to pass this to narrative creation
                  // For now, just create the session
                }}
                isLoading={false}
                className="h-full"
              />
            </div>
          );
        }
      } else {
        // Show appropriate PreMusai interface based on current tab
        const getPreMusaiType = () => {
          switch (currentTab) {
            case APP_TERMS.TAB_CHAT: return APP_TERMS.PREMUSAI_CHAT;
            case APP_TERMS.TAB_TASK: return APP_TERMS.PREMUSAI_TASK;
            default: return APP_TERMS.PREMUSAI_CHAT;
          }
        };

        const handleSubmit = (input: string) => {
          if (currentTab === APP_TERMS.TAB_TASK) {
            // For task, create a new chat and send the input
            onNewChat();
            setTimeout(() => {
              onSendMessage(input);
            }, 100);
          } else {
            // Default chat behavior
            onNewChat();
            setTimeout(() => {
              onSendMessage(input);
            }, 100);
          }
        };

        return (
          <div className="h-full flex flex-col">
            <ToolHeader
              icon={MessageSquare}
              title="MusaiChat"
              badge="Conversational AI"
              badgeIcon={Sparkles}
              description="Natural dialogue with your AI companion for any topic"
            />
            <div className="flex-1 overflow-hidden">
              <PreMusaiPage
                type={getPreMusaiType()}
                onSubmit={handleSubmit}
                onQuickAction={(actionId, actionType, actionData) => {
                  switch (actionId) {
                    case 'chat-new':
                      onNewChat();
                      break;
                    case 'chat-templates':
                    case 'chat-popular':
                      if (actionData) {
                        handleSubmit(actionData);
                      }
                      break;
                    case 'task-auto':
                    case 'task-templates':
                      if (actionData) {
                        handleSubmit(actionData);
                      }
                      break;
                    case 'task-view':
                      // Could show task management UI in future
                      console.log('Task view requested');
                      break;
                    default:
                      console.log('Chat quick action:', actionId, actionType, actionData);
                  }
                }}
                isLoading={isTyping}
                className="h-full"
              />
            </div>
          </div>
        );
      }
    }

    const currentMessages = currentSession.messages || [];

    return (
      <div className="h-full flex flex-col">
        {/* Always show header for regular chat */}
        <ToolHeader
          icon={MessageSquare}
          title="MusaiChat"
          badge="Conversational AI"
          badgeIcon={Sparkles}
          description="Natural dialogue with your AI companion for any topic"
        />
        <div className="flex-1 min-h-0">
          <ChatMessages 
            messages={currentMessages} 
            isTyping={isTyping}
            onSendMessage={(message) => onSendMessage(message)}
          />
        </div>
        {/* Always show ChatInput when we have a session, regardless of message count */}
        <div className="w-full">
          <ChatInput
            input={input}
            isLoading={isLoading}
            onInputChange={setInput}
            onSend={handleSend}
            onImageSelect={handleImageSelect}
          />
        </div>
      </div>
    );
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

      {/* Navigation Bar */}
      <NavigationBar
        currentTab={currentTab}
        onTabChange={handleTabChange}
        isExpanded={isNavigationExpanded}
        onToggleExpanded={handleToggleExpanded}
      />

      {/* Main Layout with offset for navigation */}
      <div className={cn(
        "flex-1 transition-all duration-300 relative z-10",
        isMobile 
          ? "ml-16" // Fixed mobile offset for navigation bar
          : isNavigationExpanded 
            ? "ml-52" // Desktop: expanded navigation bar
            : "ml-20"  // Desktop: collapsed navigation bar
      )}>
        <div className="h-[100dvh] flex">
          {/* Sidebar Panel - only show for chat tab and when sessions exist */}
          {currentTab === APP_TERMS.TAB_CHAT && sessions.length > 0 && !isSidebarCollapsed && (
            <>
              <div 
                className={cn(
                  "transition-all duration-300 w-80 flex-shrink-0",
                  isMobile && !isSidebarOpen ? "hidden" : ""
                )}
              >
                <div className="h-full bg-background/95 backdrop-blur-sm rounded-lg shadow-lg">
                  <ChatSidebar
                    sessions={sessions}
                    currentSessionId={currentSessionId}
                    isSidebarOpen={isSidebarOpen}
                    isCollapsed={isSidebarCollapsed}
                    onNewChat={handleNewChat}
                    onSessionSelect={handleSessionClick}
                    onDeleteSession={onDeleteSession}
                    onRenameSession={onRenameSession}
                    onToggleFavorite={onToggleFavorite}
                    onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  />
                </div>
              </div>


            </>
          )}

          {/* Main Content Panel */}
          <div className="flex-1">
            <div className="h-full bg-background/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
              {renderMainContent()}
            </div>
          </div>
        </div>

        {/* Mobile sidebar toggle - only show for chat tab and when sessions exist */}
        {isMobile && currentTab === APP_TERMS.TAB_CHAT && sessions.length > 0 && (
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="fixed top-8 left-20 z-50 p-2 rounded-lg bg-background border shadow-md"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Desktop collapse toggle button for chat */}
        {currentTab === APP_TERMS.TAB_CHAT && sessions.length > 0 && !isMobile && isSidebarCollapsed && (
          <button
            onClick={() => setIsSidebarCollapsed(false)}
            className="fixed top-8 left-24 z-50 p-2 rounded-lg bg-background border shadow-md hover:bg-accent transition-colors"
            title="Show chat library"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Mobile sidebar overlay */}
        {isMobile && isSidebarOpen && currentTab === APP_TERMS.TAB_CHAT && sessions.length > 0 && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
};
