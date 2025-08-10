import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { APP_TERMS } from '@/config/constants';
import { ROUTES } from '@/config/routes';
import { Theater, Heart, Search, MessageSquare, Code, GraduationCap, Bot, Eye, Stethoscope } from 'lucide-react';
import { DynamicProfileLogo } from '@/components/effects/MusaiEffects';

type TabId = typeof APP_TERMS[keyof typeof APP_TERMS];

interface SymbolOption
{
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SYMBOL_OPTIONS: SymbolOption[] = [
  { id: APP_TERMS.TAB_NARRATIVE, label: 'MusaiTale', icon: Theater },
  { id: APP_TERMS.TAB_THERAPY, label: 'TherapyMusai', icon: Heart },
  { id: APP_TERMS.TAB_MEDICAL, label: 'MedicalMusai', icon: Stethoscope },
  { id: APP_TERMS.TAB_CHAT, label: 'MusaiChat', icon: MessageSquare },
  { id: APP_TERMS.TAB_SEARCH, label: 'MusaiSearch', icon: Search },
  { id: APP_TERMS.TAB_CODE, label: 'CodeMusai', icon: Code },
  { id: APP_TERMS.TAB_UNIVERSITY, label: 'MusaiUniversity', icon: GraduationCap },
  { id: APP_TERMS.TAB_EYE, label: 'Eye of Musai', icon: Eye },
  { id: APP_TERMS.TAB_TASK, label: 'TaskMusai', icon: Bot },
];

export const AttentionalGatewayHeader: React.FC<{ defaultTabId?: string }> = ({ defaultTabId }) =>
{
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedTab, setSelectedTab] = useState<string>(defaultTabId || APP_TERMS.TAB_CHAT);
  const [prompt, setPrompt] = useState('');

  const selectedOption = useMemo(() => SYMBOL_OPTIONS.find(o => o.id === selectedTab) || SYMBOL_OPTIONS[0], [selectedTab]);

  const handleEnterApp = useCallback(() =>
  {
    const hasPrompt = prompt.trim().length > 0;
    if (selectedTab === APP_TERMS.TAB_SEARCH)
    {
      if (hasPrompt)
      {
        navigate(ROUTES.MAIN_APP + `?mode=search&q=${encodeURIComponent(prompt)}`, { state: { switchToTab: APP_TERMS.TAB_SEARCH, initialQuery: prompt } });
      }
      else
      {
        navigate(ROUTES.MAIN_APP, { state: { switchToTab: APP_TERMS.TAB_SEARCH } });
      }
      return;
    }
    if (selectedTab === APP_TERMS.TAB_CHAT)
    {
      if (hasPrompt)
      {
        navigate(ROUTES.MAIN_APP, { state: { newSession: true, initialMessage: prompt } });
      }
      else
      {
        navigate(ROUTES.MAIN_APP, { state: { switchToTab: APP_TERMS.TAB_CHAT } });
      }
      return;
    }
    navigate(ROUTES.MAIN_APP, { state: { switchToTab: selectedTab, initialQuery: hasPrompt ? prompt : undefined } });
  }, [navigate, selectedTab, prompt]);

  const handleLogoClick = useCallback(() =>
  {
    navigate(ROUTES.HOME);
  }, [navigate]);

  // Keep select in sync with current page and default tab
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
      [ROUTES.UNIVERSITY]: APP_TERMS.TAB_UNIVERSITY,
      [ROUTES.FIND_YOUR_MUSE]: APP_TERMS.TAB_SEARCH,
      [ROUTES.TASK_MUSAI]: APP_TERMS.TAB_TASK,
    };
    const mapped = pathToTab[path];
    if (mapped && mapped !== selectedTab)
    {
      setSelectedTab(mapped);
      return;
    }
    if (defaultTabId && defaultTabId !== selectedTab)
    {
      setSelectedTab(defaultTabId);
    }
  }, [location.pathname, defaultTabId]);

  const navigateToToolPage = useCallback((tabId: string) =>
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
        navigate(ROUTES.LOCAL_AI); break;
      case APP_TERMS.TAB_UNIVERSITY:
        navigate(ROUTES.UNIVERSITY); break;
      case APP_TERMS.TAB_TASK:
        navigate(ROUTES.TASK_MUSAI); break;
      default:
        break;
    }
  }, [navigate]);

  return (
    <div className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
        {/* Logo as App Portal */}
        <button onClick={handleLogoClick} className="flex items-center gap-2 group" aria-label="Open Musai">
          <DynamicProfileLogo size="md" className="transition-transform group-hover:scale-105" />
          <span className="text-sm font-semibold tracking-wide">Musai</span>
        </button>

        {/* Symbol Dropdown */}
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

        {/* Prompt Entrypoint */}
        <div className="flex-1 flex items-center gap-2">
          <Input
            placeholder="Type to enter with intent…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { handleEnterApp(); } }}
          />
          <Button onClick={handleEnterApp}>Enter</Button>
        </div>
      </div>
    </div>
  );
};

export default AttentionalGatewayHeader;


