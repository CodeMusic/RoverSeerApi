import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Send, History, Sparkles, ExternalLink, User, Brain, Check, MessageSquare, Theater, GraduationCap, Search, Bot, ChevronDown, Cpu, Code, Eye, Target, Heart, Stethoscope } from "lucide-react";
import { useChatSessions } from "@/hooks/useChatSessions";
import { MusaiLifeLogo } from "@/components/effects/MusaiEffects";
import ROUTES, { RouteUtils } from "@/config/routes";
import { APP_TERMS, MUSAI_CHROMATIC_12 } from "@/config/constants";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";

const Landing = () => {
  const navigate = useNavigate();
  const { createNewSession, sessions } = useChatSessions();
  const [isAnimating, setIsAnimating] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedMode, setSelectedMode] = useState("auto");
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const autoplayRef = useRef<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const siteMapRef = useRef<HTMLDivElement | null>(null);
  const [siteMapRevealed, setSiteMapRevealed] = useState(false);

  // Minimal links to cycle through
  // Order mirrors the main tool order: Chat, Search, Eye, Code, University, Narrative, Therapy, Medical, Task
  const infoLinks = [
    { label: "Meet Musai", icon: MessageSquare, to: ROUTES.MEET_MUSAI },
    { label: "Find Your Muse", icon: Search, to: ROUTES.FIND_YOUR_MUSE },
    { label: "Eye of Musai", icon: Eye, to: ROUTES.EYE_OF_MUSAI },
    { label: "CodeMusai", icon: Code, to: ROUTES.CODE_MUSAI_INFO },
    { label: "Musai University", icon: GraduationCap, to: ROUTES.UNIVERSITY_INFO },
    { label: "Emergent Narrative", icon: Theater, to: ROUTES.EMERGENT_NARRATIVE },
    { label: "TherapyMusai", icon: Heart, to: ROUTES.THERAPY_MUSAI },
    { label: "MedicalMusai", icon: Stethoscope, to: ROUTES.MEDICAL_MUSAI },
    { label: "TaskMusai", icon: Bot, to: ROUTES.TASK_MUSAI },
    // Additional marketing/info links follow the core tool order
    { label: "Local AI Architecture", icon: Cpu, to: ROUTES.LOCAL_AI },
    { label: "CareerMusai", icon: Target, to: ROUTES.CAREER_MUSAI },
    { label: "The Neuroscience", icon: Brain, to: ROUTES.NEUROSCIENCE },
    { label: "Musai x RoverByte Integration", icon: ExternalLink, to: ROUTES.ROVERBYTE },
  ];

  // Chromatic accent system for lists: map first to red and last to violet (12-tone scale)
  function computeToneIndices(count: number): number[]
  {
    if (count <= 1)
    {
      return [0];
    }

    // Special handcrafted mapping for 10 items: red, red-orange, orange, orange-yellow, yellow, green, green/blue, blue, indigo, violet
    if (count === 10)
    {
      return [0, 1, 2, 3, 4, 6, 7, 8, 9, 11];
    }

    const indices: number[] = [];
    const last = MUSAI_CHROMATIC_12.length - 1; // 11
    let prev = -1;
    for (let i = 0; i < count; i++)
    {
      const raw = Math.round((i * last) / (count - 1));
      const idx = Math.min(last, Math.max(prev + 1, raw));
      indices.push(idx);
      prev = idx;
    }
    return indices;
  }

  function hexToRgbTriplet(hex: string): [number, number, number]
  {
    const normalized = hex.replace('#', '');
    const value = parseInt(normalized.length === 3
      ? normalized.split('').map((c) => c + c).join('')
      : normalized, 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return [r, g, b];
  }

  function rgbaFromHex(hex: string, alpha: number): string
  {
    const [r, g, b] = hexToRgbTriplet(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function getGradientForIndex(index: number): string | null
  {
    // Define dual-color steps relative to neighbors
    const neighbor = (i: number) => MUSAI_CHROMATIC_12[Math.min(MUSAI_CHROMATIC_12.length - 1, Math.max(0, i))].hex;
    if (index === 1)
    {
      return `linear-gradient(90deg, ${rgbaFromHex(neighbor(0), 0.18)}, ${rgbaFromHex(neighbor(2), 0.18)})`;
    }
    if (index === 3)
    {
      return `linear-gradient(90deg, ${rgbaFromHex(neighbor(2), 0.18)}, ${rgbaFromHex(neighbor(4), 0.18)})`;
    }
    if (index === 7)
    {
      return `linear-gradient(90deg, ${rgbaFromHex(neighbor(6), 0.18)}, ${rgbaFromHex(neighbor(8), 0.18)})`;
    }
    if (index === 10)
    {
      return `linear-gradient(90deg, ${rgbaFromHex(neighbor(9), 0.18)}, ${rgbaFromHex(neighbor(11), 0.18)})`;
    }
    return null;
  }

  function buildAccentForList(length: number)
  {
    const toneIdx = computeToneIndices(length);
    return toneIdx.map((idx) =>
    {
      const tone = MUSAI_CHROMATIC_12[idx];
      const gradient = getGradientForIndex(idx);
      // Subtlety: reduce alpha for single tones too
      const borderStyle = gradient || rgbaFromHex(tone.hex, 0.18);
      // Icon uses softened tone; for duals choose the second neighbor for emphasis
      let iconColor = rgbaFromHex(tone.hex, 0.7);
      if (idx === 1) iconColor = rgbaFromHex(MUSAI_CHROMATIC_12[2].hex, 0.7); // orange
      if (idx === 3) iconColor = rgbaFromHex(MUSAI_CHROMATIC_12[4].hex, 0.7); // yellow
      if (idx === 7) iconColor = rgbaFromHex(MUSAI_CHROMATIC_12[8].hex, 0.7); // blue
      if (idx === 10) iconColor = rgbaFromHex(MUSAI_CHROMATIC_12[11].hex, 0.7); // violet
      return { borderStyle, iconColor };
    });
  }

  // Show only three Musai tiles in the bottom carousel (top-of-mind entry points)
  const primaryCarouselLinks = infoLinks.slice(0, 3);

  // Group links for a flat site map: modules first, then supporting pages
  const moduleRouteSet = new Set<string>([
    ROUTES.MEET_MUSAI,
    ROUTES.FIND_YOUR_MUSE,
    ROUTES.EYE_OF_MUSAI,
    ROUTES.CODE_MUSAI_INFO,
    ROUTES.UNIVERSITY_INFO,
    ROUTES.EMERGENT_NARRATIVE,
    ROUTES.THERAPY_MUSAI,
    ROUTES.MEDICAL_MUSAI,
    ROUTES.TASK_MUSAI,
    ROUTES.CAREER_MUSAI,
  ]);
  const moduleLinks = infoLinks.filter((l) => moduleRouteSet.has(l.to as string));
  const supportingLinks = infoLinks.filter((l) => !moduleRouteSet.has(l.to as string));

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

  // Autoplay that pauses on hover/focus
  useEffect(() => {
    if (!carouselApi) return;
    if (isHovered) {
      if (autoplayRef.current) cancelAnimationFrame(autoplayRef.current);
      return;
    }
    let last = performance.now();
    const tick = (now: number) => {
      if (now - last > 3500) {
        carouselApi.scrollNext();
        last = now;
      }
      autoplayRef.current = requestAnimationFrame(tick);
    };
    autoplayRef.current = requestAnimationFrame(tick);
    return () => {
      if (autoplayRef.current) cancelAnimationFrame(autoplayRef.current);
      autoplayRef.current = null;
    };
  }, [carouselApi, isHovered]);

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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />
      
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-300/20 rounded-full blur-3xl animate-pulse delay-1000" />
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
             selectedMode === "task" ? "TaskMusai" :
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
          <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative mx-auto max-w-5xl"
          >
            <Carousel setApi={setCarouselApi} opts={{ align: 'start', loop: true, slidesToScroll: 1 }}>
              <CarouselContent>
                {(() => {
                  const accents = buildAccentForList(moduleLinks.length);
                  return moduleLinks.map((link, i) => (
                    <CarouselItem key={link.label} className="basis-full sm:basis-1/2 md:basis-1/3">
                      <div className="rounded-xl p-px" style={{ background: accents[i].borderStyle }}>
                        <Button
                          onClick={() => navigate(link.to)}
                          variant="outline"
                          className={`relative z-0 w-full px-4 py-3 text-sm sm:text-base font-medium rounded-xl border-0 transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] hover:shadow-sm bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60`}
                        >
                          {(() => { const Icon = link.icon; return <Icon className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: accents[i].iconColor }} /> })()}
                          {link.label}
                        </Button>
                      </div>
                    </CarouselItem>
                  ));
                })()}
              </CarouselContent>
              <CarouselPrevious className="border-0 bg-transparent hover:bg-transparent text-muted-foreground" />
              <CarouselNext className="border-0 bg-transparent hover:bg-transparent text-muted-foreground" />
            </Carousel>
          </div>
        </div>

        {/* Reveal Site Map CTA */}
        {!siteMapRevealed && (
          <div className="pt-10 pb-16 flex justify-center">
            <Button variant="outline" onClick={() => {
              setSiteMapRevealed(true);
              setTimeout(() => siteMapRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
            }} className="rounded-xl border-2">
              Explore the Musai site map <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Flat Site Map / Quick Navigation */}
        <div className="pt-14 pb-20 relative">
          {/* Subtle resistance veil */}
          <div className="pointer-events-none absolute -top-8 left-0 right-0 h-16 bg-gradient-to-b from-background via-background/80 to-transparent" />
          <div
            ref={siteMapRef}
            className={`max-w-6xl mx-auto transition-all duration-700 ease-out ${
              siteMapRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none select-none"
            }`}
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold">What is Musai?</h2>
              <p className="text-muted-foreground mt-2">A flat, skimmable map — modules first, then supporting pages.</p>
            </div>

            {/* Modules (Musai forms) */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Modules</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(() => {
                  const accents = buildAccentForList(moduleLinks.length);
                  return moduleLinks.map((link, i) => (
                    <div key={link.label} className="rounded-xl p-px" style={{ background: accents[i].borderStyle }}>
                      <Button
                        onClick={() => navigate(link.to)}
                        variant="outline"
                        className={`justify-start h-auto py-3 px-4 text-sm rounded-xl border-0 hover:bg-sidebar-accent/30 transition-all duration-300 w-full`}
                      >
                        {(() => { const Icon = link.icon; return <Icon className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: accents[i].iconColor }} /> })()}
                        <span className="truncate">{link.label}</span>
                      </Button>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Supporting pages (architecture, integrations, docs) */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Supporting</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(() => {
                  const accents = buildAccentForList(supportingLinks.length);
                  return supportingLinks.map((link, i) => (
                    <div key={link.label} className="rounded-xl p-px" style={{ background: accents[i].borderStyle }}>
                      <Button
                        onClick={() => navigate(link.to)}
                        variant="outline"
                        className={`justify-start h-auto py-3 px-4 text-sm rounded-xl border-0 hover:bg-sidebar-accent/30 transition-all duration-300 w-full`}
                      >
                        {(() => { const Icon = link.icon; return <Icon className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: accents[i].iconColor }} /> })()}
                        <span className="truncate">{link.label}</span>
                      </Button>
                    </div>
                  ));
                })()}
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