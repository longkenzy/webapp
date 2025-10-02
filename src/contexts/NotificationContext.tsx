'use client';

import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationContextType {
  notifications: any[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  forceRefresh: () => void;
  refreshIfNeeded: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  setUserInteracting: (interacting: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const notificationHook = useNotifications();

  // Add focus listener to refresh when window gains focus (with throttling)
  useEffect(() => {
    let lastRefreshTime = 0;
    const REFRESH_COOLDOWN = 60000; // 60 seconds cooldown (increased from 30s)
    
    const handleFocus = () => {
      const now = Date.now();
      if (!document.hidden && (now - lastRefreshTime) > REFRESH_COOLDOWN) {
        lastRefreshTime = now;
        console.log('Refreshing notifications due to focus (cooldown applied)');
        notificationHook.forceRefresh();
      } else {
        console.log('Skipping notification refresh due to cooldown');
      }
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [notificationHook.forceRefresh]);

  return (
    <NotificationContext.Provider value={notificationHook}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}
