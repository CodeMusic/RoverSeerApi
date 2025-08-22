import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Smile, Heart, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { THERAPY_MOODS } from '@/utils/mood';

interface ChatInputProps {
  module: string;
  onMessageSend: (text: string, file?: File) => Promise<void>;
  isLoading?: boolean;
  streamEnabled?: boolean;
  onToggleStream?: (enabled: boolean) => void;
  effectsEnabled?: boolean;
  onToggleEffects?: (enabled: boolean) => void;
  placeholder?: string;
  theme: {
    container: string;
    accent: string;
    border: string;
  };
  /** Optional text to prepend to the user's message when sending (e.g., contextual code/output) */
  prefixText?: string;
  /** Whether to show the controls row (stream/effects). Defaults to true */
  showControls?: boolean;
  /** Enable/disable Perspective Thinking (POV) mode */
  perspectiveEnabled?: boolean;
  /** Toggle handler for Perspective Thinking (POV) */
  onTogglePerspective?: (enabled: boolean) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  module,
  onMessageSend,
  isLoading = false,
  streamEnabled = true,
  onToggleStream,
  effectsEnabled = true,
  onToggleEffects,
  placeholder,
  theme,
  prefixText,
  showControls = true,
  perspectiveEnabled = false,
  onTogglePerspective
}) => {
  const [input, setInput] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // No envelope; we send plain text with optional inline prefixes so AI sees full context

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    
    switch (module) {
      case 'therapy':
        return 'Share what\'s on your mind...';
      case 'code':
        return 'Ask about code, request help, or describe what you want to build...';
      case 'career':
        return 'Ask about your career, job search, or professional development...';
      case 'university':
        return 'Ask questions about your studies or request help with topics...';
      default:
        return 'Type your message...';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const prefixParts: string[] = [];
    if (prefixText && prefixText.trim()) {
      prefixParts.push(prefixText.trim());
    }
    if (selectedMood && module === 'therapy') {
      prefixParts.push(`[Mood: ${selectedMood}]`);
    }
    const visibleText = input.trim();
    const aiPayload = prefixParts.length > 0 ? `${prefixParts.join(' ')} ${visibleText}` : visibleText;
    const messageText = aiPayload;

    setInput('');
    setSelectedMood('');
    await onMessageSend(messageText);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onMessageSend('', file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Therapy-specific mood tags (centralized)
  const therapyMoods = THERAPY_MOODS;

  return (
    <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-3 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Therapy Mood Selector */}
      {module === 'therapy' && (
        <div className="flex gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Current mood:</span>
          {therapyMoods.map((mood) => (
            <button
              key={mood.label}
              onClick={() => setSelectedMood(selectedMood === mood.label ? '' : mood.label)}
              className={cn(
                "px-2 py-1 rounded-full text-xs flex items-center gap-1 transition-colors",
                selectedMood === mood.label
                  ? "bg-purple-200 text-purple-800 dark:bg-purple-700 dark:text-purple-200"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300"
              )}
            >
              <span>{mood.emoji}</span>
              <span>{mood.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Controls Row */}
      {showControls && (
        <div className="flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
          {/* POV toggle (Quick vs Perspective Thinking) */}
          <div className="w-full sm:w-auto flex items-center gap-2">
            <div className="inline-flex rounded-full border overflow-hidden">
              <button
                type="button"
                onClick={() => onTogglePerspective && onTogglePerspective(false)}
                className={cn(
                  "px-3 py-1 text-xs",
                  !perspectiveEnabled ? "bg-primary text-primary-foreground" : "bg-background text-foreground/70"
                )}
                aria-pressed={!perspectiveEnabled}
                aria-label="Quick mode"
              >
                Quick
              </button>
              <button
                type="button"
                onClick={() => onTogglePerspective && onTogglePerspective(true)}
                className={cn(
                  "px-3 py-1 text-xs border-l",
                  perspectiveEnabled ? "bg-primary text-primary-foreground" : "bg-background text-foreground/70"
                )}
                aria-pressed={perspectiveEnabled}
                aria-label="Perspective Thinking mode"
              >
                Perspective Thinking
              </button>
            </div>
            <span className="hidden sm:inline text-muted-foreground">POV</span>
          </div>
          <div className="inline-flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-end">
            <label className="inline-flex items-center gap-2 whitespace-nowrap">
              <span>Stream</span>
              <Switch
                checked={streamEnabled}
                onCheckedChange={(v) => onToggleStream && onToggleStream(Boolean(v))}
                aria-label="Toggle streaming responses"
              />
            </label>
            <label className="inline-flex items-center gap-2 whitespace-nowrap">
              <span>Effects</span>
              <Switch
                checked={effectsEnabled}
                onCheckedChange={(v) => onToggleEffects && onToggleEffects(Boolean(v))}
                aria-label="Toggle visual effects"
              />
            </label>
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={getPlaceholder()}
            className={cn(
              "min-h-[44px] max-h-32 resize-none pr-12",
              theme.border
            )}
            disabled={isLoading}
          />
          
          {/* File Upload Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
        </div>

        {/* Send Button */}
        <Button
          type="submit"
          disabled={!input.trim() || isLoading}
          className={cn(
            "h-11 px-4",
            theme.accent
          )}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>

      {/* Module-specific plugin zones */}
      {module === 'therapy' && (
        <div className="flex gap-2 text-xs text-muted-foreground">
          <Button variant="ghost" size="sm" className="h-6 px-2">
            <Brain className="h-3 w-3 mr-1" />
            Reflection Mode
          </Button>
          <Button variant="ghost" size="sm" className="h-6 px-2">
            <Heart className="h-3 w-3 mr-1" />
            Wellness Check
          </Button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
      />
    </div>
  );
};