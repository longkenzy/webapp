'use client';

import { useState } from 'react';
import { Bell, X, Check, Trash2, Eye, RefreshCw } from 'lucide-react';
import { useNotificationContext } from '@/contexts/NotificationContext';

interface NotificationCenterProps {
  onCaseClick?: (caseId: string, caseType: string) => void;
}

export default function NotificationCenter({ onCaseClick }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    if (notification.caseId && notification.caseType && onCaseClick) {
      onCaseClick(notification.caseId, notification.caseType);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'CASE_CREATED':
        return '🆕';
      case 'CASE_UPDATED':
        return '📝';
      case 'CASE_COMPLETED':
        return '✅';
      case 'CASE_ASSIGNED':
        return '👤';
      case 'SYSTEM_ALERT':
        return '⚠️';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'CASE_CREATED':
        return 'bg-blue-50 border-blue-200';
      case 'CASE_UPDATED':
        return 'bg-yellow-50 border-yellow-200';
      case 'CASE_COMPLETED':
        return 'bg-green-50 border-green-200';
      case 'CASE_ASSIGNED':
        return 'bg-purple-50 border-purple-200';
      case 'SYSTEM_ALERT':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };


  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => {
          const newIsOpen = !isOpen;
          setIsOpen(newIsOpen);
          
          // Set user interaction state
          setUserInteracting(newIsOpen);
          
          // Smart refresh - only fetch if needed (cache expired)
          if (newIsOpen) {
            refreshIfNeeded();
          }
        }}
        className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-semibold rounded-full h-4 w-4 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[400px] overflow-hidden">
          {/* Header */}
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-0.5">
              <button
                onClick={forceRefresh}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Làm mới"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-2 py-1 text-[10px] font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Đọc tất cả"
                >
                  <Eye className="h-3 w-3" />
                </button>
              )}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setUserInteracting(false);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[340px] overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-xs text-gray-600">Đang tải...</span>
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Bell className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-xs font-medium text-gray-900 mb-1">Không có thông báo</h3>
                <p className="text-[10px] text-gray-500">Bạn sẽ nhận được thông báo khi có hoạt động mới</p>
              </div>
            ) : (
              notifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className={`relative px-3 py-2 border-b border-gray-100 last:border-b-0 hover:bg-blue-50 cursor-pointer transition-colors group ${
                    !notification.isRead ? 'bg-blue-50/50 border-l-2 border-l-blue-500' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-2">
                    <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-1.5 mb-0.5">
                            <p className={`text-xs font-semibold leading-tight ${
                              !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mb-1 leading-snug line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-1.5">
                            <p className="text-[10px] text-gray-500">
                              {new Date(notification.createdAt).toLocaleString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            {notification.caseType && (
                              <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-medium">
                                {notification.caseType}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-0.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Đánh dấu đã đọc"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Xóa thông báo"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
