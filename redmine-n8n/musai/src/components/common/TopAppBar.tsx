import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Map } from 'lucide-react';
import { MusaiAlerts } from '@/components/alerts/MusaiAlerts';
import { useMusaiAlerts } from '@/contexts/MusaiAlertsContext';
import BetaRoadmapModal from './BetaRoadmapModal';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';

export function TopAppBar()
{
  const { alerts, dismissAlert, markAsRead, toggleAlerts, isAlertsOpen, closeAlerts } = useMusaiAlerts() as any;
  const [isRoadmapOpen, setIsRoadmapOpen] = useState<boolean>(false);
  const { preferences } = useUserPreferences();

  return (
    <div className={cn(
      'fixed top-0 left-0 right-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60'
    )}>
      <div className="px-3 h-16 flex items-center justify-between">
        {/* Left: (empty for now) */}
        <div />

        {/* Right: Alerts and Roadmap (Map at far right) */}
        <div className="flex items-center gap-3">
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
        </div>
      </div>

      <BetaRoadmapModal isOpen={isRoadmapOpen} onOpenChange={setIsRoadmapOpen} />
    </div>
  );
}

export default TopAppBar;


