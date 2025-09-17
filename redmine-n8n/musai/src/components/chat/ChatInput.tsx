import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Heart, Brain } from 'lucide-react';
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

const MODULE_LABEL: Record<string, string> = {
  therapy: 'Therapy',
  chat: 'Chat',
  code: 'Code',
  university: 'University',
  career: 'Career',
  search: 'Research',
  narrative: 'Tale',
  task: 'Agile',
  eye: 'Eye',
};

export const ChatInput: React.FC<ChatInputProps> = ({
  module,
  onMessageSend,
  isLoading = false,
  streamEnabled = true,
  onToggleStream,
  effectsEnabled = true,
  onToggleEffects,
  placeholder,
  theme: _theme,
  prefixText,
  showControls = true,
  perspectiveEnabled = false,
  onTogglePerspective
}) => {
  const [input, setInput] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    switch (module) {
      case 'therapy':
        return "Share what's on your mind…";
      case 'code':
        return 'Ask about code, request help, or describe what you want to build…';
      case 'career':
        return 'Ask about your career, job search, or professional development…';
      case 'university':
        return 'Ask questions about your studies or request help with topics…';
      default:
        return 'Type your message…';
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

    setInput('');
    setSelectedMood('');
    await onMessageSend(aiPayload);
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

  const therapyMoods = THERAPY_MOODS;
  const moduleLabel = MODULE_LABEL[module] ?? 'Musai';

  return (
    <div className="musai-copilot-dock">
      <div className="musai-copilot-glow" aria-hidden />
      <div className="musai-copilot-panel mystical-glow">
        <header className="musai-copilot-header">
          <div className="flex items-center gap-3">
            <div className="musai-copilot-badge">{moduleLabel}</div>
            {showControls && (
              <div className="flex items-center gap-2">
                <span className="musai-copilot-label">POV</span>
                <div className="musai-copilot-toggle">
                  <button
                    type="button"
                    onClick={() => onTogglePerspective && onTogglePerspective(false)}
                    className={cn('musai-copilot-toggle-button', !perspectiveEnabled && 'is-active')}
                    aria-pressed={!perspectiveEnabled}
                    aria-label="Quick mode"
                  >
                    Quick
                  </button>
                  <button
                    type="button"
                    onClick={() => onTogglePerspective && onTogglePerspective(true)}
                    className={cn('musai-copilot-toggle-button', perspectiveEnabled && 'is-active')}
                    aria-pressed={perspectiveEnabled}
                    aria-label="Perspective Thinking mode"
                  >
                    Perspective
                  </button>
                </div>
              </div>
            )}
          </div>
          {showControls && module !== 'code' && (
            <div className="flex items-center gap-4 text-[11px] uppercase tracking-[0.22em] text-white/70">
              <label className="musai-copilot-switch">
                <span>Stream</span>
                <Switch
                  checked={streamEnabled}
                  onCheckedChange={(v) => onToggleStream && onToggleStream(Boolean(v))}
                  aria-label="Toggle streaming responses"
                  className="musai-copilot-switch-control"
                />
              </label>
              <label className="musai-copilot-switch">
                <span>Effects</span>
                <Switch
                  checked={effectsEnabled}
                  onCheckedChange={(v) => onToggleEffects && onToggleEffects(Boolean(v))}
                  aria-label="Toggle visual effects"
                  className="musai-copilot-switch-control"
                />
              </label>
            </div>
          )}
        </header>

        {module === 'therapy' && (
          <div className="musai-copilot-mood">
            <div className="flex flex-wrap items-center gap-2">
              <span className="musai-copilot-mood-label">Current mood</span>
              {therapyMoods.map((mood) => (
                <button
                  key={mood.label}
                  onClick={() => setSelectedMood(selectedMood === mood.label ? '' : mood.label)}
                  className={cn(
                    'musai-copilot-mood-chip',
                    selectedMood === mood.label && 'musai-copilot-mood-chip--active'
                  )}
                  type="button"
                >
                  <span>{mood.emoji}</span>
                  <span>{mood.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Controls moved into header to reduce lines */}

        <form onSubmit={handleSubmit} className="musai-copilot-form">
          <div className="musai-copilot-input">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={getPlaceholder()}
              className="musai-copilot-textarea"
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="musai-copilot-attach"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>

          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="musai-copilot-send"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        {module === 'therapy' && (
          <div className="musai-copilot-plugins">
            <Button variant="ghost" size="sm" className="musai-copilot-plugin">
              <Brain className="h-3 w-3" />
              Reflection Mode
            </Button>
            <Button variant="ghost" size="sm" className="musai-copilot-plugin">
              <Heart className="h-3 w-3" />
              Wellness Check
            </Button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
        />
      </div>
    </div>
  );
};
