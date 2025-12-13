import { useRef, useCallback, useEffect } from 'react';

/**
 * Hook for safe async operations with request cancellation.
 * Prevents state updates after unmount and handles race conditions.
 */
export function useSafeAsync() {
  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);

  const safeSetState = useCallback((setter, value, requestId) => {
    if (isMountedRef.current && requestId === requestIdRef.current) {
      setter(value);
    }
  }, []);

  const startRequest = useCallback(() => {
    return ++requestIdRef.current;
  }, []);

  const isCurrentRequest = useCallback((requestId) => {
    return requestId === requestIdRef.current;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      requestIdRef.current++;
    };
  }, []);

  return { safeSetState, startRequest, isCurrentRequest };
}
