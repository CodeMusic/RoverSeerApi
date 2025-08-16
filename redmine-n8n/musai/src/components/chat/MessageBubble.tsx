import React from 'react';
import { Message } from '@/types/chat';
import { User, Bot, Clock, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer';
import { MysticalTypingIndicator } from '@/components/chat/MysticalTypingIndicator';
import { useTheme } from '@/contexts/ThemeContext';

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

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getModuleSpecificStyling = () => {
    switch (module) {
      case 'therapy':
        return {
          userBubble: 'bg-pink-100 dark:bg-pink-900/30 border-pink-200 dark:border-pink-700',
          assistantBubble: 'bg-pink-50 dark:bg-pink-950/50 border-pink-100 dark:border-pink-800',
          userText: 'text-pink-900 dark:text-pink-100',
          assistantText: 'text-pink-800 dark:text-pink-200'
        };
      case 'code':
        return {
          userBubble: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
          assistantBubble: 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800',
          userText: 'text-slate-900 dark:text-slate-100',
          assistantText: 'text-green-600 dark:text-green-400'
        };
      case 'career':
        return {
          userBubble: 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700',
          assistantBubble: 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-100 dark:border-indigo-800',
          userText: 'text-indigo-900 dark:text-indigo-100',
          assistantText: 'text-indigo-800 dark:text-indigo-200'
        };
      case 'narrative':
        return {
          userBubble: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700',
          assistantBubble: 'bg-blue-50 dark:bg-blue-950/50 border-blue-100 dark:border-blue-800',
          userText: 'text-blue-900 dark:text-blue-100',
          assistantText: 'text-blue-800 dark:text-blue-200'
        };
      default:
        return {
          userBubble: 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
          assistantBubble: 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800',
          userText: 'text-gray-900 dark:text-gray-100',
          assistantText: 'text-gray-800 dark:text-gray-200'
        };
    }
  };

  const styling = getModuleSpecificStyling();

  const PovPanels: React.FC<{ message: Message }> = ({ message }) => {
    const logical = (message as any).logicalThought as string | undefined
      || (Array.isArray((message as any).pov) ? (message as any).pov.find((p: any) => String(p?.type || '').toLowerCase().includes('logic'))?.thought : undefined);
    const creative = (message as any).creativeThought as string | undefined
      || (Array.isArray((message as any).pov) ? (message as any).pov.find((p: any) => String(p?.type || '').toLowerCase().includes('creativ'))?.thought : undefined);
    const [active, setActive] = React.useState<'logical' | 'creative' | null>(null);
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
          <span>{formatTime(message.timestamp)}</span>
        </div>

        {/* Assistant POV toggles and panels (logical/creative) */}
        {!isUser && <PovPanels message={message} />}

        {/* Message Bubble */}
        <div className={cn(
          "rounded-lg px-4 py-2 border",
          isUser ? styling.userBubble : styling.assistantBubble,
          isTyping && "animate-pulse"
        )}>
          <div className={cn(
            isUser ? styling.userText : styling.assistantText
          )}>
            {isTyping && !isUser ? (
              <div className="flex items-center gap-2" aria-label="Musai is thinking">
                <MysticalTypingIndicator isDarkMode={isDark} />
              </div>
            ) : (
              <div className="prose prose-slate dark:prose-invert max-w-none break-words">
                <MarkdownRenderer content={message.content} />
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
