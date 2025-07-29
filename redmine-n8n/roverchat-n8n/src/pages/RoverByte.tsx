import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ExternalLink, Moon, Sun } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const RoverByte = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    setIsDarkMode(theme === 'dark');
    document.documentElement.classList.toggle("dark", theme === 'dark');
  }, []);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      // Show coming soon notification
      toast({
        title: "Coming Soon! 🚀",
        description: "Email notifications will be available when RoverByte launches. We'll notify you when it's ready!",
        duration: 5000,
      });
      setEmail("");
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} transition-colors duration-300`}>
      {/* Navigation Bar */}
      <nav className={`px-6 py-4 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-purple-500 rounded-full"></div>
              <span className="font-semibold text-lg">Musai</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-1 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Musai</span>
            </button>
          </div>
          
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <span className="text-2xl">🚀</span>
                </div>
              </div>
              <div className="absolute -inset-2 bg-gradient-to-br from-orange-500 to-purple-500 rounded-full opacity-20 blur-sm animate-pulse" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="text-orange-500">Musai</span>
            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}> x </span>
            <span className="text-purple-500">RoverByte</span>
          </h1>
          
          <p className={`text-2xl mb-6 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Merging Minds, Machines & Meaning
          </p>
          
          <p className={`text-lg max-w-3xl mx-auto mb-8 leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Musai is evolving with RoverByte—a creative automation stack for building smart, self-reflective websites powered by agents.
          </p>
          
          <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email for updates"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`flex-1 px-4 py-3 text-lg rounded-xl border-2 border-orange-500/30 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Notify Me
            </Button>
          </form>
        </div>

        {/* Coming Soon Section */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-center mb-12">Coming Soon</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className={`p-8 rounded-xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'} hover:shadow-lg transition-shadow duration-300`}>
              <div className="text-orange-500 font-semibold mb-3 text-sm uppercase tracking-wide">Phase 1</div>
              <h3 className="text-xl font-bold mb-4">Agent Infrastructure</h3>
              <p className={`leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Core agent framework with self-reflection capabilities and adaptive learning systems.</p>
            </div>
            
            <div className={`p-8 rounded-xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'} hover:shadow-lg transition-shadow duration-300`}>
              <div className="text-orange-500 font-semibold mb-3 text-sm uppercase tracking-wide">Phase 2</div>
              <h3 className="text-xl font-bold mb-4">Creative Automation</h3>
              <p className={`leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Smart website building with recursive learning and intelligent content generation.</p>
            </div>
            
            <div className={`p-8 rounded-xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'} hover:shadow-lg transition-shadow duration-300`}>
              <div className="text-orange-500 font-semibold mb-3 text-sm uppercase tracking-wide">Phase 3</div>
              <h3 className="text-xl font-bold mb-4">Full Integration</h3>
              <p className={`leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Complete Musai x RoverByte ecosystem launch with advanced AI capabilities.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Learn more about RoverByte:</p>
          <a
            href="https://roverbyte.codemusic.ca"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 text-orange-500 hover:text-orange-400 transition-colors px-6 py-3 rounded-xl border border-orange-500/30 hover:border-orange-500/50 hover:bg-orange-500/10"
          >
            <span>Visit RoverByte</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default RoverByte;