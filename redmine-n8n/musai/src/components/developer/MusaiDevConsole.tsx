import React, { useState, useRef, useEffect } from 'react';
import { X, Terminal, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMusaiMood } from '@/contexts/MusaiMoodContext';
import { cn } from '@/lib/utils';

interface ConsoleEntry {
  type: 'command' | 'output' | 'error';
  content: string;
  timestamp: Date;
}

export function MusaiDevConsole() {
  const { isDevConsoleOpen, toggleDevConsole, executeCommand, currentMood, accentColor } = useMusaiMood();
  const [entries, setEntries] = useState<ConsoleEntry[]>([
    {
      type: 'output',
      content: 'Musai Developer Console v1.0.0\nType "help" for system commands or just describe what you need—Musai will route it.',
      timestamp: new Date()
    }
  ]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when console opens
  useEffect(() => {
    if (isDevConsoleOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isDevConsoleOpen]);

  // Handle escape key to close console
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDevConsoleOpen) {
        toggleDevConsole();
      }
    };

    if (isDevConsoleOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isDevConsoleOpen, toggleDevConsole]);

  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      } else {
        // Fallback to direct scrolling
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
  }, [entries]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollElement) {
          scrollElement.scrollTop = scrollElement.scrollHeight;
        } else {
          // Fallback to direct scrolling
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }
    }, 100); // Small delay to ensure DOM is updated
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCommand.trim()) return;

    // Add command to entries
    const commandEntry: ConsoleEntry = {
      type: 'command',
      content: currentCommand,
      timestamp: new Date()
    };

    // Execute command
    const result = executeCommand(currentCommand);
    
    // Handle special commands
    if (result.code === 'clear') {
      setEntries([{
        type: 'output',
        content: result.message,
        timestamp: new Date()
      }]);
    } else {
      // Add result to entries
      const resultEntry: ConsoleEntry = {
        type: 'output',
        content: result.message,
        timestamp: new Date()
      };
      setEntries(prev => [...prev, commandEntry, resultEntry]);
    }

    // Update command history
    setCommandHistory(prev => [...prev, currentCommand]);
    setCurrentCommand('');
    setHistoryIndex(-1);

    // Scroll to bottom after command execution
    scrollToBottom();

    if (result.code === 'forward') {
      setTimeout(() => {
        toggleDevConsole();
      }, 350);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex >= 0) {
        const newIndex = Math.min(commandHistory.length - 1, historyIndex + 1);
        if (newIndex === commandHistory.length - 1 && historyIndex === newIndex) {
          setHistoryIndex(-1);
          setCurrentCommand('');
        } else {
          setHistoryIndex(newIndex);
          setCurrentCommand(commandHistory[newIndex]);
        }
      }
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only close if clicking the overlay itself, not the console content
    if (e.target === e.currentTarget) {
      toggleDevConsole();
    }
  };

  if (!isDevConsoleOpen) return null;

  return (
    <>
      {/* Matrix-like overlay */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] transition-all duration-500 cursor-pointer" 
        onClick={handleOverlayClick}
      >
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          {/* Matrix rain effect */}
          <div className="matrix-rain">
            {Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                className="matrix-column"
                style={{
                  left: `${i * 5}%`,
                  animationDelay: `${i * 0.1}s`,
                  color: accentColor
                }}
              >
                {Array.from({ length: 20 }, (_, j) => (
                  <div key={j} className="matrix-char">
                    {String.fromCharCode(0x30A0 + Math.random() * 96)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Console Window */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[70vh] max-w-4xl">
          <div 
            ref={consoleRef}
            className="bg-black/90 border-2 rounded-lg shadow-2xl h-full flex flex-col overflow-hidden cursor-default"
            style={{ borderColor: accentColor }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: accentColor }}>
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5" style={{ color: accentColor }} />
                <span className="font-mono text-sm" style={{ color: accentColor }}>
                  Musai Developer Console [{currentMood}]
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDevConsole}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Console Content */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="font-mono text-sm space-y-2">
                {entries.map((entry, index) => (
                  <div key={index} className="flex items-start gap-2">
                    {entry.type === 'command' && (
                      <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: accentColor }} />
                    )}
                    <div className={cn(
                      "whitespace-pre-wrap",
                      entry.type === 'command' && "text-white",
                      entry.type === 'output' && "text-gray-300",
                      entry.type === 'error' && "text-red-400"
                    )}>
                      {entry.content}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t" style={{ borderColor: accentColor }}>
              <form onSubmit={handleCommandSubmit} className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: accentColor }} />
                <Input
                  ref={inputRef}
                  value={currentCommand}
                  onChange={(e) => setCurrentCommand(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a command or ask Musai..."
                  className="bg-transparent border-none text-white font-mono focus:ring-0 focus:ring-offset-0"
                  style={{ caretColor: accentColor }}
                />
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
