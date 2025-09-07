'use client';

import { useDashboardRefresh } from '@/contexts/DashboardRefreshContext';
import RealtimeNotification from '@/components/shared/common/RealtimeNotification';

export default function DashboardNotificationWrapper() {
  const { refreshAll } = useDashboardRefresh();

  return (
    <RealtimeNotification 
      onForceRefresh={refreshAll}
    />
  );
}
