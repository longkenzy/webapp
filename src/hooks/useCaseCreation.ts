'use client';

import { useEffect } from 'react';
import { useNotificationContext } from '@/contexts/NotificationContext';

// Custom hook to handle case creation events and refresh notifications
export function useCaseCreation() {
  const { forceRefresh } = useNotificationContext();

  useEffect(() => {
    // Listen for case creation events
    const handleCaseCreated = () => {
      // Refresh notifications when a case is created
      setTimeout(() => {
        forceRefresh();
      }, 1000); // Small delay to ensure notification is created in database
    };

    // Listen for custom events
    window.addEventListener('case-created', handleCaseCreated);
    window.addEventListener('case-updated', handleCaseCreated);

    return () => {
      window.removeEventListener('case-created', handleCaseCreated);
      window.removeEventListener('case-updated', handleCaseCreated);
    };
  }, [forceRefresh]);

  // Function to trigger case creation event
  const triggerCaseCreated = () => {
    window.dispatchEvent(new CustomEvent('case-created'));
  };

  return { triggerCaseCreated };
}
