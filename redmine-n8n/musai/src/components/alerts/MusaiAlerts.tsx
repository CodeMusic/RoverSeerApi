import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Bell, X, ExternalLink, Clock, TrendingUp, Sparkles, AlertCircle, CheckCircle, MessageSquare, Search as SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';

export interface MusaiAlert {
  id: string;
  type: 'career' | 'curations' | 'university' | 'narrative' | 'code' | 'search' | 'task' | 'chat';
  title: string;
  description: string;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  actionLabel?: string;
  data?: any;
  source: string;
}

interface MusaiAlertsProps {
  alerts: MusaiAlert[];
  onDismissAlert: (alertId: string) => void;
  onMarkAsRead: (alertId: string) => void;
  onViewAlert: (alert: MusaiAlert) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const MusaiAlerts: React.FC<MusaiAlertsProps> = ({
  alerts,
  onDismissAlert,
  onMarkAsRead,
  onViewAlert,
  isOpen,
  onToggle
}) => {
  const unreadCount = alerts.filter(alert => !alert.isRead).length;
  const [selectedAlert, setSelectedAlert] = useState<MusaiAlert | null>(null);
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [panelMaxHeightPx, setPanelMaxHeightPx] = useState<number | undefined>(undefined);

  const handleToggle = () => {
    // Request notification permission on first user interaction
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    onToggle();
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'career': return <TrendingUp className="h-4 w-4" />;
      case 'curations': return <Sparkles className="h-4 w-4" />;
      case 'university': return <AlertCircle className="h-4 w-4" />;
      case 'narrative': return <AlertCircle className="h-4 w-4" />;
      case 'code': return <AlertCircle className="h-4 w-4" />;
      case 'chat': return <MessageSquare className="h-4 w-4" />;
      case 'search': return <SearchIcon className="h-4 w-4" />;
      case 'task': return <AlertCircle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getAlertColor = (type: string, priority: string) => {
    if (priority === 'high') {
      return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950';
    }
    if (priority === 'medium') {
      return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950';
    }
    
    switch (type) {
      case 'career': return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950';
      case 'curations': return 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950';
      case 'university': return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950';
      case 'narrative': return 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950';
      case 'chat': return 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950';
      case 'search': return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950';
      default: return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  // Calculate a dynamic max height so that up to four alerts are fully visible.
  // Beyond that, the panel becomes scrollable. This prevents the 2.5 item cutoff
  // caused by a fixed max height.
  useEffect(() => {
    if (!isOpen)
    {
      return;
    }

    if (alerts.length <= 4)
    {
      setPanelMaxHeightPx(undefined);
      return;
    }

    // Defer until layout is settled to get accurate measurements
    const measure = () =>
    {
      const headerHeight = headerRef.current ? headerRef.current.getBoundingClientRect().height : 0;
      const listElement = listRef.current;

      if (!listElement)
      {
        return;
      }

      const alertCards = Array.from(listElement.querySelectorAll('.musai-alert-card')) as HTMLElement[];
      const firstFour = alertCards.slice(0, 4);

      let alertsHeight = 0;
      firstFour.forEach((el, index) =>
      {
        alertsHeight += el.getBoundingClientRect().height;
        // Account for vertical gaps introduced by space-y-3 between items (0.75rem)
        if (index < firstFour.length - 1)
        {
          alertsHeight += 12; // 0.75rem = 12px (default Tailwind base)
        }
      });

      // Account for panel inner padding around the list (p-2 => 0.5rem top + bottom)
      const listVerticalPaddingPx = 16; // 0.5rem * 2 = 16px

      // Add a small buffer for borders/shadows
      const bufferPx = 8;

      const computedMax = Math.ceil(headerHeight + alertsHeight + listVerticalPaddingPx + bufferPx);
      setPanelMaxHeightPx(computedMax);
    };

    // Use rAF to ensure DOM has rendered the list items
    const raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, [isOpen, alerts.length]);

  return (
    <>
      {/* Alert Bell Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Alerts Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute top-full right-0 mt-2 w-80 bg-background border rounded-lg shadow-lg z-50"
          style={{
            maxHeight: panelMaxHeightPx,
            overflowY: alerts.length > 4 ? 'auto' as const : 'visible' as const
          }}
        >
          <div ref={headerRef} className="p-3 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Musai Alerts</h3>
              <Button variant="ghost" size="sm" onClick={onToggle}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div ref={listRef} className="p-2">
            {alerts.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No alerts</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <Card 
                    key={alert.id}
                    className={cn(
                      "transition-all duration-200 hover:shadow-md cursor-pointer musai-alert-card",
                      getAlertColor(alert.type, alert.priority),
                      !alert.isRead && "ring-2 ring-blue-500 ring-opacity-50"
                    )}
                    onClick={() => {
                      onMarkAsRead(alert.id);
                      setSelectedAlert(alert);
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-full",
                          alert.type === 'career' && "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
                          alert.type === 'curations' && "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400",
                          alert.type === 'university' && "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400",
                          alert.type === 'narrative' && "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400",
                          alert.type === 'chat' && "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400",
                          alert.type === 'search' && "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                        )}>
                          {getAlertIcon(alert.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm truncate">{alert.title}</h4>
                            <Badge 
                              variant="secondary" 
                              className={cn("text-xs", getPriorityColor(alert.priority))}
                            >
                              {alert.priority}
                            </Badge>
                            {!alert.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                          
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {alert.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimestamp(alert.timestamp)}
                            </span>
                            
                            <div className="flex items-center gap-1">
                              {!alert.isRead && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onMarkAsRead(alert.id);
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDismissAlert(alert.id);
                                }}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Alert Dialog */}
      <Dialog open={!!selectedAlert} onOpenChange={(open) => !open && setSelectedAlert(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedAlert && (
            <div className="space-y-3">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getAlertIcon(selectedAlert.type)}
                  <span>{selectedAlert.title}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTimestamp(selectedAlert.timestamp)}
                <Badge className={cn("ml-2", getPriorityColor(selectedAlert.priority))}>{selectedAlert.priority}</Badge>
              </div>
              <DialogDescription className="whitespace-pre-wrap">
                {selectedAlert.description}
              </DialogDescription>
              {selectedAlert.actionUrl && (
                <div className="pt-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="inline-flex items-center gap-2"
                    onClick={() => {
                      // Close alerts panel and modal, then SPA navigate
                      onToggle();
                      const url = selectedAlert.actionUrl as string;
                      setSelectedAlert(null);
                      navigate(url);
                    }}
                  >
                    {selectedAlert.actionLabel || 'Open'}
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}; 