'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, Trash2, RefreshCw, Calendar, Inbox } from 'lucide-react';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { formatVietnamDateTime } from '@/lib/date-utils';

interface NotificationCenterProps {
  onCaseClick?: (caseId: string, caseType: string) => void;
}

export default function NotificationCenter({ onCaseClick }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    loading,
    forceRefresh,
    refreshIfNeeded,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    setUserInteracting,
  } = useNotificationContext();

  const filteredNotifications = activeTab === 'all'
    ? notifications
    : notifications.filter(n => !n.isRead);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setUserInteracting(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, setUserInteracting]);

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) markAsRead(notification.id);
    if (notification.caseId && notification.caseType && onCaseClick) {
      onCaseClick(notification.caseId, notification.caseType);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          const newIsOpen = !isOpen;
          setIsOpen(newIsOpen);
          setUserInteracting(newIsOpen);
          if (newIsOpen) refreshIfNeeded();
        }}
        className={`relative p-2 rounded-lg transition-colors ${isOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          }`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Compact Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-sm font-bold text-gray-900">Thông báo</span>
            <div className="flex items-center gap-1">
              <button
                onClick={forceRefresh}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
                title="Làm mới"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => { setIsOpen(false); setUserInteracting(false); }}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Sub-header: Tabs */}
          <div className="flex px-4 py-2 border-b border-gray-100 gap-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`text-xs font-semibold pb-1 border-b-2 transition-colors ${activeTab === 'all' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`text-xs font-semibold pb-1 border-b-2 transition-colors flex items-center gap-1 ${activeTab === 'unread' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
            >
              Chưa đọc
              {unreadCount > 0 && <span className="bg-blue-100 text-blue-700 px-1.5 rounded-full text-[10px]">{unreadCount}</span>}
            </button>
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center"><RefreshCw className="h-5 w-5 animate-spin mx-auto text-gray-300" /></div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-10 text-center">
                <Inbox className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">Không có thông báo nào</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filteredNotifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`relative p-3 flex gap-3 hover:bg-gray-50 cursor-pointer group transition-colors ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className={`text-xs font-bold leading-tight truncate ${!n.isRead ? 'text-blue-700' : 'text-gray-900'}`}>{n.title}</p>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">{formatVietnamDateTime(n.createdAt).split(' ')[1]}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 line-clamp-2 leading-snug">{n.message}</p>

                      <div className="mt-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-medium text-gray-400">{formatVietnamDateTime(n.createdAt).split(' ')[0]}</span>
                          {n.caseType && <span className="text-[9px] font-bold text-gray-400 px-1.5 py-0.5 bg-gray-100 rounded uppercase">{n.caseType}</span>}
                        </div>
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          {!n.isRead && (
                            <button onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }} className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                              <Check className="h-3 w-3" />
                            </button>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-2 border-t border-gray-50 text-center">
            <button
              onClick={markAllAsRead}
              className="text-[11px] font-bold text-gray-500 hover:text-blue-600 w-full py-1 rounded hover:bg-gray-50 transition-colors"
            >
              Đánh dấu đã xem tất cả
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
