'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface LiveIndicatorProps {
  isActive?: boolean;
  className?: string;
}

export default function LiveIndicator({ 
  isActive = true, 
  className = '' 
}: LiveIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update last update time every 30 seconds
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (!isActive) return null;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-1">
        {isOnline ? (
          <Wifi className="h-3 w-3 text-green-500" />
        ) : (
          <WifiOff className="h-3 w-3 text-red-500" />
        )}
        <span className={`text-xs font-medium ${
          isOnline ? 'text-green-600' : 'text-red-600'
        }`}>
          {isOnline ? 'Live' : 'Offline'}
        </span>
      </div>
      
      {lastUpdate && (
        <span className="text-xs text-gray-500">
          • {lastUpdate.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
        </span>
      )}
    </div>
  );
}
