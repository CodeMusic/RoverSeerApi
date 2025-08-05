import React from 'react';
import { AlertCircle, ArrowLeft, Bell, Clock, ExternalLink, X, TrendingUp, Mail, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CareerAlert {
  id: string;
  type: 'search_result' | 'schedule_complete' | 'opportunity' | 'trend' | 'reminder';
  title: string;
  description: string;
  timestamp: Date;
  isRead: boolean;
  data?: any;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
}

interface CareerAlertsProps {
  alerts: CareerAlert[];
  onBack: () => void;
  onDismissAlert: (alertId: string) => void;
  onMarkAsRead?: (alertId: string) => void;
  onViewAlert?: (alert: CareerAlert) => void;
}

export const CareerAlerts: React.FC<CareerAlertsProps> = ({
  alerts,
  onBack,
  onDismissAlert,
  onMarkAsRead,
  onViewAlert
}) => {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'search_result': return <TrendingUp className="h-4 w-4" />;
      case 'schedule_complete': return <Clock className="h-4 w-4" />;
      case 'opportunity': return <ExternalLink className="h-4 w-4" />;
      case 'trend': return <TrendingUp className="h-4 w-4" />;
      case 'reminder': return <Bell className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
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
      case 'search_result': return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950';
      case 'schedule_complete': return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950';
      case 'opportunity': return 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950';
      case 'trend': return 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950';
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

  const unreadCount = alerts.filter(alert => !alert.isRead).length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Career Alerts</h2>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {alerts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Career Alerts</h3>
              <p className="text-sm text-muted-foreground">
                You'll see notifications here when scheduled searches complete or new opportunities are found.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <Card 
                key={alert.id} 
                className={cn(
                  "transition-all duration-200 hover:shadow-md",
                  getAlertColor(alert.type, alert.priority),
                  !alert.isRead && "ring-2 ring-blue-500 ring-opacity-50"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={cn(
                        "p-2 rounded-full",
                        alert.type === 'search_result' && "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
                        alert.type === 'schedule_complete' && "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400",
                        alert.type === 'opportunity' && "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400",
                        alert.type === 'trend' && "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400",
                        alert.type === 'reminder' && "bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400"
                      )}>
                        {getAlertIcon(alert.type)}
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{alert.title}</h4>
                          <Badge 
                            variant="secondary" 
                            className={cn("text-xs", getPriorityColor(alert.priority))}
                          >
                            {alert.priority}
                          </Badge>
                          {!alert.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          {alert.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(alert.timestamp)}
                          </span>
                          
                          {alert.actionUrl && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-auto p-0 text-xs text-blue-600 hover:text-blue-700"
                              onClick={() => onViewAlert?.(alert)}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {!alert.isRead && onMarkAsRead && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => onMarkAsRead(alert.id)}
                          className="h-8 w-8 p-0"
                        >
                          <FileText className="h-3 w-3" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onDismissAlert(alert.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 