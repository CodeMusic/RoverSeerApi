import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { MusaiAlert } from '@/components/alerts/MusaiAlerts';

interface MusaiAlertsContextType {
  alerts: MusaiAlert[];
  addAlert: (alert: Omit<MusaiAlert, 'id' | 'timestamp' | 'isRead'>) => void;
  dismissAlert: (alertId: string) => void;
  markAsRead: (alertId: string) => void;
  markAllAsRead: () => void;
  clearAllAlerts: () => void;
  getUnreadCount: () => number;
  isAlertsOpen: boolean;
  toggleAlerts: () => void;
  closeAlerts: () => void;
}

const MusaiAlertsContext = createContext<MusaiAlertsContextType | undefined>(undefined);

export function MusaiAlertsProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<MusaiAlert[]>([]);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  // Load alerts from localStorage on mount
  useEffect(() => {
    const savedAlerts = localStorage.getItem('musai-alerts');
    if (savedAlerts) {
      try {
        const parsedAlerts = JSON.parse(savedAlerts);
        // Convert timestamp strings back to Date objects
        const alertsWithDates = parsedAlerts.map((alert: any) => ({
          ...alert,
          timestamp: new Date(alert.timestamp)
        }));
        setAlerts(alertsWithDates);
      } catch (error) {
        console.error('Failed to load alerts from localStorage:', error);
      }
    }
    // Seed a one-time beta announcement if none exists yet
    try {
      const hasSeeded = localStorage.getItem('musai-alerts-seeded-beta-0814');
      if (!hasSeeded) {
        const base = {
          description: 'Core chat and search experiences are live in beta. Expect occasional rough edges while we stabilize long-running requests and polish UX.',
          isRead: false,
          priority: 'medium' as const,
          source: 'system'
        };
        const seedChat: MusaiAlert = {
          id: `seed-chat-${Date.now()}`,
          type: 'chat',
          title: 'MusaiChat beta is now working',
          timestamp: new Date(),
          ...base
        } as MusaiAlert;
        const seedSearch: MusaiAlert = {
          id: `seed-search-${Date.now() + 1}`,
          type: 'search',
          title: 'MusaiSearch beta is now working',
          timestamp: new Date(),
          ...base
        } as MusaiAlert;
        setAlerts(prev => [seedChat, seedSearch, ...prev]);
        localStorage.setItem('musai-alerts-seeded-beta-0814', '1');
      }
    } catch {}

    // Seed feature announcements (beta roadmap highlights)
    try {
      const hasSeededFeatures = localStorage.getItem('musai-alerts-seeded-beta-0820');
      if (!hasSeededFeatures) {
        const base = {
          description: '',
          isRead: false,
          priority: 'high' as const,
          source: 'system'
        };
        const featureAlerts: MusaiAlert[] = [
          {
            id: `seed-uni-lecture-${Date.now()}`,
            type: 'university',
            title: 'Musai University can now generate lectures',
            description: 'Create multi-section lectures with syllabus, quiz, and content previews.',
            timestamp: new Date(),
            ...base
          } as MusaiAlert,
          {
            id: `seed-eye-${Date.now() + 1}`,
            type: 'chat',
            title: 'Eye of Musai: Perceive and Recognize working',
            description: 'Generate images from prompts and recognize content from images; includes tools and multi-image sessions.',
            timestamp: new Date(),
            ...base
          } as MusaiAlert,
          {
            id: `seed-research-${Date.now() + 2}`,
            type: 'search',
            title: 'MusaiRESearch generates newspaper articles with images',
            description: 'Research flow outputs full newspaper-style articles with inline images.',
            timestamp: new Date(),
            ...base
          } as MusaiAlert
        ];
        setAlerts(prev => [...featureAlerts, ...prev]);
        localStorage.setItem('musai-alerts-seeded-beta-0820', '1');
      }
    } catch {}
  }, []);

  // Save alerts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('musai-alerts', JSON.stringify(alerts));
  }, [alerts]);

  const addAlert = useCallback((alertData: Omit<MusaiAlert, 'id' | 'timestamp' | 'isRead'>) => {
    const newAlert: MusaiAlert = {
      ...alertData,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      isRead: false
    };

    setAlerts(prev => [newAlert, ...prev]);

    // Show browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(newAlert.title, {
        body: newAlert.description,
        icon: '/musai_logo.png',
        tag: newAlert.id
      });
    }
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  const markAsRead = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ));
  }, []);

  const markAllAsRead = useCallback(() => {
    setAlerts(prev => prev.map(alert => ({ ...alert, isRead: true })));
  }, []);

  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const getUnreadCount = useCallback(() => {
    return alerts.filter(alert => !alert.isRead).length;
  }, [alerts]);

  const toggleAlerts = useCallback(() => {
    setIsAlertsOpen(prev => !prev);
  }, []);

  const closeAlerts = useCallback(() => {
    setIsAlertsOpen(false);
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    // Remove automatic permission request - will be requested on user interaction instead
    // if ('Notification' in window && Notification.permission === 'default') {
    //   Notification.requestPermission();
    // }
  }, []);

  // Listen for n8n webhook notifications
  useEffect(() => {
    const handleN8nWebhook = (event: MessageEvent) => {
      if (event.data?.type === 'musai-alert') {
        addAlert({
          type: event.data.alertType,
          title: event.data.title,
          description: event.data.description,
          priority: event.data.priority || 'medium',
          actionUrl: event.data.actionUrl,
          actionLabel: event.data.actionLabel,
          data: event.data.data,
          source: 'n8n-webhook'
        });
      }
    };

    window.addEventListener('message', handleN8nWebhook);
    return () => window.removeEventListener('message', handleN8nWebhook);
  }, [addAlert]);

  return (
    <MusaiAlertsContext.Provider value={{
      alerts,
      addAlert,
      dismissAlert,
      markAsRead,
      markAllAsRead,
      clearAllAlerts,
      getUnreadCount,
      isAlertsOpen,
      toggleAlerts,
      closeAlerts
    }}>
      {children}
    </MusaiAlertsContext.Provider>
  );
}

export function useMusaiAlerts() {
  const context = useContext(MusaiAlertsContext);
  if (context === undefined) {
    throw new Error('useMusaiAlerts must be used within a MusaiAlertsProvider');
  }
  return context;
} 