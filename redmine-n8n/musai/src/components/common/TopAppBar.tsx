import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Map, Theater, Heart, Search, MessageSquare, Code, GraduationCap, Bot, Eye, Stethoscope, TrendingUp, Sparkles } from 'lucide-react';
import { MusaiAlerts } from '@/components/alerts/MusaiAlerts';
import { useMusaiAlerts } from '@/contexts/MusaiAlertsContext';
import BetaRoadmapModal from './BetaRoadmapModal';
import { useMusaiStatus } from '@/contexts/MusaiStatusContext';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocation, useNavigate } from 'react-router-dom';
import { APP_TERMS, CANONICAL_TOOL_ORDER } from '@/config/constants';
import { ROUTES } from '@/config/routes';

export function TopAppBar()
{
  const { alerts, dismissAlert, markAsRead, toggleAlerts, isAlertsOpen, getUnreadCount, closeAlerts } = useMusaiAlerts() as any;
  const [isRoadmapOpen, setIsRoadmapOpen] = useState<boolean>(false);
  const { status, emitQuickAction } = useMusaiStatus();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedTab, setSelectedTab] = useState<string>(APP_TERMS.TAB_CHAT);

  type SymbolOption = { id: string; label: string; icon: React.ComponentType<{ className?: string }> };
  const SYMBOL_OPTIONS: SymbolOption[] = useMemo(() => [
    { id: APP_TERMS.TAB_CHAT, label: 'MusaiChat', icon: MessageSquare },
    { id: APP_TERMS.TAB_SEARCH, label: 'MusaiSearch', icon: Search },
    { id: APP_TERMS.TAB_EYE, label: 'Eye of Musai', icon: Eye },
    { id: APP_TERMS.TAB_CODE, label: 'CodeMusai', icon: Code },
    { id: 'studio', label: 'Musai Studio', icon: Code },
    { id: APP_TERMS.TAB_UNIVERSITY, label: 'MusaiUniversity', icon: GraduationCap },
    { id: APP_TERMS.TAB_NARRATIVE, label: 'MusaiTale', icon: Theater },
    { id: APP_TERMS.TAB_CAREER, label: 'CareerMusai', icon: TrendingUp },
    { id: APP_TERMS.TAB_THERAPY, label: 'TherapyMusai', icon: Heart },
    { id: APP_TERMS.TAB_MEDICAL, label: 'MedicalMusai', icon: Stethoscope },
    { id: 'curations', label: 'Musai Curations', icon: Sparkles },
    { id: APP_TERMS.TAB_TASK, label: 'AgileMusai', icon: Bot },
  ].sort((a, b) => CANONICAL_TOOL_ORDER.indexOf(a.id) - CANONICAL_TOOL_ORDER.indexOf(b.id)), []);

  useEffect(() =>
  {
    const path = location.pathname;
    const pathToTab: Record<string, string> = {
      [ROUTES.MEET_MUSAI]: APP_TERMS.TAB_CHAT,
      [ROUTES.EMERGENT_NARRATIVE]: APP_TERMS.TAB_NARRATIVE,
      [ROUTES.THERAPY_MUSAI]: APP_TERMS.TAB_THERAPY,
      [ROUTES.MEDICAL_MUSAI]: APP_TERMS.TAB_MEDICAL,
      [ROUTES.CAREER_MUSAI]: APP_TERMS.TAB_CAREER,
      [ROUTES.EYE_OF_MUSAI]: APP_TERMS.TAB_EYE,
      [ROUTES.LOCAL_AI]: APP_TERMS.TAB_CODE,
      [ROUTES.CODE_MUSAI_INFO]: APP_TERMS.TAB_CODE,
      [ROUTES.NEUROSCIENCE]: APP_TERMS.TAB_UNIVERSITY,
      [ROUTES.UNIVERSITY]: APP_TERMS.TAB_UNIVERSITY,
      [ROUTES.UNIVERSITY_INFO]: APP_TERMS.TAB_UNIVERSITY,
      [ROUTES.FIND_YOUR_MUSE]: APP_TERMS.TAB_SEARCH,
      [ROUTES.TASK_MUSAI]: APP_TERMS.TAB_TASK,
      [ROUTES.CURATIONS_INFO]: 'curations',
      [ROUTES.CURATIONS]: 'curations',
      [ROUTES.MUSAI_STUDIO_INFO]: 'studio',
      [ROUTES.MUSAI_STUDIO]: 'studio',
    };
    const mapped = pathToTab[path];
    if (mapped && mapped !== selectedTab)
    {
      setSelectedTab(mapped);
    }
  }, [location.pathname]);

  const navigateToToolPage = (tabId: string) =>
  {
    switch (tabId)
    {
      case APP_TERMS.TAB_CHAT:
        navigate(ROUTES.MEET_MUSAI); break;
      case APP_TERMS.TAB_NARRATIVE:
        navigate(ROUTES.EMERGENT_NARRATIVE); break;
      case APP_TERMS.TAB_THERAPY:
        navigate(ROUTES.THERAPY_MUSAI); break;
      case APP_TERMS.TAB_MEDICAL:
        navigate(ROUTES.MEDICAL_MUSAI); break;
      case APP_TERMS.TAB_CAREER:
        navigate(ROUTES.CAREER_MUSAI); break;
      case APP_TERMS.TAB_EYE:
        navigate(ROUTES.EYE_OF_MUSAI); break;
      case APP_TERMS.TAB_CODE:
        navigate(ROUTES.CODE_MUSAI_INFO); break;
      case APP_TERMS.TAB_UNIVERSITY:
        navigate(ROUTES.UNIVERSITY_INFO); break;
      case APP_TERMS.TAB_TASK:
        navigate(ROUTES.TASK_MUSAI); break;
      case APP_TERMS.TAB_SEARCH:
        navigate(ROUTES.FIND_YOUR_MUSE); break;
      case 'curations':
        navigate(ROUTES.CURATIONS); break;
      case 'studio':
        navigate(ROUTES.MUSAI_STUDIO); break;
      default:
        break;
    }
  };

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

        {/* Tool Dropdown (12 Musais) */}
        <div className="w-[220px]">
          <Select value={selectedTab} onValueChange={(v) => { setSelectedTab(v); navigateToToolPage(v); }}>
            <SelectTrigger>
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              {SYMBOL_OPTIONS.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  <div className="flex items-center gap-2">
                    <opt.icon className="w-4 h-4" />
                    <span>{opt.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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


