
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
    const effectiveWebhookUrl = window.env?.VITE_N8N_WEBHOOK_URL || import.meta.env.VITE_N8N_WEBHOOK_URL;
    const username = window.env?.VITE_N8N_WEBHOOK_USERNAME || import.meta.env.VITE_N8N_WEBHOOK_USERNAME;
    const secret = window.env?.VITE_N8N_WEBHOOK_SECRET || import.meta.env.VITE_N8N_WEBHOOK_SECRET;

    if (!effectiveWebhookUrl) {
      toast.error("Configuration error: No webhook URL available");
      return false;
    }

    let retryCount = 0;

    while (retryCount <= MAX_RETRIES) {
      let timeoutWarning: NodeJS.Timeout | null = null;
      let longRequestWarning: NodeJS.Timeout | null = null;
      
      try {
        setIsLoading(true);
        setIsTyping(true);

        // Set up timeout warnings
        timeoutWarning = setTimeout(() => {
          toast.info("Request is taking longer than usual. Please wait...", {
            duration: 5000,
          });
        }, 120000); // Show warning after 2 minutes

        longRequestWarning = setTimeout(() => {
          toast.warning("Request is taking a very long time. You may want to try again.", {
            duration: 8000,
          });
        }, 300000); // Show warning after 5 minutes

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

        const newMessages = [...currentMessages, userMessage];
        updateSession(sessionId, newMessages);
        queryClient.setQueryData(['chatSessions', sessionId], newMessages);

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
