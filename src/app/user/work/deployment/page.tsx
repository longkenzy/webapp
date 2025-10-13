'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Search, Filter, MoreVertical, Edit, RefreshCw, X, Rocket, Check, ChevronDown, User, Building2, Calendar, Settings } from 'lucide-react';
import CreateDeploymentModal from './CreateDeploymentModal';
import EditDeploymentModal from './EditDeploymentModal';
import { useDeploymentCases } from '@/hooks/useDeploymentCases';
import toast from 'react-hot-toast';
import { DateTimePicker } from '@mantine/dates';
import 'dayjs/locale/vi';

interface Employee {
  id: string;
  fullName: string;
  position: string;
  department: string;
  companyEmail: string;
}

interface DeploymentCase {
  id: string;
  title: string;
  description: string;
  reporter: Employee;
  handler: Employee;
  deploymentType: {
    id: string;
    name: string;
  };
  customerName: string;
  customerId?: string;
  customer?: {
    id: string;
    shortName: string;
    fullCompanyName: string;
    contactPerson?: string;
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

export default function DeploymentCasePage() {
  const { data: session, status } = useSession();
  const { deploymentCases: hookCases, loading, error, refreshCases, clearCache } = useDeploymentCases();
  const [deploymentCases, setDeploymentCases] = useState<DeploymentCase[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<DeploymentCase | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [closingCaseId, setClosingCaseId] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [casesPerPage] = useState(10);
  
  // Filter states
  const [filters, setFilters] = useState<{
    handler: string;
    deploymentType: string;
    customer: string;
    status: string;
    startDate: Date | null;
    endDate: Date | null;
  }>({
    handler: '',
    deploymentType: '',
    customer: '',
    status: '',
    startDate: null,
    endDate: null
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

  // Use the hook's refreshCases function
  const fetchCases = useCallback(async () => {
    await refreshCases();
  }, [refreshCases]);

  // Optimized refresh function that only fetches if needed
  const refreshCasesOptimized = useCallback(async () => {
    // Only refresh if we don't have data or if there's an error
    if (deploymentCases.length === 0 || error) {
      await refreshCases();
    }
  }, [deploymentCases.length, error, refreshCases]);

  // Refresh cases
  const handleRefresh = async () => {
    setRefreshing(true);
    clearCache(); // Clear all cache first
    await refreshCases(); // Force refresh when user clicks refresh button
    setRefreshing(false);
  };

  // Handle edit modal
  const handleOpenEditModal = (caseData: DeploymentCase) => {
    setSelectedCase(caseData);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedCase(null);
  };

  const handleEditSuccess = async (updatedCase: DeploymentCase) => {
    // Optimistic update - update the case in the current list
    setDeploymentCases(prevCases => 
      prevCases.map(case_ => 
        case_.id === updatedCase.id ? updatedCase : case_
      )
    );
  };

  // Sync data from hook to local state
  useEffect(() => {
    setDeploymentCases(hookCases);
  }, [hookCases]);

  // Load cases on component mount
  useEffect(() => {
    if (status === 'authenticated') {
      refreshCasesOptimized();
    }
  }, [status, refreshCasesOptimized]);

  // Close customer dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCustomerDropdown) {
        const target = event.target as HTMLElement;
        if (!target.closest('.customer-dropdown-container')) {
          setShowCustomerDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCustomerDropdown]);

  // Filter and sort cases based on search term and filters
  const filteredCases = deploymentCases
    .filter(case_ => {
      // Search term filter
      const matchesSearch = searchTerm === '' || (
      case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.reporter?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.handler?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.deploymentType?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      // Handler filter
      const matchesHandler = filters.handler === '' || 
        case_.handler?.fullName?.toLowerCase().includes(filters.handler.toLowerCase());
      
      // Customer filter
      const matchesCustomer = filters.customer === '' || 
        (case_.customer?.shortName || case_.customerName).toLowerCase().includes(filters.customer.toLowerCase());
      
      // Deployment type filter
      const matchesDeploymentType = filters.deploymentType === '' || 
        case_.deploymentType?.name === filters.deploymentType;
      
      // Status filter
      const matchesStatus = filters.status === '' || 
        case_.status === filters.status;
      
      // Date range filter
      const caseDate = new Date(case_.startDate);
      const startDate = filters.startDate;
      const endDate = filters.endDate;
      
      const matchesDateRange = (!startDate || caseDate >= startDate) && 
        (!endDate || caseDate <= endDate);
      
      return matchesSearch && matchesHandler && matchesCustomer && 
             matchesDeploymentType && matchesStatus && matchesDateRange;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Pagination logic
  const totalCases = filteredCases.length;
  const totalPages = Math.ceil(totalCases / casesPerPage);
  const startIndex = (currentPage - 1) * casesPerPage;
  const endIndex = startIndex + casesPerPage;
  const paginatedCases = filteredCases.slice(startIndex, endIndex);

  // Pagination functions
  const goToPage = (page: number) => {
    setCurrentPage(page);
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
      case 'Tạm dừng':
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  // Get unique values for filter dropdowns
  const getUniqueHandlers = () => {
    const handlers = deploymentCases
      .map(case_ => case_.handler?.fullName)
      .filter(name => name); // Filter out undefined/null values
    return [...new Set(handlers)].sort();
  };

  const getUniqueDeploymentTypes = () => {
    const deploymentTypes = deploymentCases
      .map(case_ => case_.deploymentType?.name)
      .filter(name => name); // Filter out undefined/null values
    return [...new Set(deploymentTypes)].sort();
  };

  const getUniqueStatuses = () => {
    const statuses = deploymentCases.map(case_ => case_.status);
    return [...new Set(statuses)].sort();
  };

  const getUniqueCustomers = () => {
    const customers = deploymentCases
      .map(case_ => case_.customer?.shortName || case_.customerName)
      .filter(name => name); // Filter out undefined/null values
    return [...new Set(customers)].sort();
  };

  const getFilteredCustomers = () => {
    const customers = getUniqueCustomers();
    if (!customerSearch) return customers;
    return customers.filter(customer => 
      customer.toLowerCase().includes(customerSearch.toLowerCase())
    );
  };

  const handleCloseCase = async (caseId: string) => {
    if (!confirm('Bạn có chắc chắn muốn đóng case này?')) {
      return;
    }

    try {
      setClosingCaseId(caseId);
      
      const response = await fetch(`/api/deployment-cases/${caseId}/close`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Case đã được đóng thành công!');
        // Optimistic update - update the case status locally
        setDeploymentCases(prevCases => 
          prevCases.map(case_ => 
            case_.id === caseId 
              ? { ...case_, status: 'COMPLETED', endDate: new Date().toISOString() }
              : case_
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

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      handler: '',
      deploymentType: '',
      customer: '',
      status: '',
      startDate: null,
      endDate: null
    });
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return filters.handler !== '' || 
           filters.deploymentType !== '' || 
           filters.customer !== '' || 
           filters.status !== '' || 
           filters.startDate !== null || 
           filters.endDate !== null;
  };

  // Count active filters
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.handler) count++;
    if (filters.deploymentType) count++;
    if (filters.customer) count++;
    if (filters.status) count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    return count;
  };


  // Validate date range
  const isDateRangeValid = () => {
    if (filters.startDate && filters.endDate) {
      return filters.startDate <= filters.endDate;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-3 md:p-6 pt-3 md:pt-4">
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
                <Rocket className="h-5 w-5 md:h-8 md:w-8 text-blue-600 mr-2 md:mr-3" />
                Case Triển Khai
              </h1>
              <p className="text-xs md:text-base text-slate-600 hidden md:block">Quản lý và theo dõi các case triển khai hệ thống và phần mềm</p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 md:gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden md:inline">Tạo Case Triển Khai</span>
              <span className="md:hidden">Tạo</span>
            </button>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 md:mb-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-3 md:px-6 py-3 md:py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg">
                  <Search className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm md:text-lg font-semibold text-gray-900">Tìm kiếm & Lọc</h3>
                  <p className="text-xs text-gray-600 hidden md:block">Tìm kiếm và lọc case triển khai theo nhiều tiêu chí</p>
              </div>
            </div>
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-1.5 md:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs md:text-sm"
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
                    className="w-full pl-8 md:pl-10 pr-2.5 md:pr-3 py-1.5 md:py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white text-xs md:text-sm"
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
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
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

                    {/* Loại triển khai */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Loại
                      </label>
                      <select
                        value={filters.deploymentType}
                        onChange={(e) => setFilters(prev => ({ ...prev, deploymentType: e.target.value }))}
                        className="w-full px-2.5 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-gray-50 focus:bg-white text-xs md:text-sm"
                      >
                        <option value="">Tất cả</option>
                        {getUniqueDeploymentTypes().map(deploymentType => (
                          <option key={deploymentType} value={deploymentType}>{deploymentType}</option>
                        ))}
                      </select>
                    </div>

                    {/* Khách hàng */}
                    <div className="relative customer-dropdown-container">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Khách hàng
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Tìm KH..."
                          value={customerSearch}
                          onChange={(e) => {
                            setCustomerSearch(e.target.value);
                            setShowCustomerDropdown(true);
                          }}
                          onFocus={() => setShowCustomerDropdown(true)}
                          className="w-full px-2.5 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 focus:bg-white text-xs md:text-sm"
                        />
                        {showCustomerDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            <div className="py-1">
                              {getFilteredCustomers().map(customer => (
                                <button
                                  key={customer}
                                  type="button"
                                  onClick={() => {
                                    setFilters(prev => ({ ...prev, customer }));
                                    setCustomerSearch(customer);
                                    setShowCustomerDropdown(false);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                                >
                                  {customer}
                                </button>
                              ))}
                              {getFilteredCustomers().length === 0 && (
                                <div className="px-3 py-2 text-sm text-gray-500">
                                  Không tìm thấy khách hàng
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      {filters.customer && (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                            {filters.customer}
                            <button
                              type="button"
                              onClick={() => {
                                setFilters(prev => ({ ...prev, customer: '' }));
                                setCustomerSearch('');
                              }}
                              className="ml-1 text-purple-600 hover:text-purple-800"
                            >
                              ×
                            </button>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Trạng thái */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Trạng thái
                      </label>
                      <select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-2.5 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white text-xs md:text-sm"
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
                      <DateTimePicker
                        value={filters.startDate}
                        onChange={(date) => setFilters(prev => ({ ...prev, startDate: date ? new Date(date) : null }))}
                        locale="vi"
                        valueFormat="DD/MM/YYYY HH:mm"
                        placeholder="Chọn ngày bắt đầu"
                        clearable
                        withSeconds={false}
                        classNames={{
                          input: 'w-full px-2.5 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white text-xs md:text-sm'
                        }}
                        styles={{
                          input: {
                            fontSize: 'inherit',
                            height: 'auto',
                            minHeight: '38px'
                          }
                        }}
                      />
                    </div>

                    {/* Đến ngày */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Đến ngày
                      </label>
                      <DateTimePicker
                        value={filters.endDate}
                        onChange={(date) => setFilters(prev => ({ ...prev, endDate: date ? new Date(date) : null }))}
                        locale="vi"
                        valueFormat="DD/MM/YYYY HH:mm"
                        placeholder="Chọn ngày kết thúc"
                        clearable
                        withSeconds={false}
                        minDate={filters.startDate || undefined}
                        classNames={{
                          input: `w-full px-2.5 md:px-3 py-1.5 md:py-2 border rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-gray-50 focus:bg-white text-xs md:text-sm ${
                            !isDateRangeValid() ? 'border-red-300' : 'border-gray-200'
                          }`
                        }}
                        styles={{
                          input: {
                            fontSize: 'inherit',
                            height: 'auto',
                            minHeight: '38px'
                          }
                        }}
                      />
                      {!isDateRangeValid() && (
                        <p className="text-xs text-red-600 mt-1">Ngày kết thúc phải sau ngày bắt đầu</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Results Summary */}
              <div className="flex items-center justify-between pt-2 md:pt-3 border-t border-gray-200">
                <div className="text-xs md:text-sm text-gray-600">
                  <span className="font-medium text-gray-900">{filteredCases.length}</span> / <span className="font-medium text-gray-900">{deploymentCases.length}</span> case
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cases Table - Desktop */}
        <div className="hidden md:block bg-white rounded-lg shadow-sm border border-slate-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-blue-50">
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
                    Loại triển khai
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-80">
                    Thông tin Triển khai
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
                    <td colSpan={8} className="px-3 py-8 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                        <span className="text-slate-600">Đang tải danh sách case...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedCases.length > 0 ? (
                  paginatedCases.map((case_, index) => (
                    <tr key={case_.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                      <td className="px-2 py-1 text-center">
                        <span className="text-sm font-medium text-slate-600">
                          {totalCases - startIndex - index}
                        </span>
                      </td>
                      <td className="px-2 py-1">
                        <div>
                          <div className="text-sm text-slate-900">{case_.handler?.fullName || 'Không xác định'}</div>
                          <div className="text-xs text-slate-500">{case_.handler?.position || ''}</div>
                        </div>
                      </td>
                      <td className="px-2 py-1">
                        <div>
                          {case_.customer ? (
                            <>
                              <div className="text-sm font-bold text-slate-900">
                                {case_.customer.shortName}
                              </div>
                              <div className="text-xs text-slate-600">
                                {case_.customer.fullCompanyName}
                              </div>
                              <div className="text-xs text-slate-500">
                                Liên hệ: {case_.customerName}
                              </div>
                            </>
                          ) : (
                            <div className="text-sm text-slate-700">{case_.customerName}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-1">
                        <div className="text-sm text-slate-700">{case_.deploymentType?.name || 'Không xác định'}</div>
                      </td>
                      <td className="px-2 py-1">
                        <div>
                          <div className="text-sm font-medium text-slate-900 mb-1">
                            {case_.title}
                          </div>
                          <div className="text-xs text-slate-500 mb-1 line-clamp-2">
                            {case_.description}
                          </div>
                          <div className="text-xs text-slate-500">
                            Tạo: {formatDate(case_.createdAt)}
                          </div>
                        </div>
                      </td>
                      
                      {/* Ghi chú */}
                      <td className="px-2 py-1 w-32">
                        <div className="text-xs text-slate-600 max-w-32">
                          {case_.notes ? (
                            <div className="text-xs text-slate-700 line-clamp-3 break-words">
                              {case_.notes}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Chưa có ghi chú</span>
                          )}
                        </div>
                      </td>
                      
                      {/* Mã CRM */}
                      <td className="px-2 py-1 w-24">
                        <div className="text-sm text-slate-900">
                          {case_.crmReferenceCode ? (
                            <span className="text-xs font-bold text-blue-600">
                              {case_.crmReferenceCode}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Chưa có</span>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-2 py-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(case_.status)}`}>
                          {getStatusText(case_.status)}
                        </span>
                      </td>
                      <td className="px-2 py-1">
                        <div className="text-xs space-y-1">
                          <div className="flex items-center">
                            <span className="text-green-600 font-medium">Bắt đầu:</span>
                            <span className="text-green-600 ml-1">{formatDate(case_.startDate)}</span>
                          </div>
                          {case_.endDate && (
                            <div className="flex items-center">
                              <span className="text-red-600 font-medium">Kết thúc:</span>
                              <span className="text-red-600 ml-1">{formatDate(case_.endDate)}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-1 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {case_.status !== 'COMPLETED' && (
                            <button 
                              onClick={() => handleOpenEditModal(case_)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors duration-200 cursor-pointer"
                              title="Chỉnh sửa"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          
                          {case_.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleCloseCase(case_.id)}
                              disabled={closingCaseId === case_.id}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                              title="Đóng case"
                            >
                              {closingCaseId === case_.id ? (
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
                    <td colSpan={10} className="px-3 py-8 text-center">
                      <div className="text-slate-400 mb-4">
                        <Rocket className="h-16 w-16 mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 mb-2">Không tìm thấy case nào</h3>
                      <p className="text-slate-500">Thử thay đổi từ khóa tìm kiếm hoặc tạo case mới</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
        </div>

        {/* Cases Cards - Mobile */}
        <div className="md:hidden space-y-3 mb-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 bg-white rounded-lg">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-sm text-slate-600">Đang tải...</span>
              </div>
            </div>
          ) : paginatedCases.length > 0 ? (
            paginatedCases.map((case_, index) => (
              <div key={case_.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
                {/* Header: Status & CRM */}
                <div className="flex items-start justify-between mb-2 pb-2 border-b border-gray-100">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-md border ${getStatusColor(case_.status)}`}>
                    {getStatusText(case_.status)}
                  </span>
                  {case_.crmReferenceCode && (
                    <span className="text-xs font-bold text-blue-600">
                      {case_.crmReferenceCode}
                    </span>
                  )}
                </div>

                {/* Main Info */}
                <div className="space-y-1.5 mb-2">
                  {/* Title */}
                  <div className="font-semibold text-sm text-gray-900 line-clamp-2">
                    {case_.title}
                  </div>

                  {/* Handler */}
                  <div className="flex items-start gap-1.5 text-xs">
                    <User className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-600">Xử lý: </span>
                      <span className="font-medium text-gray-900">{case_.handler?.fullName || 'Không xác định'}</span>
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="flex items-start gap-1.5 text-xs">
                    <Building2 className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-600">Khách hàng: </span>
                      {case_.customer ? (
                        <span className="font-medium text-gray-900">{case_.customer.shortName}</span>
                      ) : (
                        <span className="font-medium text-gray-900">{case_.customerName}</span>
                      )}
                    </div>
                  </div>

                  {/* Deployment Type */}
                  <div className="flex items-start gap-1.5 text-xs">
                    <Rocket className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-600">Loại: </span>
                      <span className="font-medium text-gray-900">{case_.deploymentType?.name || 'Không xác định'}</span>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-start gap-1.5 text-xs">
                    <Calendar className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div>
                        <span className="text-green-600">Bắt đầu: </span>
                        <span className="text-green-600 font-medium">{formatDate(case_.startDate)}</span>
                      </div>
                      {case_.endDate && (
                        <div>
                          <span className="text-red-600">Kết thúc: </span>
                          <span className="text-red-600 font-medium">{formatDate(case_.endDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {case_.description && (
                    <div className="pt-1 text-xs text-gray-600 line-clamp-2 bg-gray-50 rounded px-2 py-1.5">
                      {case_.description}
                    </div>
                  )}

                  {/* Notes */}
                  {case_.notes && (
                    <div className="rounded px-2 py-1.5">
                      <div className="text-xs font-medium text-slate-700 mb-0.5">Ghi chú:</div>
                      <div className="text-xs text-slate-600 line-clamp-2">{case_.notes}</div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {case_.status !== 'COMPLETED' && (
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <button 
                      onClick={() => handleOpenEditModal(case_)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded transition-colors cursor-pointer"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Sửa
                    </button>
                    <button
                      onClick={() => handleCloseCase(case_.id)}
                      disabled={closingCaseId === case_.id}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {closingCaseId === case_.id ? (
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
              <Rocket className="h-12 w-12 text-gray-300 mx-auto mb-3" />
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
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
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
      </div>

      {/* Create Case Modal */}
      <CreateDeploymentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={async (newCase: any) => {
          // Refresh the entire list to get complete data
          await fetchCases();
        }}
      />

      {/* Edit Case Modal */}
      <EditDeploymentModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSuccess={handleEditSuccess}
        caseData={selectedCase}
      />
    </div>
  );
}

