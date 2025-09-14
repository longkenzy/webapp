'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'CASE_CREATED' | 'CASE_UPDATED' | 'CASE_COMPLETED' | 'CASE_ASSIGNED' | 'SYSTEM_ALERT';
  isRead: boolean;
  caseId?: string;
  caseType?: string;
  createdAt: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  forceRefresh: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  setUserInteracting: (interacting: boolean) => void;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUserInteractingRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/notifications?limit=50');
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.notifications?.filter((n: Notification) => !n.isRead).length || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    // Skip if user is actively interacting with notifications
    if (isUserInteractingRef.current) {
      return;
    }
    
    try {
      const response = await fetch('/api/notifications/unread-count');
      
      if (response.ok) {
        const data = await response.json();
        const newUnreadCount = data.unreadCount || 0;
        
        // Only update if count actually changed
        if (newUnreadCount !== unreadCount) {
          setUnreadCount(newUnreadCount);
        }
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, [unreadCount]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRead: true }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        setUnreadCount(prev => {
          const notification = notifications.find(n => n.id === id);
          return notification && !notification.isRead ? Math.max(0, prev - 1) : prev;
        });
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, [notifications]);

  useEffect(() => {
    fetchNotifications();
    
    // Only poll when tab is visible and user is active
    let unreadInterval: NodeJS.Timeout;
    let fullInterval: NodeJS.Timeout;
    
    const startPolling = () => {
      // Poll for unread count every 15 seconds (less frequent)
      unreadInterval = setInterval(fetchUnreadCount, 15000);
      
      // Poll for full notifications every 30 seconds
      fullInterval = setInterval(fetchNotifications, 30000);
    };
    
    const stopPolling = () => {
      if (unreadInterval) clearInterval(unreadInterval);
      if (fullInterval) clearInterval(fullInterval);
    };
    
    // Start polling initially
    startPolling();
    
    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        // Refresh immediately when tab becomes visible
        fetchNotifications();
        startPolling();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Clear debounce timeout on cleanup
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [fetchNotifications, fetchUnreadCount]);

  // Add a function to force refresh notifications with debounce
  const forceRefresh = useCallback(() => {
    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Set a new timeout to debounce rapid calls
    debounceTimeoutRef.current = setTimeout(() => {
      fetchNotifications();
    }, 500); // 500ms debounce
  }, [fetchNotifications]);

  // Function to manage user interaction state
  const setUserInteracting = useCallback((interacting: boolean) => {
    isUserInteractingRef.current = interacting;
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    forceRefresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    setUserInteracting,
  };
}
