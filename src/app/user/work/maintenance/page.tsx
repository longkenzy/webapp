'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Search, Filter, MoreVertical, Edit, RefreshCw, X, Wrench, Check, ChevronDown, User, Building2, Calendar, Settings } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import CreateMaintenanceModal from './CreateMaintenanceModal';
import EditMaintenanceModal from './EditMaintenanceModal';

interface Employee {
  id: string;
  fullName: string;
  position: string;
  department: string;
}

interface MaintenanceCase {
  id: string;
  title: string;
  description: string;
  reporter: Employee;
  handler: Employee;
  maintenanceType: string;
  maintenanceCaseType?: {
    id: string;
    name: string;
  };
  customerName?: string;
  customerId?: string;
  customer?: {
    id: string;
    fullCompanyName: string;
    shortName: string;
    contactPerson?: string;
    contactPhone?: string;
  };
  equipment?: {
    id: string;
    name: string;
    model?: string;
    serialNumber?: string;
    location?: string;
  };
  status: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  crmReferenceCode?: string; // Thêm trường Mã CRM
  // User assessment fields
  userDifficultyLevel?: number;
  userEstimatedTime?: number;
  userImpactLevel?: number;
  userUrgencyLevel?: number;
  userFormScore?: number;
  userAssessmentDate?: string;
  // Admin assessment fields
  adminDifficultyLevel?: number;
  adminEstimatedTime?: number;
  adminImpactLevel?: number;
  adminUrgencyLevel?: number;
  adminAssessmentDate?: string;
  adminAssessmentNotes?: string;
}

export default function MaintenancePage() {
  const { data: session, status } = useSession();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState<MaintenanceCase | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [maintenanceCases, setMaintenanceCases] = useState<MaintenanceCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [partners, setPartners] = useState<any[]>([]);
  const [closingCaseId, setClosingCaseId] = useState<string | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [casesPerPage] = useState(10);
  
  // Filter states
  const [filters, setFilters] = useState({
    handler: '',
    maintenanceType: '',
    status: '',
    customer: '',
    startDate: '',
    endDate: ''
  });

  // Mobile states
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCases, setExpandedCases] = useState<Set<string>>(new Set());

  const toggleExpand = (caseId: string) => {
    setExpandedCases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(caseId)) {
        newSet.delete(caseId);
      } else {
        newSet.add(caseId);
      }
      return newSet;
    });
  };

  // Fetch maintenance cases from API with caching
  const fetchMaintenanceCases = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/maintenance-cases', {
        method: 'GET',
        headers: {
          'Cache-Control': 'max-age=60',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Maintenance Cases API response:', data);
        setMaintenanceCases(data.data || []);
      } else {
        console.error('Failed to fetch maintenance cases:', response.status, response.statusText);
        try {
          const errorData = await response.json();
          console.error('Error details:', errorData);
        } catch (e) {
          console.error('Could not parse error response');
        }
        setMaintenanceCases([]);
      }
    } catch (error) {
      console.error('Error fetching maintenance cases:', error);
      setMaintenanceCases([]);
    } finally {
      setLoading(false);
    }
  }, []);


  // Refresh maintenance cases
  const refreshMaintenanceCases = async () => {
    setRefreshing(true);
    await fetchMaintenanceCases();
    setRefreshing(false);
  };


  // Handle edit modal
  const handleOpenEditModal = (maintenanceData: MaintenanceCase) => {
    setSelectedMaintenance(maintenanceData);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedMaintenance(null);
  };

  const handleEditSuccess = (updatedMaintenance: MaintenanceCase) => {
    // Cập nhật case trong danh sách với dữ liệu đầy đủ từ API
    setMaintenanceCases(prevMaintenance => 
      prevMaintenance.map(maintenance => 
        maintenance.id === updatedMaintenance.id ? updatedMaintenance : maintenance
      )
    );
  };

  const handleCloseCase = async (caseId: string) => {
    if (!confirm('Bạn có chắc chắn muốn đóng case này?')) {
      return;
    }

    try {
      setClosingCaseId(caseId);
      
      const response = await fetch(`/api/maintenance-cases/${caseId}/close`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Case đã được đóng thành công!');
        // Optimistic update - update the case status locally
        setMaintenanceCases(prevCases => 
          prevCases.map(maintenanceCase => 
            maintenanceCase.id === caseId 
              ? { ...maintenanceCase, status: 'COMPLETED', endDate: new Date().toISOString() }
              : maintenanceCase
          )
        );
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Có lỗi xảy ra khi đóng case');
      }
    } catch (error) {
      console.error('Error closing case:', error);
      toast.error('Có lỗi xảy ra khi đóng case');
    } finally {
      setClosingCaseId(null);
    }
  };

  // Load maintenance cases on component mount
  useEffect(() => {
    if (status === 'authenticated') {
      fetchMaintenanceCases();
    }
  }, [status, fetchMaintenanceCases]);

  // Fetch partners for customer filter
  const fetchPartners = useCallback(async () => {
    try {
      const response = await fetch('/api/partners/list', {
        method: 'GET',
        headers: {
          'Cache-Control': 'max-age=300',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPartners(data || []);
      } else {
        console.error('Failed to fetch partners:', response.status, response.statusText);
        setPartners([]);
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
      setPartners([]);
    }
  }, []);

  // Load partners on component mount
  useEffect(() => {
    if (status === 'authenticated') {
      fetchPartners();
    }
  }, [status, fetchPartners]);

  // Filter maintenance cases based on search term and filters
  const filteredMaintenanceCases = maintenanceCases.filter(maintenance => {
    // Search term filter
    const matchesSearch = searchTerm === '' || (
      maintenance.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maintenance.reporter.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maintenance.handler.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maintenance.maintenanceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maintenance.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (maintenance.customerName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Handler filter
    const matchesHandler = filters.handler === '' || 
      maintenance.handler.fullName.toLowerCase().includes(filters.handler.toLowerCase());
    
    // Maintenance type filter
    const matchesMaintenanceType = filters.maintenanceType === '' || 
      maintenance.maintenanceType === filters.maintenanceType;
    
    // Status filter
    const matchesStatus = filters.status === '' || 
      maintenance.status === filters.status;
    
    // Customer filter
    const matchesCustomer = filters.customer === '' || 
      maintenance.customerId === filters.customer;
    
    // Date range filter
    const maintenanceDate = new Date(maintenance.startDate);
    const startDate = filters.startDate ? new Date(filters.startDate) : null;
    const endDate = filters.endDate ? new Date(filters.endDate) : null;
    
    const matchesDateRange = (!startDate || maintenanceDate >= startDate) && 
      (!endDate || maintenanceDate <= endDate);
    
    return matchesSearch && matchesHandler && 
           matchesMaintenanceType && matchesStatus && matchesCustomer && matchesDateRange;
  });

  // Pagination logic
  const totalCases = filteredMaintenanceCases.length;
  const totalPages = Math.ceil(totalCases / casesPerPage);
  const startIndex = (currentPage - 1) * casesPerPage;
  const endIndex = startIndex + casesPerPage;
  const paginatedMaintenanceCases = filteredMaintenanceCases.slice(startIndex, endIndex);

  // Pagination functions
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RECEIVED':
      case 'Tiếp nhận':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PROCESSING':
      case 'Đang xử lý':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'COMPLETED':
      case 'Hoàn thành':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
      case 'Hủy':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return 'Tiếp nhận';
      case 'PROCESSING':
        return 'Đang xử lý';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'CANCELLED':
        return 'Hủy';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Ho_Chi_Minh'
    });
  };

  const formatMaintenanceType = (maintenanceType: string) => {
    switch (maintenanceType?.toLowerCase()) {
      case 'preventive':
        return 'Bảo trì phòng ngừa';
      case 'corrective':
        return 'Bảo trì sửa chữa';
      case 'emergency':
        return 'Bảo trì khẩn cấp';
      case 'routine':
        return 'Bảo trì định kỳ';
      case 'upgrade':
        return 'Nâng cấp thiết bị';
      case 'inspection':
        return 'Kiểm tra thiết bị';
      default:
        return maintenanceType || 'Không xác định';
    }
  };

  // Get unique values for filter dropdowns
  const getUniqueHandlers = () => {
    const handlers = maintenanceCases.map(maintenance => maintenance.handler.fullName);
    return [...new Set(handlers)].sort();
  };

  const getUniqueMaintenanceTypes = () => {
    const maintenanceTypes = maintenanceCases.map(maintenance => maintenance.maintenanceType);
    return [...new Set(maintenanceTypes)].sort();
  };

  const getUniqueStatuses = () => {
    const statuses = maintenanceCases.map(maintenance => maintenance.status);
    return [...new Set(statuses)].sort();
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      handler: '',
      maintenanceType: '',
      status: '',
      customer: '',
      startDate: '',
      endDate: ''
    });
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return Object.values(filters).some(value => value !== '');
  };

  // Count active filters
  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== '').length;
  };

  // Validate date range
  const isDateRangeValid = () => {
    if (filters.startDate && filters.endDate) {
      return new Date(filters.startDate) <= new Date(filters.endDate);
    }
    return true;
  };

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Đang kiểm tra phiên đăng nhập...</div>
        </div>
      </div>
    );
  }

  // Show message if not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-600">Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50 p-3 md:p-6 pt-3 md:pt-4">
      {/* iOS Safari text color fix */}
      <style dangerouslySetInnerHTML={{ __html: `
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

      <div className="max-w-full mx-auto px-2 md:px-4">
        {/* Header */}
        <div className="mb-4 md:mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-slate-900 mb-1 md:mb-2 flex items-center">
                <Wrench className="h-5 w-5 md:h-8 md:w-8 text-orange-600 mr-2 md:mr-3" />
                Quản Lý Bảo Trì
              </h1>
              <p className="text-xs md:text-base text-slate-600 hidden md:block">Theo dõi và thực hiện các công việc bảo trì thiết bị</p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 md:gap-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium hover:from-orange-700 hover:to-amber-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Wrench className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden md:inline">Tạo Case Bảo Trì</span>
              <span className="md:hidden">Tạo</span>
            </button>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 md:mb-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-3 md:px-6 py-3 md:py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2 bg-orange-100 rounded-lg">
                  <Search className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-sm md:text-lg font-semibold text-gray-900">Tìm kiếm & Lọc</h3>
                  <p className="text-xs text-gray-600 hidden md:block">Tìm kiếm và lọc case bảo trì theo nhiều tiêu chí</p>
                </div>
              </div>
              <button 
                onClick={refreshMaintenanceCases}
                disabled={refreshing}
                className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-1.5 md:py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 text-xs md:text-sm"
              >
                <RefreshCw className={`h-3.5 w-3.5 md:h-4 md:w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">Làm mới</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-3 md:p-4">
            <div className="space-y-2 md:space-y-3">
              {/* Search Section */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-1.5">
                  Tìm kiếm
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 md:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm case..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 md:pl-10 pr-2.5 md:pr-3 py-1.5 md:py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-gray-50 focus:bg-white text-xs md:text-sm"
                  />
                </div>
              </div>

              {/* Filters Section */}
              <div>
                {/* Collapsible Filter Header */}
                <div className="flex items-center justify-between mb-2">
                  <div 
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 cursor-pointer flex-1"
                  >
                    <label className="text-xs md:text-sm font-medium text-gray-700 cursor-pointer flex-shrink-0">
                      Bộ lọc
                    </label>
                    {getActiveFiltersCount() > 0 && (
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-orange-100 text-orange-600 text-xs font-medium">
                        {getActiveFiltersCount()}
                      </span>
                    )}
                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform md:hidden ${showFilters ? 'rotate-180' : ''}`} />
                  </div>
                  {hasActiveFilters() && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-gray-600 hover:text-gray-800 font-medium px-2 py-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      Xóa tất cả
                    </button>
                  )}
                </div>

                {/* Filters Grid */}
                <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-2">
                    {/* Người xử lý */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Xử lý
                      </label>
                      <select
                        value={filters.handler}
                        onChange={(e) => setFilters(prev => ({ ...prev, handler: e.target.value }))}
                        className="w-full px-2.5 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 focus:bg-white text-xs md:text-sm"
                      >
                        <option value="">Tất cả</option>
                        {getUniqueHandlers().map(handler => (
                          <option key={handler} value={handler}>{handler}</option>
                        ))}
                      </select>
                    </div>

                    {/* Loại bảo trì */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Loại
                      </label>
                      <select
                        value={filters.maintenanceType}
                        onChange={(e) => setFilters(prev => ({ ...prev, maintenanceType: e.target.value }))}
                        className="w-full px-2.5 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-gray-50 focus:bg-white text-xs md:text-sm"
                      >
                        <option value="">Tất cả</option>
                        {getUniqueMaintenanceTypes().map(maintenanceType => (
                          <option key={maintenanceType} value={maintenanceType}>{formatMaintenanceType(maintenanceType)}</option>
                        ))}
                      </select>
                    </div>

                    {/* Khách hàng */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Khách hàng
                      </label>
                      <select
                        value={filters.customer}
                        onChange={(e) => setFilters(prev => ({ ...prev, customer: e.target.value }))}
                        className="w-full px-2.5 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 focus:bg-white text-xs md:text-sm"
                      >
                        <option value="">Tất cả</option>
                        {partners.map((partner) => (
                          <option key={partner.id} value={partner.id}>
                            {partner.shortName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Trạng thái */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Trạng thái
                      </label>
                      <select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-2.5 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white text-xs md:text-sm"
                      >
                        <option value="">Tất cả</option>
                        {getUniqueStatuses().map(status => (
                          <option key={status} value={status}>{getStatusText(status)}</option>
                        ))}
                      </select>
                    </div>

                    {/* Từ ngày */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Từ ngày
                      </label>
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full px-2.5 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-gray-50 focus:bg-white text-xs md:text-sm"
                      />
                    </div>

                    {/* Đến ngày */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Đến ngày
                      </label>
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        className={`w-full px-2.5 md:px-3 py-1.5 md:py-2 border rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-gray-50 focus:bg-white text-xs md:text-sm ${
                          !isDateRangeValid() ? 'border-red-300' : 'border-gray-200'
                        }`}
                      />
                      {!isDateRangeValid() && (
                        <p className="text-xs text-red-600 mt-1">Ngày kết thúc phải sau ngày bắt đầu</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Filters & Actions */}
              {hasActiveFilters() && (
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-md p-2.5 border border-orange-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-1.5 mb-1">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                        <span className="text-xs font-semibold text-gray-800">Bộ lọc đang áp dụng</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {searchTerm && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                            <Search className="h-2.5 w-2.5 mr-1" />
                            &quot;{searchTerm}&quot;
                          </span>
                        )}
                        {filters.handler && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
                            Xử lý: {filters.handler}
                          </span>
                        )}
                        {filters.maintenanceType && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1"></div>
                            Loại: {formatMaintenanceType(filters.maintenanceType)}
                          </span>
                        )}
                        {filters.status && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1"></div>
                            Trạng thái: {getStatusText(filters.status)}
                          </span>
                        )}
                        {filters.customer && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1"></div>
                            Khách hàng: {partners.find(p => p.id === filters.customer)?.shortName || 'Unknown'}
                          </span>
                        )}
                        {filters.startDate && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800 border border-teal-200">
                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-1"></div>
                            Từ: {new Date(filters.startDate + 'T00:00:00').toLocaleDateString('vi-VN')}
                          </span>
                        )}
                        {filters.endDate && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800 border border-cyan-200">
                            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-1"></div>
                            Đến: {new Date(filters.endDate + 'T00:00:00').toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={clearFilters}
                        className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-md transition-colors"
                      >
                        <X className="h-3 w-3" />
                        <span>Xóa tất cả</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Results Summary */}
              <div className="flex items-center justify-between pt-2 md:pt-3 border-t border-gray-200">
                <div className="text-xs md:text-sm text-gray-600">
                  <span className="font-medium text-gray-900">{filteredMaintenanceCases.length}</span> / <span className="font-medium text-gray-900">{maintenanceCases.length}</span> case
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance Cases Table - Desktop */}
        <div className="hidden md:block bg-white rounded-lg shadow-sm border border-slate-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-orange-50">
                <tr>
                  <th className="px-2 py-1 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-16">
                    STT
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-32">
                    Người xử lý
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-48">
                    Khách hàng
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-32">
                    Loại bảo trì
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-80">
                    Thông tin Case
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-32">
                    Ghi chú
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-24">
                    Mã CRM
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-24">
                    Trạng thái
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-36">
                    Thời gian
                  </th>
                  <th className="px-2 py-1 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-20">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-2 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="h-5 w-5 animate-spin text-orange-600" />
                        <span className="text-slate-600">Đang tải danh sách case bảo trì...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedMaintenanceCases.length > 0 ? (
                  paginatedMaintenanceCases.map((maintenance, index) => (
                    <tr key={maintenance.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                      {/* STT */}
                      <td className="px-2 py-1 text-center w-16">
                        <span className="text-sm font-medium text-slate-600">
                          {totalCases - startIndex - index}
                        </span>
                      </td>
                      
                      {/* Người xử lý */}
                      <td className="px-2 py-1 w-32">
                        <div>
                          <div className="text-sm text-slate-900">{maintenance.handler.fullName}</div>
                          <div className="text-xs text-slate-500">{maintenance.handler.position}</div>
                        </div>
                      </td>
                      
                      {/* Khách hàng */}
                      <td className="px-2 py-1 w-48">
                        <div>
                          {maintenance.customer ? (
                            <>
                              <div className="text-sm font-bold text-slate-900">
                                {maintenance.customer.shortName}
                              </div>
                              <div className="text-xs text-slate-600">
                                {maintenance.customer.fullCompanyName}
                              </div>
                              <div className="text-xs text-slate-500">
                                Liên hệ: {maintenance.customerName || '-'}
                              </div>
                            </>
                          ) : (
                            <div className="text-sm text-slate-700">{maintenance.customerName || '-'}</div>
                          )}
                        </div>
                      </td>
                      
                      {/* Loại bảo trì */}
                      <td className="px-2 py-1 w-32">
                        <div className="text-sm text-slate-700">{formatMaintenanceType(maintenance.maintenanceType)}</div>
                      </td>
                      
                      {/* Thông tin Case */}
                      <td className="px-2 py-1 w-80">
                        <div>
                          <div className="text-sm font-medium text-slate-900 mb-1 break-words">
                            {maintenance.title}
                          </div>
                          <div className="text-xs text-slate-500 mb-1 break-words">
                            {maintenance.description}
                          </div>
                          <div className="text-xs text-slate-500">
                            Tạo: {formatDate(maintenance.createdAt)}
                          </div>
                        </div>
                      </td>
                      
                      {/* Ghi chú */}
                      <td className="px-2 py-1 w-32">
                        <div className="text-xs text-slate-600 max-w-32">
                          {maintenance.notes ? (
                            <div className="bg-green-50 border border-green-200 rounded-md p-2">
                              <div className="text-xs font-medium text-green-800 mb-1">Ghi chú:</div>
                              <div className="text-xs text-green-700 line-clamp-3 break-words">
                                {maintenance.notes}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Chưa có ghi chú</span>
                          )}
                        </div>
                      </td>
                      
                      {/* Mã CRM */}
                      <td className="px-2 py-1 w-24">
                        <div className="text-sm text-slate-900">
                          {maintenance.crmReferenceCode ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                              {maintenance.crmReferenceCode}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Chưa có</span>
                          )}
                        </div>
                      </td>
                      
                      {/* Trạng thái */}
                      <td className="px-2 py-1 w-24">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(maintenance.status)}`}>
                          {getStatusText(maintenance.status)}
                        </span>
                      </td>
                      
                      {/* Thời gian */}
                      <td className="px-2 py-1 w-36">
                        <div className="text-xs space-y-1">
                          <div className="flex items-center">
                            <span className="text-green-600 font-medium">Bắt đầu:</span>
                            <span className="text-green-600 ml-1">{formatDate(maintenance.startDate)}</span>
                          </div>
                          {maintenance.endDate && (
                            <div className="flex items-center">
                              <span className="text-red-600 font-medium">Kết thúc:</span>
                              <span className="text-red-600 ml-1">{formatDate(maintenance.endDate)}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      
                      {/* Hành động */}
                      <td className="px-2 py-1 w-20 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {maintenance.status !== 'COMPLETED' && (
                            <button 
                              onClick={() => handleOpenEditModal(maintenance)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors duration-200"
                              title="Chỉnh sửa"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          
                          {maintenance.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleCloseCase(maintenance.id)}
                              disabled={closingCaseId === maintenance.id}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Đóng case"
                            >
                              {closingCaseId === maintenance.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="px-2 py-4 text-center">
                      <div className="text-slate-400 mb-4">
                        <Wrench className="h-16 w-16 mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 mb-2">Không tìm thấy case bảo trì nào</h3>
                      <p className="text-slate-500">Thử thay đổi từ khóa tìm kiếm hoặc tạo case bảo trì mới</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Maintenance Cases Cards - Mobile */}
        <div className="md:hidden space-y-3 mb-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 bg-white rounded-lg">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin text-orange-600" />
                <span className="text-sm text-slate-600">Đang tải...</span>
              </div>
            </div>
          ) : paginatedMaintenanceCases.length > 0 ? (
            paginatedMaintenanceCases.map((maintenanceCase, index) => (
              <div key={maintenanceCase.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
                {/* Header: Status & CRM */}
                <div className="flex items-start justify-between mb-2 pb-2 border-b border-gray-100">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-md border ${getStatusColor(maintenanceCase.status)}`}>
                    {getStatusText(maintenanceCase.status)}
                  </span>
                  {maintenanceCase.crmReferenceCode && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      {maintenanceCase.crmReferenceCode}
                    </span>
                  )}
                </div>

                {/* Main Info */}
                <div className="space-y-1.5 mb-2">
                  {/* Title */}
                  <div className="font-semibold text-sm text-gray-900 line-clamp-2">
                    {maintenanceCase.title}
                  </div>

                  {/* Handler */}
                  <div className="flex items-start gap-1.5 text-xs">
                    <User className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-600">Xử lý: </span>
                      <span className="font-medium text-gray-900">{maintenanceCase.handler?.fullName || 'Không xác định'}</span>
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="flex items-start gap-1.5 text-xs">
                    <Building2 className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-600">Khách hàng: </span>
                      {maintenanceCase.customer ? (
                        <span className="font-medium text-gray-900">{maintenanceCase.customer.shortName}</span>
                      ) : (
                        <span className="font-medium text-gray-900">{maintenanceCase.customerName || 'Không xác định'}</span>
                      )}
                    </div>
                  </div>

                  {/* Maintenance Type */}
                  <div className="flex items-start gap-1.5 text-xs">
                    <Wrench className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-600">Loại: </span>
                      <span className="font-medium text-gray-900">{formatMaintenanceType(maintenanceCase.maintenanceType)}</span>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-start gap-1.5 text-xs">
                    <Calendar className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div>
                        <span className="text-green-600">Bắt đầu: </span>
                        <span className="text-green-600 font-medium">{formatDate(maintenanceCase.startDate)}</span>
                      </div>
                      {maintenanceCase.endDate && (
                        <div>
                          <span className="text-red-600">Kết thúc: </span>
                          <span className="text-red-600 font-medium">{formatDate(maintenanceCase.endDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {maintenanceCase.description && (
                    <div className="pt-1 text-xs text-gray-600 line-clamp-2 bg-gray-50 rounded px-2 py-1.5">
                      {maintenanceCase.description}
                    </div>
                  )}

                  {/* Notes */}
                  {maintenanceCase.notes && (
                    <div className="bg-green-50 border border-green-200 rounded px-2 py-1.5">
                      <div className="text-xs font-medium text-green-800 mb-0.5">Ghi chú:</div>
                      <div className="text-xs text-green-700 line-clamp-2">{maintenanceCase.notes}</div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {maintenanceCase.status !== 'COMPLETED' && (
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <button 
                      onClick={() => handleOpenEditModal(maintenanceCase)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded transition-colors"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Sửa
                    </button>
                    <button
                      onClick={() => handleCloseCase(maintenanceCase.id)}
                      disabled={closingCaseId === maintenanceCase.id}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors disabled:opacity-50"
                    >
                      {closingCaseId === maintenanceCase.id ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      Đóng
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg p-8 text-center">
              <Wrench className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">Không tìm thấy case nào</h3>
              <p className="text-xs text-gray-500">Thử thay đổi từ khóa tìm kiếm</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalCases > 0 && (
          <div className="bg-white px-3 md:px-6 py-3 rounded-lg border border-gray-200">
            {/* Mobile & Desktop Pagination */}
            <div className="flex items-center justify-between">
              <div className="text-xs md:text-sm text-gray-700">
                <span className="font-medium">{startIndex + 1}</span>-<span className="font-medium">{Math.min(endIndex, totalCases)}</span> / <span className="font-medium">{totalCases}</span>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Trước</span>
                    <svg className="h-4 w-4 md:h-5 md:w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
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
                        className={`relative inline-flex items-center px-3 md:px-4 py-2 border text-xs md:text-sm font-medium ${
                          currentPage === pageNum
                            ? 'z-10 bg-orange-50 border-orange-500 text-orange-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Sau</span>
                    <svg className="h-4 w-4 md:h-5 md:w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

      {/* Create Maintenance Modal */}
      <CreateMaintenanceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(newMaintenance: any) => {
          setMaintenanceCases(prevMaintenance => [...prevMaintenance, newMaintenance as MaintenanceCase]);
        }}
      />

      {/* Edit Maintenance Modal */}
      <EditMaintenanceModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSuccess={handleEditSuccess}
        maintenanceData={selectedMaintenance}
      />

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10B981',
              color: '#fff',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#EF4444',
              color: '#fff',
            },
          },
        }}
      />
      </div>
    </div>
  );
}
