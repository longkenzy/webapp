'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Search, Filter, Eye, Edit, RefreshCw, Package, X, Calendar, Clock, CheckCircle, Trash2, Check, ChevronDown, User, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import CreateReceivingCaseModal from './CreateReceivingCaseModal';
import EditReceivingCaseModal from './EditReceivingCaseModal';

interface Employee {
  id: string;
  fullName: string;
  position: string;
  department: string;
}

interface Partner {
  id: string;
  shortName: string;
  fullCompanyName: string;
  contactPerson: string;
  contactPhone: string;
}

interface Product {
  id: string;
  name: string;
  code: string | null;
  quantity: number;
  serialNumber: string | null;
}

interface ReceivingCase {
  id: string;
  title: string;
  description: string;
  form: string;
  startDate: string;
  endDate: string | null;
  status: string;
  notes: string | null;
  crmReferenceCode: string | null;
  userDifficultyLevel: number | null;
  userEstimatedTime: number | null;
  userImpactLevel: number | null;
  userUrgencyLevel: number | null;
  userFormScore: number | null;
  userAssessmentDate: string | null;
  adminDifficultyLevel: number | null;
  adminEstimatedTime: number | null;
  adminImpactLevel: number | null;
  adminUrgencyLevel: number | null;
  adminAssessmentDate: string | null;
  adminAssessmentNotes: string | null;
  inProgressAt: string | null;
  createdAt: string;
  updatedAt: string;
  requester: Employee;
  handler: Employee;
  supplier: Partner | null;
  products: Product[];
  _count: {
    comments: number;
    worklogs: number;
    products: number;
  };
}

export default function ReceivingCasePage() {
  const { data: session, status } = useSession();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<ReceivingCase | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cases, setCases] = useState<ReceivingCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [closingCaseId, setClosingCaseId] = useState<string | null>(null);
  const [inProgressCaseId, setInProgressCaseId] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCases, setTotalCases] = useState(0);
  const casesPerPage = 10;
  
  // Filter states
  const [filters, setFilters] = useState({
    receiver: '',
    supplier: '',
    status: '',
    startDate: '',
    endDate: ''
  });
  
  // Mobile filter visibility
  const [showFilters, setShowFilters] = useState(false);
  
  // Expanded cases for mobile (to show/hide products)
  const [expandedCases, setExpandedCases] = useState<Set<string>>(new Set());
  
  const toggleExpand = (caseId: string) => {
    setExpandedCases(prev => {
      const next = new Set(prev);
      if (next.has(caseId)) {
        next.delete(caseId);
      } else {
        next.add(caseId);
      }
      return next;
    });
  };

  // Helper function to get products from case (either from products table or description JSON)
  const getCaseProducts = (case_: ReceivingCase): Product[] => {
    // If products table has data, use it
    if (case_.products && case_.products.length > 0) {
      return case_.products;
    }
    
    // Otherwise, try to parse from description JSON
    if (case_.description) {
      try {
        const parsedProducts = JSON.parse(case_.description);
        if (Array.isArray(parsedProducts)) {
          return parsedProducts.map((product: any) => ({
            id: product.id || Date.now().toString(),
            name: product.name || '',
            code: product.code || null,
            quantity: parseInt(product.quantity) || 1,
            serialNumber: product.serialNumber || product.notes || null // Support both old and new format
          }));
        }
      } catch (e) {
        // If not JSON, return empty array
        return [];
      }
    }
    
    return [];
  };


  // Fetch receiving cases from API
  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/receiving-cases?page=1&limit=100', {
        credentials: 'include' // Ensure cookies are sent
      });
      
      
      if (response.ok) {
        const data = await response.json();
        setCases(data.receivingCases || []);
        setError(null);
      } else {
        // Try to get error details from response
        let errorMessage = 'Failed to fetch cases';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        setCases([]);
        setError(errorMessage);
      }
    } catch (error) {
      setCases([]);
      setError('Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh cases
  const refreshCases = async () => {
    try {
      setRefreshing(true);
      await fetchCases();
    } catch (error) {
    } finally {
      setRefreshing(false);
    }
  };

  // Handle edit modal
  const handleOpenEditModal = (caseData: ReceivingCase) => {
    setSelectedCase(caseData);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedCase(null);
  };

  const handleEditSuccess = (updatedCase: ReceivingCase) => {
    setCases(prevCases => 
      prevCases.map(case_ => 
        case_.id === updatedCase.id ? updatedCase : case_
      )
    );
  };

  const handleCloseCase = async (caseId: string) => {
    try {
      setClosingCaseId(caseId);
      const response = await fetch(`/api/receiving-cases/${caseId}/close`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        // Update the case in the list
        setCases(prevCases => 
          prevCases.map(case_ => 
            case_.id === caseId 
              ? { ...case_, ...result.data }
              : case_
          )
        );
        
        // Show success toast
        toast.success('Case đã được đóng thành công!', {
          duration: 3000,
          position: 'top-right',
          style: {
            background: '#10B981',
            color: '#fff',
          },
        });
        
        return result;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to close case');
      }
    } catch (error) {
      
      // Show error toast
      toast.error('Có lỗi xảy ra khi đóng case. Vui lòng thử lại!', {
        duration: 4000,
        position: 'top-right',
      });
      
      throw error;
    } finally {
      setClosingCaseId(null);
    }
  };

  const handleSetInProgress = async (caseId: string) => {
    try {
      setInProgressCaseId(caseId);
      const response = await fetch(`/api/receiving-cases/${caseId}/set-in-progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        // Update the case in the list
        setCases(prevCases => 
          prevCases.map(case_ => 
            case_.id === caseId 
              ? { ...case_, ...result.data }
              : case_
          )
        );
        
        // Show success toast
        toast.success('Case đã được chuyển sang trạng thái đang xử lý!', {
          duration: 3000,
          position: 'top-right',
          style: {
            background: '#F59E0B',
            color: '#fff',
          },
        });
        
        return result;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set case in progress');
      }
    } catch (error) {
      
      // Show error toast
      toast.error('Có lỗi xảy ra khi chuyển trạng thái case. Vui lòng thử lại!', {
        duration: 4000,
        position: 'top-right',
      });
      
      throw error;
    } finally {
      setInProgressCaseId(null);
    }
  };

  // Load cases on component mount
  useEffect(() => {
    if (status === 'authenticated') {
      fetchCases();
    }
  }, [status, fetchCases]);

  // Filter and sort cases based on search term and filters
  const filteredCases = cases
    .filter(case_ => {
      // Search term filter
      const matchesSearch = searchTerm === '' || (
      case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.requester.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.handler.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (case_.supplier?.shortName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
      
      // Receiver filter
      const matchesReceiver = filters.receiver === '' || 
        case_.requester.fullName.toLowerCase().includes(filters.receiver.toLowerCase());
      
      // Supplier filter
      const matchesSupplier = filters.supplier === '' || 
        (case_.supplier?.shortName || '').toLowerCase().includes(filters.supplier.toLowerCase());
      
      // Status filter
      const matchesStatus = filters.status === '' || 
        case_.status === filters.status;
      
      // Date range filter
      const caseDate = new Date(case_.startDate);
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;
      
      const matchesDateRange = (!startDate || caseDate >= startDate) && 
        (!endDate || caseDate <= endDate);
      
      return matchesSearch && matchesReceiver && matchesSupplier && 
             matchesStatus && matchesDateRange;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Sort by newest first

  // Client-side pagination
  const paginatedCases = filteredCases.slice(
    (currentPage - 1) * casesPerPage,
    currentPage * casesPerPage
  );

  // Update total pages and total cases based on filtered results
  const totalCasesFiltered = filteredCases.length;
  const totalPagesFiltered = Math.ceil(totalCasesFiltered / casesPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RECEIVED':
      case 'Tiếp nhận':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IN_PROGRESS':
      case 'Đang xử lý':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'COMPLETED':
      case 'Hoàn thành':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
      case 'Hủy':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'DELAYED':
      case 'Trễ hạn':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return 'Tiếp nhận';
      case 'IN_PROGRESS':
        return 'Đang xử lý';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'CANCELLED':
        return 'Hủy';
      case 'DELAYED':
        return 'Trễ hạn';
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
      minute: '2-digit'
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Ho_Chi_Minh'
    });
  };

  const getProcessFlow = (caseItem: ReceivingCase) => {
    if (caseItem.status === 'CANCELLED') {
      return (
        <div className="text-center py-1">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-1">
            <Trash2 className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-xs font-medium text-red-600">Đã hủy</div>
        </div>
      );
    }

    const currentStep = caseItem.status === 'RECEIVED' ? 1 : 
                      caseItem.status === 'IN_PROGRESS' ? 2 : 3;

    // Determine timestamps for each step
    const receivedTime = caseItem.startDate; // Lấy từ startDate của DB
    const inProgressTime = caseItem.inProgressAt; // Lấy từ inProgressAt của DB
    
    // Validation: Thời gian hoàn thành phải lớn hơn thời gian tiếp nhận và đang xử lý
    let completedTime = null;
    if (caseItem.status === 'COMPLETED' && caseItem.endDate) {
      const endDate = new Date(caseItem.endDate);
      const startDate = new Date(caseItem.startDate);
      
      // Kiểm tra nếu endDate hợp lệ (lớn hơn startDate)
      if (endDate > startDate) {
        // Nếu có inProgressTime, cũng kiểm tra endDate > inProgressTime
        if (inProgressTime) {
          const inProgressDate = new Date(inProgressTime);
          if (endDate > inProgressDate) {
            completedTime = caseItem.endDate;
          }
        } else {
          completedTime = caseItem.endDate;
        }
      }
    }

    return (
      <div className="py-1">
        {/* Process Icons with Timestamps */}
        <div className="flex items-center justify-center mb-1">
          <div className="flex items-center space-x-3">
            {/* Step 1: Tiếp nhận */}
            <div className="flex flex-col items-center">
              <div className="text-xs font-medium text-gray-700 mb-1">
                Tiếp nhận
              </div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                <Package className="w-3 h-3" />
              </div>
              <div className="text-xs text-gray-500 text-center">
                {formatDateTime(receivedTime)}
              </div>
            </div>
            
            {/* Line */}
            <div className="flex items-center justify-center h-6 -mt-3">
              <div className={`w-8 h-0.5 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            </div>
            
            {/* Step 2: Đang xử lý */}
            <div className="flex flex-col items-center">
              <div className="text-xs font-medium text-gray-700 mb-1">
                Đang xử lý
              </div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
                currentStep >= 2 ? 'bg-yellow-500 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                <Clock className="w-3 h-3" />
              </div>
              <div className="text-xs text-gray-500 text-center">
                {inProgressTime ? formatDateTime(inProgressTime) : '-'}
              </div>
            </div>
            
            {/* Line */}
            <div className="flex items-center justify-center h-6 -mt-3">
              <div className={`w-8 h-0.5 ${currentStep >= 3 ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
            </div>
            
            {/* Step 3: Hoàn thành */}
            <div className="flex flex-col items-center">
              <div className="text-xs font-medium text-gray-700 mb-1">
                Hoàn thành
              </div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
                currentStep >= 3 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                <CheckCircle className="w-3 h-3" />
              </div>
              <div className="text-xs text-gray-500 text-center">
                {completedTime ? formatDateTime(completedTime) : '-'}
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  };

  // Get unique values for filter dropdowns
  const getUniqueReceivers = () => {
    const receivers = cases.map(case_ => case_.requester.fullName);
    return [...new Set(receivers)].sort();
  };

  const getUniqueSuppliers = () => {
    const suppliers = cases.map(case_ => case_.supplier?.shortName || '').filter(name => name !== '');
    return [...new Set(suppliers)].sort();
  };

  const getUniqueStatuses = () => {
    const statuses = cases.map(case_ => case_.status);
    return [...new Set(statuses)].sort();
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      receiver: '',
      supplier: '',
      status: '',
      startDate: '',
      endDate: ''
    });
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return Object.values(filters).some(value => value !== '');
  };

  // Pagination functions
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToNextPage = () => {
    if (currentPage < totalPagesFiltered) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

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
    <>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-3 md:p-6 pt-3 md:pt-4">
        <div className="max-w-full mx-auto px-2 md:px-4">
        {/* Header */}
        <div className="mb-4 md:mb-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-3xl font-bold text-slate-900 mb-1 md:mb-2">Case Nhận Hàng</h1>
              <p className="text-xs md:text-base text-slate-600 hidden sm:block">Quản lý và theo dõi các case nhận hàng của công ty</p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 md:gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg flex-shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Tạo Case Nhận Hàng</span>
              <span className="sm:hidden">Tạo</span>
            </button>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg border border-gray-200 mb-4 md:mb-6 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 flex-1 md:pointer-events-none"
            >
              <div className="p-1 bg-blue-50 rounded">
                <Search className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">Tìm kiếm & Lọc</span>
              {(searchTerm || hasActiveFilters()) && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
                  {[searchTerm, ...Object.values(filters)].filter(Boolean).length}
                </span>
              )}
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform md:hidden ml-auto ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <div className="flex items-center gap-2">
              {(searchTerm || hasActiveFilters()) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    clearFilters();
                  }}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1"
                >
                  Xóa hết
                </button>
              )}
              <button 
                onClick={refreshCases}
                disabled={refreshing}
                className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 text-xs md:text-sm"
              >
                <RefreshCw className={`h-3 w-3 md:h-4 md:w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Làm mới</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className={`${showFilters ? 'block' : 'hidden md:block'}`}>
            <div className="p-3 space-y-2.5">
              {/* Search Section */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tìm kiếm</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm kiếm case..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Filters Section */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Bộ lọc</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2.5">
                  {/* Người nhận hàng */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Người nhận hàng</label>
                    <select
                      value={filters.receiver}
                      onChange={(e) => setFilters(prev => ({ ...prev, receiver: e.target.value }))}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                    >
                      <option value="">Tất cả</option>
                      {getUniqueReceivers().map(receiver => (
                        <option key={receiver} value={receiver}>{receiver}</option>
                      ))}
                    </select>
                  </div>

                  {/* Nhà cung cấp */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nhà cung cấp</label>
                    <select
                      value={filters.supplier}
                      onChange={(e) => setFilters(prev => ({ ...prev, supplier: e.target.value }))}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                    >
                      <option value="">Tất cả</option>
                      {getUniqueSuppliers().map(supplier => (
                        <option key={supplier} value={supplier}>{supplier}</option>
                      ))}
                    </select>
                  </div>

                  {/* Trạng thái */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Trạng thái</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                    >
                      <option value="">Tất cả</option>
                      {getUniqueStatuses().map(status => (
                        <option key={status} value={status}>{getStatusText(status)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Từ ngày */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Từ ngày</label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                    />
                  </div>

                  {/* Đến ngày */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Đến ngày</label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                      className={`w-full px-2.5 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow ${
                        !isDateRangeValid() ? 'border-red-300' : 'border-gray-200'
                      }`}
                    />
                    {!isDateRangeValid() && (
                      <p className="text-xs text-red-600 mt-1">Ngày kết thúc phải sau ngày bắt đầu</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Results Summary */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="text-xs text-gray-600">
                  Hiển thị <span className="font-medium text-gray-900">{totalCasesFiltered}</span> case
                  {(searchTerm || hasActiveFilters()) && (
                    <span className="ml-1 text-blue-600 font-medium">(đã lọc)</span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  Trang {currentPage}/{totalPagesFiltered}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cases - Mobile Card View */}
        <div className="md:hidden mb-4">
          <div className="space-y-3">
          {loading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Đang tải...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              <div className="text-sm text-red-600 mb-3">{error}</div>
              <button
                onClick={fetchCases}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Thử lại
              </button>
            </div>
          ) : paginatedCases.length > 0 ? (
            paginatedCases.map((case_, index) => {
              const products = getCaseProducts(case_);
              return (
                <div key={case_.id} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm active:shadow-md transition-shadow">
                  {/* Header - Status, CRM, Number */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(case_.status)}`}>
                        {getStatusText(case_.status)}
                      </span>
                      {case_.crmReferenceCode && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {case_.crmReferenceCode}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-gray-400">#{totalCasesFiltered - ((currentPage - 1) * casesPerPage + index)}</span>
                  </div>

                  {/* Người nhận hàng */}
                  <div className="mb-1.5">
                    <div className="flex items-start gap-1 text-xs">
                      <User className="h-3 w-3 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-gray-900">{case_.requester.fullName}</span>
                        <span className="text-gray-500"> • {case_.requester.position}</span>
                        {case_.requester.department && (
                          <span className="text-gray-400"> • {case_.requester.department}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Nhà cung cấp */}
                  <div className="mb-1.5">
                    <div className="flex items-start gap-1 text-xs">
                      <Building2 className="h-3 w-3 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900">{case_.supplier?.shortName || 'Không xác định'}</div>
                        {case_.supplier?.fullCompanyName && (
                          <div className="text-gray-500 text-xs leading-snug">{case_.supplier.fullCompanyName}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Danh sách sản phẩm - Expandable */}
                  {products.length > 0 && (
                    <div className="mb-1.5">
                      {/* Summary with Expand Button */}
                      <div className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-1.5 text-xs text-gray-700">
                          <Package className="h-3 w-3 text-gray-500" />
                          <span className="font-medium">{products.length} sản phẩm</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleExpand(case_.id);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors shadow-sm"
                        >
                          <span>{expandedCases.has(case_.id) ? 'Ẩn chi tiết' : 'Xem chi tiết'}</span>
                          <ChevronDown 
                            className={`h-3.5 w-3.5 transition-transform duration-200 ${
                              expandedCases.has(case_.id) ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      </div>

                      {/* Products List - Expanded */}
                      {expandedCases.has(case_.id) && (
                        <div className="mt-2 pl-4 border-l-2 border-blue-200 bg-blue-50/30 py-2 rounded-r">
                          <div className="text-xs space-y-1.5">
                            {products.map((product, idx) => (
                              <div key={idx} className="text-gray-700">
                                <div className="flex items-start gap-1.5">
                                  <span className="text-blue-600 flex-shrink-0 font-medium">{idx + 1}.</span>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-900">{product.name}</div>
                                    <div className="text-gray-600 text-xs mt-0.5">
                                      <span className="inline-flex items-center gap-1">
                                        <span className="font-medium text-gray-900">SL: {product.quantity}</span>
                                      </span>
                                      {product.code && (
                                        <span className="ml-2 inline-flex items-center gap-1">
                                          <span className="text-gray-500">Mã:</span>
                                          <span className="font-medium text-gray-900">{product.code}</span>
                                        </span>
                                      )}
                                      {product.serialNumber && (
                                        <span className="ml-2 inline-flex items-center gap-1">
                                          <span className="text-gray-500">S/N:</span>
                                          <span className="font-medium text-gray-900">{product.serialNumber}</span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Thời gian */}
                  <div className="mb-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span>Bắt đầu: {formatDate(case_.startDate)}</span>
                    </div>
                    {case_.endDate && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>Kết thúc: {formatDate(case_.endDate)}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 pt-1.5 border-t border-gray-100">
                    {case_.status !== 'COMPLETED' && (
                      <>
                        <button 
                          onClick={() => handleOpenEditModal(case_)}
                          className="flex-1 flex items-center justify-center gap-0.5 px-1.5 py-1 text-blue-600 border border-blue-200 hover:bg-blue-50 rounded text-xs font-medium transition-colors"
                        >
                          <Edit className="h-3 w-3" />
                          <span>Sửa</span>
                        </button>
                        {case_.status !== 'IN_PROGRESS' && (
                          <button 
                            onClick={async () => {
                              if (!confirm(`Chuyển sang đang xử lý?`)) return;
                              try {
                                await handleSetInProgress(case_.id);
                              } catch (error) {}
                            }}
                            disabled={inProgressCaseId === case_.id}
                            className="flex-1 flex items-center justify-center gap-0.5 px-1.5 py-1 text-yellow-700 border border-yellow-200 hover:bg-yellow-50 rounded text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            <Clock className={`h-3 w-3 ${inProgressCaseId === case_.id ? 'animate-pulse' : ''}`} />
                            <span>Xử lý</span>
                          </button>
                        )}
                        <button 
                          onClick={async () => {
                            if (!confirm(`Đóng case?`)) return;
                            try {
                              await handleCloseCase(case_.id);
                            } catch (error) {}
                          }}
                          disabled={closingCaseId === case_.id}
                          className="flex-1 flex items-center justify-center gap-0.5 px-1.5 py-1 text-green-700 border border-green-200 hover:bg-green-50 rounded text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          <Check className={`h-3 w-3 ${closingCaseId === case_.id ? 'animate-pulse' : ''}`} />
                          <span>Đóng</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900 mb-1">Không tìm thấy case nào</p>
              <p className="text-xs text-gray-500">Thử thay đổi bộ lọc hoặc tạo case mới</p>
            </div>
          )}
          </div>

          {/* Mobile Pagination */}
          {totalPagesFiltered > 1 && !loading && !error && (
            <div className="bg-white rounded-lg border border-gray-200 p-3 mt-3">
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px w-full justify-center" aria-label="Pagination">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Trước</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPagesFiltered) }, (_, i) => {
                  let pageNum;
                  if (totalPagesFiltered <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPagesFiltered - 2) {
                    pageNum = totalPagesFiltered - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNum === currentPage
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
                  disabled={currentPage === totalPagesFiltered}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Sau</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          )}
        </div>

        {/* Cases Table - Desktop */}
        <div className="hidden md:block bg-white rounded-lg shadow-sm border border-slate-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-green-50">
                <tr>
                  <th className="px-2 py-1 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-16">
                    STT
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-32">
                    Người nhận hàng
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-48">
                    Nhà cung cấp
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-64">
                    Nội dung nhận hàng
                  </th>
                  <th className="px-2 py-1 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-48">
                    Quy trình xử lý
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-24">
                    Mã CRM
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-24">
                    Trạng thái
                  </th>
                  <th className="px-2 py-1 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-20">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-2 py-8 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                        <span className="text-slate-600">Đang tải danh sách case...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="px-2 py-8 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="text-red-600 text-sm font-medium">
                          Lỗi tải dữ liệu: {error}
                        </div>
                        <button
                          onClick={fetchCases}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          <RefreshCw className="h-4 w-4" />
                          <span>Thử lại</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : paginatedCases.length > 0 ? (
                  paginatedCases.map((case_, index) => (
                    <tr key={case_.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                      {/* STT */}
                      <td className="px-2 py-1 text-center">
                        <span className="text-sm font-medium text-slate-600">
                          {totalCasesFiltered - ((currentPage - 1) * casesPerPage + index)}
                        </span>
                      </td>
                      
                      {/* Người nhận hàng */}
                      <td className="px-2 py-1">
                        <div>
                          <div className="text-sm text-slate-900">{case_.requester.fullName}</div>
                          <div className="text-xs text-slate-500">{case_.requester.position}</div>
                        </div>
                      </td>

                      {/* Nhà cung cấp */}
                      <td className="px-2 py-1 w-48">
                        <div className="max-w-48">
                          <div className="text-sm text-slate-900 font-medium truncate" title={case_.supplier?.shortName || 'Không xác định'}>
                            {case_.supplier?.shortName || 'Không xác định'}
                          </div>
                          <div className="text-xs text-slate-500 leading-tight mt-1" title={case_.supplier?.fullCompanyName || 'Không xác định'}>
                            {case_.supplier?.fullCompanyName || 'Không xác định'}
                          </div>
                        </div>
                      </td>

                      {/* Nội dung nhận hàng */}
                      <td className="px-2 py-1">
                        <div className="max-w-md">
                          {(() => {
                            const products = getCaseProducts(case_);
                            if (products.length > 0) {
                              return (
                                <div className="space-y-0.5">
                                  {products.map((product, idx) => (
                                    <div key={product.id} className="text-xs text-slate-900 leading-tight">
                                      <span className="font-medium">{product.name}</span>
                                      <span className="text-slate-600"> | SL: {product.quantity}</span>
                                      {product.code && (
                                        <span className="text-slate-600"> | Mã: {product.code}</span>
                                      )}
                                      {product.serialNumber && (
                                        <span className="text-slate-600"> | S/N: {product.serialNumber}</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              );
                            } else {
                              return (
                                <div className="text-xs text-slate-500 italic leading-tight">
                                  {case_.description || 'Không có mô tả sản phẩm'}
                                </div>
                              );
                            }
                          })()}
                        </div>
                      </td>

                      {/* Quy trình xử lý */}
                      <td className="px-2 py-1 text-center">
                        {getProcessFlow(case_)}
                      </td>

                      {/* Mã CRM */}
                      <td className="px-2 py-1">
                        <div className="text-sm text-slate-900">
                          {case_.crmReferenceCode ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                              {case_.crmReferenceCode}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Chưa có</span>
                          )}
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-2 py-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(case_.status)}`}>
                          {getStatusText(case_.status)}
                        </span>
                      </td>

                      {/* Hành động */}
                      <td className="px-2 py-1 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {case_.status !== 'COMPLETED' && (
                            <button 
                              onClick={() => handleOpenEditModal(case_)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200"
                              title="Chỉnh sửa"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}

                          {case_.status !== 'COMPLETED' && case_.status !== 'IN_PROGRESS' && (
                            <button 
                              onClick={async () => {
                                if (case_.status === 'IN_PROGRESS') {
                                  toast.error('Case này đã đang được xử lý!', {
                                    duration: 3000,
                                    position: 'top-right',
                                  });
                                  return;
                                }

                                if (!confirm(`Bạn có chắc chắn muốn chuyển case "${case_.title}" sang trạng thái đang xử lý?`)) {
                                  return;
                                }

                                try {
                                  await handleSetInProgress(case_.id);
                                } catch (error) {
                                }
                              }}
                              disabled={inProgressCaseId === case_.id}
                              className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Chuyển sang đang xử lý"
                            >
                              <Clock className={`h-4 w-4 ${inProgressCaseId === case_.id ? 'animate-pulse' : ''}`} />
                            </button>
                          )}
                          
                          {case_.status !== 'COMPLETED' && (
                            <button 
                              onClick={async () => {
                                if (case_.status === 'COMPLETED') {
                                  toast.error('Case này đã được đóng rồi!', {
                                    duration: 3000,
                                    position: 'top-right',
                                  });
                                  return;
                                }

                                if (!confirm(`Bạn có chắc chắn muốn đóng case "${case_.title}"?`)) {
                                  return;
                                }

                                try {
                                  await handleCloseCase(case_.id);
                                } catch (error) {
                                }
                              }}
                              disabled={closingCaseId === case_.id}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Đóng case"
                            >
                              <Check className={`h-4 w-4 ${closingCaseId === case_.id ? 'animate-pulse' : ''}`} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-2 py-8 text-center">
                      <div className="text-slate-400 mb-4">
                        <Search className="h-16 w-16 mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 mb-2">Không tìm thấy case nào</h3>
                      <p className="text-slate-500">Thử thay đổi từ khóa tìm kiếm hoặc tạo case mới</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPagesFiltered > 1 && (
            <div className="bg-white px-2 sm:px-4 py-2 md:py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="flex-1 flex justify-between items-center sm:hidden">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white active:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <span className="text-xs text-gray-600">
                  Trang {currentPage}/{totalPagesFiltered}
                </span>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPagesFiltered}
                  className="relative inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white active:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Hiển thị{' '}
                    <span className="font-medium">{(currentPage - 1) * casesPerPage + 1}</span>
                    {' '}đến{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * casesPerPage, totalCasesFiltered)}
                    </span>
                    {' '}của{' '}
                    <span className="font-medium">{totalCasesFiltered}</span>
                    {' '}kết quả
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={goToPrevPage}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Trước</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPagesFiltered) }, (_, i) => {
                      let pageNum;
                      if (totalPagesFiltered <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPagesFiltered - 2) {
                        pageNum = totalPagesFiltered - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNum === currentPage
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
                      disabled={currentPage === totalPagesFiltered}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Sau</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
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
        <CreateReceivingCaseModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={(newCase) => {
            setCases(prevCases => [newCase, ...prevCases]);
            setIsCreateModalOpen(false);
          }}
        />

        {/* Edit Case Modal */}
        <EditReceivingCaseModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSuccess={handleEditSuccess}
          caseData={selectedCase}
        />
      </div>
      </div>
    </>
  );
}
