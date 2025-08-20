
import { useState, useEffect } from 'react';
import { Message } from '@/types/chat';
import { fetchWithTimeout, FETCH_TIMEOUT } from '@/utils/fetchWithTimeout';
import { MUSAI_MODULES } from '@/config/constants';
import { queuedFetch } from '@/lib/AttentionalRequestQueue';
import { N8N_ENDPOINTS } from '@/config/n8nEndpoints';
import { extractResponseContent, extractResponseThoughts, extractResponsePov } from '@/utils/responseHandler';
import { shouldTreatAsStream, readNdjsonOrSse } from '@/utils/streaming';
import { QueryClient } from '@tanstack/react-query';
import { handleApiResponse, handleApiError } from '@/utils/apiResponseHandler';
import { prepareFileData } from '@/utils/fileOperations';
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { getRandomWittyError } from '@/config/messages';
import { buildThreadSessionId } from '@/lib/n8nClient';

const MAX_RETRIES = 2;
const RETRY_DELAY = 2000; // 2 seconds

export const useMessageSender = (
  updateSession: (sessionId: string, messages: Message[]) => void,
  queryClient: QueryClient
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const sendMessage = async (
    input: string,
    sessionId: string,
    currentMessages: Message[],
    file?: File
  ) => {
    // First, immediately add the user message to trigger UI transition
    console.log('Processing file for message:', file ? {
      name: file.name,
      type: file.type,
      size: file.size
    } : 'No file');

    const fileData = file ? await prepareFileData(file) : null;

    console.log('File data prepared:', fileData ? 'Successfully processed' : 'No file data');

    // Extract optional mood prefix for UI rendering, keep original input for backend
    const moodMatch = input.match(/^\s*\[\s*Mood\s*:\s*([^\]]+)\]\s*(.*)$/i);
    const uiMood = moodMatch ? (moodMatch[1] || '').trim() : undefined;
    const uiContent = moodMatch ? (moodMatch[2] || '') : input;

    const userMessage: Message = {
      id: uuidv4(),
      content: uiContent,
      role: "user",
      timestamp: Date.now(),
      ...(uiMood ? { mood: uiMood } : {}),
      ...(fileData && { imageData: fileData })
    };

    // Add user message immediately to trigger UI transition from PreMusaiPage to chat
    const newMessages = [...currentMessages, userMessage];
    updateSession(sessionId, newMessages);
    queryClient.setQueryData(['chatSessions', sessionId], newMessages);
    
    // Agent-managed memory: do not send history; sessionId is sufficient for recall
    // Now check webhook configuration for the API call
    const effectiveWebhookUrl = window.env?.VITE_N8N_WEBHOOK_URL || import.meta.env.VITE_N8N_WEBHOOK_URL;
    const username = window.env?.VITE_N8N_WEBHOOK_USERNAME || import.meta.env.VITE_N8N_WEBHOOK_USERNAME;
    const secret = window.env?.VITE_N8N_WEBHOOK_SECRET || import.meta.env.VITE_N8N_WEBHOOK_SECRET;

    // Resolve final chat endpoint:
    // - If env provides a full endpoint ending with /chat/message, use it as-is
    // - If env provides a base URL (e.g., https://n8n.codemusic.ca/webhook/), append the chat path
    // - Otherwise, fall back to configured BASE_URL + path
    const chatPostUrl = (() => {
      if (effectiveWebhookUrl) {
        const trimmed = String(effectiveWebhookUrl).replace(/\/$/, '');
        if (/\/chat\//.test(trimmed)) return trimmed; // already full endpoint
        // Default to stream endpoint; allow query param to force non-stream
        const wantStream = (window as any).__musai_stream_enabled !== false;
        return `${trimmed}${wantStream ? N8N_ENDPOINTS.CHAT.SEND_MESSAGE_STREAM : N8N_ENDPOINTS.CHAT.SEND_MESSAGE}`;
      }
      const wantStream = (window as any).__musai_stream_enabled !== false;
      return `${N8N_ENDPOINTS.BASE_URL}${wantStream ? N8N_ENDPOINTS.CHAT.SEND_MESSAGE_STREAM : N8N_ENDPOINTS.CHAT.SEND_MESSAGE}`;
    })();

    let retryCount = 0;

    while (retryCount <= MAX_RETRIES) {
      let timeoutWarning: NodeJS.Timeout | null = null;
      let longRequestWarning: NodeJS.Timeout | null = null;
      let veryLongRequestWarning: NodeJS.Timeout | null = null;
      
      try {
        setIsLoading(true);
        setIsTyping(true);

        // Set up timeout warnings
        timeoutWarning = setTimeout(() => {
          toast.info("Request is taking longer than usual. Please wait...", {
            duration: 10000,
          });
        }, 300000); // Show warning after 5 minutes

        longRequestWarning = setTimeout(() => {
          toast.warning("Request is taking a very long time. This is normal for complex tasks. Please be patient.", {
            duration: 15000,
          });
        }, 900000); // Show warning after 15 minutes

        veryLongRequestWarning = setTimeout(() => {
          toast.warning("Request is taking an exceptionally long time. You may want to try again if it doesn't complete soon.", {
            duration: 20000,
          });
        }, 1500000); // Show warning after 25 minutes

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          // Default chat mode uses POV (logic + creative + fusion)
          'X-Musai-Task-Label': 'chat-bicameral-pov'
        };

        console.log('Sending message to webhook:', {
          url: chatPostUrl.includes('/webhook/') ? chatPostUrl.split('/webhook/')[0] + '/webhook/[WEBHOOK_ID]' : chatPostUrl,
          hasAuth: true,
          hasFile: !!fileData
        });

        const streamToken = `stream-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const response = await queuedFetch(
          chatPostUrl,
          {
            method: "POST",
            headers: {
              ...headers,
              'X-Musai-Stream-Token': streamToken,
            },
            body: JSON.stringify({
              // Compose sessionId as {threadId_systemId}
              sessionId: buildThreadSessionId(sessionId),
              // Send original full text (with mood tag if present) to backend so workflows can parse it
              query: input,
              params: {
                module: MUSAI_MODULES.CHAT,
                debug: true,
                ...(fileData && {
                  data: fileData.data,
                  mimeType: fileData.mimeType,
                  fileName: fileData.fileName
                })
              }
            }),
          },
          FETCH_TIMEOUT
        );

        // Clear timeout warnings on success
        clearTimeout(timeoutWarning);
        clearTimeout(longRequestWarning);
        clearTimeout(veryLongRequestWarning);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        let didStream = false;
        let assistantMessageId: string | null = null;
        let workingMessages = [...newMessages];

        const ensureAssistantPlaceholder = (): void => {
          if (assistantMessageId) return;
          const placeholderId = uuidv4();
          const placeholder: Message = {
            id: placeholderId,
            content: '',
            role: 'assistant',
            timestamp: Date.now()
          };
          assistantMessageId = placeholderId;
          workingMessages = [...workingMessages, placeholder];
          updateSession(sessionId, workingMessages);
          queryClient.setQueryData(['chatSessions', sessionId], workingMessages);
        };

        const updateAssistantMessage = (partial: Partial<Message>): void => {
          if (!assistantMessageId) return;
          workingMessages = workingMessages.map(m => m.id === assistantMessageId ? { ...m, ...partial } : m);
          updateSession(sessionId, workingMessages);
          queryClient.setQueryData(['chatSessions', sessionId], workingMessages);
        };

        const tryParseFinalRaw = (raw: string): void => {
          try {
            const data = JSON.parse(raw);
            const responseContent = extractResponseContent(data);
            const responseThoughts = extractResponseThoughts(data);
            const responsePov = extractResponsePov(data);

            let logicalThought: string | undefined;
            let creativeThought: string | undefined;
            if (Array.isArray(responsePov)) {
              for (const pov of responsePov) {
                if (!pov || typeof pov.thought !== 'string') continue;
                const type = String(pov.type || '').toLowerCase();
                if (!logicalThought && (type === 'logical' || /logic/.test(type))) logicalThought = pov.thought;
                if (!creativeThought && (type === 'creative' || /creativ/.test(type))) creativeThought = pov.thought;
              }
            }

            updateAssistantMessage({
              ...(responseContent ? { content: workingMessages.find(m => m.id === assistantMessageId)?.content || responseContent } : {}),
              ...(responseThoughts ? { thoughts: responseThoughts } : {}),
              ...(responsePov ? { pov: responsePov } : {}),
              ...(logicalThought ? { logicalThought } : {}),
              ...(creativeThought ? { creativeThought } : {})
            });
          } catch {
            // ignore
          }
        };

        // Always attempt streaming when body exists; fallback below if no tokens seen
        if (response.body) {
          didStream = true;
          ensureAssistantPlaceholder();
          try { window.dispatchEvent(new CustomEvent('musai-stream-start', { detail: { token: streamToken } })); } catch {}
          const { sawStreamToken, raw } = await readNdjsonOrSse(response, {
            onFirstToken: () => {
              // Keep typing true during streaming; we'll turn it off when the stream completes
            },
            onToken: (chunk) => {
              const current = workingMessages.find(m => m.id === assistantMessageId)?.content || '';
              updateAssistantMessage({ content: current + chunk });
            },
            onFinalJson: (obj) => {
              try {
                const responseContent = extractResponseContent(obj);
                const responseThoughts = extractResponseThoughts(obj);
                const responsePov = extractResponsePov(obj);
                let logicalThought: string | undefined;
                let creativeThought: string | undefined;
                if (Array.isArray(responsePov)) {
                  for (const pov of responsePov) {
                    if (!pov || typeof pov.thought !== 'string') continue;
                    const type = String(pov.type || '').toLowerCase();
                    if (!logicalThought && (type === 'logical' || /logic/.test(type))) logicalThought = pov.thought;
                    if (!creativeThought && (type === 'creative' || /creativ/.test(type))) creativeThought = pov.thought;
                  }
                }
                updateAssistantMessage({
                  ...(responseThoughts ? { thoughts: responseThoughts } : {}),
                  ...(responsePov ? { pov: responsePov } : {}),
                  ...(logicalThought ? { logicalThought } : {}),
                  ...(creativeThought ? { creativeThought } : {}),
                  // keep streamed content; don't overwrite
                  ...(responseContent && !(workingMessages.find(m => m.id === assistantMessageId)?.content)?.trim() ? { content: responseContent } : {})
                });
              } catch {}
            },
            onError: (msg, payload) => {
              console.warn('[Stream Error]', msg || 'Unknown streaming error', payload);
              toast.error(msg || 'We hit a hiccup while streaming the reply. Musai will try to summarize the response.');
            }
          });
          if (!sawStreamToken) {
            // Fallback: parse the accumulated raw response (non-streamy servers)
            try {
              const data = JSON.parse(raw);
              const responseContent = extractResponseContent(data);
              const responseThoughts = extractResponseThoughts(data);
              const responsePov = extractResponsePov(data);
              let logicalThought: string | undefined;
              let creativeThought: string | undefined;
              if (Array.isArray(responsePov)) {
                for (const pov of responsePov) {
                  if (!pov || typeof pov.thought !== 'string') continue;
                  const type = String(pov.type || '').toLowerCase();
                  if (!logicalThought && (type === 'logical' || /logic/.test(type))) logicalThought = pov.thought;
                  if (!creativeThought && (type === 'creative' || /creativ/.test(type))) creativeThought = pov.thought;
                }
              }
              updateAssistantMessage({
                content: responseContent,
                ...(responseThoughts ? { thoughts: responseThoughts } : {}),
                ...(responsePov ? { pov: responsePov } : {}),
                ...(logicalThought ? { logicalThought } : {}),
                ...(creativeThought ? { creativeThought } : {})
              });
            } catch {
              // Raw text fallback
              const current = workingMessages.find(m => m.id === assistantMessageId)?.content || '';
              updateAssistantMessage({ content: current + raw });
            }
            setIsTyping(false);
          }
          else {
            // Stream ended successfully; turn off typing now
            setIsTyping(false);
          }
          try { window.dispatchEvent(new CustomEvent('musai-stream-end', { detail: { token: streamToken } })); } catch {}
          return true;
        }

        const responseData = await handleApiResponse(response);

        if (!responseData) {
          throw new Error('Empty response from server');
        }

        const responseContent = extractResponseContent(responseData);
        const responseThoughts = extractResponseThoughts(responseData);
        const responsePov = extractResponsePov(responseData);

        let logicalThought: string | undefined;
        let creativeThought: string | undefined;
        if (Array.isArray(responsePov)) {
          for (const pov of responsePov) {
            if (!pov || typeof pov.thought !== 'string') continue;
            const type = String(pov.type || '').toLowerCase();
            if (!logicalThought && (type === 'logical' || /logic/.test(type))) logicalThought = pov.thought;
            if (!creativeThought && (type === 'creative' || /creativ/.test(type))) creativeThought = pov.thought;
          }
        }

        const assistantMessage: Message = {
          id: uuidv4(),
          content: responseContent,
          role: "assistant",
          timestamp: Date.now(),
          ...(responseThoughts && { thoughts: responseThoughts }),
          ...(responsePov && { pov: responsePov }),
          ...(logicalThought && { logicalThought }),
          ...(creativeThought && { creativeThought })
        };

        const finalMessages = [...newMessages, assistantMessage];
        updateSession(sessionId, finalMessages);
        queryClient.setQueryData(['chatSessions', sessionId], finalMessages);
        
        console.log('Message sent successfully');
        return true;
      } catch (error) {
        console.error('Error in webhook request:', error);
        
        // Clear timeout warnings on error
        clearTimeout(timeoutWarning);
        clearTimeout(longRequestWarning);
        clearTimeout(veryLongRequestWarning);
        
        // Check if we should retry
        if (retryCount < MAX_RETRIES && 
            (error instanceof Error && 
             (error.message === 'Request timed out' || 
              error.message.includes('Network error') ||
              error.message.includes('500')))) {
          
          retryCount++;
          console.log(`Retrying request (attempt ${retryCount}/${MAX_RETRIES})`);
          
          toast.info(`Request failed, retrying... (${retryCount}/${MAX_RETRIES})`, {
            duration: 3000,
          });
          
          await delay(RETRY_DELAY);
          continue;
        }
        
        // Provide specific error messages based on the error type
        if (error instanceof Error) {
          if (error.message === 'Request timed out') {
            toast.error("Request timed out. The server is taking longer than expected to respond. Please try again.");
          } else if (error.message.includes('Network error')) {
            toast.error("Network error. Please check your internet connection and try again.");
          } else if (error.message.includes('401')) {
            toast.error("Authentication failed. Please check your credentials.");
          } else if (error.message.includes('500')) {
            toast.error("Server error. Please try again later.");
          } else {
            toast.error("Failed to send message. Please try again.");
          }
        } else {
          toast.error("An unexpected error occurred. Please try again.");
        }

        // Append witty assistant reply to let the user know it didn't work
        const wittyAssistant: Message = {
          id: uuidv4(),
          content: getRandomWittyError(),
          role: 'assistant',
          timestamp: Date.now(),
        };
        const finalMessages = [...newMessages, wittyAssistant];
        updateSession(sessionId, finalMessages);
        queryClient.setQueryData(['chatSessions', sessionId], finalMessages);

        return false;
      } finally {
        setIsLoading(false);
        setIsTyping(false);
      }
    }
    
    return false;
  };

  return {
    sendMessage,
    isLoading,
    isTyping
  };
};
