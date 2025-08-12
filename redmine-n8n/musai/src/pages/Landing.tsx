import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Send, History, Sparkles, ExternalLink, User, Brain, Check, MessageSquare, Theater, GraduationCap, Search, Bot, ChevronDown, Cpu, Code, Eye, Target, Heart, Stethoscope, Music, Map } from "lucide-react";
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
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { IconTileList } from "@/components/common/IconTileList";

const Landing = () => {
  const navigate = useNavigate();
  const { createNewSession, sessions } = useChatSessions();
  const [isAnimating, setIsAnimating] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedMode, setSelectedMode] = useState("auto");
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const siteMapRef = useRef<HTMLDivElement | null>(null);
  const [siteMapRevealed, setSiteMapRevealed] = useState(false);

  // Marketing/info links (used by carousel) – labels remain as-is
  const infoLinks = [
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
    { label: "Local AI Architecture", icon: Cpu, to: ROUTES.LOCAL_AI },
    { label: "CareerMusai", icon: Target, to: ROUTES.CAREER_MUSAI },
    { label: "The Neuroscience", icon: Brain, to: ROUTES.NEUROSCIENCE },
    { label: "Musai x RoverByte Integration", icon: ExternalLink, to: ROUTES.ROVERBYTE },
    { label: "Roadmap", icon: Map, to: ROUTES.ROADMAP },
  ];

  // Chromatic accent system moved to IconTileList

  // Canonical module order and labels for Explore (module names), omit Eye here
  const canonicalModules = [
    { id: APP_TERMS.TAB_CHAT, label: 'MusaiChat', icon: MessageSquare, to: ROUTES.MEET_MUSAI },
    { id: APP_TERMS.TAB_SEARCH, label: 'MusaiSearch', icon: Search, to: ROUTES.FIND_YOUR_MUSE },
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

  // Carousel: keep marketing labels but enforce canonical ordering
  const primaryCarouselLinks = moduleLinks
    .slice()
    .sort((a, b) => {
      const idFor = (to: string): string => {
        switch (to) {
          case ROUTES.MEET_MUSAI: return APP_TERMS.TAB_CHAT;
          case ROUTES.FIND_YOUR_MUSE: return APP_TERMS.TAB_SEARCH;
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

  // Optional: if user scrolls past a bit, auto‑reveal site map
  useEffect(() => {
    const onScroll = () => {
      if (siteMapRevealed) return;
      const scrolled = window.scrollY || document.documentElement.scrollTop;
      if (scrolled > window.innerHeight * 0.9) {
        setSiteMapRevealed(true);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [siteMapRevealed]);

  // Disable autoplay; clicks will advance one full item

  const modeOptions = [
    { id: "auto", icon: Sparkles, label: "Auto", description: "Let AI decide" },
    { id: "chat", icon: MessageSquare, label: "Chat", description: "Conversation" },
    { id: "search", icon: Search, label: "Search", description: "Intelligent Discovery" },
    { id: "code", icon: Code, label: "Code", description: "Paired AI Programming" },
    { id: "university", icon: GraduationCap, label: "University", description: "Generative Learning" },
    { id: "emergent-narrative", icon: Theater, label: APP_TERMS.NAV_NARRATIVE, description: "Where thoughts become stories" },
    { id: "task", icon: Bot, label: "Task", description: "Orchestrated Achievement" },
  ];

  // Get the current mode data
  const selectedModeData = modeOptions.find(mode => mode.id === selectedMode) || modeOptions[0];

  // Always show the type selector, but with different options based on mode
  const shouldShowTypeSelector = true;

  // Always show the same options in the same order
  const getModeOptions = () => {
    return modeOptions; // Always return all options in the same order
  };

  const handleStartNewChat = async (initialMessage?: string) => {
    setIsAnimating(true);
    // Create a new session
    const sessionId = createNewSession();
    
    // If session creation failed due to limit, don't navigate
    if (!sessionId) {
      setIsAnimating(false);
      return;
    }
    
    // Add a small delay for the animation effect
    setTimeout(() => {
              navigate(ROUTES.MAIN_APP, { 
        state: { 
          newSession: true,
          initialMessage: initialMessage 
        } 
      });
    }, 300);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    handleMessageWithMode(message.trim(), selectedMode);
  };

  const handleMessageWithMode = (messageText: string, mode: string) => {
    setIsAnimating(true);
    
    // Route based on selected mode
    setTimeout(() => {
      switch (mode) {
        case "auto":
          // Auto defaults to Search within the main app (passes through RiddleGate)
          navigate(RouteUtils.mainAppWithMode("search", messageText), { 
            state: { switchToTab: APP_TERMS.TAB_SEARCH, initialQuery: messageText } 
          });
          break;
        case "chat":
          handleStartNewChat(messageText);
          break;
        case "search":
          // Add URL parameter as backup for refresh handling
          navigate(RouteUtils.mainAppWithMode("search", messageText), { 
            state: { switchToTab: APP_TERMS.TAB_SEARCH, initialQuery: messageText } 
          });
          break;
        case "code":
          // Add URL parameter as backup for refresh handling
          navigate(RouteUtils.mainAppWithMode("code", messageText), { 
            state: { switchToTab: "code-musai", initialQuery: messageText } 
          });
          break;
        case "university":
          // Add URL parameter as backup for refresh handling
          navigate(RouteUtils.mainAppWithMode("university", messageText), { 
            state: { switchToTab: APP_TERMS.TAB_UNIVERSITY, initialQuery: messageText } 
          });
          break;
        case "emergent-narrative":
          // Add URL parameter as backup for refresh handling
          navigate(RouteUtils.mainAppWithMode("narrative", messageText), { 
            state: { switchToTab: "emergent-narrative", initialQuery: messageText } 
          });
          break;
        case "task":
          // Add URL parameter as backup for refresh handling
          navigate(RouteUtils.mainAppWithMode("task", messageText), { 
            state: { switchToTab: "task-musai", initialQuery: messageText } 
          });
          break;
        default:
          handleStartNewChat(messageText);
      }
    }, 300);
  };

  const handleViewPastChats = () => {
    setIsAnimating(true);
    setTimeout(() => {
      navigate(ROUTES.MAIN_APP, { state: { viewPastChats: true } });
    }, 300);
  };

  const hasPastChats = sessions.length > 0;

  const tileButtonClass = `
    relative z-10 w-full px-4 py-3 text-sm sm:text-base font-medium rounded-xl border-0
    transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] hover:shadow-sm
    bg-background/90 md:bg-background/70 md:backdrop-blur supports-[backdrop-filter]:md:bg-background/60
    text-[hsl(var(--foreground))] min-h-[48px] leading-tight
    flex items-center justify-start touch-manipulation
  `;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
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
            {selectedMode === "auto" ? "Musai" :
             selectedMode === "chat" ? "MusaiChat" :
             selectedMode === "search" ? "MusaiSearch" :
             selectedMode === "code" ? "CodeMusai" :
             selectedMode === "university" ? "Musai U" :
             selectedMode === "emergent-narrative" ? "MusaiTale" :
             selectedMode === "task" ? "AgileMusai" :
             "MusaiChat"}
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {selectedMode === "auto" ? "Reflective AI for Recursive Minds" :
             selectedMode === "chat" ? "Start a natural conversation with your AI assistant" :
             selectedMode === "search" ? "Intelligent discovery and exploration" :
             selectedMode === "code" ? "Paired AI programming and development" :
             selectedMode === "university" ? "Generative learning and knowledge creation" :
             selectedMode === "emergent-narrative" ? "Story emergence and perspective thinking" :
             selectedMode === "task" ? "Orchestrated achievement and task management" :
             "Reflective AI for Recursive Minds"}
          </p>
          
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {selectedMode === "auto" ? 
              "Experience the world's first agentic AI mind that grows over time through memory, feedback, and self-refinement. Musai doesn't just answer questions—it develops a sense of who you are, and a working model of who it is becoming." :
             selectedMode === "chat" ? 
              "Start a natural conversation with your AI assistant. Ask questions, brainstorm ideas, or just chat. Musai learns from every interaction to better understand your needs." :
             selectedMode === "search" ? 
              "Discover intelligent insights through advanced search capabilities. Find answers, explore topics, and uncover connections you might have missed." :
             selectedMode === "code" ? 
              "Get paired programming assistance with AI that understands your codebase. Debug, optimize, and build better software together." :
             selectedMode === "university" ? 
              "Learn and grow with AI-powered education. Create courses, explore topics, and develop knowledge through interactive learning experiences." :
             selectedMode === "emergent-narrative" ? 
              "Explore story emergence and perspective thinking. Let AI help you craft narratives and discover new ways of seeing the world." :
             selectedMode === "task" ? 
              "Achieve your goals with orchestrated task management. Break down complex projects and track progress with AI assistance." :
              "Experience the world's first agentic AI mind that grows over time through memory, feedback, and self-refinement. Musai doesn't just answer questions—it develops a sense of who you are, and a working model of who it is becoming."
            }
          </p>
        </div>

        {/* Message Input Form */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8 slide-in-up" style={{ animationDelay: '0.4s' }}>
          <form onSubmit={handleSendMessage} className="flex w-full max-w-md gap-2">
            {/* Mode Selector Dropdown - only show for auto mode */}
            {shouldShowTypeSelector && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex items-center gap-2 px-3 py-3 h-auto rounded-xl border-2 border-purple-500/30 hover:border-purple-500/50 transition-all duration-300"
                    disabled={isAnimating}
                  >
                    {(() => {
                      const SelectedIcon = selectedModeData.icon;
                      return <SelectedIcon className="w-5 h-5" />;
                    })()}
                    <ChevronDown className="w-4 h-4 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-48">
                {getModeOptions().map((mode) => {
                  const Icon = mode.icon;
                  const isComingSoon = mode.id === "emergent-narrative" || mode.id === "agents";
                  return (
                    <DropdownMenuItem
                      key={mode.id}
                      onClick={() => setSelectedMode(mode.id)}
                      className={`flex items-center gap-3 p-3 cursor-pointer ${
                        selectedMode === mode.id ? "bg-purple-500/10" : ""
                      } ${isComingSoon ? "opacity-60" : ""}`}
                    >
                      <Icon className="w-4 h-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">{mode.label}</span>
                        <span className="text-xs text-muted-foreground">{mode.description}</span>
                      </div>
                      {isComingSoon && (
                        <span className="ml-auto text-xs text-yellow-600 dark:text-yellow-400">Soon</span>
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Input
              type="text"
              placeholder={
                selectedMode === "auto" ? "Start a new conversation..." :
                selectedMode === "chat" ? "What's on your mind?" :
                selectedMode === "search" ? "Search for anything..." :
                selectedMode === "code" ? "Ask about your code..." :
                selectedMode === "university" ? "What would you like to learn?" :
                selectedMode === "emergent-narrative" ? "Tell me a story..." :
                selectedMode === "task" ? "What task can I help with?" :
                "Start a new conversation..."
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isAnimating}
              className={`flex-1 px-4 py-3 text-lg rounded-xl border-2 focus:ring-2 transition-all duration-300 ${
                selectedMode === "auto" ? "border-purple-500/30 focus:border-purple-500/50 focus:ring-purple-500/20 mystical-glow" :
                selectedMode === "chat" ? "border-red-500/30 focus:border-red-500/50 focus:ring-red-500/20 mystical-glow" :
                selectedMode === "search" ? "border-orange-500/30 focus:border-orange-500/50 focus:ring-orange-500/20 mystical-glow" :
                selectedMode === "code" ? "border-yellow-500/30 focus:border-yellow-500/50 focus:ring-yellow-500/20 mystical-glow" :
                selectedMode === "university" ? "border-green-500/30 focus:border-green-500/50 focus:ring-green-500/20 mystical-glow" :
                selectedMode === "emergent-narrative" ? "border-blue-500/30 focus:border-blue-500/50 focus:ring-blue-500/20 mystical-glow" :
                selectedMode === "task" ? "border-violet-500/30 focus:border-violet-500/50 focus:ring-violet-500/20 mystical-glow" :
                "border-purple-500/30 focus:border-purple-500/50 focus:ring-purple-500/20 mystical-glow"
              }`}
            />
            <Button
              type="submit"
              disabled={isAnimating}
              className="group relative overflow-hidden bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </form>

            {/* Enter App and History buttons removed per request. Sending with empty input now navigates into the app's module without starting chat. */}
        </div>

        {/* Minimalist Info Carousel */}
        <div className="pt-8 slide-in-up" style={{ animationDelay: '0.6s' }}>
          <div className="relative mx-auto max-w-5xl">
            <Carousel
              className="px-2 sm:px-4"
              setApi={setCarouselApi}
              opts={{ align: 'start', loop: true, slidesToScroll: 1, watchDrag: true, containScroll: 'trimSnaps' as any, duration: 10 }}
              style={{ paddingLeft: "max(env(safe-area-inset-left), 16px)", paddingRight: "max(env(safe-area-inset-right), 16px)" }}
            >
              <CarouselContent className="gap-2 sm:gap-3">
                {(() => {
                  const links = primaryCarouselLinks;
                  const toneIdx = computeToneIndices(links.length, MUSAI_CHROMATIC_12.length);
                  return links.map((link, i) => { 
                    const idx = toneIdx[i] ?? 0;
                    const tone = getToneByIndex(idx);
                    const { previous, next } = getNeighborTones(idx);
                    const isDual = isDualValenceIndex(idx);
                    const border = isDual
                      ? `linear-gradient(90deg, ${hexToRgba(previous.hex, 0.12)}, ${hexToRgba(next.hex, 0.12)})`
                      : hexToRgba(tone.hex, 0.12);
                    const IconComp = link.icon as any;
                    return (
                      <CarouselItem key={link.label} className="basis-full sm:basis-1/2 md:basis-1/3 flex-none">
                        <div className="rounded-lg p-px w-full overflow-hidden" style={{ background: border }}>
                          <Button
                            variant="outline"
                            className="justify-start h-[48px] px-4 text-left whitespace-nowrap text-sm w-full rounded-lg border-0 bg-background/70 md:bg-background/60"
                            onClick={() => navigate(link.to as string)}
                            aria-label={link.label}
                          >
                            <IconComp className="w-4 h-4 mr-2 opacity-90" style={{ color: hexToRgba(tone.hex, 0.7) }} />
                            <span className="font-medium leading-snug truncate">{link.label}</span>
                          </Button>
                        </div>
                      </CarouselItem>
                    );
                  });
                })()}
              </CarouselContent>
              <CarouselPrevious className="-left-1 sm:left-0 border-0 bg-gradient-to-r from-background/90 to-transparent hover:from-background/95 text-muted-foreground" />
              <CarouselNext className="-right-1 sm:right-0 border-0 bg-gradient-to-l from-background/90 to-transparent hover:from-background/95 text-muted-foreground" />
            </Carousel>
          </div>
        </div>

        {/* Reveal Section CTA: Roadmap + Explore */}
        {!siteMapRevealed && (
          <div className="pt-10 pb-16 flex justify-center gap-3">
            <Button variant="outline" onClick={() => {
              setSiteMapRevealed(true);
              setTimeout(() => siteMapRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
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
          <div className="pt-14 pb-20 relative overflow-hidden">
          {/* Subtle resistance veil */}
          <div className="pointer-events-none absolute -top-8 left-0 right-0 h-16 bg-gradient-to-b from-background via-background/80 to-transparent" />
          <div
            ref={siteMapRef}
            className={`max-w-5xl md:max-w-6xl mx-auto transition-all duration-700 ease-out ${
              siteMapRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none select-none"
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
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Modules</h3>
                <IconTileList items={moduleLinks.map(l => ({ to: l.to, label: l.label, Icon: l.icon as any }))} minItemHeight={60} />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Supporting</h3>
                <IconTileList items={supportingLinks.map(l => ({ to: l.to, label: l.label, Icon: l.icon as any }))} minItemHeight={60} />
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
  );
};

export default Landing;