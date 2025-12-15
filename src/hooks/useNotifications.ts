'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import { useSocket } from '@/providers/SocketProvider';
import toast from 'react-hot-toast';

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
  fetchNotifications: (showLoading?: boolean) => Promise<void>;
  forceRefresh: () => void;
  refreshIfNeeded: () => void;
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
  const lastFetchTimeRef = useRef<number>(0);
  const CACHE_DURATION = 15000; // 15 seconds cache

  const { socket } = useSocket();

  const fetchNotifications = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      // Track last fetch time
      const now = Date.now();
      lastFetchTimeRef.current = now;
      (window as any).lastNotificationFetch = now;

      const response = await fetch('/api/notifications?limit=50', {
        headers: {
          'Cache-Control': 'max-age=30' // Cache for 30 seconds
        }
      });

      // Handle 401 Unauthorized gracefully (session expired or not logged in)
      if (response.status === 401) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

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
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    // Skip if user is actively interacting with notifications
    if (isUserInteractingRef.current) {
      return;
    }

    try {
      const response = await fetch('/api/notifications/unread-count');

      // Handle 401 Unauthorized gracefully
      if (response.status === 401) {
        setUnreadCount(0);
        return;
      }

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

    // Poll less frequently if socket is connected
    const POLL_INTERVAL = socket ? 60000 : 15000;

    const startPolling = () => {
      // Poll for unread count
      unreadInterval = setInterval(fetchUnreadCount, POLL_INTERVAL);

      // Poll for full notifications (less frequent)
      fullInterval = setInterval(() => fetchNotifications(false), POLL_INTERVAL * 2);
    };

    const stopPolling = () => {
      if (unreadInterval) clearInterval(unreadInterval);
      if (fullInterval) clearInterval(fullInterval);
    };

    // Start polling initially
    startPolling();

    // Socket listeners
    if (socket) {
      socket.on('refresh_notifications', () => {
        console.log('Socket: Refreshing notifications');
        fetchNotifications(false);
        fetchUnreadCount();
      });

      socket.on('new_notification', (data: any) => {
        // Show toast
        toast(data.message, {
          icon: '🔔',
          duration: 4000
        });
        // Also refresh
        fetchNotifications(false);
      });
    }

    // Handle visibility change
    const handleVisibilityChange = () => {
      try {
        if (document.hidden) {
          stopPolling();
        } else {
          // Only refresh if we've been away for more than 30 seconds
          const now = Date.now();
          const timeSinceLastFetch = now - (window as any).lastNotificationFetch || 0;
          if (timeSinceLastFetch > 30000) {
            console.log('Refreshing notifications due to visibility change');
            fetchNotifications().catch(error => {
              console.error('Error refreshing notifications on visibility change:', error);
            });
            (window as any).lastNotificationFetch = now;
          }
          startPolling();
        }
      } catch (error) {
        console.error('Error in visibility change handler:', error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      if (socket) {
        socket.off('refresh_notifications');
        socket.off('new_notification');
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Clear debounce timeout on cleanup
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [fetchNotifications, fetchUnreadCount, socket]);

  // Add a function to force refresh notifications with debounce
  const forceRefresh = useCallback(() => {
    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set a new timeout to debounce rapid calls
    debounceTimeoutRef.current = setTimeout(() => {
      fetchNotifications(true).catch(error => {
        console.error('Error in force refresh:', error);
      });
    }, 500); // 500ms debounce
  }, [fetchNotifications]);

  // Smart refresh - only fetch if cache expired
  const refreshIfNeeded = useCallback(() => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;

    // If data is fresh (< 15 seconds), don't fetch
    if (timeSinceLastFetch < CACHE_DURATION) {
      console.log(`Using cached notifications (${Math.round(timeSinceLastFetch / 1000)}s old)`);
      return;
    }

    // Data is stale, fetch in background without showing loader
    console.log(`Refreshing notifications in background (${Math.round(timeSinceLastFetch / 1000)}s old)`);
    fetchNotifications(false).catch(error => {
      console.error('Error in background refresh:', error);
    });
  }, [fetchNotifications, CACHE_DURATION]);

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
    refreshIfNeeded,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    setUserInteracting,
  };
}
