"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SessionExpiredModal() {
  const { data: session } = useSession();
  const router = useRouter();
  const [showExpiredModal, setShowExpiredModal] = useState(false);

  useEffect(() => {
    if (!session?.user) return;

    // @ts-expect-error custom field
    const loginTime = session.user.loginTime;
    if (!loginTime) return;

    const sessionDuration = 60 * 60 * 1000; // 1 hour in milliseconds
    const expiryTime = loginTime + sessionDuration;

    const checkExpiry = () => {
      const now = Date.now();
      if (now >= expiryTime) {
        setShowExpiredModal(true);
        // Auto logout after 5 seconds
        setTimeout(() => {
          signOut({ redirect: false });
          router.push("/login");
        }, 5000);
      }
    };

    // Initial check
    checkExpiry();
    
    // Only run interval when tab is visible
    let interval: NodeJS.Timeout;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden, clear interval
        if (interval) {
          clearInterval(interval);
        }
      } else {
        // Tab is visible, start interval
        checkExpiry(); // Check immediately when tab becomes visible
        interval = setInterval(checkExpiry, 1000);
      }
    };

    // Set up visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Start interval if tab is currently visible
    if (!document.hidden) {
      interval = setInterval(checkExpiry, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session, router]);

  if (!showExpiredModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md mx-4 text-center">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Phiên làm việc đã hết hạn</h2>
        <p className="text-gray-600 mb-6">
          Phiên làm việc của bạn đã hết hạn. Bạn sẽ được chuyển đến trang đăng nhập trong vài giây.
        </p>
        <div className="flex justify-center">
          <button
            onClick={() => {
              signOut({ redirect: false });
              router.push("/login");
            }}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Đăng nhập lại ngay
          </button>
        </div>
      </div>
    </div>
  );
}
