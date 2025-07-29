export const FETCH_TIMEOUT = 1800000; // 30 minutes - increased for very long processing
export const FETCH_TIMEOUT_SHORT = 600000; // 10 minutes timeout for quick operations

export const fetchWithTimeout = async (
  url: string, 
  options: RequestInit,
  timeout: number = FETCH_TIMEOUT
) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out after 30 minutes');
      }
      // Handle browser-level timeouts
      if (error.message.includes('timeout') || error.message.includes('aborted')) {
        throw new Error('Request timed out');
      }
      // Handle network errors
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Network error - please check your connection');
      }
      throw error;
    }
    throw new Error('Network error occurred');
  }
};