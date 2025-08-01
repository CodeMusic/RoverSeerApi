import React, { createContext, useContext, useState, useEffect } from 'react';

interface MusaiMoodContextType {
  currentMood: string;
  accentColor: string;
  isDevConsoleOpen: boolean;
  setMood: (mood: string) => void;
  toggleDevConsole: () => void;
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
  const [isDevConsoleOpen, setIsDevConsoleOpen] = useState(false);

  const accentColor = musicalMoodColors[currentMood as keyof typeof musicalMoodColors] || musicalMoodColors.default;

  // Apply CSS custom properties for mood colors
  useEffect(() => {
    document.documentElement.style.setProperty('--musai-accent', accentColor);
    document.documentElement.style.setProperty('--musai-accent-rgb', hexToRgb(accentColor));
  }, [accentColor]);

  const setMood = (mood: string) => {
    if (musicalMoodColors[mood as keyof typeof musicalMoodColors]) {
      setCurrentMood(mood);
      localStorage.setItem('musai-mood', mood);
    }
  };

  const toggleDevConsole = () => {
    setIsDevConsoleOpen(prev => !prev);
  };

  const executeCommand = (command: string): string => {
    const cmd = command.toLowerCase().trim();
    
    switch (cmd) {
      case 'help':
        return `Available commands:
• mood <name> - Change Musai's mood (${Object.keys(musicalMoodColors).join(', ')})
• status - Show current system status
• clear - Clear console
• matrix - Toggle matrix effect
• colors - Show all available mood colors`;
      
      case 'status':
        return `Musai Status:
• Mood: ${currentMood}
• Accent Color: ${accentColor}
• Console: Active
• Theme: ${document.documentElement.classList.contains('dark') ? 'Dark' : 'Light'}`;
      
      case 'colors':
        return `Available mood colors:
${Object.entries(musicalMoodColors).map(([mood, color]) => `• ${mood}: ${color}`).join('\n')}`;
      
      case 'clear':
        return 'CLEAR_CONSOLE';
      
      case 'matrix':
        return 'Matrix effect activated... Welcome to the Musai reality.';
      
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
  }, []);

  return (
    <MusaiMoodContext.Provider value={{
      currentMood,
      accentColor,
      isDevConsoleOpen,
      setMood,
      toggleDevConsole,
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