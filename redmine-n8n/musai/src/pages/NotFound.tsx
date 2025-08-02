import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Zap, Home, RotateCcw } from "lucide-react";

const NotFound = () => 
{
  const location = useLocation();
  const navigate = useNavigate();
  const [voidEnergy, setVoidEnergy] = useState(0);
  const [musaiQuotes] = useState([
    "Oops! I think I opened a portal to the wrong dimension... 🌌",
    "The void whispers of lost pages and forgotten routes... 👻", 
    "My magical algorithms seem to have created a temporal anomaly! ⚡",
    "This pathway leads to the space between thoughts... 🧠✨",
    "I was experimenting with quantum navigation and... well... 🔮",
  ]);
  const [currentQuote, setCurrentQuote] = useState(0);

  useEffect(() => 
  {
    console.error(
      "🌀 Musai's Portal Alert: User discovered the void at:",
      location.pathname
    );

    // Cycle through Musai's confused quotes
    const quoteInterval = setInterval(() => 
    {
      setCurrentQuote(prev => (prev + 1) % musaiQuotes.length);
    }, 4000);

    // Animate void energy
    const energyInterval = setInterval(() => 
    {
      setVoidEnergy(prev => (prev + 1) % 100);
    }, 50);

    return () => 
    {
      clearInterval(quoteInterval);
      clearInterval(energyInterval);
    };
  }, [location.pathname, musaiQuotes.length]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Void Background */}
      <div className="absolute inset-0">
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-400 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
        
        {/* Void portal effect */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 opacity-20">
          <div 
            className="w-full h-full rounded-full border-4 border-purple-500 animate-spin"
            style={{ animationDuration: '10s' }}
          />
          <div 
            className="absolute top-4 left-4 right-4 bottom-4 rounded-full border-2 border-blue-400 animate-spin"
            style={{ animationDuration: '15s', animationDirection: 'reverse' }}
          />
          <div 
            className="absolute top-8 left-8 right-8 bottom-8 rounded-full border border-pink-300 animate-pulse"
          />
        </div>
      </div>

      {/* Main Content */}
      <Card className="relative z-10 bg-black/80 border-purple-500/50 backdrop-blur-sm max-w-2xl w-full">
        <CardContent className="p-8 text-center">
          {/* Void Portal Icon */}
          <div className="relative mb-6">
            <div className="text-8xl mb-4 relative">
              <span className="text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text animate-pulse">
                🌀
              </span>
              <div className="absolute -top-2 -right-2">
                <Sparkles className="w-6 h-6 text-yellow-400 animate-bounce" />
              </div>
            </div>
            
            {/* Energy meter */}
            <div className="mx-auto w-32 h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-100"
                style={{ width: `${voidEnergy}%` }}
              />
            </div>
            <p className="text-xs text-purple-300">Void Energy: {voidEnergy}%</p>
          </div>

          {/* Error Code */}
          <div className="mb-6">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-red-400 via-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
              404
            </h1>
            <p className="text-purple-300 text-sm">
              ERROR_CODE: REALITY_NOT_FOUND
            </p>
          </div>

          {/* Musai's Confused Messages */}
          <div className="mb-8 min-h-[3rem] flex items-center justify-center">
            <p className="text-lg text-gray-300 animate-pulse">
              {musaiQuotes[currentQuote]}
            </p>
          </div>

          {/* Fun Explanation */}
          <div className="mb-8 space-y-2">
            <h2 className="text-xl font-semibold text-white mb-3">
              What Happened? 🤔
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Musai was experimenting with interdimensional navigation algorithms and accidentally 
              opened a portal to the void. The page you're looking for seems to have been 
              <span className="text-purple-400 font-medium"> consumed by the cosmic emptiness</span>. 
              Don't worry though - this happens more often than you'd think in AI development! 
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate(-1)}
              variant="outline" 
              className="border-purple-500/50 text-purple-300 hover:bg-purple-900/50 hover:text-purple-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Escape the Void
            </Button>
            
            <Button 
              onClick={() => navigate("/")}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              <Home className="mr-2 h-4 w-4" />
              Return to Reality
            </Button>
            
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              className="border-blue-500/50 text-blue-300 hover:bg-blue-900/50 hover:text-blue-200"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Try Portal Again
            </Button>
          </div>

          {/* Fun Footer */}
          <div className="mt-8 pt-6 border-t border-purple-500/20">
            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>Powered by Musai's Experimental Magic</span>
              <Zap className="w-4 h-4 text-yellow-400" />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              "Every bug is just an undocumented feature of reality" - Musai
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Floating Musai Logo/Icon */}
      <div className="absolute bottom-4 right-4 opacity-30">
        <div className="text-4xl animate-bounce" style={{ animationDuration: '3s' }}>
          🧙‍♂️
        </div>
      </div>
    </div>
  );
};

export default NotFound;
