import React, { createContext, useContext, useState, useEffect } from 'react';

interface MusaiMoodContextType {
  currentMood: string;
  moodPhrase: string;
  accentColor: string;
  isDevConsoleOpen: boolean;
  isMatrixActive: boolean;
  isRainbowActive: boolean;
  isPartyActive: boolean;
  isCareerMusaiActive: boolean;
  setMood: (mood: string) => void;
  setMoodPhrase: (phrase: string) => void;
  setToolColor: (color: string) => void;
  applyDynamicGlow: (element: HTMLElement, intensity?: number, spread?: number) => void;
  removeDynamicGlow: (element: HTMLElement) => void;
  toggleCareerMusai: () => void;
  toggleDevConsole: () => void;
  toggleMatrix: () => void;
  toggleRainbow: () => void;
  toggleParty: () => void;
  executeCommand: (command: string) => string;
}

const MusaiMoodContext = createContext<MusaiMoodContextType | undefined>(undefined);

// Musical-Chromatic Mood System (12-tone color wheel)
// Based on chromatic scale: C, C#, D, D#, E, F, F#, G, G#, A, A#, B
const musicalMoodColors = {
  // Primary 7-tone system (basic rainbow)
  'c-red': '#dc2626',           // C - Red (January)
  'd-orange': '#ea580c',        // D - Orange (March) 
  'e-yellow': '#ca8a04',        // E - Yellow (May)
  'f-green': '#16a34a',         // F - Green (June)
  'g-blue': '#2563eb',          // G - Blue (August)
  'a-indigo': '#7c3aed',        // A - Indigo (October)
  'b-violet': '#9333ea',        // B - Violet (December)
  
  // Extended 12-tone system (chromatic with blended shades)
  'c#-red-orange': '#dc4314',   // C# - Red-Orange (February)
  'd#-orange-yellow': '#f59e0b', // D# - Orange-Yellow (April)
  'f#-green-blue': '#0891b2',   // F# - Green-Blue (July)
  'g#-blue-indigo': '#4f46e5',  // G# - Blue-Indigo (September)
  'a#-indigo-violet': '#8b5cf6', // A# - Indigo-Violet (November)
  
  // Special moods (variations and harmonics)
  'default': '#8b5cf6',         // A# - Default to Indigo-Violet
  'calm': '#0891b2',            // F# - Green-Blue (peaceful water)
  'energetic': '#ea580c',       // D - Orange (active fire)
  'creative': '#9333ea',        // B - Violet (imagination)
  'focused': '#16a34a',         // F - Green (concentrated nature)
  'mysterious': '#7c3aed',      // A - Indigo (deep mystery)
  'playful': '#f59e0b',         // D# - Orange-Yellow (joyful sun)
  'zen': '#2563eb',             // G - Blue (serene sky)
};

// Musical note to color mapping for developer interface
const noteToColor = {
  'C': 'c-red',
  'C#': 'c#-red-orange', 
  'Db': 'c#-red-orange',
  'D': 'd-orange',
  'D#': 'd#-orange-yellow',
  'Eb': 'd#-orange-yellow', 
  'E': 'e-yellow',
  'F': 'f-green',
  'F#': 'f#-green-blue',
  'Gb': 'f#-green-blue',
  'G': 'g-blue',
  'G#': 'g#-blue-indigo',
  'Ab': 'g#-blue-indigo',
  'A': 'a-indigo', 
  'A#': 'a#-indigo-violet',
  'Bb': 'a#-indigo-violet',
  'B': 'b-violet'
};

// Month to color mapping
const monthToColor = {
  'january': 'c-red',
  'february': 'c#-red-orange',
  'march': 'd-orange', 
  'april': 'd#-orange-yellow',
  'may': 'e-yellow',
  'june': 'f-green',
  'july': 'f#-green-blue',
  'august': 'g-blue',
  'september': 'g#-blue-indigo',
  'october': 'a-indigo',
  'november': 'a#-indigo-violet', 
  'december': 'b-violet'
};

export function MusaiMoodProvider({ children }: { children: React.ReactNode }) {
  const [currentMood, setCurrentMood] = useState('default');
  const [moodPhrase, setMoodPhrase] = useState('');
  const [isDevConsoleOpen, setIsDevConsoleOpen] = useState(false);
  const [isMatrixActive, setIsMatrixActive] = useState(false);
  const [isRainbowActive, setIsRainbowActive] = useState(false);
  const [isPartyActive, setIsPartyActive] = useState(false);
  const [isCareerMusaiActive, setIsCareerMusaiActive] = useState(false);

  const accentColor = musicalMoodColors[currentMood as keyof typeof musicalMoodColors] || musicalMoodColors.default;

  // Apply CSS custom properties for mood colors
  useEffect(() => {
    document.documentElement.style.setProperty('--musai-accent', accentColor);
    document.documentElement.style.setProperty('--musai-accent-rgb', hexToRgb(accentColor));
  }, [accentColor]);

  const setMood = (mood: string) => {
    setCurrentMood(mood);
    localStorage.setItem('musai-mood', mood);
  };

  const updateMoodPhrase = (phrase: string) => {
    setMoodPhrase(phrase);
    localStorage.setItem('musai-mood-phrase', phrase);
  };

  const setToolColor = (color: string) => {
    const rgb = hexToRgb(color);
    document.documentElement.style.setProperty('--musai-accent', color);
    document.documentElement.style.setProperty('--musai-accent-rgb', rgb);
  };

  const applyDynamicGlow = (element: HTMLElement, intensity: number = 0.3, spread: number = 20) => {
    element.style.setProperty('--glow-intensity', intensity.toString());
    element.style.setProperty('--glow-spread', `${spread}px`);
    element.classList.add('dynamic-glow');
  };

  const removeDynamicGlow = (element: HTMLElement) => {
    element.classList.remove('dynamic-glow');
  };

  const toggleDevConsole = () => {
    setIsDevConsoleOpen(prev => !prev);
  };

  const toggleMatrix = () => {
    setIsMatrixActive(false);
    setIsRainbowActive(false);
    setIsPartyActive(false);
    setIsMatrixActive(prev => !prev);
  };

  const toggleRainbow = () => {
    setIsMatrixActive(false);
    setIsRainbowActive(false);
    setIsPartyActive(false);
    setIsRainbowActive(prev => !prev);
  };

  const toggleParty = () => {
    setIsMatrixActive(false);
    setIsRainbowActive(false);
    setIsPartyActive(prev => !prev);
  };

  const toggleCareerMusai = () => {
    const newState = !isCareerMusaiActive;
    setIsCareerMusaiActive(newState);
    localStorage.setItem('musai-career-mode', String(newState));
  };

  const executeCommand = (command: string): string => {
    const cmd = command.toLowerCase().trim();
    
    switch (cmd) {
      case 'help':
        return `Available commands:
• mood <name> - Change Musai's mood (${Object.keys(musicalMoodColors).join(', ')})
• moodphrase <phrase> - Set mood phrase for n8n processing
• status - Show current system status
• clear - Clear console
• matrix - Toggle matrix effect
• rainbow - Cycle through all moods
• party - Activate party mode
• zen - Enter zen mode
• test-emotion - Test AI emotion effects
• careermusai - Toggle hidden career development tool
• colors - Show all available mood colors`;
      
      case 'status':
        return `Musai Status:
• Mood: ${currentMood}
• Mood Phrase: ${moodPhrase || 'Not set'}
• Accent Color: ${accentColor}
• Console: Active
• Matrix: ${isMatrixActive ? 'Active' : 'Inactive'}
• Rainbow: ${isRainbowActive ? 'Active' : 'Inactive'}
• Party: ${isPartyActive ? 'Active' : 'Inactive'}
• CareerMusai: ${isCareerMusaiActive ? 'Active' : 'Inactive'}
• Theme: ${document.documentElement.classList.contains('dark') ? 'Dark' : 'Light'}`;
      
      case 'colors':
        return `Available mood colors:
${Object.entries(musicalMoodColors).map(([mood, color]) => `• ${mood}: ${color}`).join('\n')}`;
      
      case 'clear':
        return 'CLEAR_CONSOLE';
      
      case 'matrix':
        toggleMatrix();
        return isMatrixActive ? 'Matrix effect deactivated.' : 'Matrix effect activated... Welcome to the Musai reality.';
      
      case 'rainbow':
        toggleRainbow();
        return isRainbowActive ? 'Rainbow mode deactivated.' : '🌈 Rainbow mode activated! Cycling through all moods...';
      
      case 'party':
        toggleParty();
        return isPartyActive ? 'Party mode deactivated.' : '🎉 Party mode activated! Musai is now energetic!';
      
      case 'zen':
        setMood('zen');
        return '🧘 Zen mode activated. Musai is now serene and focused.';
      
      case 'test-emotion':
        return 'Testing emotion effects... Try saying: "🎉 Congratulations! This is amazing!" or "🔮 This is mysterious and intriguing..." or "🎨 This is so creative and artistic!"';
      
      case 'careermusai':
        const newCareerState = !isCareerMusaiActive;
        setIsCareerMusaiActive(newCareerState);
        localStorage.setItem('musai-career-mode', String(newCareerState));
        return newCareerState ? '🎯 CareerMusai mode activated! Career development tool is now available in the navigation menu.' : '🎯 CareerMusai mode deactivated.';
      
      default:
        if (cmd.startsWith('mood ')) {
          const newMood = cmd.substring(5);
          if (musicalMoodColors[newMood as keyof typeof musicalMoodColors]) {
            setMood(newMood);
            return `Mood changed to: ${newMood}`;
          } else {
            return `Unknown mood: ${newMood}. Available: ${Object.keys(musicalMoodColors).join(', ')}`;
          }
        }
        if (cmd.startsWith('moodphrase ')) {
          const phrase = cmd.substring(11);
          updateMoodPhrase(phrase);
          return `Mood phrase set to: "${phrase}". This will be processed by n8n to determine the actual mood.`;
        }
        return `Unknown command: ${command}. Type 'help' for available commands.`;
    }
  };

  // Automatically set mood based on current month if no saved mood
  const getCurrentMonthMood = () => {
    const currentMonth = new Date().getMonth();
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                       'july', 'august', 'september', 'october', 'november', 'december'];
    return monthToColor[monthNames[currentMonth] as keyof typeof monthToColor] || 'default';
  };

  // Load saved mood on mount, or use current month
  useEffect(() => {
    const savedMood = localStorage.getItem('musai-mood');
    if (savedMood && musicalMoodColors[savedMood as keyof typeof musicalMoodColors]) {
      setCurrentMood(savedMood);
    } else {
      // Auto-set based on current month if no saved preference
      const monthMood = getCurrentMonthMood();
      setCurrentMood(monthMood);
      localStorage.setItem('musai-mood', monthMood);
    }

    // Load saved mood phrase
    const savedMoodPhrase = localStorage.getItem('musai-mood-phrase');
    if (savedMoodPhrase) {
      setMoodPhrase(savedMoodPhrase);
    }

    // Load CareerMusai state
    const savedCareerState = localStorage.getItem('musai-career-mode');
    if (savedCareerState === 'true') {
      setIsCareerMusaiActive(true);
    }
  }, []);

  return (
    <MusaiMoodContext.Provider value={{
      currentMood,
      moodPhrase,
      accentColor,
      isDevConsoleOpen,
      isMatrixActive,
      isRainbowActive,
      isPartyActive,
      isCareerMusaiActive,
      setMood,
      setMoodPhrase: updateMoodPhrase,
      setToolColor,
      applyDynamicGlow,
      removeDynamicGlow,
      toggleCareerMusai,
      toggleDevConsole,
      toggleMatrix,
      toggleRainbow,
      toggleParty,
      executeCommand
    }}>
      {children}
    </MusaiMoodContext.Provider>
  );
}

export function useMusaiMood() {
  const context = useContext(MusaiMoodContext);
  if (context === undefined) {
    throw new Error('useMusaiMood must be used within a MusaiMoodProvider');
  }
  return context;
}

// Helper function to convert hex to RGB
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `${r}, ${g}, ${b}`;
  }
  return '139, 92, 246'; // Default purple RGB
}