'use client';

import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationCenter from '@/components/shared/common/NotificationCenter';
import { NotificationProvider } from '@/contexts/NotificationContext';

function TestNotificationsContent() {
  const [testMessage, setTestMessage] = useState('');
  const { notifications, unreadCount, loading, fetchNotifications } = useNotifications();

  const createTestNotification = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Test Notification',
          message: testMessage || 'This is a test notification',
          type: 'CASE_CREATED',
          userId: 'test-user-id', // This would normally be the current user's ID
        }),
      });

      if (response.ok) {
        alert('Test notification created!');
        fetchNotifications(); // Refresh notifications
      } else {
        alert('Failed to create test notification');
      }
    } catch (error) {
      console.error('Error creating test notification:', error);
      alert('Error creating test notification');
    }
  };

  const triggerCaseCreatedEvent = () => {
    window.dispatchEvent(new CustomEvent('case-created'));
    alert('Case created event triggered! Check if notifications refresh.');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Notifications</h1>
        
        {/* Notification Center */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Notification Center</h2>
          <div className="flex items-center space-x-4">
            <NotificationCenter />
            <div className="text-sm text-gray-600">
              Click the bell icon to see notifications
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Message
              </label>
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Enter test message..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex space-x-4">
              <button
                onClick={createTestNotification}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Create Test Notification
              </button>
              <button
                onClick={triggerCaseCreatedEvent}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Trigger Case Created Event
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Current Notifications</h2>
          
          {loading ? (
            <div className="text-center py-4">Loading notifications...</div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Total: {notifications.length} | Unread: {unreadCount}
              </div>
              
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No notifications found
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg ${
                        !notification.isRead 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {notification.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(notification.createdAt).toLocaleString('vi-VN')}
                          </p>
                        </div>
                        <div className="ml-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            notification.isRead 
                              ? 'bg-gray-100 text-gray-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {notification.isRead ? 'Read' : 'Unread'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TestNotificationsPage() {
  return (
    <NotificationProvider>
      <TestNotificationsContent />
    </NotificationProvider>
  );
}
