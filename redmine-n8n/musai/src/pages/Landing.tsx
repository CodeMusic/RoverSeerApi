import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Send, History, Sparkles, ExternalLink, User, Brain, Check, MessageSquare, Theater, GraduationCap, Search, Bot, ChevronDown, Cpu, Code } from "lucide-react";
import { useChatSessions } from "@/hooks/useChatSessions";

const Landing = () => {
  const navigate = useNavigate();
  const { createNewSession, sessions } = useChatSessions();
  const [isAnimating, setIsAnimating] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedMode, setSelectedMode] = useState("auto");

  const modeOptions = [
    { id: "auto", icon: Sparkles, label: "Auto", description: "Let AI decide" },
    { id: "chat", icon: MessageSquare, label: "Chat", description: "Conversation" },
    { id: "search", icon: Search, label: "Search", description: "Intelligent Discovery" },
    { id: "code", icon: Code, label: "Code", description: "Paired AI Programming" },
    { id: "university", icon: GraduationCap, label: "University", description: "Generative Learning" },
    { id: "emergent-narrative", icon: Theater, label: "Emergent Narrative", description: "Story Emergence" },
    { id: "task", icon: Bot, label: "Task", description: "Orchestrated Achievement" },
  ];

  const selectedModeData = modeOptions.find(mode => mode.id === selectedMode) || modeOptions[0];

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
      navigate("/chat", { 
        state: { 
          newSession: true,
          initialMessage: initialMessage 
        } 
      });
    }, 300);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      handleMessageWithMode(message.trim(), selectedMode);
    }
  };

  const handleMessageWithMode = (messageText: string, mode: string) => {
    setIsAnimating(true);
    
    // Route based on selected mode
    setTimeout(() => {
      switch (mode) {
        case "auto":
          // For now, auto goes to search until automation is added
          // Add URL parameter as backup for refresh handling
          navigate(`/chat?mode=search&q=${encodeURIComponent(messageText)}`, { 
            state: { switchToTab: "musai-search", initialQuery: messageText } 
          });
          break;
        case "chat":
          handleStartNewChat(messageText);
          break;
        case "search":
          // Add URL parameter as backup for refresh handling
          navigate(`/chat?mode=search&q=${encodeURIComponent(messageText)}`, { 
            state: { switchToTab: "musai-search", initialQuery: messageText } 
          });
          break;
        case "code":
          // Add URL parameter as backup for refresh handling
          navigate(`/chat?mode=code&q=${encodeURIComponent(messageText)}`, { 
            state: { switchToTab: "code-musai", initialQuery: messageText } 
          });
          break;
        case "university":
          // Add URL parameter as backup for refresh handling
          navigate(`/university?topic=${encodeURIComponent(messageText)}`, { 
            state: { initialQuery: messageText } 
          });
          break;
        case "emergent-narrative":
          // Add URL parameter as backup for refresh handling
          navigate(`/chat?mode=narrative&q=${encodeURIComponent(messageText)}`, { 
            state: { switchToTab: "emergent-narrative", initialQuery: messageText } 
          });
          break;
        case "task":
          // Add URL parameter as backup for refresh handling
          navigate(`/chat?mode=task&q=${encodeURIComponent(messageText)}`, { 
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
      navigate("/chat", { state: { viewPastChats: true } });
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
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="mb-8 slide-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex justify-center mb-8">
            <div className="relative">
              <img 
                src="/src/assets/images/musai_logo.png" 
                alt="Musai Logo" 
                className="w-24 h-24 object-contain shadow-lg"
              />
              <div className="absolute -inset-2 bg-gradient-to-br from-purple-500 to-orange-500 rounded-full opacity-20 blur-sm animate-pulse" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent">
            MusaiChat
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Reflective AI for Recursive Minds
          </p>
          
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Experience the world's first agentic AI mind that grows over time through memory, 
            feedback, and self-refinement. Musai doesn't just answer questions—it develops 
            a sense of who you are, and a working model of who it is becoming.
          </p>
        </div>

        {/* Message Input Form */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8 slide-in-up" style={{ animationDelay: '0.4s' }}>
          <form onSubmit={handleSendMessage} className="flex w-full max-w-md gap-2">
            {/* Mode Selector Dropdown */}
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
                {modeOptions.map((mode) => {
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

            <Input
              type="text"
              placeholder="Start a new conversation..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isAnimating}
              className="flex-1 px-4 py-3 text-lg rounded-xl border-2 border-purple-500/30 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
            />
            <Button
              type="submit"
              disabled={isAnimating || !message.trim()}
              className="group relative overflow-hidden bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </form>

          {hasPastChats && (
            <Button
              onClick={handleViewPastChats}
              disabled={isAnimating}
              variant="outline"
              className="px-8 py-4 text-lg font-semibold rounded-xl border-2 border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all duration-300 shadow-lg"
            >
              <History className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Additional Navigation Links */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8 slide-in-up" style={{ animationDelay: '0.6s' }}>
          <Button
            onClick={() => navigate("/meet-musai")}
            variant="outline"
            className="px-6 py-3 text-base font-medium rounded-xl border-2 border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all duration-300"
          >
            <User className="w-4 h-4 mr-2" />
            Meet Musai
          </Button>
          
          <Button
            onClick={() => navigate("/neuroscience")}
            variant="outline"
            className="px-6 py-3 text-base font-medium rounded-xl border-2 border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all duration-300"
          >
            <Brain className="w-4 h-4 mr-2" />
            The Neuroscience
          </Button>
          
          <Button
            onClick={() => navigate("/local-ai")}
            variant="outline"
            className="px-6 py-3 text-base font-medium rounded-xl border-2 border-blue-500/30 hover:border-blue-500/50 hover:bg-blue-500/10 transition-all duration-300"
          >
            <Cpu className="w-4 h-4 mr-2" />
            Local AI Architecture
          </Button>
          
          <Button
            onClick={() => navigate("/find-your-muse")}
            variant="outline"
            className="px-6 py-3 text-base font-medium rounded-xl border-2 border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all duration-300"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Find Your Muse
          </Button>
          
          <Button
            onClick={() => navigate("/roverbyte")}
            variant="outline"
            className="px-6 py-3 text-base font-medium rounded-xl border-2 border-orange-500/30 hover:border-orange-500/50 hover:bg-orange-500/10 transition-all duration-300"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Musai x RoverByte Integration
          </Button>
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