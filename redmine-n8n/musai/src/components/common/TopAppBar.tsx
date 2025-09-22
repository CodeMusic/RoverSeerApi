import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Map, Waves } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ROUTES, { RouteUtils } from '@/config/routes';
import { MusaiAlerts } from '@/components/alerts/MusaiAlerts';
import { useMusaiAlerts } from '@/contexts/MusaiAlertsContext';
import BetaRoadmapModal from './BetaRoadmapModal';
import { TopCopilotLauncher } from './TopCopilotLauncher';

export function TopAppBar()
{
  const { alerts, dismissAlert, markAsRead, toggleAlerts, isAlertsOpen, closeAlerts } = useMusaiAlerts() as any;
  const [isRoadmapOpen, setIsRoadmapOpen] = useState<boolean>(false);
  const [isReady, setIsReady] = useState(false);
  useEffect(() =>
  {
    const id = requestAnimationFrame(() => setIsReady(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const navigate = useNavigate();

  return (
    <div className={cn(
      'md:fixed md:top-0 md:left-0 md:right-0 z-50 border-b  border-white/10 bg-slate-950/40 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/30 magic-reactive magic-topbar topbar-aurora',
      isReady && 'magical-topbar-enter'
    )}>
      <div className="w-full px-4 sm:px-6">
        <div className="h-16 ml-14 mb-1 mt-1 flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-[11px] uppercase tracking-[0.32em] text-white/70">
       
            Musai
          </div>

          <TopCopilotLauncher className="flex-1 min-w-0" />

          <div className="flex items-center gap-3">
            <div className="relative">
              <MusaiAlerts
                alerts={alerts}
                onDismissAlert={dismissAlert}
                onMarkAsRead={markAsRead}
                onViewAlert={(alert) =>
                {
                  markAsRead(alert.id);
                  // Prefer in-app navigation to the relevant module
                  const title = (alert.title || '').toLowerCase();
                  if (title.includes('university'))
                  {
                    closeAlerts();
                    navigate(ROUTES.UNIVERSITY);
                    return;
                  }
                  if (title.includes('eye of musai') || title.includes('perceive') || title.includes('recognize'))
                  {
                    closeAlerts();
                    navigate(RouteUtils.mainAppWithMode('eye'));
                    return;
                  }
                  if (title.includes('research') || title.includes('newspaper') || alert.type === 'search')
                  {
                    closeAlerts();
                    navigate(RouteUtils.mainAppWithMode('search'));
                    return;
                  }
                  // Fallback: external url if provided
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
              className="rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white"
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
      </div>

      <BetaRoadmapModal isOpen={isRoadmapOpen} onOpenChange={setIsRoadmapOpen} />
    </div>
  );
}

export default TopAppBar;
