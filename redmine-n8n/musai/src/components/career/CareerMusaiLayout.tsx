import React, { useState, useCallback, useEffect } from 'react';
import { TrendingUp, Sparkles, Calendar, AlertCircle, Mail, Bell } from 'lucide-react';
import { ToolHeader } from '@/components/common/ToolHeader';
import { PreMusaiPage } from '@/components/common/PreMusaiPage';
import { APP_TERMS } from '@/config/constants';
import { useMusaiMood } from '@/contexts/MusaiMoodContext';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { CareerChat } from './CareerChat';
import { CareerScheduler } from './CareerScheduler';
import { CareerAlerts } from './CareerAlerts';

interface CareerMusaiLayoutProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onNewChat: () => void;
  onSendMessage: (message: string) => void;
  isTyping: boolean;
  currentSession: any;
}

export const CareerMusaiLayout: React.FC<CareerMusaiLayoutProps> = ({
  currentTab,
  onTabChange,
  onNewChat,
  onSendMessage,
  isTyping,
  currentSession
}) => {
  const { currentMood } = useMusaiMood();
  const { preferences, recordLastSession, getLastSession } = useUserPreferences();
  const [activeView, setActiveView] = useState<'chat' | 'scheduler' | 'alerts'>('chat');
  const [scheduledSearches, setScheduledSearches] = useState<any[]>([]);
  const [careerAlerts, setCareerAlerts] = useState<any[]>([]);

  // Load last used session or first item based on preferences
  useEffect(() => {
    if (preferences.autoSelectFirstItem) {
      const lastSession = getLastSession(APP_TERMS.SESSION_CAREER);
      if (lastSession) {
        // Load the last session
        console.log('Loading last career session:', lastSession);
      } else {
        // Auto-select first item if available
        console.log('Auto-selecting first career item');
      }
    }
  }, [preferences.autoSelectFirstItem, getLastSession]);

  const handleCareerSubmit = useCallback((input: string, mode?: string) => {
    // Record this session as last used
    recordLastSession(APP_TERMS.SESSION_CAREER, { timestamp: Date.now() });
    
    // Create new chat and send message
    onNewChat();
    setTimeout(() => {
      onSendMessage(input);
    }, 100);
  }, [onNewChat, onSendMessage, recordLastSession]);

  const handleScheduleSearch = useCallback((searchConfig: {
    query: string;
    presentation: string;
    email?: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    time?: string;
  }) => {
    // Send to n8n to schedule the search
    const scheduleData = {
      type: 'career_search_schedule',
      config: searchConfig,
      userId: 'current-user', // Replace with actual user ID
      timestamp: Date.now()
    };

    // Call n8n endpoint to schedule the search
    fetch('/api/n8n/career/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduleData)
    })
    .then(response => response.json())
    .then(data => {
      setScheduledSearches(prev => [...prev, { ...searchConfig, id: data.id }]);
      console.log('Search scheduled:', data);
    })
    .catch(error => {
      console.error('Failed to schedule search:', error);
    });
  }, []);

  const handleQuickAction = useCallback((actionId: string, actionType: string, actionData?: any) => {
    switch (actionId) {
      case 'career-chat':
        handleCareerSubmit('Start a new career development conversation');
        break;
      case 'career-insights':
        handleCareerSubmit('Show me the latest career insights and trends');
        break;
      case 'career-recent':
        handleCareerSubmit('What are my recent career activities and progress?');
        break;
      case 'career-answers':
        handleCareerSubmit('Give me quick career advice and answers');
        break;
      default:
        console.log('Career quick action:', actionId, actionType, actionData);
    }
  }, [handleCareerSubmit]);

  // Render main content based on active view
  const renderMainContent = () => {
    if (activeView === 'scheduler') {
      return (
        <CareerScheduler
          scheduledSearches={scheduledSearches}
          onScheduleSearch={handleScheduleSearch}
          onBack={() => setActiveView('chat')}
        />
      );
    }

    if (activeView === 'alerts') {
      return (
        <CareerAlerts
          alerts={careerAlerts}
          onBack={() => setActiveView('chat')}
          onDismissAlert={(alertId) => {
            setCareerAlerts(prev => prev.filter(alert => alert.id !== alertId));
          }}
        />
      );
    }

    // Show PreMusai screen if no current session
    if (!currentSession) {
      return (
        <div className="h-full flex flex-col">
          <ToolHeader
            icon={TrendingUp}
            title={APP_TERMS.CAREER}
            badge="Career Development"
            badgeIcon={Sparkles}
            description="AI-powered career development and job search assistance"
          />
          <div className="flex-1 overflow-hidden">
            <PreMusaiPage
              type="career"
              onSubmit={handleCareerSubmit}
              onQuickAction={handleQuickAction}
              isLoading={isTyping}
              className="h-full"
            />
          </div>
        </div>
      );
    }

    // Default chat view with current session
    return (
      <div className="h-full flex flex-col">
        <ToolHeader
          icon={TrendingUp}
          title={APP_TERMS.CAREER}
          badge="Career Development"
          badgeIcon={Sparkles}
          description="AI-powered career development and job search assistance"
        />
        <div className="flex-1 overflow-hidden">
          <CareerChat
            currentSession={currentSession}
            onSendMessage={onSendMessage}
            isTyping={isTyping}
            onNewChat={onNewChat}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {renderMainContent()}
    </div>
  );
}; 