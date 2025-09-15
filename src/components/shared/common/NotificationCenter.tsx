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
          
          // Force refresh when opening notifications
          if (newIsOpen) {
            forceRefresh();
          }
        }}
        className="relative p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 group"
      >
        <Bell className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-3 w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 max-h-96 overflow-hidden backdrop-blur-sm">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Thông báo</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-blue-600 font-medium">{unreadCount} thông báo chưa đọc</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={forceRefresh}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200"
                title="Làm mới"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all duration-200 flex items-center space-x-1"
                >
                  <Eye className="h-3 w-3" />
                  <span>Đọc tất cả</span>
                </button>
              )}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setUserInteracting(false);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="text-gray-600 font-medium">Đang tải thông báo...</span>
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">Không có thông báo nào</h3>
                <p className="text-xs text-gray-500">Bạn sẽ nhận được thông báo khi có hoạt động mới</p>
              </div>
            ) : (
              notifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className={`relative p-4 border-b border-gray-50 last:border-b-0 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all duration-200 group ${
                    !notification.isRead ? 'bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-l-4 border-l-blue-400' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className={`text-sm font-semibold ${
                              !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-2">
                            <p className="text-xs text-gray-500 font-medium">
                              {new Date(notification.createdAt).toLocaleString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            {notification.caseType && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                                {notification.caseType}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                              title="Đánh dấu đã đọc"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                            title="Xóa thông báo"
                          >
                            <Trash2 className="h-4 w-4" />
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
