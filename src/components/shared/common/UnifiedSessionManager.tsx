"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface SessionManagerProps {
  showTimer?: boolean;
  showWarning?: boolean;
  warningMinutes?: number;
}

export default function UnifiedSessionManager({ 
  showTimer = false, 
  showWarning = true, 
  warningMinutes = 5 
}: SessionManagerProps) {
  const { data: session, update } = useSession();
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [isExtending, setIsExtending] = useState(false);

  const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds - effectively disable auto logout
  const WARNING_TIME = warningMinutes * 60 * 1000; // Warning time in milliseconds

  const checkSessionExpiry = useCallback(() => {
    if (!session?.user) return;

    // Disable auto logout - session will never expire automatically
    // Set a very large time left to prevent any expiry warnings
    setTimeLeft(SESSION_DURATION);
    
    // Don't show any warning modals or expiry modals
    // Session will remain active indefinitely
  }, [session, SESSION_DURATION]);

  const startSessionCheck = useCallback(() => {
    if (!session?.user) return;

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Check immediately to set time left
    checkSessionExpiry();
    
    // Don't set up interval since we don't need to check for expiry anymore
    // Session will remain active indefinitely
  }, [session, checkSessionExpiry]);

  const stopSessionCheck = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handleExtendSession = async () => {
    setIsExtending(true);
    try {
      const response = await fetch("/api/auth/extend-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Update session with new login time
        await update({
          ...session,
          user: {
            ...session?.user,
            loginTime: Date.now(),
          },
        });
        setShowWarningModal(false);
      } else {
        console.error("Failed to extend session");
        signOut({ redirect: false });
        router.push("/login");
      }
    } catch (error) {
      console.error("Error extending session:", error);
      signOut({ redirect: false });
      router.push("/login");
    } finally {
      setIsExtending(false);
    }
  };

  const handleLogout = () => {
    signOut({ redirect: false });
    router.push("/login");
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

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

  // Don't render anything if no session
  if (!session?.user || timeLeft === 0) return null;

  return (
    <>
      {/* Session timer */}
      {showTimer && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded text-sm z-50">
          Session: {formatTime(timeLeft)}
        </div>
      )}

      {/* Warning modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Phiên làm việc sắp hết hạn</h3>
            <p className="text-gray-600 mb-4">
              Phiên làm việc của bạn sẽ hết hạn trong {formatTime(timeLeft)}. 
              Bạn có muốn gia hạn phiên làm việc không?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleExtendSession}
                disabled={isExtending}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {isExtending ? "Đang gia hạn..." : "Gia hạn"}
              </button>
              <button
                onClick={handleLogout}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expired modal */}
      {showExpiredModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md mx-4 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Phiên làm việc đã hết hạn</h2>
            <p className="text-gray-600 mb-6">
              Phiên làm việc của bạn đã hết hạn. Bạn sẽ được chuyển đến trang đăng nhập trong vài giây.
            </p>
            <div className="flex justify-center">
              <button
                onClick={handleLogout}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
              >
                Đăng nhập lại ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
