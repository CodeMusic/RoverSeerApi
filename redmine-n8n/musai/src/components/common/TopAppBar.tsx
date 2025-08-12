import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Map } from 'lucide-react';
import { MusaiAlerts } from '@/components/alerts/MusaiAlerts';
import { useMusaiAlerts } from '@/contexts/MusaiAlertsContext';
import BetaRoadmapModal from './BetaRoadmapModal';
import { useMusaiStatus } from '@/contexts/MusaiStatusContext';
import { Progress } from '@/components/ui/progress';

export function TopAppBar()
{
  const { alerts, dismissAlert, markAsRead, toggleAlerts, isAlertsOpen, getUnreadCount, closeAlerts } = useMusaiAlerts() as any;
  const [isRoadmapOpen, setIsRoadmapOpen] = useState<boolean>(false);
  const { status, emitQuickAction } = useMusaiStatus();

  const progressValue = typeof status.progressPercent === 'number' ? Math.max(0, Math.min(100, status.progressPercent)) : undefined;

  return (
    <div className={cn(
      'fixed top-0 left-0 right-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60'
    )}>
      <div className="px-3 h-16 flex items-center gap-2">
        {/* Notifications Bell */}
        <div className="relative">
          <MusaiAlerts
            alerts={alerts}
            onDismissAlert={dismissAlert}
            onMarkAsRead={markAsRead}
            onViewAlert={(alert) =>
            {
              markAsRead(alert.id);
              if (alert.actionUrl)
              {
                window.open(alert.actionUrl, '_blank', 'noopener,noreferrer');
              }
            }}
            isOpen={isAlertsOpen}
            onToggle={toggleAlerts}
          />
        </div>

        {/* Beta Roadmap Trigger */}
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full"
          onClick={() =>
          {
            closeAlerts();
            setIsRoadmapOpen(true);
          }}
          title="Beta Roadmap"
          aria-label="Open Beta Roadmap"
        >
          <Map className="h-5 w-5" />
        </Button>

        {/* Musai Status Area */}
        <div className="flex-1 min-w-0 px-2">
          <div className="flex items-center gap-3 min-w-0">
            {status.symbolUrl && (
              <img src={status.symbolUrl} alt="symbol" className="w-8 h-8 rounded" />
            )}
            <div className="min-w-0">
              {status.header && (
                <div className="text-sm font-semibold truncate">{status.header}</div>
              )}
              {/* Operational metrics: # Active Requests / total allow, (y queued) */}
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {typeof status.activeRequests === 'number' && typeof status.maxConcurrentRequests === 'number' && (
                  <span>
                    {`Requests: ${status.activeRequests} / ${status.maxConcurrentRequests}`}
                    {typeof status.queuedRequests === 'number' && status.queuedRequests > 0 && (
                      <span>{` (${status.queuedRequests} queued)`}</span>
                    )}
                  </span>
                )}
                {typeof status.activeUsers === 'number' && (
                  <span className="ml-3">{`Active Users: ${status.activeUsers}`}</span>
                )}
              </div>
              {progressValue !== undefined && (
                <div className="mt-1">
                  <Progress value={progressValue} className="h-2" />
                </div>
              )}
              {status.statusHtml && (
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: status.statusHtml }} />
              )}
            </div>
            {/* Quick actions */}
            {Array.isArray(status.quickActions) && status.quickActions.length > 0 && (
              <div className="flex items-center gap-2 ml-2 flex-wrap">
                {status.quickActions.slice(0, 3).map((qa) => (
                  <Button key={qa.id} size="sm" variant="secondary" onClick={() => emitQuickAction(qa.id, qa.payload)}>
                    {qa.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Future right-side controls could go here */}
      </div>

      <BetaRoadmapModal isOpen={isRoadmapOpen} onOpenChange={setIsRoadmapOpen} />
    </div>
  );
}

export default TopAppBar;


