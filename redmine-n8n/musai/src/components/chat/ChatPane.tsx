import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { ChatContextMenu } from './ChatContextMenu';
import { Message } from '@/types/chat';
import { useEmotionEffects } from '@/hooks/useEmotionEffects';
import { useMusaiMood } from '@/contexts/MusaiMoodContext';
import { attentionalRequestQueue } from '@/lib/AttentionalRequestQueue';
import type { QueueMetrics } from '@/lib/AttentionalRequestQueue';

interface ChatPaneProps {
  sessionId: string;
  module: 'therapy' | 'chat' | 'code' | 'university' | 'career' | 'search' | 'narrative' | 'task' | 'eye';
  roleConfig?: {
    user?: string;
    assistant?: string;
  };
  messageList: Message[];
  onMessageSend: (text: string, file?: File) => Promise<void>;
  onMessageFlag?: (msgId: string) => void;
  readOnly?: boolean;
  className?: string;
  isTyping?: boolean;
  isLoading?: boolean;
  /** Optional text to prepend to the user's message when sending */
  prefixText?: string;
  /** Whether to show controls above the input (stream/effects). Defaults true */
  showControls?: boolean;
}

// Theme utility function
const getChatTheme = (module: string) => {
  switch (module) {
    case 'therapy': 
      return {
        container: 'bg-purple-50 dark:bg-purple-950/20',
        accent: 'text-purple-900 dark:text-purple-100',
        border: 'border-purple-200 dark:border-purple-800'
      };
    case 'code': 
      return {
        container: 'bg-slate-50 dark:bg-slate-900',
        accent: 'text-green-600 dark:text-green-400',
        border: 'border-slate-200 dark:border-slate-700'
      };  
    case 'university': 
      return {
        container: 'bg-yellow-50 dark:bg-yellow-950/20',
        accent: 'text-yellow-800 dark:text-yellow-200',
        border: 'border-yellow-200 dark:border-yellow-800'
      };
    case 'career':
      return {
        container: 'bg-blue-50 dark:bg-blue-950/20',
        accent: 'text-blue-800 dark:text-blue-200',
        border: 'border-blue-200 dark:border-blue-800'
      };
    case 'narrative':
      return {
        container: 'bg-emerald-50 dark:bg-emerald-950/20',
        accent: 'text-emerald-800 dark:text-emerald-200',
        border: 'border-emerald-200 dark:border-emerald-800'
      };
    case 'eye':
      return {
        container: 'bg-cyan-50 dark:bg-cyan-950/20',
        accent: 'text-cyan-800 dark:text-cyan-200',
        border: 'border-cyan-200 dark:border-cyan-800'
      };
    default: 
      return {
        container: 'bg-white dark:bg-gray-900',
        accent: 'text-black dark:text-white',
        border: 'border-gray-200 dark:border-gray-700'
      };
  }
};

// Apply glow ring based on module color (ties into ROYGBIV constants via CSS variable)
const withGlow = (isActive: boolean) => isActive ? 'tool-glow' : '';

export const ChatPane: React.FC<ChatPaneProps> = ({
  sessionId,
  module,
  roleConfig = { user: 'You', assistant: 'Musai' },
  messageList,
  onMessageSend,
  onMessageFlag,
  readOnly = false,
  className = '',
  isTyping = false,
  isLoading = false,
  prefixText,
  showControls = true
}) => {
  const [contextMenu, setContextMenu] = useState<{
    messageId: string;
    x: number;
    y: number;
  } | null>(null);
  const [streamEnabled, setStreamEnabled] = useState<boolean>(true);
  const [effectsEnabled, setEffectsEnabled] = useState<boolean>(true);

  const theme = getChatTheme(module);
  const { processAIResponse } = useEmotionEffects();
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const { disableEffects } = useMusaiMood();
  const [queueMetrics, setQueueMetrics] = useState<QueueMetrics | null>(null);

  useEffect(() =>
  {
    const onMetrics = (ev: Event) =>
    {
      const detail = (ev as CustomEvent<QueueMetrics>).detail;
      setQueueMetrics(detail);
    };
    attentionalRequestQueue.addEventListener('metrics', onMetrics as EventListener);
    return () => attentionalRequestQueue.removeEventListener('metrics', onMetrics as EventListener);
  }, []);

  const isAtCapacity = useMemo(() =>
  {
    if (!queueMetrics) return false;
    return queueMetrics.activeCount >= queueMetrics.maxConcurrent;
  }, [queueMetrics]);

  // Trigger Musai effects after streaming completes and content is finalized
  useEffect(() => {
    if (!messageList || messageList.length === 0) return;
    const last = messageList[messageList.length - 1];
    // Only fire when not typing and we have assistant content
    if (!isTyping && last.role === 'assistant' && last.content && last.content.trim().length > 0) {
      if ((window as any).__musai_effects_enabled !== false && effectsEnabled) {
        processAIResponse(last.content);
      }
    }
  }, [messageList.length, isTyping, effectsEnabled, processAIResponse]);

  // Auto-scroll to bottom when messages update or typing indicator appears
  useEffect(() => {
    const scrollToBottom = () => {
      const container = scrollContainerRef.current;
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      } else {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    };
    // use rAF and short timeout to ensure layout is committed
    const raf = requestAnimationFrame(() => {
      const id = window.setTimeout(scrollToBottom, 0);
      return () => window.clearTimeout(id);
    });
    return () => cancelAnimationFrame(raf);
  }, [messageList.length, isTyping]);

  const handleMessageContext = (messageId: string, event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      messageId,
      x: event.clientX,
      y: event.clientY
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleMessageFlag = (messageId: string) => {
    if (onMessageFlag) {
      onMessageFlag(messageId);
    }
    handleCloseContextMenu();
  };

  return (
    <div className={`chat-pane h-full flex flex-col min-h-0 ${theme.container} ${className}`}>
      {/* Messages Area */}
      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 pb-2">
        {messageList.map((message, index) => {
          const isLast = index === messageList.length - 1;
          const showTypingInThisBubble = Boolean(
            isTyping &&
            isLast &&
            message.role === 'assistant' &&
            (!message.content || message.content.trim().length === 0)
          );
          return (
            <MessageBubble
              key={message.id}
              message={message}
              roleConfig={roleConfig}
              module={module}
              onContextMenu={(event) => handleMessageContext(message.id, event)}
              theme={theme}
              isTyping={showTypingInThisBubble}
            />
          );
        })}

        {/* Fallback: if typing but no assistant placeholder yet, render a single mystical bubble */}
        {isTyping && (
          (() => {
            const last = messageList[messageList.length - 1];
            // Show standalone indicator only if there is no assistant placeholder yet
            // i.e., when there are no messages or the last message is from the user
            const shouldShowStandalone = !last || last.role === 'user';
            if (!shouldShowStandalone) return null;
            return (
              <MessageBubble
                key="typing-standalone"
                message={{ id: 'typing-standalone', content: '', role: 'assistant', timestamp: Date.now() }}
                roleConfig={roleConfig}
                module={module}
                isTyping={true}
                theme={theme}
              />
            );
          })()
        )}
        {/* Scroll Sentinel */}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Area */}
      {!readOnly && (
        <div className={`border-t ${theme.border} bg-background/50`}>
          <ChatInput
            module={module}
            onMessageSend={onMessageSend}
            // Do not block input for a single in-flight request; only disable when queue is at capacity
            isLoading={isAtCapacity}
            streamEnabled={streamEnabled}
            onToggleStream={(enabled) => {
              setStreamEnabled(enabled);
              try { (window as any).__musai_stream_enabled = enabled; } catch {}
            }}
            effectsEnabled={effectsEnabled}
            onToggleEffects={(enabled) => {
              setEffectsEnabled(enabled);
              try { (window as any).__musai_effects_enabled = enabled; } catch {}
              if (!enabled) {
                try { disableEffects(); } catch {}
              }
            }}
            theme={theme}
            prefixText={prefixText}
            showControls={showControls}
          />
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ChatContextMenu
          messageId={contextMenu.messageId}
          x={contextMenu.x}
          y={contextMenu.y}
          module={module}
          onClose={handleCloseContextMenu}
          onFlag={() => handleMessageFlag(contextMenu.messageId)}
        />
      )}
    </div>
  );
};
