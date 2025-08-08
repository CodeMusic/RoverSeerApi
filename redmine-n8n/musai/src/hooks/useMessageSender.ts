
import { useState, useEffect } from 'react';
import { Message } from '@/types/chat';
import { fetchWithTimeout, FETCH_TIMEOUT } from '@/utils/fetchWithTimeout';
import { extractResponseContent, extractResponseThoughts } from '@/utils/responseHandler';
import { QueryClient } from '@tanstack/react-query';
import { handleApiResponse, handleApiError } from '@/utils/apiResponseHandler';
import { prepareFileData } from '@/utils/fileOperations';
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

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

    const userMessage: Message = {
      id: uuidv4(),
      content: input,
      role: "user",
      timestamp: Date.now(),
      ...(fileData && { imageData: fileData })
    };

    // Add user message immediately to trigger UI transition from PreMusaiPage to chat
    const newMessages = [...currentMessages, userMessage];
    updateSession(sessionId, newMessages);
    queryClient.setQueryData(['chatSessions', sessionId], newMessages);
    // Now check webhook configuration for the API call
    const effectiveWebhookUrl = window.env?.VITE_N8N_WEBHOOK_URL || import.meta.env.VITE_N8N_WEBHOOK_URL;
    const username = window.env?.VITE_N8N_WEBHOOK_USERNAME || import.meta.env.VITE_N8N_WEBHOOK_USERNAME;
    const secret = window.env?.VITE_N8N_WEBHOOK_SECRET || import.meta.env.VITE_N8N_WEBHOOK_SECRET;

    if (!effectiveWebhookUrl) {
      // If no webhook URL is configured, add a helpful assistant message for development
      const fallbackMessage: Message = {
        id: uuidv4(),
        content: "Hello! I'm Musai, your AI companion. It looks like I'm running in development mode without a webhook URL configured. In production, I would connect to an n8n workflow to provide intelligent responses.\n\nFor now, I can help you explore the interface and see how the chat system works. Try sending me a message and I'll show you how the conversation flow works!",
        role: "assistant",
        timestamp: Date.now()
      };
      
      const finalMessages = [...newMessages, fallbackMessage];
      updateSession(sessionId, finalMessages);
      queryClient.setQueryData(['chatSessions', sessionId], finalMessages);
      
      console.log('Running in development mode without webhook URL');
      return true;
    }

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
        };

        if (username && secret) {
          const authString = `${username}:${secret}`;
          const base64Auth = btoa(authString);
          headers['Authorization'] = `Basic ${base64Auth}`;
        }

        console.log('Sending message to webhook:', {
          url: effectiveWebhookUrl.split('/webhook/')[0] + '/webhook/[WEBHOOK_ID]',
          hasAuth: !!username && !!secret,
          hasFile: !!fileData
        });

        const response = await fetchWithTimeout(
          effectiveWebhookUrl,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              chatInput: input,
              sessionId: sessionId,
              ...(fileData && {
                data: fileData.data,
                mimeType: fileData.mimeType,
                fileName: fileData.fileName
              })
            }),
          },
          FETCH_TIMEOUT
        );

        // Clear timeout warnings on success
        clearTimeout(timeoutWarning);
        clearTimeout(longRequestWarning);
        clearTimeout(veryLongRequestWarning);

        const responseData = await handleApiResponse(response);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!responseData) {
          throw new Error('Empty response from server');
        }

        const responseContent = extractResponseContent(responseData);
        const responseThoughts = extractResponseThoughts(responseData);

        const assistantMessage: Message = {
          id: uuidv4(),
          content: responseContent,
          role: "assistant",
          timestamp: Date.now(),
          ...(responseThoughts && { thoughts: responseThoughts })
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
