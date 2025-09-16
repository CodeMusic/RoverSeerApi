import React, { createContext, useContext, useState, useEffect } from 'react';
import type { MusaiDiscoverModule } from '@/lib/discoveryApi';

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
  activateRainbowWithPersistence: (pagesRemaining: number) => void;
  decrementRainbowPersistence: () => void;
  toggleParty: () => void;
  disableEffects: () => void;
  executeCommand: (command: string) => { message: string; code?: 'clear' | 'forward' };
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

// Day of week to color mapping (initial default mood)
const dayToColor = {
  'sunday': 'c-red',
  'monday': 'd-orange',
  'tuesday': 'e-yellow',
  'wednesday': 'f-green',
  'thursday': 'g-blue',
  'friday': 'a-indigo',
  'saturday': 'b-violet'
};

export function MusaiMoodProvider({ children }: { children: React.ReactNode }) {
  const [currentMood, setCurrentMood] = useState('default');
  const [moodPhrase, setMoodPhrase] = useState('');
  const [isDevConsoleOpen, setIsDevConsoleOpen] = useState(false);
  const [isMatrixActive, setIsMatrixActive] = useState(false);
  const [isRainbowActive, setIsRainbowActive] = useState(false);
  const [isPartyActive, setIsPartyActive] = useState(false);
  const [isCareerMusaiActive, setIsCareerMusaiActive] = useState(false);
  const [isStatusBarForced, setIsStatusBarForced] = useState(false);

  const accentColor = musicalMoodColors[currentMood as keyof typeof musicalMoodColors] || musicalMoodColors.default;

  // Apply CSS custom properties for mood colors
  useEffect(() => {
    document.documentElement.style.setProperty('--musai-accent', accentColor);
    document.documentElement.style.setProperty('--musai-accent-rgb', hexToRgb(accentColor));
  }, [accentColor]);

  const setMood = (mood: string) => {
    setCurrentMood(mood);
    localStorage.setItem('musai-mood', mood);
    try
    {
      localStorage.setItem('musai-mood-date', getTodayKey());
    }
    catch {}
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

  // Activate rainbow and persist it across a limited number of route changes
  const activateRainbowWithPersistence = (pagesRemaining: number) =>
  {
    setIsMatrixActive(false);
    setIsPartyActive(false);
    setIsRainbowActive(true);
    try
    {
      sessionStorage.setItem('musai-rainbow-persist', String(Math.max(0, pagesRemaining)));
      // Ensure base intensity is set for immediate visual consistency
      document.documentElement.style.setProperty('--musai-rainbow-intensity', '1');
    }
    catch
    {
      // ignore storage errors
    }
  };

  const decrementRainbowPersistence = () =>
  {
    try
    {
      const raw = sessionStorage.getItem('musai-rainbow-persist');
      if (raw === null)
      {
        return;
      }
      const remaining = parseInt(raw, 10);
      if (Number.isNaN(remaining))
      {
        sessionStorage.removeItem('musai-rainbow-persist');
        return;
      }

      if (remaining <= 0)
      {
        document.documentElement.style.removeProperty('--musai-rainbow-intensity');
        sessionStorage.removeItem('musai-rainbow-persist');
        setIsRainbowActive(false);
        return;
      }

      // Map remaining pages to intensity
      // 3 -> 1.0, 2 -> 0.6, 1 -> 0.3
      const intensity = remaining >= 3 ? 1 : remaining === 2 ? 0.6 : 0.3;
      document.documentElement.style.setProperty('--musai-rainbow-intensity', String(intensity));
      sessionStorage.setItem('musai-rainbow-persist', String(remaining - 1));

      // Ensure effect is active while persisting
      setIsRainbowActive(true);
    }
    catch
    {
      // ignore storage errors
    }
  };

  const toggleParty = () => {
    setIsMatrixActive(false);
    setIsRainbowActive(false);
    setIsPartyActive(prev => !prev);
  };

  // Force-disable all active visual effects
  const disableEffects = () => {
    setIsMatrixActive(false);
    setIsRainbowActive(false);
    setIsPartyActive(false);
    try {
      document.documentElement.style.removeProperty('--musai-rainbow-intensity');
    } catch {}
  };

  const toggleCareerMusai = () => {
    const newState = !isCareerMusaiActive;
    setIsCareerMusaiActive(newState);
    localStorage.setItem('musai-career-mode', String(newState));
  };

  const executeCommand = (command: string): { message: string; code?: 'clear' | 'forward' } => {
    const cmd = command.toLowerCase().trim();

    switch (cmd) {
      case 'help':
        return { message: `Available commands:
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
• colors - Show all available mood colors
• stats - Toggle live status banner` };
      
      case 'status':
        return { message: `Musai Status:
• Mood: ${currentMood}
• Mood Phrase: ${moodPhrase || 'Not set'}
• Accent Color: ${accentColor}
• Console: Active
• Matrix: ${isMatrixActive ? 'Active' : 'Inactive'}
• Rainbow: ${isRainbowActive ? 'Active' : 'Inactive'}
• Party: ${isPartyActive ? 'Active' : 'Inactive'}
• CareerMusai: ${isCareerMusaiActive ? 'Active' : 'Inactive'}
• Theme: ${document.documentElement.classList.contains('dark') ? 'Dark' : 'Light'}` };
      
      case 'colors':
        return { message: `Available mood colors:
${Object.entries(musicalMoodColors).map(([mood, color]) => `• ${mood}: ${color}`).join('\n')}` };
      
      case 'clear':
        return { message: 'Console cleared.', code: 'clear' };
      
      case 'matrix':
        toggleMatrix();
        return { message: isMatrixActive ? 'Matrix effect deactivated.' : 'Matrix effect activated... Welcome to the Musai reality.' };
      
      case 'rainbow':
        toggleRainbow();
        return { message: isRainbowActive ? 'Rainbow mode deactivated.' : '🌈 Rainbow mode activated! Cycling through all moods...' };
      
      case 'party':
        toggleParty();
        return { message: isPartyActive ? 'Party mode deactivated.' : '🎉 Party mode activated! Musai is now energetic!' };

      case 'zen':
        setMood('zen');
        return { message: '🧘 Zen mode activated. Musai is now serene and focused.' };

      case 'stats':
      {
        const next = !isStatusBarForced;
        setIsStatusBarForced(next);
        window.dispatchEvent(new CustomEvent('musai-status-override', { detail: { active: next } }));
        return { message: next ? 'Status banner activated.' : 'Status banner hidden.' };
      }

      case 'test-emotion':
        return { message: 'Testing emotion effects... Try saying: "🎉 Congratulations! This is amazing!" or "🔮 This is mysterious and intriguing..." or "🎨 This is so creative and artistic!"' };
      
      case 'careermusai':
        const newCareerState = !isCareerMusaiActive;
        setIsCareerMusaiActive(newCareerState);
        localStorage.setItem('musai-career-mode', String(newCareerState));
        return { message: newCareerState ? '🎯 CareerMusai mode activated! Career development tool is now available in the navigation menu.' : '🎯 CareerMusai mode deactivated.' };
      
      default:
        if (cmd.startsWith('mood ')) {
          const newMood = cmd.substring(5);
          if (musicalMoodColors[newMood as keyof typeof musicalMoodColors]) {
            setMood(newMood);
            return { message: `Mood changed to: ${newMood}` };
          } else {
            return { message: `Unknown mood: ${newMood}. Available: ${Object.keys(musicalMoodColors).join(', ')}` };
          }
        }
        if (cmd.startsWith('moodphrase ')) {
          const phrase = cmd.substring(11);
          updateMoodPhrase(phrase);
          return { message: `Mood phrase set to: "${phrase}". This will be processed by n8n to determine the actual mood.` };
        }
        // Fall through: forward unknown command to n8n
        forwardUnknownCommandToN8n(command);
        triggerMusaiDiscover(command);
        return { message: `Musai heard “${command}”. Routing to the right Muse…`, code: 'forward' };
    }
  };

  // Forward unknown commands to n8n webhook with basic auth and metadata
  async function forwardUnknownCommandToN8n(rawCommand: string)
  {
    try
    {
      // Get client IP for sessionId via a public IP endpoint
      let sessionId = '';
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        if (ipRes.ok) {
          const data = await ipRes.json();
          sessionId = data?.ip || '';
        }
      } catch {}

      const baseUrl = (await import('@/config/n8nEndpoints')).N8N_ENDPOINTS.BASE_URL;
      const url = `${baseUrl}/codemusicca`;
      const body = new URLSearchParams();
      body.set('type', 'musai');
      if (sessionId) body.set('sessionId', sessionId);
      body.set('command', rawCommand);

      const credentials = btoa('siteuser:codemusai');
      await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
        mode: 'cors',
      });
    }
    catch
    {
      // Swallow network errors in UI; console remains responsive
    }
  }

  async function triggerMusaiDiscover(rawCommand: string)
  {
    const query = rawCommand.trim();
    if (!query)
    {
      return;
    }
    try
    {
      const { discoverMusaiModule } = await import('@/lib/discoveryApi');
      const module = await discoverMusaiModule(query);
      try
      {
        sessionStorage.setItem('musai-discover-payload', JSON.stringify({ module, query }));
      }
      catch
      {
        // ignore storage errors
      }
      window.dispatchEvent(new CustomEvent('musai-discover-request', { detail: { module, query } }));
      await navigateForModule(module, query);
    }
    catch
    {
      try
      {
        sessionStorage.setItem('musai-discover-payload', JSON.stringify({ module: 'chat', query }));
      }
      catch {}
      window.dispatchEvent(new CustomEvent('musai-discover-request', { detail: { module: 'chat', query } }));
      await navigateForModule('chat', query);
    }
  }

  async function navigateForModule(module: MusaiDiscoverModule | string, query: string)
  {
    const { RouteUtils, ROUTES } = await import('@/config/routes');
    const target = (() =>
    {
      switch (module)
      {
        case 'research':
          return RouteUtils.mainAppWithMode('search', query);
        case 'tale':
          return RouteUtils.mainAppWithMode('narrative', query);
        case 'story':
          return RouteUtils.mainAppWithMode('narrative', query);
        case 'search':
        case 'chat':
        case 'university':
        case 'eye':
        case 'medical':
        case 'therapy':
        case 'career':
        case 'code':
          return RouteUtils.mainAppWithMode(module, query);
        case 'agile':
          return ROUTES.TASK_MUSAI_CONSOLE;
        default:
          return RouteUtils.mainAppWithMode('chat', query);
      }
    })();
    if (target)
    {
      // Use full navigation to guarantee Router picks up the route and query params
      window.location.assign(target);
    }
  }

  // Automatically set mood based on current month if no saved mood
  const getCurrentMonthMood = () => {
    const currentMonth = new Date().getMonth();
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                       'july', 'august', 'september', 'october', 'november', 'december'];
    return monthToColor[monthNames[currentMonth] as keyof typeof monthToColor] || 'default';
  };

  // Load saved mood on mount, or use current day-of-week default
  useEffect(() => {
    const savedMood = localStorage.getItem('musai-mood');
    const savedDate = localStorage.getItem('musai-mood-date');
    const todayKey = getTodayKey();

    if (savedMood && savedDate === todayKey && musicalMoodColors[savedMood as keyof typeof musicalMoodColors])
    {
      setCurrentMood(savedMood);
    }
    else
    {
      // Auto-set based on current day of week if no valid saved preference for today
      const dayMood = getCurrentDayMood();
      setCurrentMood(dayMood);
      localStorage.setItem('musai-mood', dayMood);
      try { localStorage.setItem('musai-mood-date', todayKey); } catch {}
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
    // Schedule reset at next local midnight to rotate mood with day change
    const scheduleReset = () =>
    {
      const ms = msUntilMidnight();
      return window.setTimeout(() =>
      {
        const nextMood = getCurrentDayMood();
        setCurrentMood(nextMood);
        try
        {
          localStorage.setItem('musai-mood', nextMood);
          localStorage.setItem('musai-mood-date', getTodayKey());
        }
        catch {}
        // Reschedule for subsequent midnights
        timerId = scheduleReset();
      }, ms);
    };

    let timerId = scheduleReset();
    return () => { if (timerId) { clearTimeout(timerId); } };
  }, []);

  // Determine mood based on current day of week
  function getCurrentDayMood()
  {
    const dayIndex = new Date().getDay(); // 0 (Sun) - 6 (Sat)
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return dayToColor[dayNames[dayIndex] as keyof typeof dayToColor] || 'default';
  }

  // Return YYYY-MM-DD in local time for day comparisons
  function getTodayKey()
  {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Milliseconds until next local midnight
  function msUntilMidnight()
  {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    return Math.max(0, midnight.getTime() - now.getTime());
  }

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
      activateRainbowWithPersistence,
      decrementRainbowPersistence,
      toggleParty,
      disableEffects,
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
