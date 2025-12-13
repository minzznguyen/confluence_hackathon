import { useRef, useCallback, useEffect } from 'react';

/**
 * Hook for safe async operations with request cancellation.
 * Prevents state updates after component unmount and handles race conditions
 * by tracking request IDs to ignore stale async responses.
 * 
 * @returns {Object} Object containing setSafeState and startRequest functions
 */
export function useSafeAsync() {
  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);

  // Only updates state if component is mounted and request ID matches current request
  // This prevents updates from stale/out-of-order async operations
  const setSafeState = useCallback((setter, value, requestId) => {
    if (isMountedRef.current && requestId === requestIdRef.current) {
      setter(value);
    }
  }, []);

  // Generates a new request ID for each async operation
  const startRequest = useCallback(() => {
    return ++requestIdRef.current;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      requestIdRef.current++;
    };
  }, []);

  return { setSafeState, startRequest };
}
