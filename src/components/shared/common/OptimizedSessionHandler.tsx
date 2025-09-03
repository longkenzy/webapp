"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function OptimizedSessionHandler() {
  const { data: session } = useSession();
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkSessionExpiry = useCallback(() => {
    if (!session?.user) return;

    // @ts-expect-error custom field
    const loginTime = session.user.loginTime;
    if (!loginTime) return;

    const sessionDuration = 60 * 60 * 1000; // 1 hour in milliseconds
    const expiryTime = loginTime + sessionDuration;
    const now = Date.now();

    if (now >= expiryTime) {
      // Clear any existing intervals/timeouts
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Auto logout after 5 seconds
      timeoutRef.current = setTimeout(() => {
        signOut({ redirect: false });
        router.push("/login");
      }, 5000);
    }
  }, [session, router]);

  const startSessionCheck = useCallback(() => {
    if (!session?.user) return;

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Check immediately
    checkSessionExpiry();
    
    // Set up interval only if tab is visible
    if (!document.hidden) {
      intervalRef.current = setInterval(checkSessionExpiry, 1000);
    }
  }, [session, checkSessionExpiry]);

  const stopSessionCheck = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!session?.user) {
      stopSessionCheck();
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopSessionCheck();
      } else {
        startSessionCheck();
      }
    };

    // Set up visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Start initial check
    startSessionCheck();

    return () => {
      stopSessionCheck();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session, startSessionCheck, stopSessionCheck]);

  // This component doesn't render anything, it just handles session logic
  return null;
}
