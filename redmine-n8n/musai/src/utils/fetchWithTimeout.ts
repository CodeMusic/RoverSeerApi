import { TIMEOUTS, createTimeoutController, formatTimeout } from '@/config/timeouts';
import { N8N_ENDPOINTS } from '@/config/n8nEndpoints';
import { withN8nAuthHeaders, getN8nSessionId } from '@/lib/n8nClient';

// Legacy exports for backward compatibility (now use configured values)
export const FETCH_TIMEOUT = TIMEOUTS.CHAT_MESSAGE;
export const FETCH_TIMEOUT_SHORT = TIMEOUTS.API_REQUEST;

export const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout: number = TIMEOUTS.CHAT_MESSAGE
) => {
  const { controller, timeoutId, cleanup, signal } = createTimeoutController(timeout);
  
  console.log(`Starting request with ${formatTimeout(timeout)} timeout`);

  try {
    // If the request targets n8n, enforce Basic Auth headers
    const isN8n = typeof url === 'string' && (url.startsWith(N8N_ENDPOINTS.BASE_URL) || url.includes('/webhook/'));
    const baseHeaders = isN8n ? withN8nAuthHeaders(options.headers) : options.headers;
    // Ensure a sessionId is provided for memory tracking, either in headers or body
    let nextHeaders = baseHeaders;
    if (isN8n) {
      const sessionId = getN8nSessionId();
      // Add session headers if missing
      if (baseHeaders && !(baseHeaders as any)['X-Musai-Session-Id']) {
        nextHeaders = { ...(baseHeaders as any), 'X-Musai-Session-Id': sessionId } as any;
      }
      // If body is JSON, inject sessionId field when not present
      if (options.body && typeof options.body === 'string' && (options.headers as any)?.['Content-Type']?.includes('application/json')) {
        try {
          const parsed = JSON.parse(options.body as string);
          if (parsed && typeof parsed === 'object' && parsed.sessionId == null) {
            (options as any).body = JSON.stringify({ ...parsed, sessionId });
          }
        } catch {}
      }
    }
    const response = await fetch(url, {
      ...options,
      headers: nextHeaders,
      signal
    });
    cleanup();
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    cleanup();
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timed out after ${formatTimeout(timeout)}`);
      }
      // Handle browser-level timeouts
      if (error.message.includes('timeout') || error.message.includes('aborted')) {
        throw new Error('Request timed out');
      }
      // Handle network errors
      if (
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError') ||
        // Safari/WebKit commonly reports CORS/SSL/preflight failures as "Load failed"
        error.message.includes('Load failed')
      ) {
        throw new Error('Network error - please check your connection');
      }
      throw error;
    }
    throw new Error('Network error occurred');
  }
};