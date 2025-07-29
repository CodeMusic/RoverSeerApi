import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, History, Sparkles } from "lucide-react";
import { useChatSessions } from "@/hooks/useChatSessions";

const Landing = () => {
  const navigate = useNavigate();
  const { createNewSession, sessions } = useChatSessions();
  const [isAnimating, setIsAnimating] = useState(false);
  const [message, setMessage] = useState("");

  const handleStartNewChat = async (initialMessage?: string) => {
    setIsAnimating(true);
    // Create a new session
    const sessionId = createNewSession();
    
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
      handleStartNewChat(message.trim());
    }
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
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-orange-500/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-[length:20px_20px]" />
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto text-center space-y-8 relative z-10 animate-in">
        {/* Logo/Icon */}
        <div className="flex justify-center mb-8 slide-in-up">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -inset-1 bg-gradient-to-br from-purple-500 to-orange-500 rounded-full opacity-20 blur-sm animate-pulse" />
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-4 slide-in-up" style={{ animationDelay: '0.2s' }}>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            <span className="text-purple-500">Musai Chat</span>
            <br />
            <span className="text-orange-500">— The Modular Muse Within</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground font-medium">
            Reflective AI for Recursive Minds
          </p>
          
          <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Your adaptive digital muse — bridging raw data and emergent insight through reflective AI for recursive minds.
          </p>
        </div>

        {/* Message Input Form */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8 slide-in-up" style={{ animationDelay: '0.4s' }}>
          <form onSubmit={handleSendMessage} className="flex w-full max-w-md gap-2">
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

        {/* Subtle Animation Elements */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-500/30 rounded-full animate-pulse" />
        <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-orange-500/30 rounded-full animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-purple-500/20 rounded-full animate-pulse delay-2000" />
      </div>

      {/* Fade Animation Overlay */}
      {isAnimating && (
        <div className="fixed inset-0 bg-background z-50 fade-in" />
      )}
    </div>
  );
};

export default Landing;