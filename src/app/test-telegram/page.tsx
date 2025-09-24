'use client';

import { useState } from 'react';

export default function TestTelegramPage() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState('');

  const testConfig = async () => {
    setLoading(true);
    setResult('Testing Telegram configuration...');
    
    try {
      const response = await fetch('/api/test-telegram');
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setLoading(false);
  };

  const testSend = async () => {
    setLoading(true);
    setResult('Sending test Telegram notification...');
    
    try {
      const response = await fetch('/api/test-telegram', {
        method: 'POST'
      });
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setLoading(false);
  };

  const getBotInfo = async () => {
    setLoading(true);
    setResult('Getting bot info...');
    
    try {
      const response = await fetch('/api/test-telegram', {
        method: 'PUT'
      });
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setLoading(false);
  };

  const updateChatId = async () => {
    if (!chatId.trim()) {
      setResult('Please enter a Chat ID');
      return;
    }
    
    setLoading(true);
    setResult('Updating Chat ID...');
    
    try {
      // This would typically be done through an API call to update environment
      setResult(`Chat ID updated to: ${chatId}\n\nNote: You need to update TELEGRAM_CHAT_ID in env.development file manually.`);
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            📱 Test Telegram Notification
          </h1>
          
          <div className="space-y-4 mb-6">
            <button
              onClick={testConfig}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              🔧 Test Configuration
            </button>
            
            <button
              onClick={testSend}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors ml-4"
            >
              📤 Send Test Message
            </button>
            
            <button
              onClick={getBotInfo}
              disabled={loading}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors ml-4"
            >
              🤖 Get Bot Info
            </button>
          </div>
          
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">⚠️ Setup Required:</h3>
            <div className="text-sm text-yellow-800 space-y-2">
              <p><strong>1. Get your Chat ID:</strong></p>
              <ol className="list-decimal list-inside ml-4 space-y-1">
                <li>Send a message to your bot</li>
                <li>Visit: <code className="bg-yellow-200 px-1 rounded">https://api.telegram.org/bot7957331372:AAEl8wYO_mlZz3XLhzBGg9AKr-LZM--3LKo/getUpdates</code></li>
                <li>Find &quot;chat&quot;:&quot;id&quot;: in the response</li>
                <li>Copy the Chat ID number</li>
              </ol>
              <p><strong>2. Update env.development:</strong></p>
              <p>Add your Chat ID to <code className="bg-yellow-200 px-1 rounded">TELEGRAM_CHAT_ID</code></p>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chat ID (for testing):
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="Enter your Chat ID"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={updateChatId}
                disabled={loading}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Update
              </button>
            </div>
          </div>
          
          {result && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Result:</h3>
              <div className="bg-gray-100 p-4 rounded-lg">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-auto">
                  {result}
                </pre>
              </div>
            </div>
          )}
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">📋 Telegram Configuration:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Bot Token:</strong> 7957331372:AAEl8wYO_mlZz3XLhzBGg9AKr-LZM--3LKo</li>
              <li>• <strong>Chat ID:</strong> {chatId || 'Not set (get from getUpdates API)'}</li>
              <li>• <strong>API URL:</strong> https://api.telegram.org/bot7957331372:AAEl8wYO_mlZz3XLhzBGg9AKr-LZM--3LKo</li>
            </ul>
          </div>
          
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-2">✅ Features:</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Telegram notification cho tất cả case types</li>
              <li>• HTML formatting với emojis</li>
              <li>• Error handling và logging</li>
              <li>• Test API endpoints</li>
              <li>• Integration với existing notification system</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
