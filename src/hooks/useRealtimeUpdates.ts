'use client';

import { useEffect, useRef, useCallback } from 'react';

interface UseRealtimeUpdatesOptions {
  interval?: number; // milliseconds
  enabled?: boolean;
  onUpdate?: () => void;
  debounceMs?: number; // debounce time
}

export function useRealtimeUpdates({
  interval = 30000, // 30 seconds default
  enabled = true,
  onUpdate,
  debounceMs = 1000 // 1 second debounce
}: UseRealtimeUpdatesOptions = {}) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(false);
  const lastUpdateRef = useRef<number>(0);

  const debouncedUpdate = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      const now = Date.now();
      // Only update if enough time has passed since last update
      if (now - lastUpdateRef.current >= debounceMs) {
        if (onUpdate) {
          onUpdate();
          lastUpdateRef.current = now;
        }
      }
    }, debounceMs);
  }, [onUpdate, debounceMs]);

  const startPolling = useCallback(() => {
    if (!enabled || isActiveRef.current) return;
    
    isActiveRef.current = true;
    intervalRef.current = setInterval(() => {
      debouncedUpdate();
    }, interval);
  }, [enabled, interval, debouncedUpdate]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    isActiveRef.current = false;
  }, []);

  const forceUpdate = useCallback(() => {
    if (onUpdate) {
      onUpdate();
      lastUpdateRef.current = Date.now();
    }
  }, [onUpdate]);

  useEffect(() => {
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enabled, startPolling, stopPolling]);

  // Pause polling when tab is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else if (enabled) {
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, startPolling, stopPolling]);

  return {
    startPolling,
    stopPolling,
    forceUpdate,
    isActive: isActiveRef.current
  };
}
