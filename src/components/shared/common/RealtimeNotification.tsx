'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, X, Bell } from 'lucide-react';

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
  onForceRefresh?: () => void; // New prop to trigger immediate refresh
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

    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]); // Keep only 5 latest
    setIsVisible(true);

    // Auto hide after 5 seconds
    setTimeout(() => {
      setIsVisible(false);
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const checkForNewCases = async () => {
    try {
      const response = await fetch('/api/dashboard/cases');
      if (response.ok) {
        const data = await response.json();
        const currentCount = data.data?.length || 0;
        
        if (lastCaseCount > 0 && currentCount > lastCaseCount) {
          const newCasesCount = currentCount - lastCaseCount;
          addNotification({
            type: 'new_case',
            title: 'Case mới',
            message: `Có ${newCasesCount} case mới được tạo`
          });
          
          // Trigger immediate refresh of dashboard components
          if (onForceRefresh) {
            onForceRefresh();
          }
          
          if (onNewCase) {
            onNewCase(data.data);
          }
        }
        
        setLastCaseCount(currentCount);
      }
    } catch (error) {
      console.error('Error checking for new cases:', error);
    }
  };

  useEffect(() => {
    // Initial check
    checkForNewCases();
    
    // Check every 30 seconds to reduce API calls
    const interval = setInterval(checkForNewCases, 30000);
    
    return () => clearInterval(interval);
  }, [lastCaseCount]);

  if (!isVisible || notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm animate-in slide-in-from-right duration-300"
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {notification.type === 'new_case' && (
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Bell className="h-4 w-4 text-blue-600" />
                </div>
              )}
              {notification.type === 'case_completed' && (
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {notification.title}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {notification.message}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {notification.timestamp.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
              </p>
            </div>
            
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
