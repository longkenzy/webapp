"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SessionTimer() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showWarning, setShowWarning] = useState(false);
  const [isExtending, setIsExtending] = useState(false);

  useEffect(() => {
    if (!session?.user) return;

    // @ts-expect-error custom field
    const loginTime = session.user.loginTime;
    if (!loginTime) return;

    const sessionDuration = 60 * 60 * 1000; // 1 hour in milliseconds
    const warningTime = 5 * 60 * 1000; // 5 minutes before expiry
    const expiryTime = loginTime + sessionDuration;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, expiryTime - now);
      
      setTimeLeft(remaining);

      // Show warning 5 minutes before expiry
      if (remaining <= warningTime && remaining > 0) {
        setShowWarning(true);
      }

      // Auto logout when session expires
      if (remaining <= 0) {
        signOut({ redirect: false });
        router.push("/login");
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [session, router]);

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
        setShowWarning(false);
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

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!session?.user || timeLeft === 0) return null;

  return (
    <>
      {/* Session timer */}
      <div className="fixed top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded text-sm z-50">
        Session: {formatTime(timeLeft)}
      </div>

      {/* Warning modal */}
      {showWarning && (
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
                onClick={() => {
                  signOut({ redirect: false });
                  router.push("/login");
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
