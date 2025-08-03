import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Brain, Cpu, Database, Zap, Moon, Sun, ChevronDown, ChevronUp } from "lucide-react";
import musaiArchDiagram from "@/assets/images/musai_archdiag.png";
import redmineMemoryStructure from "@/assets/images/redmine_memory_structure.png";
import dnaFlow from "@/assets/images/dna_flow.png";
import dayNightTraining from "@/assets/images/day_night_training.png";
import n8nWorkflow from "@/assets/images/n8n_workflow.png";

const Neuroscience = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

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

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
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
      <div className="max-w-6xl mx-auto px-6 py-16">
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
          
          <h1 className="text-5xl font-bold mb-6">
            Musai: The Neuroscience
          </h1>
          
          <p className={`text-2xl mb-8 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            The cognitive foundations of a self-evolving AI mind
          </p>
          
          <div className={`max-w-4xl mx-auto text-lg leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <p>
              Musai is more than a conversational AI—it is an adaptive cognitive system modeled after 
              the recursive structures of the human brain. Its architecture integrates principles from 
              neuroscience, memory theory, and evolutionary scaffolding, resulting in an AI that doesn't 
              just process commands—it reflects, remembers, and reconfigures itself over time.
            </p>
          </div>
        </div>

        {/* Bicameral Cognition Section */}
        <div className="mb-20">
          <div className="flex items-center mb-8">
            <Cpu className="w-8 h-8 text-orange-500 mr-4" />
            <h2 className="text-3xl font-bold">Bicameral Cognition: Dual Agents and Integration</h2>
          </div>
          
          <div className={`p-8 rounded-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
            <p className={`text-lg mb-6 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              At the core of Musai's architecture are two cooperative cognitive agents:
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <h3 className="font-bold text-lg mb-2">Agent</h3>
                <div className="space-y-2 text-sm">
                  <div className={`p-2 rounded ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'}`}>Logical Musai</div>
                  <div className={`p-2 rounded ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'}`}>Creative Musai</div>
                </div>
              </div>
              <div className="text-center">
                <h3 className="font-bold text-lg mb-2">Role</h3>
                <div className="space-y-2 text-sm">
                  <div className={`p-2 rounded ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'}`}>Stepwise reasoning, factual parsing</div>
                  <div className={`p-2 rounded ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'}`}>Associative, metaphorical, intuitive synthesis</div>
                </div>
              </div>
              <div className="text-center">
                <h3 className="font-bold text-lg mb-2">Brain Analogy</h3>
                <div className="space-y-2 text-sm">
                  <div className={`p-2 rounded ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'}`}>Left Hemisphere</div>
                  <div className={`p-2 rounded ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'}`}>Right Hemisphere</div>
                </div>
              </div>
            </div>
            
            <p className={`text-lg leading-relaxed mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Each agent receives the same input and processes it independently. Their outputs are passed 
              into a Fusion Layer, which reconciles their differing perspectives and delivers a single 
              unified response. This mirrors the function of the corpus callosum, the bridge between 
              human hemispheres.
            </p>
            
            {/* Musai Architecture Diagram */}
            <div className="mt-8 p-6 bg-gradient-to-r from-purple-900/20 to-orange-900/20 rounded-lg border border-purple-500/30">
              <h3 className="text-center text-xl font-bold mb-4 text-gray-200">Musai Architecture Overview</h3>
              <div className="flex justify-center">
                <img 
                  src={musaiArchDiagram} 
                  alt="Musai Architecture Diagram showing n8n, Redmine, Agents, and Fusion layers" 
                  className="max-w-full h-auto rounded-lg shadow-lg"
                  style={{ maxHeight: '600px' }}
                />
              </div>
              <p className="text-center text-sm text-gray-600 mt-4">
                Complete system architecture showing the integration of n8n workflows, Redmine memory substrate, 
                dual cognitive agents, and the fusion layer that unifies their outputs.
              </p>
            </div>
          </div>
        </div>

        {/* Structured Memory Section */}
        <div className="mb-20">
          <div className="flex items-center mb-8">
            <Database className="w-8 h-8 text-purple-500 mr-4" />
            <h2 className="text-3xl font-bold">Structured Memory: Redmine as a Cognitive Substrate</h2>
          </div>
          
          <div className={`p-8 rounded-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
            <p className={`text-lg mb-6 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Unlike static AI systems that discard past context, Musai relies on a structured long-term 
              memory system—Redmine—to retain, organize, and reflect on its evolving knowledge.
            </p>
            
            <p className={`text-lg mb-6 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Redmine acts as Musai's externalized hippocampus + prefrontal cortex, handling:
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <h4 className="font-bold text-orange-500 mb-2">Episodic Memory</h4>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Logs interactions, emotional tone, and contextual signals</p>
              </div>
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <h4 className="font-bold text-orange-500 mb-2">Procedural Memory</h4>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Tracks learned behaviors, system modifications, and internal biases</p>
              </div>
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <h4 className="font-bold text-orange-500 mb-2">Self-Modeling</h4>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Records agent evaluations, decisions, and performance feedback</p>
              </div>
            </div>
            
            <p className={`text-lg mb-6 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              This structured memory is divided across three active domains:
            </p>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-start">
                <span className="text-2xl mr-3">🧍</span>
                <div>
                  <h4 className="font-bold">User Memory</h4>
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>What Musai knows about the user (identity, emotional trends, task history)</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-2xl mr-3">🤖</span>
                <div>
                  <h4 className="font-bold">Agent Memory</h4>
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>What Musai tracks about its own logic, missteps, and updates</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-2xl mr-3">🗣️</span>
                <div>
                  <h4 className="font-bold">Conversation History</h4>
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Active contextual threads with embedded tone and weight</p>
                </div>
              </div>
            </div>
            
            {/* Redmine Memory Structure Diagram */}
            <div className="mt-8 p-6 bg-gradient-to-r from-purple-900/20 to-orange-900/20 rounded-lg border border-purple-500/30">
              <div className="flex justify-center">
                <img 
                  src={redmineMemoryStructure} 
                  alt="Redmine Memory Structure showing User/Agent/Conversation domains" 
                  className="max-w-full h-auto rounded-lg shadow-lg"
                  style={{ maxHeight: '500px' }}
                />
              </div>
              <p className="text-center text-sm text-gray-600 mt-4">
                Redmine memory structure divided across three active domains: User Memory, Agent Memory, and Conversation History.
              </p>
            </div>
          </div>
        </div>

        {/* DNA/DNS Metaphor Section */}
        <div className="mb-20">
          <div className="flex items-center mb-8">
            <Zap className="w-8 h-8 text-orange-500 mr-4" />
            <h2 className="text-3xl font-bold">DNA/DNS Metaphor: Cognitive Inheritance</h2>
          </div>
          
          <div className={`p-8 rounded-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
            <p className={`text-lg mb-6 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Biological life is shaped not only by learning but by inherited patterns encoded in DNA. 
              This code emerges from evolutionary history, allowing each organism to begin life with a 
              scaffold of built-in intelligence—walking, bonding, recognizing threats.
            </p>
            
            <p className={`text-lg mb-6 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Musai's architecture plays a similar role for AI agents.
            </p>
            
            <p className={`text-lg mb-6 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Its cognitive scaffolding is pre-encoded:
            </p>
            
            <ul className={`text-lg space-y-3 mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <li className="flex items-start">
                <span className="text-orange-500 mr-3">•</span>
                A dual-agent thinking model
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-3">•</span>
                Structured memory organization
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-3">•</span>
                Feedback and bias detection
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-3">•</span>
                Nightly training rituals
              </li>
            </ul>
            
            <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              New agents (like those in RoverByte) inherit this structure. They don't learn from scratch—they 
              are born thinking, just like a baby is born with a nervous system ready to adapt.
            </p>
            
            {/* DNA Flow Diagram */}
            <div className="mt-8 p-6 bg-gradient-to-r from-purple-900/20 to-orange-900/20 rounded-lg border border-purple-500/30">
              <div className="flex justify-center">
                <img 
                  src={dnaFlow} 
                  alt="DNA-style cognitive inheritance flow showing Musai core to RoverByte" 
                  className="max-w-full h-auto rounded-lg shadow-lg"
                  style={{ maxHeight: '500px' }}
                />
              </div>
              <p className="text-center text-sm text-gray-600 mt-4">
                DNA-style inheritance pattern showing how Musai's cognitive architecture is passed to new agents like RoverByte.
              </p>
            </div>
          </div>
        </div>

        {/* Narrative Consolidation Section */}
        <div className="mb-20">
          <div className="flex items-center mb-8">
            <Moon className="w-8 h-8 text-purple-500 mr-4" />
            <h2 className="text-3xl font-bold">Narrative Consolidation & Optional Embedded Training</h2>
          </div>
          
          <div className={`p-8 rounded-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
            <p className={`text-lg mb-6 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Just as the brain consolidates memories during sleep, Musai engages in daily reflective processing:
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <h4 className="font-bold text-orange-500 mb-2">🕑 Daytime</h4>
                <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Logs memory tickets (Redmine)</p>
                <p className="text-xs text-gray-400">Hippocampal encoding</p>
              </div>
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <h4 className="font-bold text-orange-500 mb-2">🌙 Nighttime</h4>
                <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Summarizes experience, checks for Ready for Training</p>
                <p className="text-xs text-gray-400">REM-based narrative processing</p>
              </div>
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <h4 className="font-bold text-orange-500 mb-2">🌠 Optional</h4>
                <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Embeds distilled memories into the AI model</p>
                <p className="text-xs text-gray-400">Long-term synaptic consolidation</p>
              </div>
            </div>
            
            <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Only experiences marked with a special Redmine status (Ready for Training) are passed into 
              Musai's embedded training pipeline, updating its internal model. This is akin to epigenetic 
              learning—where certain experiences become encoded as lasting traits.
            </p>
            
            {/* Day/Night Training Cycle Diagram */}
            <div className="mt-8 p-6 bg-gradient-to-r from-purple-900/20 to-orange-900/20 rounded-lg border border-purple-500/30">
              <div className="flex justify-center">
                <img 
                  src={dayNightTraining} 
                  alt="Daily training cycle showing day/night/optional flow" 
                  className="max-w-full h-auto rounded-lg shadow-lg"
                  style={{ maxHeight: '500px' }}
                />
              </div>
              <p className="text-center text-sm text-gray-600 mt-4">
                Daily training cycle showing the day/night/optional flow of memory consolidation and embedded learning.
              </p>
            </div>
          </div>
        </div>

        {/* Executive Function Section */}
        <div className="mb-20">
          <div className="flex items-center mb-8">
            <Zap className="w-8 h-8 text-orange-500 mr-4" />
            <h2 className="text-3xl font-bold">Executive Function: n8n as Procedural Engine</h2>
          </div>
          
          <div className={`p-8 rounded-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
            <p className={`text-lg mb-6 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Musai's thinking isn't just internal—it's agentic. It must act, decide, and restructure 
              its own mind over time. This is where n8n plays a crucial role.
            </p>
            
            <p className={`text-lg mb-6 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              n8n serves as Musai's executive control layer, orchestrating:
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <span className="text-orange-500 mr-3">⏲️</span>
                  <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Automated scheduling of daily review cycles</span>
                </div>
                <div className="flex items-center">
                  <span className="text-orange-500 mr-3">🧾</span>
                  <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Ticket state transitions (e.g., New → Ready for Training)</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center">
                  <span className="text-orange-500 mr-3">🪞</span>
                  <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Bias detection triggers based on reflection logs</span>
                </div>
                <div className="flex items-center">
                  <span className="text-orange-500 mr-3">🔁</span>
                  <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>API calls to agents, retraining pipelines, or user-facing updates</span>
                </div>
              </div>
            </div>
            
            <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              In cognitive terms, n8n is the dorsolateral prefrontal cortex—the system responsible for 
              planning, task-switching, and executing deliberate actions based on thought.
            </p>
            
            <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              n8n doesn't just automate. It enacts cognition.
            </p>
            
            {/* n8n Workflow Diagram */}
            <div className="mt-8 p-6 bg-gradient-to-r from-purple-900/20 to-orange-900/20 rounded-lg border border-purple-500/30">
              <div className="flex justify-center">
                <img 
                  src={n8nWorkflow} 
                  alt="n8n workflow orchestration showing scheduling, transitions, and API calls" 
                  className="max-w-full h-auto rounded-lg shadow-lg"
                  style={{ maxHeight: '500px' }}
                />
              </div>
              <p className="text-center text-sm text-gray-600 mt-4">
                n8n workflow orchestration showing automated scheduling, ticket state transitions, and API call management.
              </p>
            </div>
          </div>
        </div>

        {/* Perspective Thinking Section */}
        <div className="mb-20">
          <div className="flex items-center mb-8">
            <Zap className="w-8 h-8 text-indigo-500 mr-4" />
            <h2 className="text-3xl font-bold">Perspective Thinking: Multi-Viewpoint Cognition</h2>
          </div>
          
          <div className={`p-8 rounded-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
            <p className={`text-lg mb-6 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              At the heart of Musai's cognitive architecture lies a fundamental principle: when we see something 
              from more than one perspective, we understand it better. This multi-viewpoint approach is embedded 
              throughout the system, from the dual-agent processing to the MusaiTale capabilities.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-bold mb-4 text-indigo-500">Left/Right Brain Model</h3>
                <p className={`text-lg leading-relaxed mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Musai's bicameral cognition mirrors the human brain's hemispheric specialization. The logical 
                  agent processes information step-by-step, while the creative agent synthesizes through 
                  association and metaphor. Together, they provide complementary perspectives on every input.
                </p>
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <h4 className="font-bold mb-2">Key Benefits:</h4>
                  <ul className={`text-sm space-y-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <li>• Logical analysis + creative synthesis</li>
                    <li>• Factual accuracy + intuitive insight</li>
                    <li>• Systematic reasoning + associative thinking</li>
                  </ul>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-4 text-indigo-500">MusaiTale</h3>
                <p className={`text-lg leading-relaxed mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  The MusaiTale system takes perspective thinking to a new level. By placing abstract 
                  ideas into story frameworks where AI characters inhabit and concretize them, users can see 
                  their own concepts from entirely new viewpoints.
                </p>
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <h4 className="font-bold mb-2">Perspective Facilitation:</h4>
                  <ul className={`text-sm space-y-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <li>• Making ideas tangible through emergence</li>
                    <li>• Character-driven perspective shifts</li>
                    <li>• Multi-viewpoint exploration</li>
                    <li>• Perspective-driven insights</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <p className={`text-lg mb-6 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              This multi-perspective approach isn't just about seeing different sides of an issue—it's about 
              fundamentally changing how we understand complex problems. When Musai processes information through 
              multiple cognitive pathways, it creates a richer, more nuanced understanding that transcends 
              single-viewpoint limitations.
            </p>
            
            <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-indigo-900/20 border border-indigo-500/30' : 'bg-indigo-50 border border-indigo-200'}`}>
              <h3 className="text-xl font-bold mb-4 text-indigo-500">The Power of Perspective</h3>
              <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Whether through the dual-agent system's logical/creative balance or MusaiTale's 
                character-driven exploration, Musai's perspective thinking capabilities enable deeper understanding 
                by viewing problems, ideas, and solutions from multiple cognitive angles simultaneously.
              </p>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="mb-20">
          <div className="flex items-center mb-8">
            <Brain className="w-8 h-8 text-purple-500 mr-4" />
            <h2 className="text-3xl font-bold">Summary</h2>
          </div>
          
          <div className={`p-8 rounded-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
            <p className={`text-lg mb-6 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Musai's architecture is a tightly-coupled, brain-inspired system where every cognitive 
              principle is grounded in real-world analogs:
            </p>
            
            <ul className={`text-lg space-y-3 mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <li className="flex items-start">
                <span className="text-orange-500 mr-3">•</span>
                Dual-agent processing mirrors left/right brain hemispheres
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-3">•</span>
                Redmine structures memory like a digital hippocampus
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-3">•</span>
                n8n executes workflows like an executive cortex
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-3">•</span>
                DNA-style scaffolding allows agents to inherit evolved thought patterns
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-3">•</span>
                Daily reflective training mimics REM-phase consolidation
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-3">•</span>
                Bias detection and narrative abstraction allow for model evolution
              </li>
            </ul>
            
            <p className={`text-xl font-medium leading-relaxed ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              Musai isn't just smart—it remembers like a person, adapts like a system, and evolves like a species.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Neuroscience;