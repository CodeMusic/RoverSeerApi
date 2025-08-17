import React from 'react';
import { Message } from '@/types/chat';
import { User, Bot, Clock, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer';
import { MysticalTypingIndicator } from '@/components/chat/MysticalTypingIndicator';
import { StreamingText } from '@/components/chat/StreamingText';
import { useTheme } from '@/contexts/ThemeContext';
import { APP_TERMS, MUSAI_COLORS } from '@/config/constants';
import { hexToRgba } from '@/utils/chroma';

interface MessageBubbleProps {
  message: Message;
  roleConfig: {
    user?: string;
    assistant?: string;
  };
  module: string;
  onContextMenu?: (event: React.MouseEvent) => void;
  isTyping?: boolean;
  theme: {
    container: string;
    accent: string;
    border: string;
  };
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  roleConfig,
  module,
  onContextMenu,
  isTyping = false,
  theme
}) => {
  const isUser = message.role === 'user';
  const displayName = isUser ? roleConfig.user : roleConfig.assistant;
  const { isDark } = useTheme();

  const formatNaturalTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();

    const sameDay = (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );

    const yesterdayRef = new Date(now);
    yesterdayRef.setDate(now.getDate() - 1);
    const yesterday = (
      date.getFullYear() === yesterdayRef.getFullYear() &&
      date.getMonth() === yesterdayRef.getMonth() &&
      date.getDate() === yesterdayRef.getDate()
    );

    const to12Hour = (d: Date): string => {
      let h = d.getHours();
      const m = d.getMinutes().toString().padStart(2, '0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      if (h === 0) h = 12;
      return `${h}:${m} ${ampm}`;
    };

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const ordinal = (n: number) => {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return s[(v - 20) % 10] || s[v] || s[0];
    };

    const time = to12Hour(date);
    if (sameDay) return `Today at ${time}`;
    if (yesterday) return `Yesterday at ${time}`;
    return `${monthNames[date.getMonth()]} ${day}${ordinal(day)}, ${date.getFullYear()} at ${time}`;
  };

  const getModuleSpecificStyling = () => {
    switch (module) {
      case 'therapy':
        return {
          userBubble: 'bg-pink-100 dark:bg-pink-900/35 border-pink-200 dark:border-pink-500',
          assistantBubble: 'bg-neutral-100 dark:bg-neutral-800/90 border-neutral-200 dark:border-neutral-500',
          userText: 'text-pink-900 dark:text-pink-100',
          assistantText: 'text-neutral-800 dark:text-neutral-100'
        };
      case 'code':
        return {
          userBubble: 'bg-slate-100 dark:bg-slate-800/90 border-slate-200 dark:border-slate-500',
          assistantBubble: 'bg-neutral-100 dark:bg-neutral-800/90 border-neutral-200 dark:border-neutral-500',
          userText: 'text-slate-900 dark:text-slate-50',
          assistantText: 'text-neutral-800 dark:text-neutral-100'
        };
      case 'career':
        return {
          userBubble: 'bg-indigo-100 dark:bg-indigo-900/35 border-indigo-200 dark:border-indigo-500',
          assistantBubble: 'bg-neutral-100 dark:bg-neutral-800/90 border-neutral-200 dark:border-neutral-500',
          userText: 'text-indigo-900 dark:text-indigo-100',
          assistantText: 'text-neutral-800 dark:text-neutral-100'
        };
      case 'narrative':
        return {
          userBubble: 'bg-blue-100 dark:bg-blue-900/35 border-blue-200 dark:border-blue-500',
          assistantBubble: 'bg-neutral-100 dark:bg-neutral-800/90 border-neutral-200 dark:border-neutral-500',
          userText: 'text-blue-900 dark:text-blue-100',
          assistantText: 'text-neutral-800 dark:text-neutral-100'
        };
      default:
        return {
          userBubble: 'bg-gray-100 dark:bg-gray-800/90 border-gray-200 dark:border-gray-500',
          assistantBubble: 'bg-neutral-100 dark:bg-neutral-800/90 border-neutral-200 dark:border-neutral-500',
          userText: 'text-gray-900 dark:text-gray-100',
          assistantText: 'text-neutral-800 dark:text-neutral-100'
        };
    }
  };

  const styling = getModuleSpecificStyling();
  const [activePov, setActivePov] = React.useState<'logical' | 'creative' | null>(null);

  const PovPanels: React.FC<{ message: Message; active: 'logical' | 'creative' | null; setActive: React.Dispatch<React.SetStateAction<'logical' | 'creative' | null>> }> = ({ message, active, setActive }) => {
    const logical = (message as any).logicalThought as string | undefined
      || (Array.isArray((message as any).pov) ? (message as any).pov.find((p: any) => String(p?.type || '').toLowerCase().includes('logic'))?.thought : undefined);
    const creative = (message as any).creativeThought as string | undefined
      || (Array.isArray((message as any).pov) ? (message as any).pov.find((p: any) => String(p?.type || '').toLowerCase().includes('creativ'))?.thought : undefined);
    const hasLogical = Boolean(logical);
    const hasCreative = Boolean(creative);
    return (
      <div className="w-full mb-2">
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            onClick={() => hasLogical && setActive(prev => prev === 'logical' ? null : 'logical')}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-colors",
              hasLogical ? (active === 'logical' ? "bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700 text-red-900 dark:text-red-200" : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300") : "opacity-50 cursor-not-allowed bg-red-50 dark:bg-red-950/20 border-red-200/50 dark:border-red-800/40 text-red-800/50 dark:text-red-300/50"
            )}
            aria-pressed={active === 'logical'}
            aria-disabled={!hasLogical}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Logical</span>
          </button>
          <button
            type="button"
            onClick={() => hasCreative && setActive(prev => prev === 'creative' ? null : 'creative')}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-colors",
              hasCreative ? (active === 'creative' ? "bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200" : "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300") : "opacity-50 cursor-not-allowed bg-blue-50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-800/40 text-blue-800/50 dark:text-blue-300/50"
            )}
            aria-pressed={active === 'creative'}
            aria-disabled={!hasCreative}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Creative</span>
          </button>
        </div>
        {active === 'logical' && logical && (
          <div className="rounded-md border p-3 text-sm bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200 pov-panel pov-electric-red">
            <div className="flex items-center gap-2 mb-1">
              <Brain className="w-3.5 h-3.5" />
              <span className="font-medium">Logical</span>
            </div>
            <div className="whitespace-pre-wrap">{logical}</div>
          </div>
        )}
        {active === 'creative' && creative && (
          <div className="rounded-md border p-3 text-sm bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 pov-panel pov-shimmer-blue">
            <div className="flex items-center gap-2 mb-1">
              <Brain className="w-3.5 h-3.5" />
              <span className="font-medium">Creative</span>
            </div>
            <div className="whitespace-pre-wrap">{creative}</div>
          </div>
        )}
      </div>
    );
  };

  // Map current module to tab key → chroma color
  const moduleToTab: Record<string, string> = {
    therapy: APP_TERMS.TAB_THERAPY,
    chat: APP_TERMS.TAB_CHAT,
    code: APP_TERMS.TAB_CODE,
    university: APP_TERMS.TAB_UNIVERSITY,
    career: APP_TERMS.TAB_CAREER,
    narrative: APP_TERMS.TAB_NARRATIVE,
    task: APP_TERMS.TAB_TASK,
    eye: APP_TERMS.TAB_EYE,
  };
  const userBubbleStyle: React.CSSProperties | undefined = (() => {
    const tab = moduleToTab[module];
    const hex = tab ? MUSAI_COLORS[tab] : undefined;
    if (!hex) return undefined;
    return {
      backgroundColor: hexToRgba(hex, 0.06),
      borderColor: hexToRgba(hex, 0.32),
    };
  })();

  const isLikelyMarkdown = (text: string): boolean => {
    if (!text) return false;
    return (
      /(^|\n)```/.test(text) || // code block
      /`[^`]+`/.test(text) || // inline code
      /\[[^\]]+\]\([^\)]+\)/.test(text) || // links
      /(^|\n)#{1,6}\s+/.test(text) || // headings
      /(^|\n)(-|\*|\+)\s+/.test(text) || // bullet lists
      /(^|\n)\d+\.\s+/.test(text) || // numbered lists
      /!\[[^\]]*\]\([^\)]+\)/.test(text) || // images
      /\|[^\n]*\|/.test(text) // tables
    );
  };

  return (
    <div 
      className={cn(
        "flex gap-3 group",
        isUser ? "justify-end" : "justify-start"
      )}
      onContextMenu={onContextMenu}
    >
      {/* Avatar */}
      {!isUser && (
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          styling.assistantBubble,
          "border"
        )}>
          <Bot className="w-4 h-4" />
        </div>
      )}

      {/* Message Content */}
      <div className={cn(
        "max-w-[70%] flex flex-col",
        isUser ? "items-end" : "items-start"
      )}>
        {/* Name and Time */}
        <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground">
          <span>{displayName}</span>
          <Clock className="w-3 h-3" />
          <span>{formatNaturalTimestamp(message.timestamp)}</span>
        </div>

        {/* Assistant POV toggles and panels (logical/creative). Controlled state to prevent auto-close. */}
        {!isUser && <PovPanels message={message} active={activePov} setActive={setActivePov} />}

        {/* Message Bubble */}
        <div className={cn(
          "rounded-lg px-4 py-2 border-2 imsg-bubble",
          isUser ? cn(styling.userBubble, "imsg-user") : cn(styling.assistantBubble, "imsg-ai"),
          isTyping && "animate-pulse",
          isTyping && !isUser && "flex items-center justify-center"
        )} style={isUser ? userBubbleStyle : undefined}>
          <div className={cn(
            isUser 
              ? cn(styling.userText, "text-[1.2rem] md:text-[1.28rem] leading-8 font-user-sans") 
              : cn(styling.assistantText, "text-[1rem] md:text-[1.06rem] leading-7 font-ai-mono")
          )}>
            {isTyping && !isUser ? (
              <div className="w-full flex items-center justify-center py-1" aria-label="Musai is thinking">
                <MysticalTypingIndicator isDarkMode={isDark} align="center" />
              </div>
            ) : (
              <div className="prose prose-slate dark:prose-invert max-w-none break-words">
                {isLikelyMarkdown(message.content)
                  ? <MarkdownRenderer content={message.content} />
                  : <StreamingText content={message.content} />}
              </div>
            )}
          </div>

          {/* Image Data if present */}
          {message.imageData && (
            <div className="mt-2">
              <img 
                src={`data:${message.imageData.mimeType};base64,${message.imageData.data}`}
                alt={message.imageData.fileName}
                className="max-w-full rounded border"
              />
              <div className="text-xs text-muted-foreground mt-1">
                {message.imageData.fileName}
              </div>
            </div>
          )}

          {/* Thoughts for therapy module */}
          {module === 'therapy' && message.thoughts && (
            <div className="mt-2 pt-2 border-t border-purple-200 dark:border-purple-700">
              <div className="text-xs text-purple-600 dark:text-purple-400 italic">
                Internal reflection: {message.thoughts}
              </div>
            </div>
          )}
        </div>

        {/* Message Actions (visible on hover) */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex gap-1">
          {/* Module-specific action buttons can go here */}
          {module === 'therapy' && (
            <button 
              className="text-xs px-2 py-1 rounded bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900 dark:hover:bg-purple-800 dark:text-purple-300"
              onClick={() => console.log('Export to narrative')}
            >
              Export to Tale
            </button>
          )}
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          styling.userBubble,
          "border"
        )}>
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};
