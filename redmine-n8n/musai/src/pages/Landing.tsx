import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles, Brain, MessageSquare, Theater, GraduationCap, Search, Bot, ChevronDown, Cpu, Code, Eye, Target, Heart, Stethoscope, Music, Map } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useChatSessions } from "@/hooks/useChatSessions";
import { MusaiLifeLogo } from "@/components/effects/MusaiEffects";
import ROUTES, { RouteUtils } from "@/config/routes";
import { APP_TERMS, MUSAI_CHROMATIC_12, CANONICAL_TOOL_ORDER } from "@/config/constants";
import {
  computeToneIndices,
  getNeighborTones,
  getToneByIndex,
  hexToRgba,
  isDualValenceIndex,
} from "@/utils/chroma";
// Carousel removed for now
import { IconTileList } from "@/components/common/IconTileList";
import type { IconTileItem } from "@/components/common/IconTileList";
import { discoverMusaiModule, MusaiDiscoverModule } from "@/lib/discoveryApi";

type DiscoverExperience = 'auto' | MusaiDiscoverModule;
type FeaturedTile = { label: string; to: string; Icon: LucideIcon };

const HERO_CONTENT: Record<DiscoverExperience, { title: string; tagline: string; placeholder: string; detail: string }> = {
  auto: {
    title: "Musai",
    tagline: "Reflective AI for Recursive Minds",
    placeholder: "What would you like to explore?",
    detail: "Experience the world's first agentic AI mind that grows through memory, feedback, and self-refinement. Musai doesn't just answer questions—it develops a sense of who you are, and a working model of who it is becoming.",
  },
  chat: {
    title: "MusaiChat",
    tagline: "Start a natural conversation with your AI companion",
    placeholder: "What's on your mind?",
    detail: "Start a natural conversation with your AI assistant. Ask questions, brainstorm ideas, or simply think out loud. Musai learns from every interaction to better attune to your needs.",
  },
  search: {
    title: "MusaiSearch",
    tagline: "Intelligent discovery and exploration",
    placeholder: "Search for anything...",
    detail: "Discover intelligent insights through advanced search capabilities. Find answers, explore perspectives, and surface connections you might have missed.",
  },
  research: {
    title: "MusaiResearch",
    tagline: "Synthesize perspectives and gather sources",
    placeholder: "What should we research together?",
    detail: "Launch a research sprint that triangulates sources, perspectives, and context. MusaiResearch threads curiosity into rigorous, bias-aware exploration.",
  },
  university: {
    title: "Musai U",
    tagline: "Generative learning and knowledge creation",
    placeholder: "What would you like to learn?",
    detail: "Design living courses, adapt curricula, and co-create lectures in minutes. Musai University turns curiosity into structured learning journeys.",
  },
  tale: {
    title: "MusaiTale",
    tagline: "Story emergence and perspective thinking",
    placeholder: "Whisper the opening of a story...",
    detail: "Explore story emergence and perspective thinking. Weave narratives that balance logic and imagination with an AI co-author who feels the arc with you.",
  },
  eye: {
    title: "Eye of Musai",
    tagline: "Vision that bridges perception and meaning",
    placeholder: "What should the Eye perceive?",
    detail: "Invite the Eye to perceive, generate, or remix imagery. Blend computer vision with narrative understanding for visuals that stay grounded in context.",
  },
  medical: {
    title: "MedicalMusai",
    tagline: "Navigate health questions with clarity",
    placeholder: "Describe your health question...",
    detail: "Translate symptoms, labs, and research into clear, actionable next steps. MedicalMusai weaves specialists, GP insight, and therapy context into one plan.",
  },
  therapy: {
    title: "TherapyMusai",
    tagline: "Compassionate reflection for your emotional world",
    placeholder: "How are you feeling today?",
    detail: "Move through reflection with a companion who listens for patterns, metaphors, and needs. TherapyMusai blends resonance with grounded follow-through.",
  },
  agile: {
    title: "AgileMusai",
    tagline: "Orchestrated achievement and adaptive planning",
    placeholder: "What mission should we organize?",
    detail: "Turn missions into orchestrated sprints. AgileMusai plans, reprioritizes, and keeps momentum by balancing focus with adaptive execution.",
  },
  code: {
    title: "CodeMusai",
    tagline: "Paired AI programming and development",
    placeholder: "Ask about your code...",
    detail: "Pair program with an AI that understands architecture, style, and intent. Generate, review, and refactor code with shared context in real time.",
  },
  career: {
    title: "CareerMusai",
    tagline: "Navigate direction and professional growth",
    placeholder: "What career question are we exploring?",
    detail: "Chart the next chapter of your work. CareerMusai scouts opportunities, drafts materials, and mirrors back the through-line of your story.",
  },
};

const EXPERIENCE_ACCENT: Record<DiscoverExperience, string> = {
  auto: "border-purple-500/30 focus:border-purple-500/50 focus:ring-purple-500/20",
  chat: "border-red-500/30 focus:border-red-500/50 focus:ring-red-500/20",
  search: "border-orange-500/30 focus:border-orange-500/50 focus:ring-orange-500/20",
  research: "border-amber-500/30 focus:border-amber-500/50 focus:ring-amber-500/20",
  university: "border-green-500/30 focus:border-green-500/50 focus:ring-green-500/20",
  tale: "border-blue-500/30 focus:border-blue-500/50 focus:ring-blue-500/20",
  eye: "border-cyan-500/30 focus:border-cyan-500/50 focus:ring-cyan-500/20",
  medical: "border-emerald-500/30 focus:border-emerald-500/50 focus:ring-emerald-500/20",
  therapy: "border-pink-500/30 focus:border-pink-500/50 focus:ring-pink-500/20",
  agile: "border-violet-500/30 focus:border-violet-500/50 focus:ring-violet-500/20",
  code: "border-yellow-500/30 focus:border-yellow-500/50 focus:ring-yellow-500/20",
  career: "border-indigo-500/30 focus:border-indigo-500/50 focus:ring-indigo-500/20",
};

const NAVIGATE_DELAY_MS = 320;

const Landing = () => {
  const navigate = useNavigate();
  const { createNewSession } = useChatSessions();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [message, setMessage] = useState("");
  const [activeExperience, setActiveExperience] = useState<DiscoverExperience>('auto');
  const mountedRef = useRef(true);
  // Carousel removed
  const siteMapRef = useRef<HTMLDivElement | null>(null);
  const [siteMapRevealed, setSiteMapRevealed] = useState(false);
  const featuredMiddleRef = useRef<FeaturedTile | null>(null);
  useEffect(() => () => { mountedRef.current = false; }, []);

  // Marketing/info links (used by carousel) – labels remain as-is
  type InfoLink = { label: string; icon: LucideIcon; to: string };
  const infoLinks: InfoLink[] = [
    { label: "Meet Musai", icon: MessageSquare, to: ROUTES.MEET_MUSAI },
    { label: "Find Your Muse", icon: Search, to: ROUTES.FIND_YOUR_MUSE },
    { label: "Eye of Musai", icon: Eye, to: ROUTES.EYE_OF_MUSAI },
    { label: "CodeMusai", icon: Code, to: ROUTES.CODE_MUSAI_INFO },
    { label: "Musai University", icon: GraduationCap, to: ROUTES.UNIVERSITY_INFO },
    { label: "Emergent Narrative", icon: Theater, to: ROUTES.EMERGENT_NARRATIVE },
    { label: "TherapyMusai", icon: Heart, to: ROUTES.THERAPY_MUSAI },
    { label: "MedicalMusai", icon: Stethoscope, to: ROUTES.MEDICAL_MUSAI },
    { label: "MusaiCurations", icon: Sparkles, to: ROUTES.CURATIONS_INFO },
    { label: "MusaiStudio", icon: Music, to: ROUTES.MUSAI_STUDIO_INFO },
    { label: "AgileMusai", icon: Bot, to: ROUTES.TASK_MUSAI },
    // Additional marketing/info links follow the core tool order
    { label: "Contextual Feedback Model (CFM)", icon: Brain, to: ROUTES.CFM_INFO },
    { label: "Local AI Architecture", icon: Cpu, to: ROUTES.LOCAL_AI },
    { label: "CareerMusai", icon: Target, to: ROUTES.CAREER_MUSAI },
    { label: "The Neuroscience", icon: Brain, to: ROUTES.NEUROSCIENCE },
    { label: "Roadmap", icon: Map, to: ROUTES.ROADMAP },
  ];

  // Chromatic accent system moved to IconTileList

  // Canonical module order and labels for Explore (module names)
  type CanonicalModule = { id: string; label: string; icon: LucideIcon; to: string };
  const canonicalModules: CanonicalModule[] = [
    { id: APP_TERMS.TAB_CHAT, label: 'MusaiChat', icon: MessageSquare, to: ROUTES.MEET_MUSAI },
    { id: APP_TERMS.TAB_SEARCH, label: 'MusaiSearch', icon: Search, to: ROUTES.FIND_YOUR_MUSE },
    { id: APP_TERMS.TAB_EYE, label: 'Eye of Musai', icon: Eye, to: ROUTES.EYE_OF_MUSAI },
    { id: APP_TERMS.TAB_CODE, label: 'CodeMusai', icon: Code, to: ROUTES.CODE_MUSAI_INFO },
    { id: APP_TERMS.TAB_UNIVERSITY, label: 'MusaiUniversity', icon: GraduationCap, to: ROUTES.UNIVERSITY_INFO },
    { id: APP_TERMS.TAB_NARRATIVE, label: 'MusaiTale', icon: Theater, to: ROUTES.EMERGENT_NARRATIVE },
    { id: APP_TERMS.TAB_MEDICAL, label: 'MedicalMusai', icon: Stethoscope, to: ROUTES.MEDICAL_MUSAI },
    { id: APP_TERMS.TAB_THERAPY, label: 'TherapyMusai', icon: Heart, to: ROUTES.THERAPY_MUSAI },
    { id: 'curations', label: 'MusaiCurations', icon: Sparkles, to: ROUTES.CURATIONS_INFO },
    { id: APP_TERMS.TAB_CAREER, label: 'CareerMusai', icon: Target, to: ROUTES.CAREER_MUSAI },
    { id: 'studio', label: 'MusaiStudio', icon: Music, to: ROUTES.MUSAI_STUDIO_INFO },
    { id: APP_TERMS.TAB_TASK, label: 'AgileMusai', icon: Bot, to: ROUTES.TASK_MUSAI },
  ].sort((a, b) => CANONICAL_TOOL_ORDER.indexOf(a.id) - CANONICAL_TOOL_ORDER.indexOf(b.id));

  // Prepare sets for splitting Explore into modules vs supporting
  const moduleRouteSet = new Set<string>(canonicalModules.map(m => m.to as string));
  const moduleLinks = infoLinks.filter((l) => moduleRouteSet.has(l.to as string));
  const supportingLinks = infoLinks.filter((l) => !moduleRouteSet.has(l.to as string));
  // Explicit supporting order: CFM → Local AI → Roadmap (trim others)
  const supportingLinksOrdered: IconTileItem[] = [
    { to: ROUTES.NEUROSCIENCE, label: 'The Neuroscience', Icon: Brain },
    { to: ROUTES.CFM_INFO, label: 'Contextual Feedback Model (CFM)', Icon: Brain },
    { to: ROUTES.LOCAL_AI, label: 'Local AI Architecture', Icon: Cpu },
    { to: ROUTES.ROADMAP, label: 'Roadmap', Icon: Map },
  ].filter((item): item is IconTileItem => supportingLinks.some(l => l.to === item.to));

  // Carousel: keep marketing labels but enforce canonical ordering
  const carouselExclusions = new Set<string>([
    ROUTES.CODE_MUSAI_INFO,
    ROUTES.EMERGENT_NARRATIVE,
    ROUTES.CURATIONS_INFO,
    ROUTES.CAREER_MUSAI,
  ]);

  const primaryCarouselLinks = moduleLinks
    .filter(l => !carouselExclusions.has(l.to as string))
    .slice()
    .sort((a, b) => {
      const idFor = (to: string): string => {
        switch (to) {
          case ROUTES.MEET_MUSAI: return APP_TERMS.TAB_CHAT;
          case ROUTES.FIND_YOUR_MUSE: return APP_TERMS.TAB_SEARCH;
          case ROUTES.EYE_OF_MUSAI: return APP_TERMS.TAB_EYE;
          case ROUTES.CODE_MUSAI_INFO: return APP_TERMS.TAB_CODE;
          case ROUTES.UNIVERSITY_INFO: return APP_TERMS.TAB_UNIVERSITY;
          case ROUTES.EMERGENT_NARRATIVE: return APP_TERMS.TAB_NARRATIVE;
          case ROUTES.MEDICAL_MUSAI: return APP_TERMS.TAB_MEDICAL;
          case ROUTES.THERAPY_MUSAI: return APP_TERMS.TAB_THERAPY;
          case ROUTES.CURATIONS_INFO: return 'curations';
          case ROUTES.MUSAI_STUDIO_INFO: return 'studio';
          case ROUTES.CAREER_MUSAI: return APP_TERMS.TAB_CAREER;
          case ROUTES.TASK_MUSAI: return APP_TERMS.TAB_TASK;
          default: return 'zz';
        }
      };
      return CANONICAL_TOOL_ORDER.indexOf(idFor(a.to as string)) - CANONICAL_TOOL_ORDER.indexOf(idFor(b.to as string));
    });

  // Explore tiles use module names in canonical order (4 columns at lg via IconTileList default)

  // Disable autoplay; clicks will advance one full item

  const handleStartNewChat = async (initialMessage?: string, onNavigate?: () => void) => {
    setIsAnimating(true);
    // Create a new session
    const sessionId = createNewSession();
    
    // If session creation failed due to limit, don't navigate
    if (!sessionId) {
      setIsAnimating(false);
      if (mountedRef.current)
      {
        setIsDiscovering(false);
      }
      return;
    }
    
    // Add a small delay for the animation effect
    navigateAfterDelay(() => {
      navigate(ROUTES.MAIN_APP, { 
        state: { 
          newSession: true,
          initialMessage: initialMessage 
        } 
      });
      onNavigate?.();
    });
  };

  const navigateAfterDelay = (fn: () => void) => {
    setTimeout(() => {
      fn();
      if (mountedRef.current)
      {
        setIsDiscovering(false);
      }
    }, NAVIGATE_DELAY_MS);
  };

  const rememberDiscovery = (module: MusaiDiscoverModule, query: string) => {
    try
    {
      sessionStorage.setItem('musai-discover-payload', JSON.stringify({ module, query }));
    }
    catch
    {
      // ignore storage errors
    }
  };

  const routeToModule = (module: MusaiDiscoverModule, messageText: string) => {
    const trimmed = messageText.trim();
    if (!trimmed)
    {
      return;
    }

    rememberDiscovery(module, trimmed);

    switch (module)
    {
      case 'chat':
        handleStartNewChat(trimmed);
        return;
      case 'search':
        navigateAfterDelay(() => {
          navigate(RouteUtils.mainAppWithMode('search', trimmed), {
            state: { switchToTab: APP_TERMS.TAB_SEARCH, initialQuery: trimmed },
          });
        });
        return;
      case 'research':
        navigateAfterDelay(() => {
          navigate(RouteUtils.mainAppWithMode('search', trimmed), {
            state: { switchToTab: APP_TERMS.TAB_SEARCH, initialQuery: trimmed, searchMode: 'research' },
          });
        });
        return;
      case 'university':
        navigateAfterDelay(() => {
          navigate(RouteUtils.mainAppWithMode('university', trimmed), {
            state: { switchToTab: APP_TERMS.TAB_UNIVERSITY, initialQuery: trimmed },
          });
        });
        return;
      case 'tale':
        navigateAfterDelay(() => {
          navigate(RouteUtils.mainAppWithMode('narrative', trimmed), {
            state: { switchToTab: APP_TERMS.TAB_NARRATIVE, initialQuery: trimmed },
          });
        });
        return;
      case 'eye':
        navigateAfterDelay(() => {
          navigate(RouteUtils.mainAppWithMode('eye', trimmed), {
            state: { switchToTab: APP_TERMS.TAB_EYE, initialQuery: trimmed },
          });
        });
        return;
      case 'medical':
        navigateAfterDelay(() => {
          navigate(RouteUtils.mainAppWithMode('medical', trimmed), {
            state: { switchToTab: APP_TERMS.TAB_MEDICAL, initialQuery: trimmed },
          });
        });
        return;
      case 'therapy':
        navigateAfterDelay(() => {
          navigate(RouteUtils.mainAppWithMode('therapy', trimmed), {
            state: { switchToTab: APP_TERMS.TAB_THERAPY, initialQuery: trimmed },
          });
        });
        return;
      case 'agile':
        navigateAfterDelay(() => {
          navigate(ROUTES.TASK_MUSAI_CONSOLE, {
            state: { initialRequest: trimmed },
          });
        });
        return;
      case 'code':
        navigateAfterDelay(() => {
          navigate(RouteUtils.mainAppWithMode('code', trimmed), {
            state: { switchToTab: APP_TERMS.TAB_CODE, initialQuery: trimmed },
          });
        });
        return;
      case 'career':
        navigateAfterDelay(() => {
          navigate(RouteUtils.mainAppWithMode('career', trimmed), {
            state: { switchToTab: APP_TERMS.TAB_CAREER, initialQuery: trimmed },
          });
        });
        return;
      default:
        handleStartNewChat(trimmed);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();

    if (!trimmed || isDiscovering)
    {
      return;
    }

    setIsAnimating(true);
    setIsDiscovering(true);

    try
    {
      const module = await discoverMusaiModule(trimmed);
      setActiveExperience(module);
      routeToModule(module, trimmed);
    }
    catch
    {
      setActiveExperience('chat');
      routeToModule('chat', trimmed);
    }
    finally
    {
      setMessage('');
    }
  };

  const hero = HERO_CONTENT[activeExperience];
  const inputAccentClass = `${EXPERIENCE_ACCENT[activeExperience]} mystical-glow`;

  return (
    <>
      <div className={`min-h-[100svh] bg-background flex items-center justify-center p-4 relative overflow-x-hidden ${siteMapRevealed ? 'overflow-y-auto' : 'overflow-y-hidden'}`}>
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />
      
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-300/20 rounded-full blur-3xl animate-pulse delay-1000" aria-hidden="true" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-orange-400/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto pt-10 sm:pt-12 md:pt-16">
        {/* Hero Section */}
        <div className="mb-8 slide-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-36 h-36 sm:w-52 sm:h-52 md:w-60 md:h-60 flex items-center justify-center aspect-square">
                <MusaiLifeLogo 
                  size="4xl" 
                  isDarkMode={false} 
                  noShimmer={true}
                  className="border-0 w-full h-full"
                  onClick={() => navigate(ROUTES.CURATIONS)}
                />
              </div>
              <div className="absolute -inset-1.5 sm:-inset-2 bg-gradient-to-br from-purple-500 to-orange-500 rounded-full opacity-15 blur-[2px]" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent">
            {hero.title}
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {hero.tagline}
          </p>

          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {hero.detail}
          </p>
        </div>

        {/* Message Input Form */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8 slide-in-up" style={{ animationDelay: '0.4s' }}>
          <form onSubmit={handleSendMessage} className="flex w-full max-w-md gap-2">
            <Input
              type="text"
              placeholder={hero.placeholder}
              value={message}
              onChange={(e) => {
                const value = e.target.value;
                setMessage(value);
                if (value.trim().length === 0 && !isDiscovering)
                {
                  setActiveExperience('auto');
                }
              }}
              disabled={isAnimating || isDiscovering}
              className={`flex-1 px-4 py-3 text-lg rounded-xl border-2 focus:ring-2 transition-all duration-300 ${inputAccentClass}`}
            />
            <Button
              type="submit"
              disabled={isAnimating || isDiscovering}
              className="group relative overflow-hidden bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </form>

            {/* Enter App and History buttons removed per request. Sending with empty input now navigates into the app's module without starting chat. */}
        </div>

        {/* Featured quick links (replaces carousel) */}
        <div className="pt-8 slide-in-up" style={{ animationDelay: '0.6s' }}>
          {(() => {
            const middleOptions: FeaturedTile[] = [
              { label: 'AgileMusai', to: ROUTES.TASK_MUSAI, Icon: Bot },
              { label: 'MedicalMusai', to: ROUTES.MEDICAL_MUSAI, Icon: Stethoscope },
              { label: 'TherapyMusai', to: ROUTES.THERAPY_MUSAI, Icon: Heart },
            ];
            if (!featuredMiddleRef.current)
            {
              featuredMiddleRef.current = middleOptions[Math.floor(Math.random() * middleOptions.length)];
            }
            const selectedMiddle = featuredMiddleRef.current;
            const featured: FeaturedTile[] = [
              { label: 'Meet Musai', to: ROUTES.MEET_MUSAI, Icon: MessageSquare },
              selectedMiddle,
              { label: 'The Neuroscience', to: ROUTES.NEUROSCIENCE, Icon: Brain },
            ];
            const toneIdx = computeToneIndices(featured.length, MUSAI_CHROMATIC_12.length);
            return (
              <div className="mx-auto max-w-5xl px-2 sm:px-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  {featured.map((item, i) => {
                    const idx = toneIdx[i] ?? 0;
                    const tone = getToneByIndex(idx);
                    const { previous, next } = getNeighborTones(idx);
                    const isDual = isDualValenceIndex(idx);
                    const border = isDual
                      ? `linear-gradient(90deg, ${hexToRgba(previous.hex, 0.12)}, ${hexToRgba(next.hex, 0.12)})`
                      : hexToRgba(tone.hex, 0.12);
                    const IconComp = item.Icon;
                    return (
                      <div key={item.label} className="rounded-lg p-px w-full overflow-hidden" style={{ background: border }}>
                        <Button
                          variant="outline"
                          className="justify-start h-[48px] px-4 text-left whitespace-nowrap text-sm w-full rounded-lg border-0 bg-background/70 md:bg-background/60"
                          onClick={() => navigate(item.to)}
                          aria-label={item.label}
                        >
                          <IconComp className="w-4 h-4 mr-2 opacity-90" style={{ color: hexToRgba(tone.hex, 0.7) }} />
                          <span className="font-medium leading-snug truncate">{item.label}</span>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Reveal Section CTA: Roadmap + Explore */}
        {!siteMapRevealed && (
          <div className="pt-10 pb-16 flex justify-center gap-3">
            <Button variant="outline" onClick={() => {
              setSiteMapRevealed(true);
              setTimeout(() => siteMapRef.current?.scrollIntoView({ behavior: 'smooth' }), 150);
            }} className="rounded-xl border-2">
              Explore more <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                navigate(ROUTES.ROADMAP);
              }}
              className="rounded-xl border-2"
            >
              Roadmap
            </Button>
          </div>
        )}

        {/* Flat Site Map / Quick Navigation */}
        <div className={`relative overflow-hidden transition-all duration-500 ${siteMapRevealed ? 'pt-12 pb-20' : 'pt-12 pb-10'}`}>
          {/* Subtle resistance veil */}
          <div className="pointer-events-none absolute -top-8 left-0 right-0 h-16 bg-gradient-to-b from-background via-background/80 to-transparent" />
          <div
            ref={siteMapRef}
            className={`max-w-5xl md:max-w-6xl mx-auto transition-all duration-700 ease-out origin-top overflow-hidden ${
              siteMapRevealed
                ? "opacity-100 translate-y-0 max-h-[1600px]"
                : "opacity-0 -translate-y-4 pointer-events-none select-none max-h-0"
            }`}
          >
            {/* Tabs: Explore | Roadmap */}
            <div className="flex justify-center mb-6 gap-2">
              <input type="radio" name="landing-tabs" id="tab-explore" defaultChecked className="hidden peer/explore" />
              <input type="radio" name="landing-tabs" id="tab-roadmap" className="hidden peer/roadmap" />
              <button onClick={() => {
                const explore = document.getElementById('tab-explore') as HTMLInputElement | null;
                const roadmap = document.getElementById('tab-roadmap') as HTMLInputElement | null;
                if (explore) explore.checked = true;
                if (roadmap) roadmap.checked = false;
              }} className="px-3 py-1.5 rounded-full border text-sm" id="explore-tab-btn">Explore</button>
              <button onClick={() => {
                const explore = document.getElementById('tab-explore') as HTMLInputElement | null;
                const roadmap = document.getElementById('tab-roadmap') as HTMLInputElement | null;
                if (roadmap) roadmap.checked = true;
                if (explore) explore.checked = false;
              }} className="px-3 py-1.5 rounded-full border text-sm" id="roadmap-tab-btn">Roadmap</button>
            </div>

            {/* Explore Panel */}
            <div className="peer-checked/explore:block peer-checked/roadmap:hidden block">
              <div className="text-center mb-6">
                <h2 className="text-2xl md:text-3xl font-bold">What is Musai?</h2>
                <p className="text-muted-foreground mt-2">Musai is a creative–technical framework for exploring AI as both code and companion. It’s built as a flat, skimmable map: main modules first, then supporting pages. Part toolset, part philosophy, it’s designed to help ideas flow between logic and imagination.</p>
              </div>
              <div className="mb-6 px-4">
                <h3 className="text-lg font-semibold mb-3">Modules</h3>
                <IconTileList items={moduleLinks.map(l => ({ to: l.to, label: l.label, Icon: l.icon }))} minItemHeight={64} />
              </div>
              <div className="px-4">
                <h3 className="text-lg font-semibold mb-3">Supporting</h3>
                <IconTileList
                  items={supportingLinksOrdered}
                  minItemHeight={72}
                  gridClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                />
              </div>
            </div>

            {/* Roadmap Panel (summary) */}
            <div className="peer-checked/roadmap:block peer-checked/explore:hidden hidden">
              <div className="text-center mb-6">
                <h2 className="text-2xl md:text-3xl font-bold">Roadmap</h2>
                <p className="text-muted-foreground mt-2">High‑level status and the latest updates. Full page has more detail and raw JSON.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <div className="font-medium mb-2">Latest updates</div>
                  <ul className="text-sm text-muted-foreground list-disc ml-5 space-y-1">
                    <li>MusaiCurations + MusaiStudio info pages landed</li>
                    <li>Explore carousel and site map refined</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <div className="font-medium mb-2">Near‑term items</div>
                  <ul className="text-sm text-muted-foreground list-disc ml-5 space-y-1">
                    <li>Taste Tuning overlay (Curations)</li>
                    <li>“Why this?” explainer per card</li>
                  </ul>
                </div>
              </div>
              <div className="text-center mt-6">
                <Button variant="outline" onClick={() => navigate(ROUTES.ROADMAP)}>Open full roadmap</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Subtle Animation Elements */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-500/30 rounded-full animate-pulse" />
        <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-orange-500/30 rounded-full animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-purple-500/20 rounded-full animate-pulse delay-2000" />
      </div>
      </div>

      {isDiscovering && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-background/80 backdrop-blur-sm" aria-live="assertive">
          <div className="relative w-32 h-32 flex items-center justify-center" role="status">
            <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-mystic-orbit" />
            <div className="absolute inset-3 rounded-full border border-orange-400/30 animate-mystic-trace" />
            <div className="absolute w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 via-indigo-400/20 to-orange-400/30 blur-xl" />
            <div className="relative flex flex-col items-center text-sm font-medium text-purple-900 dark:text-purple-100 gap-2 w-24 text-center">
              <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground leading-tight">Musai is aligning</span>
              <div className="h-3 w-full overflow-hidden rounded-full bg-white/20 dark:bg-white/10">
                <div className="h-full w-full animate-mystic-sheen bg-gradient-to-r from-purple-500/20 via-orange-500/40 to-purple-500/20" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Landing;
