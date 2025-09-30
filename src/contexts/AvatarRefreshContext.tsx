'use client';

import { createContext, useContext, useCallback, useState } from 'react';

interface AvatarRefreshContextType {
  refreshAvatar: () => void;
  isRefreshing: boolean;
  registerRefreshCallback: (callback: () => void) => void;
}

const AvatarRefreshContext = createContext<AvatarRefreshContextType | undefined>(undefined);

export function AvatarRefreshProvider({ children }: { children: React.ReactNode }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshCallback, setRefreshCallback] = useState<(() => void) | null>(null);

  const refreshAvatar = useCallback(() => {
    setIsRefreshing(true);
    
    if (refreshCallback) {
      refreshCallback();
    }
    
    // Reset refreshing state after a short delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  }, [refreshCallback]);

  const registerRefreshCallback = useCallback((callback: () => void) => {
    setRefreshCallback(() => callback);
  }, []);

  return (
    <AvatarRefreshContext.Provider 
      value={{ 
        refreshAvatar, 
        isRefreshing,
        registerRefreshCallback
      }}
    >
      {children}
    </AvatarRefreshContext.Provider>
  );
}

export function useAvatarRefresh() {
  const context = useContext(AvatarRefreshContext);
  if (context === undefined) {
    throw new Error('useAvatarRefresh must be used within an AvatarRefreshProvider');
  }
  return context;
}
