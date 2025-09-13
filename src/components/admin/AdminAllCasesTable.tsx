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
  RefreshCw
} from "lucide-react";
import Link from "next/link";

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
  type: 'internal' | 'delivery' | 'receiving' | 'maintenance' | 'incident' | 'warranty';
}

// Memoized Case Row Component
const CaseRow = memo(({ case_, index, startIndex, filteredCasesLength, getStatusColor, getStatusLabel, getCaseTypeLabel, getActionLink }: {
  case_: UnifiedCase;
  index: number;
  startIndex: number;
  filteredCasesLength: number;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
  getCaseTypeLabel: (type: string) => string;
  getActionLink: (type: string, id: string) => string;
}) => (
  <tr className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 border-b border-gray-100">
    <td className="px-2 py-2 whitespace-nowrap">
      <div className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full">
        <span className="text-xs font-bold text-gray-700">{filteredCasesLength - (startIndex + index)}</span>
      </div>
    </td>
    <td className="px-2 py-2 whitespace-nowrap">
      <span className="text-xs font-medium text-gray-900">
        {getCaseTypeLabel(case_.type)}
      </span>
    </td>
    <td className="px-2 py-2 whitespace-nowrap">
      <div className="flex items-center space-x-1">
        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center overflow-hidden">
          {case_.handler?.avatar ? (
            <img 
              src={case_.handler.avatar} 
              alt={case_.handlerName}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="h-2.5 w-2.5 text-green-600" />
          )}
        </div>
        <span className="text-xs text-gray-900 font-medium">{case_.handlerName}</span>
      </div>
    </td>
    <td className="px-2 py-2 whitespace-nowrap">
      <div className="text-xs">
        {case_.type === 'internal' ? (
          <div className="whitespace-pre-line">
            <div className="font-semibold text-blue-700">Smart Services</div>
            <div className="text-gray-600 text-xs">{case_.customerName.split('\n')[1]}</div>
          </div>
        ) : (
          <span className="text-gray-900">{case_.customerName}</span>
        )}
      </div>
    </td>
    <td className="px-2 py-2 max-w-xs">
      <div className="text-xs text-gray-900 whitespace-pre-line" title={case_.title}>
        {case_.title}
      </div>
    </td>
    <td className="px-2 py-2 max-w-xs">
      <div className="text-xs text-gray-600 whitespace-pre-line" title={case_.description}>
        {case_.type === 'delivery' || case_.type === 'receiving' ? (
          <div dangerouslySetInnerHTML={{
            __html: case_.description.replace(/\*\*(.*?)\*\*/g, '<strong><em>$1</em></strong>')
          }} />
        ) : (
          case_.description
        )}
      </div>
    </td>
    <td className="px-2 py-2 w-28">
      <div className="text-xs">
        <div className="flex items-center space-x-1 mb-1">
          <Clock className="h-2.5 w-2.5 text-blue-500" />
          <span className="text-blue-700 font-medium text-xs">Bắt đầu</span>
        </div>
        <div className="text-gray-600 text-xs">
          {new Date(case_.startDate).toLocaleTimeString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
          }).replace(':', 'H')} {new Date(case_.startDate).toLocaleDateString('vi-VN')}
        </div>
        {case_.endDate && (
          <>
            <div className="flex items-center space-x-1 mt-1">
              <CheckCircle className="h-2.5 w-2.5 text-green-500" />
              <span className="text-green-700 font-medium text-xs">Kết thúc</span>
            </div>
            <div className="text-gray-600 text-xs">
              {new Date(case_.endDate).toLocaleTimeString('vi-VN', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false
              }).replace(':', 'H')} {new Date(case_.endDate).toLocaleDateString('vi-VN')}
            </div>
          </>
        )}
      </div>
    </td>
    <td className="px-2 py-2 whitespace-nowrap">
      <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full ${getStatusColor(case_.status)} shadow-sm`}>
        {getStatusLabel(case_.status)}
      </span>
    </td>
    <td className="px-2 py-2 whitespace-nowrap text-center">
      <Link
        href={getActionLink(case_.type, case_.id)}
        className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
      >
        <Eye className="h-2.5 w-2.5" />
        <span>Xem</span>
      </Link>
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
  
  // Filter states
  const [filters, setFilters] = useState({
    caseType: '',
    handler: '',
    status: '',
    customer: ''
  });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  // Memoized utility functions
  const getStatusColor = useCallback((status: string) => {
    switch (status.toUpperCase()) {
      case 'RECEIVED':
      case 'REPORTED':
      case 'TIẾP NHẬN':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
      case 'INVESTIGATING':
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
      default:
        return 'Case';
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
      
      const [internalRes, deliveryRes, receivingRes, maintenanceRes, incidentRes, warrantyRes] = await Promise.all([
        fetch('/api/internal-cases?limit=100', fetchOptions),
        fetch('/api/delivery-cases?limit=100', fetchOptions),
        fetch('/api/receiving-cases?limit=100', fetchOptions),
        fetch('/api/maintenance-cases?limit=100', fetchOptions),
        fetch('/api/incidents?limit=100', fetchOptions),
        fetch('/api/warranties?limit=100', fetchOptions)
      ]);

      const [internalData, deliveryData, receivingData, maintenanceData, incidentData, warrantyData] = await Promise.all([
        internalRes.json(),
        deliveryRes.json(),
        receivingRes.json(),
        maintenanceRes.json(),
        incidentRes.json(),
        warrantyRes.json()
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
            customerName: case_.customerName || 'Khách hàng',
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

      // Sort all cases by start date (newest first)
      unifiedCases.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      setAllCases(unifiedCases);

      // Filter cases for today tab: only show incomplete cases and cases from today
      const today = new Date();
      const todayString = today.toDateString();
      
      const todayFilteredCases = unifiedCases.filter(case_ => {
        const caseDate = new Date(case_.startDate).toDateString();
        const isIncomplete = !['COMPLETED', 'RESOLVED', 'CANCELLED', 'HỦY', 'HOÀN THÀNH'].includes(case_.status.toUpperCase());
        const isToday = caseDate === todayString;
        
        return isIncomplete || isToday;
      });

      setTodayCases(todayFilteredCases);
    } catch (err) {
      console.error('Error fetching cases:', err);
      setError('Không thể tải danh sách cases. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, []);

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
      filtered = filtered.filter(case_ => case_.status === filters.status);
    }

    if (filters.customer) {
      filtered = filtered.filter(case_ => 
        case_.customerName.toLowerCase().includes(filters.customer.toLowerCase())
      );
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
      customer: ''
    });
  }, []);

  // Enhanced loading state
  if (loading && allCases.length === 0) {
    return (
      <div className="space-y-6">
        {/* Skeleton for tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
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
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('today')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'today'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Hôm nay</span>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  {todayCases.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Tất cả</span>
                <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  {allCases.length}
                </span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { type: 'internal', label: 'Case nội bộ', icon: FileText, color: 'bg-blue-500' },
          { type: 'delivery', label: 'Case giao hàng', icon: Truck, color: 'bg-green-500' },
          { type: 'receiving', label: 'Case nhận hàng', icon: Package, color: 'bg-yellow-500' },
          { type: 'maintenance', label: 'Case bảo trì', icon: Wrench, color: 'bg-purple-500' },
          { type: 'incident', label: 'Case sự cố', icon: AlertTriangle, color: 'bg-red-500' },
          { type: 'warranty', label: 'Case bảo hành', icon: Shield, color: 'bg-indigo-500' }
        ].map(({ type, label, icon: Icon, color }) => {
          const count = filteredCases.filter(c => c.type === type).length;
          return (
            <div key={type} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{label}</p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
                <div className={`p-2 rounded-lg ${color} text-white`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Settings className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Bộ lọc tìm kiếm</h3>
          </div>
          <button
            onClick={clearFilters}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
          >
            <span>Xóa tất cả</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Case Type Filter */}
          <div className="space-y-1">
            <label className="flex items-center space-x-1 text-xs font-medium text-gray-700">
              <FileText className="h-3 w-3 text-blue-600" />
              <span>Loại Case</span>
            </label>
            <select
              value={filters.caseType}
              onChange={(e) => handleFilterChange('caseType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors duration-200 text-sm"
            >
              <option value="">Tất cả loại case</option>
              <option value="internal">Case nội bộ</option>
              <option value="delivery">Case giao hàng</option>
              <option value="receiving">Case nhận hàng</option>
              <option value="maintenance">Case bảo trì</option>
              <option value="incident">Case sự cố</option>
              <option value="warranty">Case bảo hành</option>
            </select>
          </div>

          {/* Handler Filter */}
          <div className="space-y-1">
            <label className="flex items-center space-x-1 text-xs font-medium text-gray-700">
              <User className="h-3 w-3 text-green-600" />
              <span>Người xử lý</span>
            </label>
            <input
              type="text"
              placeholder="Tìm người xử lý..."
              value={filters.handler}
              onChange={(e) => handleFilterChange('handler', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors duration-200 text-sm placeholder-gray-400"
            />
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="flex items-center space-x-1 text-xs font-medium text-gray-700">
              <CheckCircle className="h-3 w-3 text-purple-600" />
              <span>Trạng thái</span>
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors duration-200 text-sm"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="RECEIVED">Tiếp nhận</option>
              <option value="REPORTED">Tiếp nhận</option>
              <option value="IN_PROGRESS">Đang xử lý</option>
              <option value="INVESTIGATING">Đang xử lý</option>
              <option value="RESOLVED">Hoàn thành</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="CANCELLED">Hủy</option>
            </select>
          </div>

          {/* Customer Filter */}
          <div className="space-y-1">
            <label className="flex items-center space-x-1 text-xs font-medium text-gray-700">
              <AlertCircle className="h-3 w-3 text-orange-600" />
              <span>Khách hàng</span>
            </label>
            <input
              type="text"
              placeholder="Tìm khách hàng..."
              value={filters.customer}
              onChange={(e) => handleFilterChange('customer', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors duration-200 text-sm placeholder-gray-400"
            />
          </div>
        </div>

        {/* Active Filters Display */}
        {(filters.caseType || filters.handler || filters.status || filters.customer) && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-sm font-medium text-gray-700">Bộ lọc đang áp dụng:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.caseType && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Loại: {getCaseTypeLabel(filters.caseType)}
                  <button
                    onClick={() => handleFilterChange('caseType', '')}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.handler && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Xử lý: {filters.handler}
                  <button
                    onClick={() => handleFilterChange('handler', '')}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.status && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Trạng thái: {getStatusLabel(filters.status)}
                  <button
                    onClick={() => handleFilterChange('status', '')}
                    className="ml-2 text-purple-600 hover:text-purple-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.customer && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Khách hàng: {filters.customer}
                  <button
                    onClick={() => handleFilterChange('customer', '')}
                    className="ml-2 text-orange-600 hover:text-orange-800"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cases Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
             <div>
               <h2 className="text-xl font-bold text-gray-900">
                 {activeTab === 'today' ? 'Cases cần xử lý & hôm nay' : 'Tất cả cases'}
               </h2>
               <p className="text-sm text-gray-600 mt-1">
                 Hiển thị: <span className="font-semibold text-blue-600">{startIndex + 1}-{Math.min(endIndex, filteredCases.length)}</span> / <span className="font-semibold text-gray-600">{filteredCases.length}</span> cases (trang {currentPage}/{totalPages})
               </p>
             </div>
            <button
              onClick={() => {
                setLoading(true);
                fetchAllCases();
              }}
              className="flex items-center space-x-2 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Đang tải...' : 'Làm mới'}</span>
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  #
                </th>
                <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Loại Case
                </th>
                <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Người xử lý
                </th>
                <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Khách hàng
                </th>
                <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Tiêu đề
                </th>
                <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Chi tiết
                </th>
                <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-28">
                  Thời gian
                </th>
                <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Trạng thái
                </th>
                <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
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
                  getActionLink={getActionLink}
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
        {filteredCases.length > 0 && totalPages > 1 && (
          <div className="bg-white px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-700">
                <span>
                  Hiển thị {startIndex + 1} đến {Math.min(endIndex, filteredCases.length)} trong tổng số {filteredCases.length} kết quả
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Previous Button */}
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Trước
                </button>
                
                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current page
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="px-2 text-gray-500">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
                
                {/* Next Button */}
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Sau
                </button>
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
    </div>
  );
}

export default memo(AdminAllCasesTable);
