/**
 * Timeout Configuration
 * 
 * All timeout values are in milliseconds.
 * Minimum timeout is enforced to be 2 minutes (120,000ms) for all operations.
 */

// Minimum timeout enforced across all operations (2 minutes)
const MINIMUM_TIMEOUT_MS = 2 * 60 * 1000; // 120,000ms

// Default timeout configurations
const DEFAULT_TIMEOUTS = {
  // Search-related timeouts
  SEARCH_REQUEST: 5 * 60 * 1000,        // 5 minutes for search requests
  SEARCH_FOLLOWUP: 3 * 60 * 1000,       // 3 minutes for follow-up questions
  
  // Chat-related timeouts  
  CHAT_MESSAGE: 4 * 60 * 1000,          // 4 minutes for chat messages
  CHAT_STREAMING: 6 * 60 * 1000,        // 6 minutes for streaming responses
  
  // General API timeouts
  API_REQUEST: 3 * 60 * 1000,           // 3 minutes for general API calls
  FILE_UPLOAD: 10 * 60 * 1000,          // 10 minutes for file uploads
} as const;

/**
 * Validates and enforces minimum timeout
 * @param timeout - Timeout value in milliseconds
 * @returns Validated timeout (minimum 2 minutes)
 */
const enforceMinimumTimeout = (timeout: number): number => {
  return Math.max(timeout, MINIMUM_TIMEOUT_MS);
};

/**
 * Get timeout value for specific operation
 * @param operation - The operation type
 * @returns Timeout value in milliseconds (minimum 2 minutes enforced)
 */
export const getTimeout = (operation: keyof typeof DEFAULT_TIMEOUTS): number => {
  return enforceMinimumTimeout(DEFAULT_TIMEOUTS[operation]);
};

/**
 * Timeout configuration object with enforced minimums
 */
export const TIMEOUTS = {
  // Search timeouts
  SEARCH_REQUEST: getTimeout('SEARCH_REQUEST'),
  SEARCH_FOLLOWUP: getTimeout('SEARCH_FOLLOWUP'),
  
  // Chat timeouts
  CHAT_MESSAGE: getTimeout('CHAT_MESSAGE'),
  CHAT_STREAMING: getTimeout('CHAT_STREAMING'),
  
  // General timeouts
  API_REQUEST: getTimeout('API_REQUEST'),
  FILE_UPLOAD: getTimeout('FILE_UPLOAD'),
  
  // Minimum timeout constant for reference
  MINIMUM: MINIMUM_TIMEOUT_MS,
} as const;

/**
 * Format timeout for display (e.g., "5 minutes")
 * @param timeoutMs - Timeout in milliseconds
 * @returns Human-readable timeout string
 */
export const formatTimeout = (timeoutMs: number): string => {
  const minutes = Math.floor(timeoutMs / (60 * 1000));
  const seconds = Math.floor((timeoutMs % (60 * 1000)) / 1000);
  
  if (seconds === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  return `${minutes}m ${seconds}s`;
};

/**
 * Create AbortController with timeout
 * @param timeoutMs - Timeout in milliseconds (minimum 2 minutes enforced)
 * @returns Object with controller and timeoutId for cleanup
 */
export const createTimeoutController = (timeoutMs: number) => {
  const controller = new AbortController();
  const validatedTimeout = enforceMinimumTimeout(timeoutMs);
  
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, validatedTimeout);
  
  return {
    controller,
    timeoutId,
    timeout: validatedTimeout,
    signal: controller.signal,
    cleanup: () => clearTimeout(timeoutId),
  };
};

export default TIMEOUTS;