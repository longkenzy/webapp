/**
 * Lazy-loaded Components
 * Tối ưu hóa bundle size và initial load time
 */

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
  </div>
);

const LoadingModal = () => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-8">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  </div>
);

// ==================== Modals ====================
// Modals are heavy and not needed on initial page load

export const CreateIncidentModal = dynamic(
  () => import('@/app/user/work/incident/CreateIncidentModal'),
  {
    loading: () => <LoadingModal />,
    ssr: false // Modals don't need SSR
  }
);

export const CreateMaintenanceModal = dynamic(
  () => import('@/app/user/work/maintenance/CreateMaintenanceModal'),
  {
    loading: () => <LoadingModal />,
    ssr: false
  }
);

export const CreateDeploymentModal = dynamic(
  () => import('@/app/user/work/deployment/CreateDeploymentModal'),
  {
    loading: () => <LoadingModal />,
    ssr: false
  }
);

export const CreateWarrantyModal = dynamic(
  () => import('@/app/user/work/warranty/CreateWarrantyModal'),
  {
    loading: () => <LoadingModal />,
    ssr: false
  }
);

export const CreateInternalCaseModal = dynamic(
  () => import('@/app/user/work/internal/CreateInternalCaseModal'),
  {
    loading: () => <LoadingModal />,
    ssr: false
  }
);

export const CreateReceivingCaseModal = dynamic(
  () => import('@/app/user/work/receiving/CreateReceivingCaseModal'),
  {
    loading: () => <LoadingModal />,
    ssr: false
  }
);

export const CreateDeliveryCaseModal = dynamic(
  () => import('@/app/user/work/delivery/CreateDeliveryCaseModal'),
  {
    loading: () => <LoadingModal />,
    ssr: false
  }
);

// Edit Modals
export const EditIncidentModal = dynamic(
  () => import('@/app/user/work/incident/EditIncidentModal'),
  {
    loading: () => <LoadingModal />,
    ssr: false
  }
);

export const EditMaintenanceModal = dynamic(
  () => import('@/app/user/work/maintenance/EditMaintenanceModal'),
  {
    loading: () => <LoadingModal />,
    ssr: false
  }
);

export const EditDeploymentModal = dynamic(
  () => import('@/app/user/work/deployment/EditDeploymentModal'),
  {
    loading: () => <LoadingModal />,
    ssr: false
  }
);

export const EditWarrantyModal = dynamic(
  () => import('@/app/user/work/warranty/EditWarrantyModal'),
  {
    loading: () => <LoadingModal />,
    ssr: false
  }
);

export const EditInternalCaseModal = dynamic(
  () => import('@/app/user/work/internal/EditInternalCaseModal'),
  {
    loading: () => <LoadingModal />,
    ssr: false
  }
);

// View Modals
export const ViewIncidentModal = dynamic(
  () => import('@/app/user/work/incident/ViewIncidentModal'),
  {
    loading: () => <LoadingModal />,
    ssr: false
  }
);

export const ViewMaintenanceModal = dynamic(
  () => import('@/app/user/work/maintenance/ViewMaintenanceModal'),
  {
    loading: () => <LoadingModal />,
    ssr: false
  }
);

export const ViewWarrantyModal = dynamic(
  () => import('@/app/user/work/warranty/ViewWarrantyModal'),
  {
    loading: () => <LoadingModal />,
    ssr: false
  }
);

// ==================== Charts ====================
// Charts are heavy with recharts library

export const DashboardCharts = dynamic(
  () => import('@/components/charts/DashboardCharts'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false // Charts don't need SSR and use browser APIs
  }
);

export const CasesPieChart = dynamic(
  () => import('@/components/dashboard/CasesPieChart'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
);

// ==================== Tables ====================
// Large tables can be lazy loaded

export const AdminAllCasesTable = dynamic(
  () => import('@/components/admin/AdminAllCasesTable'),
  {
    loading: () => <LoadingSpinner />
  }
);

export const DeliveryCaseTable = dynamic(
  () => import('@/components/admin/DeliveryCaseTable'),
  {
    loading: () => <LoadingSpinner />
  }
);

export const ReceivingCaseTable = dynamic(
  () => import('@/components/admin/ReceivingCaseTable'),
  {
    loading: () => <LoadingSpinner />
  }
);

export const InternalCaseTable = dynamic(
  () => import('@/components/admin/InternalCaseTable'),
  {
    loading: () => <LoadingSpinner />
  }
);

// ==================== Calendar ====================
// Calendar với FullCalendar library rất nặng

export const ScheduleCalendar = dynamic(
  () => import('@/components/schedule/ScheduleCalendar'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false // Calendar needs browser APIs
  }
);

// ==================== Utilities ====================

/**
 * Prefetch a lazy component
 * Useful for hover/focus events
 */
export function prefetchComponent(component: any) {
  if (component && component.preload) {
    component.preload();
  }
}

/**
 * Example usage:
 * 
 * <button
 *   onMouseEnter={() => prefetchComponent(CreateIncidentModal)}
 *   onClick={() => setShowModal(true)}
 * >
 *   Create Incident
 * </button>
 */

