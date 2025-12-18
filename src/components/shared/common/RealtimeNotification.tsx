'use client';

import { useState, useEffect } from 'react';
import { X, Bell, Info, ShieldCheck } from 'lucide-react';

interface NotificationData {
  id: string;
  type: 'new_case' | 'case_updated' | 'case_completed';
  title: string;
  message: string;
  timestamp: Date;
}

interface RealtimeNotificationProps {
  onNewCase?: (caseData: unknown) => void;
  onCaseUpdate?: (caseData: unknown) => void;
  onForceRefresh?: () => void;
}

export default function RealtimeNotification({
  onNewCase,
  onCaseUpdate,
  onForceRefresh
}: RealtimeNotificationProps) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [lastCaseCount, setLastCaseCount] = useState(0);

  const addNotification = (notification: Omit<NotificationData, 'id' | 'timestamp'>) => {
    const newNotification: NotificationData = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date()
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 2)]);
    setIsVisible(true);

    setTimeout(() => {
      removeNotification(newNotification.id);
    }, 6000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => {
      const filtered = prev.filter(n => n.id !== id);
      if (filtered.length === 0) setIsVisible(false);
      return filtered;
    });
  };

  const checkForNewCases = async () => {
    try {
      const response = await fetch('/api/dashboard/cases');
      if (response.ok) {
        const data = await response.json();
        const currentCount = data.data?.length || 0;

        if (lastCaseCount > 0 && currentCount > lastCaseCount) {
          addNotification({
            type: 'new_case',
            title: 'Thông báo IT',
            message: `Có ${currentCount - lastCaseCount} yêu cầu mới.`
          });
          if (onForceRefresh) onForceRefresh();
          if (onNewCase) onNewCase(data.data);
        }
        setLastCaseCount(currentCount);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    checkForNewCases();
    const interval = setInterval(checkForNewCases, 30000);
    return () => clearInterval(interval);
  }, [lastCaseCount]);

  if (!isVisible || notifications.length === 0) return null;

  return (
    <div className="fixed top-16 right-4 z-[60] flex flex-col gap-2 w-72 pointer-events-none">
      {notifications.map((n) => (
        <div
          key={n.id}
          className="pointer-events-auto bg-white border border-gray-200 shadow-lg rounded-lg p-3 flex gap-3 group animate-in slide-in-from-right-4 fade-in duration-200"
        >
          <div className={`mt-0.5 p-1.5 rounded-md ${n.type === 'new_case' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
            }`}>
            {n.type === 'new_case' ? <Bell className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[12px] font-bold text-gray-900">{n.title}</span>
              <button onClick={() => removeNotification(n.id)} className="text-gray-400 hover:text-gray-600">
                <X className="h-3 w-3" />
              </button>
            </div>
            <p className="text-[11px] text-gray-500 leading-tight">{n.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
