'use client';

import { createContext, useContext, useCallback, useState } from 'react';

interface DashboardRefreshContextType {
  refreshStats: () => void;
  refreshCases: () => void;
  refreshAll: () => void;
  isRefreshing: boolean;
  registerRefreshStats: (callback: () => void) => void;
  registerRefreshCases: (callback: () => void) => void;
}

const DashboardRefreshContext = createContext<DashboardRefreshContextType | undefined>(undefined);

export function DashboardRefreshProvider({ children }: { children: React.ReactNode }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshStatsCallback, setRefreshStatsCallback] = useState<(() => void) | null>(null);
  const [refreshCasesCallback, setRefreshCasesCallback] = useState<(() => void) | null>(null);

  const refreshStats = useCallback(() => {
    if (refreshStatsCallback) {
      refreshStatsCallback();
    }
  }, [refreshStatsCallback]);

  const refreshCases = useCallback(() => {
    if (refreshCasesCallback) {
      refreshCasesCallback();
    }
  }, [refreshCasesCallback]);

  const refreshAll = useCallback(() => {
    setIsRefreshing(true);
    
    // Refresh both components
    if (refreshStatsCallback) {
      refreshStatsCallback();
    }
    if (refreshCasesCallback) {
      refreshCasesCallback();
    }
    
    // Reset refreshing state after a short delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  }, [refreshStatsCallback, refreshCasesCallback]);

  const registerRefreshStats = useCallback((callback: () => void) => {
    setRefreshStatsCallback(() => callback);
  }, []);

  const registerRefreshCases = useCallback((callback: () => void) => {
    setRefreshCasesCallback(() => callback);
  }, []);

  return (
    <DashboardRefreshContext.Provider 
      value={{ 
        refreshStats, 
        refreshCases, 
        refreshAll, 
        isRefreshing,
        registerRefreshStats,
        registerRefreshCases
      }}
    >
      {children}
    </DashboardRefreshContext.Provider>
  );
}

export function useDashboardRefresh() {
  const context = useContext(DashboardRefreshContext);
  if (context === undefined) {
    throw new Error('useDashboardRefresh must be used within a DashboardRefreshProvider');
  }
  return context;
}
