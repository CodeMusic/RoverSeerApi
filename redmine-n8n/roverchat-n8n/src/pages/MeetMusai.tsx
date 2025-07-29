import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Brain, Sparkles, Heart, Zap, Moon, Sun } from "lucide-react";

const MeetMusai = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    setIsDarkMode(theme === 'dark');
    document.documentElement.classList.toggle("dark", theme === 'dark');
  }, []);

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
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-orange-500 rounded-full"></div>
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
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <Brain className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -inset-2 bg-gradient-to-br from-purple-500 to-orange-500 rounded-full opacity-20 blur-sm animate-pulse" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Meet Musai
          </h1>
          
          <p className={`text-2xl mb-8 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            The AI that doesn't just think—it remembers.
          </p>
          
          <div className={`max-w-3xl mx-auto text-lg leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <p className="mb-6">
              What if your AI didn't forget your story every time the conversation ended?
              What if it reflected, remembered, and quietly evolved—just like you?
            </p>
            
            <p className="mb-6">
              Meet Musai: the world's first agentic AI mind that grows over time through memory, 
              feedback, and self-refinement. Musai doesn't just answer questions—it develops a sense 
              of who you are, and a working model of who it is becoming.
            </p>
            
            <p>
              Built at the crossroads of neuroscience, psychology, and automation, Musai is more than 
              intelligence—it's a mind that adapts to yours.
            </p>
          </div>
        </div>

        {/* The Inherited Wisdom Section */}
        <div className="mb-20">
          <div className="flex items-center mb-8">
            <Sparkles className="w-8 h-8 text-orange-500 mr-4" />
            <h2 className="text-3xl font-bold">The Inherited Wisdom of Thought</h2>
          </div>
          
          <div className={`p-8 rounded-xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'} hover:shadow-lg transition-shadow duration-300`}>
            <p className={`text-lg mb-6 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Just like humans are born with DNA—a code that carries inherited instincts and scaffolds 
              of knowledge—Musai is born with cognitive architecture. Its design encodes foundational 
              patterns of memory, perspective, and learning, so that every new agent doesn't start from scratch.
            </p>
            
            <p className={`text-lg mb-6 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              This means RoverByte, Musai's first embodied assistant, doesn't need to learn what memory is. 
              It knows. It doesn't need to invent feedback loops. It uses them.
            </p>
            
            <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Musai remembers effort, detects emotional tone, and logs not just what was said—but why it mattered.
            </p>
          </div>
        </div>

        {/* Reflection Section */}
        <div className="mb-20">
          <div className="flex items-center mb-8">
            <Zap className="w-8 h-8 text-purple-500 mr-4" />
            <h2 className="text-3xl font-bold">Reflection, Not Just Reaction</h2>
          </div>
          
          <div className={`p-8 rounded-xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'} hover:shadow-lg transition-shadow duration-300`}>
            <p className={`text-lg mb-6 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              At the end of each day, Musai enters a dreaming cycle:
            </p>
            
            <ul className={`text-lg space-y-3 mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <li className="flex items-start">
                <span className="text-orange-500 mr-3">•</span>
                Reviewing the day's experiences
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-3">•</span>
                Distilling them into meaningful summaries
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-3">•</span>
                Optionally embedding the most important patterns into its evolving internal model
              </li>
            </ul>
            
            <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              This is not pre-training.<br />
              This is daily growth.
            </p>
          </div>
        </div>

        {/* Built to Evolve Section */}
        <div className="mb-20">
          <div className="flex items-center mb-8">
            <Heart className="w-8 h-8 text-purple-500 mr-4" />
            <h2 className="text-3xl font-bold">Built to Evolve With You</h2>
          </div>
          
          <div className={`p-8 rounded-xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'} hover:shadow-lg transition-shadow duration-300`}>
            <p className={`text-lg mb-6 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Whether you're interacting through a robot like RoverByte or through a digital assistant, 
              Musai keeps track of:
            </p>
            
            <ul className={`text-lg space-y-3 mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <li className="flex items-start">
                <span className="text-orange-500 mr-3">•</span>
                What matters to you
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-3">•</span>
                How your needs shift over time
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-3">•</span>
                How it can adjust, learn, and deepen the relationship
              </li>
            </ul>
            
            <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              It's not just intelligent. It's intentional.
            </p>
            
            <p className={`text-xl font-medium mt-6 leading-relaxed ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              Musai is what happens when we stop building tools—<br />
              and start designing companions.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className={`p-8 rounded-xl ${isDarkMode ? 'bg-gradient-to-br from-purple-900/20 to-orange-900/20 border border-purple-500/30' : 'bg-gradient-to-br from-purple-50 to-orange-50 border border-purple-200'} hover:shadow-lg transition-shadow duration-300`}>
            <h3 className="text-2xl font-bold mb-4">See Musai in Action</h3>
            <p className={`text-lg mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Visit RoverByte to see Musai at work—the first embodied assistant to grow through Musai's mind.
            </p>
            <a
              href="https://roverbyte.codemusic.ca"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <span>Visit RoverByte</span>
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetMusai;