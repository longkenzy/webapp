'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  Ticket,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Calendar,
  TrendingUp,
  User,
  Settings,
  FileText,
  Eye,
  Edit,
  Truck,
  Package,
  Wrench,
  Shield,
  AlertTriangle,
  RefreshCw,
  Rocket,
  ChevronDown,
  Search,
  Building2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import toast from 'react-hot-toast';
import EditInternalCaseModal from '@/app/admin/work/internal/EditInternalCaseModal';
import EditIncidentModal from '@/app/admin/work/incident/EditIncidentModal';
import CreateDeploymentModal from '@/app/admin/work/deployment/CreateDeploymentModal';
import CreateMaintenanceModal from '@/app/admin/work/maintenance/CreateMaintenanceModal';
import CreateWarrantyModal from '@/app/admin/work/warranty/CreateWarrantyModal';
import CreateDeliveryCaseModal from '@/app/admin/delivery-cases/CreateDeliveryCaseModal';
import CreateReceivingCaseModal from '@/app/admin/receiving-cases/CreateReceivingCaseModal';

interface CaseData {
  id: string;
  title: string;
  description: string;
  handler: {
    fullName: string;
  };
  customer?: {
    shortName?: string;
    fullCompanyName?: string;
  };
  supplier?: {
    shortName?: string;
    fullCompanyName?: string;
  };
  reporter?: {
    fullName: string;
  };
  status: string;
  startDate: string;
  endDate?: string;
  caseType: string;
  createdAt: string;
  updatedAt: string;
}

interface UnifiedCase {
  id: string;
  title: string;
  description: string;
  handlerName: string;
  handler?: {
    avatar?: string;
  };
  customerName: string;
  status: string;
  startDate: string;
  endDate?: string;
  caseType: string;
  createdAt: string;
  updatedAt: string;
  type: 'internal' | 'delivery' | 'receiving' | 'maintenance' | 'incident' | 'warranty' | 'deployment';
}

// Memoized Case Row Component
const CaseRow = memo(({ case_, index, startIndex, filteredCasesLength, getStatusColor, getStatusLabel, getCaseTypeLabel, getCaseTypeColor, onViewClick }: {
  case_: UnifiedCase;
  index: number;
  startIndex: number;
  filteredCasesLength: number;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
  getCaseTypeLabel: (type: string) => string;
  getCaseTypeColor: (type: string) => string;
  onViewClick: (type: string, id: string) => void;
}) => (
  <tr className="group hover:bg-blue-50/50 transition-colors duration-200 border-b border-gray-100 last:border-0">
    <td className="px-4 py-3 whitespace-nowrap">
      <div className="flex items-center justify-center w-8 h-8 bg-gray-50 text-gray-500 rounded-lg font-medium text-xs border border-gray-100 group-hover:bg-white group-hover:border-blue-100 group-hover:text-blue-600 transition-colors">
        {filteredCasesLength - (startIndex + index)}
      </div>
    </td>
    <td className="px-4 py-3 whitespace-nowrap">
      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getCaseTypeColor(case_.type)}`}>
        {getCaseTypeLabel(case_.type)}
      </span>
    </td>
    <td className="px-4 py-3 whitespace-nowrap">
      <div className="flex items-center space-x-3">
        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0 group-hover:border-blue-200 transition-colors">
          {case_.handler?.avatar ? (
            <img
              src={case_.handler.avatar.includes('/') ? case_.handler.avatar : `/api/avatars/${case_.handler.avatar}`}
              alt={case_.handlerName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <User className="h-4 w-4 text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{case_.handlerName}</span>
        </div>
      </div>
    </td>
    <td className="px-4 py-3">
      <div className="flex flex-col">
        {case_.type === 'internal' ? (
          <>
            <span className="text-sm font-semibold text-gray-900">Smart Services</span>
            <span className="text-xs text-gray-500">{case_.customerName.split('\n')[1] || 'Nội bộ'}</span>
          </>
        ) : (
          <span className="text-sm font-medium text-gray-900" title={case_.customerName}>
            {case_.customerName}
          </span>
        )}
      </div>
    </td>
    <td className="px-4 py-3 max-w-[200px]">
      <div className="text-sm font-medium text-gray-900 whitespace-pre-wrap" title={case_.title}>
        {case_.title}
      </div>
    </td>
    <td className="px-4 py-3 max-w-[250px]">
      <div className="text-xs text-gray-500 whitespace-pre-wrap leading-relaxed" title={case_.description}>
        {case_.type === 'delivery' || case_.type === 'receiving' ? (
          <div dangerouslySetInnerHTML={{
            __html: case_.description.replace(/\*\*(.*?)\*\*/g, '<span class="font-semibold text-gray-700">$1</span>')
          }} />
        ) : (
          case_.description
        )}
      </div>
    </td>
    <td className="px-4 py-3 whitespace-nowrap">
      <div className="flex flex-col space-y-1">
        <div className="flex items-center space-x-1.5 text-xs text-gray-500">
          <Clock className="h-3.5 w-3.5 text-blue-500" />
          <span>
            {new Date(case_.startDate).toLocaleDateString('vi-VN')}
            <span className="mx-1 text-gray-300">|</span>
            {new Date(case_.startDate).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
              timeZone: 'Asia/Ho_Chi_Minh'
            })}
          </span>
        </div>
        {case_.endDate && (
          <div className="flex items-center space-x-1.5 text-xs text-gray-500">
            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
            <span>
              {new Date(case_.endDate).toLocaleDateString('vi-VN')}
              <span className="mx-1 text-gray-300">|</span>
              {new Date(case_.endDate).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone: 'Asia/Ho_Chi_Minh'
              })}
            </span>
          </div>
        )}
      </div>
    </td>
    <td className="px-4 py-3 whitespace-nowrap">
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(case_.status)} border border-current/10 shadow-sm`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-60"></span>
        {getStatusLabel(case_.status)}
      </span>
    </td>
    <td className="px-4 py-3 whitespace-nowrap text-right">
      <button
        onClick={() => onViewClick(case_.type, case_.id)}
        className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 rounded-lg transition-all duration-200 group-hover:shadow-sm"
      >
        <Eye className="h-3.5 w-3.5 mr-1.5" />
        Chi tiết
      </button>
    </td>
  </tr>
));

CaseRow.displayName = 'CaseRow';

function AdminAllCasesTable() {
  const [allCases, setAllCases] = useState<UnifiedCase[]>([]);
  const [todayCases, setTodayCases] = useState<UnifiedCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'today' | 'all'>('today');
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    caseType: '',
    handler: '',
    status: '',
    customer: '',
    dateFrom: '',
    dateTo: ''
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  // Modal states
  const [selectedCaseData, setSelectedCaseData] = useState<any>(null);
  const [openedModal, setOpenedModal] = useState<string | null>(null);

  const handleViewCase = useCallback(async (type: string, id: string) => {
    const toastId = toast.loading('Đang tải thông tin case...');
    try {
      let endpoint = '';
      let modalType = '';

      switch (type) {
        case 'internal':
          endpoint = `/api/internal-cases/${id}`;
          modalType = 'internal';
          break;
        case 'incident':
          endpoint = `/api/incidents/${id}`;
          modalType = 'incident';
          break;
        case 'deployment':
          endpoint = `/api/deployment-cases/${id}`;
          modalType = 'deployment';
          break;
        case 'maintenance':
          endpoint = `/api/maintenance-cases/${id}`;
          modalType = 'maintenance';
          break;
        case 'warranty':
          endpoint = `/api/warranties/${id}`;
          modalType = 'warranty';
          break;
        case 'delivery':
          endpoint = `/api/delivery-cases/${id}`; // Need to confirm if ID route exists or use GET params
          // Fallback: If no direct ID route, might need to filter list or find better way.
          // Assuming [id]/route.ts exists as verified.
          modalType = 'delivery';
          break;
        case 'receiving':
          endpoint = `/api/receiving-cases/${id}`; // Need to confirm if ID route exists
          // Assuming [id]/route.ts exists.
          modalType = 'receiving';
          break;
        default:
          throw new Error('Unknown case type');
      }

      console.log(`Fetching case data from: ${endpoint}`);
      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`Failed to fetch case: ${response.statusText}`);
      }

      const result = await response.json();
      const data = result.data || result; // Handle different API response structures

      console.log('Case data loaded in AdminAllCasesTable:', data);
      console.log('Products in data:', data.products);

      setSelectedCaseData(data);
      setOpenedModal(modalType);
      toast.dismiss(toastId);

    } catch (error) {
      console.error('Error viewing case:', error);
      toast.error('Không thể tải thông tin case', { id: toastId });
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setOpenedModal(null);
    setSelectedCaseData(null);
  }, []);



  // Memoized utility functions
  const getStatusColor = useCallback((status: string) => {
    switch (status.toUpperCase()) {
      case 'RECEIVED':
      case 'REPORTED':
      case 'TIẾP NHẬN':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
      case 'INVESTIGATING':
      case 'PROCESSING':
      case 'ĐANG XỬ LÝ':
        return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED':
      case 'COMPLETED':
      case 'HOÀN THÀNH':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
      case 'HỦY':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getStatusLabel = useCallback((status: string) => {
    switch (status.toUpperCase()) {
      case 'RECEIVED':
      case 'REPORTED':
        return 'Tiếp nhận';
      case 'IN_PROGRESS':
      case 'INVESTIGATING':
      case 'PROCESSING':
        return 'Đang xử lý';
      case 'RESOLVED':
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'CANCELLED':
        return 'Hủy';
      default:
        return status;
    }
  }, []);

  const getCaseTypeIcon = useCallback((type: string) => {
    switch (type) {
      case 'internal':
        return <FileText className="h-4 w-4" />;
      case 'delivery':
        return <Truck className="h-4 w-4" />;
      case 'receiving':
        return <Package className="h-4 w-4" />;
      case 'maintenance':
        return <Wrench className="h-4 w-4" />;
      case 'incident':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warranty':
        return <Shield className="h-4 w-4" />;
      case 'deployment':
        return <Rocket className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  }, []);

  const getCaseTypeLabel = useCallback((type: string) => {
    switch (type) {
      case 'internal':
        return 'Case nội bộ';
      case 'delivery':
        return 'Case giao hàng';
      case 'receiving':
        return 'Case nhận hàng';
      case 'maintenance':
        return 'Case bảo trì';
      case 'incident':
        return 'Case sự cố';
      case 'warranty':
        return 'Case bảo hành';
      case 'deployment':
        return 'Case triển khai';
      default:
        return 'Case';
    }
  }, []);

  const getCaseTypeColor = useCallback((type: string) => {
    switch (type) {
      case 'internal':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'delivery':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'receiving':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'maintenance':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'incident':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warranty':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'deployment':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  const getActionLink = useCallback((type: string, id: string) => {
    switch (type) {
      case 'internal':
        return `/admin/work/internal`;
      case 'delivery':
        return `/admin/delivery-cases`;
      case 'receiving':
        return `/admin/receiving-cases`;
      case 'maintenance':
        return `/admin/work/maintenance`;
      case 'incident':
        return `/admin/work/incident`;
      case 'warranty':
        return `/admin/work/warranty`;
      case 'deployment':
        return `/admin/work/deployment`;
      default:
        return '#';
    }
  }, []);

  const fetchAllCases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Add cache control headers
      const fetchOptions = {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      };

      const [internalRes, deliveryRes, receivingRes, maintenanceRes, incidentRes, warrantyRes, deploymentRes] = await Promise.all([
        fetch('/api/internal-cases?limit=100', fetchOptions),
        fetch('/api/delivery-cases?limit=100', fetchOptions),
        fetch('/api/receiving-cases?limit=100', fetchOptions),
        fetch('/api/maintenance-cases?limit=100', fetchOptions),
        fetch('/api/incidents?limit=100', fetchOptions),
        fetch('/api/warranties?limit=100', fetchOptions),
        fetch('/api/deployment-cases?limit=100', fetchOptions)
      ]);

      const [internalData, deliveryData, receivingData, maintenanceData, incidentData, warrantyData, deploymentData] = await Promise.all([
        internalRes.json(),
        deliveryRes.json(),
        receivingRes.json(),
        maintenanceRes.json(),
        incidentRes.json(),
        warrantyRes.json(),
        deploymentRes.json()
      ]);

      const unifiedCases: UnifiedCase[] = [];

      // Process internal cases
      if (internalData.data) {
        internalData.data.forEach((case_: any) => {
          const titleWithForm = case_.form ? `Hình thức: ${case_.form}\n${case_.title}` : case_.title;

          unifiedCases.push({
            id: case_.id,
            title: titleWithForm,
            description: case_.description,
            handlerName: case_.handler?.fullName || 'Chưa phân công',
            handler: case_.handler ? {
              avatar: case_.handler.avatar
            } : undefined,
            customerName: `Smart Services\n${case_.requester?.fullName || 'Nội bộ'}`,
            status: case_.status,
            startDate: case_.startDate,
            endDate: case_.endDate,
            caseType: case_.caseType || 'Nội bộ',
            createdAt: case_.createdAt,
            updatedAt: case_.updatedAt,
            type: 'internal'
          });
        });
      }

      // Process delivery cases
      if (deliveryData.deliveryCases) {
        deliveryData.deliveryCases.forEach((case_: any) => {
          // Format products for delivery cases
          const productsInfo = case_.products && case_.products.length > 0
            ? case_.products.map((product: any) =>
              `**${product.name}** | SL: ${product.quantity} | Mã: ${product.code || product.serialNumber || ''}`
            ).join('\n')
            : case_.description;

          const titleWithForm = case_.form ? `Hình thức: ${case_.form}\n${case_.title}` : case_.title;

          unifiedCases.push({
            id: case_.id,
            title: titleWithForm,
            description: productsInfo,
            handlerName: case_.handler?.fullName || 'Chưa phân công',
            handler: case_.handler ? {
              avatar: case_.handler.avatar
            } : undefined,
            customerName: case_.customer?.shortName || case_.customer?.fullCompanyName || 'Khách hàng',
            status: case_.status,
            startDate: case_.startDate,
            endDate: case_.endDate,
            caseType: 'Giao hàng',
            createdAt: case_.createdAt,
            updatedAt: case_.updatedAt,
            type: 'delivery'
          });
        });
      }

      // Process receiving cases
      if (receivingData.receivingCases) {
        receivingData.receivingCases.forEach((case_: any) => {
          // Format products for receiving cases
          let productsInfo = case_.products && case_.products.length > 0
            ? case_.products.map((product: any) =>
              `**${product.name}** | SL: ${product.quantity} | Mã: ${product.code || product.serialNumber || ''}`
            ).join('\n')
            : case_.description;

          // Add notes if available
          if (case_.notes) {
            productsInfo += `\n*Ghi chú: ${case_.notes}*`;
          }

          const titleWithForm = case_.form ? `Hình thức: ${case_.form}\n${case_.title}` : case_.title;

          unifiedCases.push({
            id: case_.id,
            title: titleWithForm,
            description: productsInfo,
            handlerName: case_.handler?.fullName || 'Chưa phân công',
            handler: case_.handler ? {
              avatar: case_.handler.avatar
            } : undefined,
            customerName: case_.supplier?.shortName || case_.supplier?.fullCompanyName || 'Nhà cung cấp',
            status: case_.status,
            startDate: case_.startDate,
            endDate: case_.endDate,
            caseType: 'Nhận hàng',
            createdAt: case_.createdAt,
            updatedAt: case_.updatedAt,
            type: 'receiving'
          });
        });
      }

      // Process maintenance cases
      if (maintenanceData.success && maintenanceData.data) {
        maintenanceData.data.forEach((case_: any) => {
          const titleWithForm = case_.form ? `Hình thức: ${case_.form}\n${case_.title}` : case_.title;

          unifiedCases.push({
            id: case_.id,
            title: titleWithForm,
            description: case_.description,
            handlerName: case_.handler?.fullName || 'Chưa phân công',
            handler: case_.handler ? {
              avatar: case_.handler.avatar
            } : undefined,
            customerName: case_.customer?.shortName || case_.customer?.fullCompanyName || case_.customerName || 'Khách hàng',
            status: case_.status,
            startDate: case_.startDate,
            endDate: case_.endDate,
            caseType: case_.maintenanceCaseType?.name || 'Bảo trì',
            createdAt: case_.createdAt,
            updatedAt: case_.updatedAt,
            type: 'maintenance'
          });
        });
      }

      // Process incidents
      if (incidentData.data) {
        incidentData.data.forEach((case_: any) => {
          const titleWithForm = case_.form ? `Hình thức: ${case_.form}\n${case_.title}` : case_.title;

          unifiedCases.push({
            id: case_.id,
            title: titleWithForm,
            description: case_.description,
            handlerName: case_.handler?.fullName || 'Chưa phân công',
            handler: case_.handler ? {
              avatar: case_.handler.avatar
            } : undefined,
            customerName: case_.customer?.shortName || case_.customer?.fullCompanyName || 'Khách hàng',
            status: case_.status,
            startDate: case_.startDate,
            endDate: case_.endDate,
            caseType: case_.incidentType || 'Sự cố',
            createdAt: case_.createdAt,
            updatedAt: case_.updatedAt,
            type: 'incident'
          });
        });
      }

      // Process warranties
      if (warrantyData.data) {
        warrantyData.data.forEach((case_: any) => {
          const titleWithForm = case_.form ? `Hình thức: ${case_.form}\n${case_.title}` : case_.title;

          unifiedCases.push({
            id: case_.id,
            title: titleWithForm,
            description: case_.description,
            handlerName: case_.handler?.fullName || 'Chưa phân công',
            handler: case_.handler ? {
              avatar: case_.handler.avatar
            } : undefined,
            customerName: case_.customer?.shortName || case_.customer?.fullCompanyName || 'Khách hàng',
            status: case_.status,
            startDate: case_.startDate,
            endDate: case_.endDate,
            caseType: case_.warrantyType || 'Bảo hành',
            createdAt: case_.createdAt,
            updatedAt: case_.updatedAt,
            type: 'warranty'
          });
        });
      }

      // Process deployment cases
      if (deploymentData.data) {
        deploymentData.data.forEach((case_: any) => {
          const titleWithForm = case_.form ? `Hình thức: ${case_.form}\n${case_.title}` : case_.title;

          unifiedCases.push({
            id: case_.id,
            title: titleWithForm,
            description: case_.description,
            handlerName: case_.handler?.fullName || 'Chưa phân công',
            handler: case_.handler ? {
              avatar: case_.handler.avatar
            } : undefined,
            customerName: case_.customer?.shortName || case_.customer?.fullCompanyName || case_.customerName || 'Khách hàng',
            status: case_.status,
            startDate: case_.startDate,
            endDate: case_.endDate,
            caseType: case_.deploymentType?.name || 'Triển khai',
            createdAt: case_.createdAt,
            updatedAt: case_.updatedAt,
            type: 'deployment'
          });
        });
      }

      // Sort all cases by start date (newest first) - create a copy before sorting to avoid read-only error
      const sortedCases = [...unifiedCases].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      setAllCases(sortedCases);

      // Filter cases for today tab: only show incomplete cases and cases from today
      const today = new Date();
      const todayString = today.toDateString();

      const todayFilteredCases = unifiedCases.filter(case_ => {
        const caseDate = new Date(case_.startDate).toDateString();
        const isIncomplete = !['COMPLETED', 'RESOLVED', 'CANCELLED', 'HỦY', 'HOÀN THÀNH'].includes(case_.status.toUpperCase());
        const isToday = caseDate === todayString;

        return isIncomplete || isToday;
      }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

      setTodayCases(todayFilteredCases);
    } catch (err) {
      console.error('Error fetching cases:', err);
      setError('Không thể tải danh sách cases. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleModalSuccess = useCallback(() => {
    handleCloseModal();
    fetchAllCases(); // Refresh list after edit
    toast.success('Cập nhật thành công');
  }, [fetchAllCases, handleCloseModal]);

  // Memoized filtered cases
  const filteredCases = useMemo(() => {
    const currentCases = activeTab === 'today' ? todayCases : allCases;
    let filtered = [...currentCases];

    if (filters.caseType) {
      filtered = filtered.filter(case_ => case_.type === filters.caseType);
    }

    if (filters.handler) {
      filtered = filtered.filter(case_ =>
        case_.handlerName.toLowerCase().includes(filters.handler.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter(case_ => {
        // Map equivalent statuses
        const statusMap: { [key: string]: string[] } = {
          'RECEIVED': ['RECEIVED', 'REPORTED', 'TIẾP NHẬN'],
          'IN_PROGRESS': ['IN_PROGRESS', 'INVESTIGATING', 'PROCESSING', 'ĐANG XỬ LÝ'],
          'COMPLETED': ['COMPLETED', 'RESOLVED', 'HOÀN THÀNH'],
          'CANCELLED': ['CANCELLED', 'HỦY']
        };

        const equivalentStatuses = statusMap[filters.status] || [filters.status];
        return equivalentStatuses.includes(case_.status.toUpperCase());
      });
    }

    if (filters.customer) {
      filtered = filtered.filter(case_ =>
        case_.customerName.toLowerCase().includes(filters.customer.toLowerCase())
      );
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(case_ => {
        const caseDate = new Date(case_.startDate);
        return caseDate >= fromDate;
      });
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(case_ => {
        const caseDate = new Date(case_.startDate);
        return caseDate <= toDate;
      });
    }

    return filtered;
  }, [activeTab, todayCases, allCases, filters]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, activeTab]);

  // Memoized pagination calculations
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredCases.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentCases = filteredCases.slice(startIndex, endIndex);

    return { totalPages, startIndex, endIndex, currentCases };
  }, [filteredCases, currentPage, itemsPerPage]);

  const { totalPages, startIndex, endIndex, currentCases } = paginationData;

  // Memoized pagination handlers
  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const goToPreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  useEffect(() => {
    fetchAllCases();
  }, [fetchAllCases]);

  // Debounced filter change
  const handleFilterChange = useCallback((filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      caseType: '',
      handler: '',
      status: '',
      customer: '',
      dateFrom: '',
      dateTo: ''
    });
  }, []);

  // Enhanced loading state
  if (loading && allCases.length === 0) {
    return (
      <div className="space-y-6">
        {/* Skeleton for tabs */}
        <div className="bg-white rounded-md shadow-sm border border-gray-100">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              <div className="py-4 px-1 border-b-2 border-blue-500">
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-5 w-6 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="py-4 px-1">
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-5 w-6 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Skeleton for statistics */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Skeleton for table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-gray-600">Đang tải danh sách case...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Lỗi tải dữ liệu</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <div className="mt-4 flex space-x-3">
            <button
              onClick={fetchAllCases}
              className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Thử lại
            </button>
            <button
              onClick={() => setError(null)}
              className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1920px] mx-auto pb-10">
      {/* iOS Safari text color fix */}
      <style dangerouslySetInnerHTML={{
        __html: `
        input, select, textarea {
          -webkit-text-fill-color: #111827 !important;
          opacity: 1 !important;
          color: #111827 !important;
        }
        input::placeholder, textarea::placeholder {
          -webkit-text-fill-color: #9ca3af !important;
          opacity: 0.6 !important;
          color: #9ca3af !important;
        }
      `}} />

      {/* Main Header & Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-1 bg-gray-50/50 border-b border-gray-200">
          <nav className="flex space-x-1" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('today')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'today'
                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
                }`}
            >
              <Calendar className={`h-4 w-4 ${activeTab === 'today' ? 'text-blue-500' : 'text-gray-400'}`} />
              <span>Hôm nay</span>
              <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs ${activeTab === 'today' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}>
                {todayCases.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'all'
                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
                }`}
            >
              <Ticket className={`h-4 w-4 ${activeTab === 'all' ? 'text-blue-500' : 'text-gray-400'}`} />
              <span>Tất cả</span>
              <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs ${activeTab === 'all' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}>
                {allCases.length}
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Statistics - Desktop: Grid */}
      <div className="hidden md:grid grid-cols-4 lg:grid-cols-7 gap-4">
        {[
          { type: 'internal', label: 'Nội bộ', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
          { type: 'delivery', label: 'Giao hàng', icon: Truck, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
          { type: 'receiving', label: 'Nhận hàng', icon: Package, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          { type: 'maintenance', label: 'Bảo trì', icon: Wrench, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
          { type: 'incident', label: 'Sự cố', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
          { type: 'warranty', label: 'Bảo hành', icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
          { type: 'deployment', label: 'Triển khai', icon: Rocket, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100' }
        ].map(({ type, label, icon: Icon, color, bg, border }) => {
          const count = filteredCases.filter(c => c.type === type).length;
          return (
            <div key={type} className={`rounded-xl border ${border} bg-white p-4 shadow-sm hover:shadow-md transition-shadow group`}>
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${bg}`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <span className={`text-2xl font-bold ${color}`}>{count}</span>
              </div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
            </div>
          );
        })}
      </div>

      {/* Mobile Stats Carousel */}
      <div className="md:hidden overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
        <div className="flex gap-3 w-max">
          {[
            { type: 'internal', label: 'Nội bộ', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
            { type: 'delivery', label: 'Giao hàng', icon: Truck, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
            { type: 'receiving', label: 'Nhận hàng', icon: Package, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
            { type: 'maintenance', label: 'Bảo trì', icon: Wrench, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
            { type: 'incident', label: 'Sự cố', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
            { type: 'warranty', label: 'Bảo hành', icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
            { type: 'deployment', label: 'Triển khai', icon: Rocket, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100' }
          ].map(({ type, label, icon: Icon, color, bg, border }) => {
            const count = filteredCases.filter(c => c.type === type).length;
            return (
              <div key={type} className={`flex-shrink-0 w-32 rounded-xl border ${border} bg-white p-3 shadow-sm`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-md ${bg}`}>
                    <Icon className={`h-3.5 w-3.5 ${color}`} />
                  </div>
                  <span className={`text-xl font-bold ${color}`}>{count}</span>
                </div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters - Modern & Collapsible */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg shadow-sm">
              <Settings className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Bộ lọc tìm kiếm</h3>
              <p className="text-xs text-gray-500">Tìm kiếm và lọc dữ liệu case</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-gray-500 hover:text-blue-600 p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
            >
              <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {/* Only show Clear Filters if filters are active */}
            {(filters.caseType || filters.handler || filters.status || filters.customer || filters.dateFrom || filters.dateTo) && (
              <button
                onClick={clearFilters}
                className="text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* Filter Content */}
        <div className={`p-4 md:p-6 transition-all duration-300 ${showFilters ? 'block' : 'hidden md:block'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Case Type Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 ml-1">
                Loại Case
              </label>
              <div className="relative">
                <select
                  value={filters.caseType}
                  onChange={(e) => handleFilterChange('caseType', e.target.value)}
                  className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 hover:bg-white transition-all text-sm appearance-none cursor-pointer"
                >
                  <option value="">Tất cả loại</option>
                  <option value="internal">Nội bộ</option>
                  <option value="delivery">Giao hàng</option>
                  <option value="receiving">Nhận hàng</option>
                  <option value="maintenance">Bảo trì</option>
                  <option value="incident">Sự cố</option>
                  <option value="warranty">Bảo hành</option>
                  <option value="deployment">Triển khai</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Handler Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 ml-1">
                Người xử lý
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tên nhân viên..."
                  value={filters.handler}
                  onChange={(e) => handleFilterChange('handler', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 hover:bg-white transition-all text-sm"
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 ml-1">
                Trạng thái
              </label>
              <div className="relative">
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 hover:bg-white transition-all text-sm appearance-none cursor-pointer"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="RECEIVED">Tiếp nhận</option>
                  <option value="IN_PROGRESS">Đang xử lý</option>
                  <option value="COMPLETED">Hoàn thành</option>
                  <option value="CANCELLED">Hủy</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Customer Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 ml-1">
                Khách hàng
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tên khách hàng..."
                  value={filters.customer}
                  onChange={(e) => handleFilterChange('customer', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 hover:bg-white transition-all text-sm"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Date Filters */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 ml-1">
                Từ ngày
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 hover:bg-white transition-all text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 ml-1">
                Đến ngày
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 hover:bg-white transition-all text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {activeTab === 'today' ? 'Danh Sách Case Hôm Nay' : 'Tất Cả Danh Sách Case'}
              </h2>
              <p className="text-sm text-gray-500">
                Tổng số: <span className="font-semibold text-gray-900">{filteredCases.length}</span> case
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setLoading(true);
              fetchAllCases();
            }}
            className="flex items-center justify-center gap-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-blue-600 hover:border-blue-200 px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 shadow-sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Đang cập nhật...' : 'Làm mới dữ liệu'}</span>
          </button>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {currentCases.length > 0 ? (
            currentCases.map((case_, index) => {
              const stt = filteredCases.length - (startIndex + index);
              return (
                <div key={case_.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
                  {/* Header: Status & Type */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(case_.status)} border border-current/10`}>
                      {getStatusLabel(case_.status)}
                    </span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-md border ${getCaseTypeColor(case_.type)}`}>
                      {getCaseTypeLabel(case_.type)}
                    </span>
                  </div>

                  {/* Title */}
                  <div className="mb-3">
                    {case_.title.includes('Hình thức:') && (
                      <p className="text-xs font-medium text-gray-500 mb-0.5">
                        {case_.title.split('\n')[0]}
                      </p>
                    )}
                    <h4 className="text-sm font-bold text-gray-900 line-clamp-2 leading-relaxed">
                      {case_.title.includes('Hình thức:') ? case_.title.split('\n')[1] : case_.title}
                    </h4>
                  </div>

                  {/* Customer & Handler */}
                  <div className="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      {case_.handler?.avatar ? (
                        <img
                          src={case_.handler.avatar.startsWith('/avatars/') ? case_.handler.avatar : `/avatars/${case_.handler.avatar}`}
                          alt={case_.handlerName}
                          className="w-6 h-6 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                          <User className="h-3 w-3 text-gray-400" />
                        </div>
                      )}
                      <span className="text-xs font-medium text-gray-700 truncate">{case_.handlerName}</span>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-xs text-gray-500 truncate max-w-[120px]" title={case_.customerName}>
                        {case_.customerName || 'Nội bộ'}
                      </span>
                      <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </div>
                  </div>

                  {/* Time Info */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-blue-500" />
                      <span>{new Date(case_.startDate).toLocaleDateString('vi-VN')}</span>
                    </div>
                    {case_.endDate && (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                        <span>{new Date(case_.endDate).toLocaleDateString('vi-VN')}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <Link
                    href={getActionLink(case_.type, case_.id)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors border border-blue-100"
                  >
                    <span>Xem chi tiết</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Không có case nào</p>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">
                  #
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">
                  Loại Case
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-48">
                  Người xử lý
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">
                  Khách hàng
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider max-w-[200px]">
                  Tiêu đề
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider max-w-[250px]">
                  Chi tiết
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">
                  Thời gian
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">
                  Trạng thái
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {currentCases.map((case_, index) => (
                <CaseRow
                  key={case_.id}
                  case_={case_}
                  index={index}
                  startIndex={startIndex}
                  filteredCasesLength={filteredCases.length}
                  getStatusColor={getStatusColor}
                  getStatusLabel={getStatusLabel}
                  getCaseTypeLabel={getCaseTypeLabel}
                  getCaseTypeColor={getCaseTypeColor}

                  onViewClick={handleViewCase}
                />
              ))}
            </tbody>
          </table>
        </div>

        {filteredCases.length === 0 && (activeTab === 'today' ? todayCases.length > 0 : allCases.length > 0) && (
          <div className="text-center py-16 bg-gray-50">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy case nào</h3>
            <p className="text-gray-500">Thử thay đổi bộ lọc để xem thêm kết quả</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Hiển thị <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> đến <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredCases.length)}</span> của <span className="font-medium">{filteredCases.length}</span> kết quả
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${pageNum === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

        {(activeTab === 'today' ? todayCases.length === 0 : allCases.length === 0) && (
          <div className="text-center py-16 bg-gray-50">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có case nào</h3>
            <p className="text-gray-500">
              {activeTab === 'today'
                ? 'Không có case chưa hoàn thành hoặc case trong ngày hôm nay'
                : 'Chưa có case nào được tạo trong hệ thống'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {openedModal === 'internal' && (
        <EditInternalCaseModal
          isOpen={true}
          onClose={handleCloseModal}
          onSuccess={handleModalSuccess}
          caseData={selectedCaseData}
        />
      )}

      {openedModal === 'incident' && (
        <EditIncidentModal
          isOpen={true}
          onClose={handleCloseModal}
          onSuccess={handleModalSuccess}
          incidentData={selectedCaseData}
        />
      )}

      {openedModal === 'deployment' && (
        <CreateDeploymentModal
          isOpen={true}
          onClose={handleCloseModal}
          onSuccess={handleModalSuccess}
          editData={selectedCaseData}
        />
      )}

      {openedModal === 'maintenance' && (
        <CreateMaintenanceModal
          isOpen={true}
          onClose={handleCloseModal}
          onSuccess={handleModalSuccess}
          editingMaintenance={selectedCaseData}
        />
      )}

      {openedModal === 'warranty' && (
        <CreateWarrantyModal
          isOpen={true}
          onClose={handleCloseModal}
          onSuccess={handleModalSuccess}
          editingWarranty={selectedCaseData}
        />
      )}

      {openedModal === 'delivery' && (
        <CreateDeliveryCaseModal
          isOpen={true}
          onClose={handleCloseModal}
          onSuccess={handleModalSuccess}
          editData={selectedCaseData}
        />
      )}

      {openedModal === 'receiving' && (
        <CreateReceivingCaseModal
          isOpen={true}
          onClose={handleCloseModal}
          onSuccess={handleModalSuccess}
          editData={selectedCaseData}
        />
      )}
    </div>
  );
}

export default memo(AdminAllCasesTable);
