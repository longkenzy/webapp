'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Search, Filter, Eye, Edit, RefreshCw, Package, X, Clock, CheckCircle, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import CreateDeliveryCaseModal from './CreateDeliveryCaseModal';
import EditDeliveryCaseModal from './EditDeliveryCaseModal';

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

interface DeliveryCase {
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
  createdAt: string;
  updatedAt: string;
  requester: Employee;
  handler: Employee;
  customer: Partner | null;
  products: Product[];
  _count: {
    comments: number;
    worklogs: number;
    products: number;
  };
}

export default function DeliveryCasePage() {
  const { data: session, status } = useSession();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<DeliveryCase | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cases, setCases] = useState<DeliveryCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [closingCaseId, setClosingCaseId] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCases, setTotalCases] = useState(0);
  const casesPerPage = 10;
  
  // Filter states
  const [filters, setFilters] = useState({
    deliveryPerson: '',
    customer: '',
    status: '',
    startDate: '',
    endDate: ''
  });

  // Helper function to get products from case (either from products table or description JSON)
  const getCaseProducts = (case_: DeliveryCase): Product[] => {
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


  // Fetch delivery cases from API
  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching delivery cases from API...');
      const response = await fetch('/api/delivery-cases?page=1&limit=100', {
        credentials: 'include' // Ensure cookies are sent
      });
      
      console.log('API response status:', response.status);
      console.log('API response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        setCases(data.deliveryCases || []);
        setError(null);
      } else {
        // Try to get error details from response
        let errorMessage = 'Failed to fetch delivery cases';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error('API Error:', errorData);
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        console.error('Failed to fetch delivery cases:', errorMessage);
        setCases([]);
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Network error fetching delivery cases:', error);
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
      console.error('Error refreshing delivery cases:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle edit modal
  const handleOpenEditModal = (caseData: DeliveryCase) => {
    setSelectedCase(caseData);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedCase(null);
  };

  const handleEditSuccess = (updatedCase: DeliveryCase) => {
    setCases(prevCases => 
      prevCases.map(case_ => 
        case_.id === updatedCase.id ? updatedCase : case_
      )
    );
  };

  const handleCloseCase = async (caseId: string) => {
    try {
      setClosingCaseId(caseId);
      const response = await fetch(`/api/delivery-cases/${caseId}/close`, {
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
        });
        
        return result;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to close case');
      }
    } catch (error) {
      console.error('Error closing case:', error);
      toast.error('Có lỗi xảy ra khi đóng case. Vui lòng thử lại!', {
        duration: 4000,
        position: 'top-right',
      });
      throw error;
    } finally {
      setClosingCaseId(null);
    }
  };

  // Load cases on component mount
  useEffect(() => {
    if (status === 'authenticated') {
      fetchCases();
    }
  }, [status, fetchCases]);

  // Filter cases based on search term and filters
  const filteredCases = cases.filter(case_ => {
    const customer = case_.customer;
    
    // Search term filter
    const matchesSearch = searchTerm === '' || (
    case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    case_.requester.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    case_.handler.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer?.shortName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    case_.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
    
    // Delivery person filter
    const matchesDeliveryPerson = filters.deliveryPerson === '' || 
      case_.requester.fullName.toLowerCase().includes(filters.deliveryPerson.toLowerCase());
    
    // Customer filter
    const matchesCustomer = filters.customer === '' || 
      (customer?.shortName || '').toLowerCase().includes(filters.customer.toLowerCase());
    
    // Status filter
    const matchesStatus = filters.status === '' || 
      case_.status === filters.status;
    
    // Date range filter
    const caseDate = new Date(case_.startDate);
    const startDate = filters.startDate ? new Date(filters.startDate) : null;
    const endDate = filters.endDate ? new Date(filters.endDate) : null;
    
    const matchesDateRange = (!startDate || caseDate >= startDate) && 
      (!endDate || caseDate <= endDate);
    
    return matchesSearch && matchesDeliveryPerson && matchesCustomer && 
           matchesStatus && matchesDateRange;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
      minute: '2-digit'
    });
  };

  const getProcessFlow = (caseItem: DeliveryCase) => {
    if (caseItem.status === 'CANCELLED') {
      return (
        <div className="text-center py-1">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-1">
            <X className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-xs font-medium text-red-600">Đã hủy</div>
        </div>
      );
    }

    const currentStep = caseItem.status === 'RECEIVED' ? 1 : 
                      caseItem.status === 'IN_PROGRESS' ? 2 : 3;

    // Determine timestamps for each step
    const receivedTime = caseItem.createdAt; // Case được tạo = tiếp nhận
    const inProgressTime = caseItem.status === 'IN_PROGRESS' || caseItem.status === 'COMPLETED' ? 
                          caseItem.updatedAt : null; // Có thể cần thêm field riêng
    const completedTime = caseItem.status === 'COMPLETED' ? 
                         caseItem.endDate || caseItem.updatedAt : null;

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
                Đang giao hàng
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
                Giao thành công
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
  const getUniqueDeliveryPersons = () => {
    const persons = cases.map(case_ => case_.requester.fullName);
    return [...new Set(persons)].sort();
  };

  const getUniqueCustomers = () => {
    const customers = cases.map(case_ => {
      const customer = case_.customer;
      return customer?.shortName || '';
    }).filter(name => name !== '');
    return [...new Set(customers)].sort();
  };

  const getUniqueStatuses = () => {
    const statuses = cases.map(case_ => case_.status);
    return [...new Set(statuses)].sort();
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      deliveryPerson: '',
      customer: '',
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 pt-4">
      <div className="max-w-full mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Case Giao Hàng</h1>
              <p className="text-slate-600">Quản lý và theo dõi các case giao hàng của công ty</p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Plus className="h-4 w-4" />
              <span>Tạo Case Giao Hàng</span>
            </button>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Search className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Tìm kiếm & Lọc</h3>
                  <p className="text-xs text-gray-600">Tìm kiếm và lọc case giao hàng theo nhiều tiêu chí</p>
              </div>
            </div>
              <button 
                onClick={refreshCases}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Làm mới</span>
              </button>
            </div>
          </div>

           {/* Content */}
           <div className="p-6">
             <div className="space-y-4">
              {/* Search Section */}
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1.5">
                   Tìm kiếm
                 </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên case, người giao hàng, khách hàng..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                  />
                </div>
              </div>

              {/* Filters Section */}
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1.5">
                   Bộ lọc
                 </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  {/* Người giao hàng */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span>Người giao hàng</span>
                      </div>
                    </label>
                    <select
                      value={filters.deliveryPerson}
                      onChange={(e) => setFilters(prev => ({ ...prev, deliveryPerson: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                    >
                      <option value="">Tất cả người giao hàng</option>
                      {getUniqueDeliveryPersons().map(person => (
                        <option key={person} value={person}>{person}</option>
                      ))}
                    </select>
                  </div>

                  {/* Khách hàng */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                        <span>Khách hàng</span>
                      </div>
                    </label>
                    <select
                      value={filters.customer}
                      onChange={(e) => setFilters(prev => ({ ...prev, customer: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                    >
                      <option value="">Tất cả khách hàng</option>
                      {getUniqueCustomers().map(customer => (
                        <option key={customer} value={customer}>{customer}</option>
                      ))}
                    </select>
                  </div>

                  {/* Trạng thái */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                        <span>Trạng thái</span>
                      </div>
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                    >
                      <option value="">Tất cả trạng thái</option>
                      {getUniqueStatuses().map(status => (
                        <option key={status} value={status}>{getStatusText(status)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Từ ngày */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <span>Từ ngày</span>
                      </div>
                    </label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                    />
                  </div>

                  {/* Đến ngày */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                        <span>Đến ngày</span>
                      </div>
                    </label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm ${
                        !isDateRangeValid() ? 'border-red-300' : 'border-gray-200'
                      }`}
                    />
                    {!isDateRangeValid() && (
                      <p className="text-xs text-red-600 mt-1">Ngày kết thúc phải sau ngày bắt đầu</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Filters & Actions */}
              {hasActiveFilters() && (
                 <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-md p-2.5 border border-green-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-1.5 mb-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span className="text-xs font-semibold text-gray-800">Bộ lọc đang áp dụng</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {searchTerm && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            <Search className="h-2.5 w-2.5 mr-1" />
                            &quot;{searchTerm}&quot;
                          </span>
                        )}
                        {filters.deliveryPerson && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
                            Người giao: {filters.deliveryPerson}
                          </span>
                        )}
                        {filters.customer && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1"></div>
                            Khách hàng: {filters.customer}
                          </span>
                        )}
                        {filters.status && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1"></div>
                            Trạng thái: {getStatusText(filters.status)}
                          </span>
                        )}
                        {filters.startDate && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1"></div>
                            Từ: {new Date(filters.startDate).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                        {filters.endDate && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1"></div>
                            Đến: {new Date(filters.endDate).toLocaleDateString('vi-VN')}
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
               <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Hiển thị <span className="font-medium text-gray-900">{filteredCases.length}</span> trong tổng số <span className="font-medium text-gray-900">{cases.length}</span> case
                  {hasActiveFilters() && (
                    <span className="ml-2 text-green-600 font-medium">
                      (đã lọc)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cases Table */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-green-50">
                <tr>
                  <th className="px-2 py-1 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-16">
                    STT
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-32">
                    Người giao hàng
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-48">
                    Khách hàng
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-64">
                    Nội dung giao hàng
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
                    <td colSpan={8} className="px-2 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="h-5 w-5 animate-spin text-green-600" />
                        <span className="text-slate-600">Đang tải danh sách case...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="px-2 py-4 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="text-red-600 text-sm font-medium">
                          Lỗi tải dữ liệu: {error}
                        </div>
                        <button
                          onClick={fetchCases}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
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
                      <td className="px-2 py-1 text-center w-16">
                        <span className="text-sm font-medium text-slate-600">
                          {totalCasesFiltered - ((currentPage - 1) * casesPerPage + index)}
                        </span>
                      </td>
                      
                      {/* Người giao hàng */}
                      <td className="px-2 py-1 w-32">
                        <div>
                          <div className="text-sm text-slate-900">{case_.requester.fullName}</div>
                          <div className="text-xs text-slate-500">{case_.requester.position}</div>
                        </div>
                      </td>

                      {/* Khách hàng */}
                      <td className="px-2 py-1 w-48">
                        <div className="max-w-48">
                          {(() => {
                            const customer = case_.customer;
                            return (
                              <>
                                <div className="text-sm text-slate-900 font-medium truncate" title={customer?.shortName || 'Không xác định'}>
                                  {customer?.shortName || 'Không xác định'}
                          </div>
                                <div className="text-xs text-slate-500 leading-tight mt-1" title={customer?.fullCompanyName || 'Không xác định'}>
                                  {customer?.fullCompanyName || 'Không xác định'}
                          </div>
                              </>
                            );
                          })()}
                        </div>
                      </td>

                      {/* Nội dung giao hàng */}
                      <td className="px-2 py-1 w-64">
                        <div className="max-w-64">
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
                      <td className="px-2 py-1 w-24">
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
                      <td className="px-2 py-1 w-24">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(case_.status)}`}>
                          {getStatusText(case_.status)}
                        </span>
                      </td>

                      {/* Hành động */}
                      <td className="px-2 py-1 text-center w-20">
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
                          
                          {case_.status !== 'COMPLETED' && (
                            <button 
                              onClick={async () => {
                                if (case_.status === 'COMPLETED') {
                                  console.log('Case này đã được đóng rồi!');
                                  return;
                                }

                                if (!confirm(`Bạn có chắc chắn muốn đóng case "${case_.title}"?`)) {
                                  return;
                                }

                                try {
                                  await handleCloseCase(case_.id);
                                } catch (error) {
                                  // Error toast is already handled in handleCloseCase
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
                    <td colSpan={8} className="px-2 py-4 text-center">
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
            <div className="bg-white px-2 sm:px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPagesFiltered}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>

      {/* Create Case Modal */}
      <CreateDeliveryCaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(newCase) => {
          console.log('New case received:', newCase);
          // Transform the new case to match the expected format
          const transformedCase = {
            ...newCase,
            customer: newCase.customer || null // Use customer field directly
          };
          console.log('Transformed case:', transformedCase);
          setCases(prevCases => [transformedCase, ...prevCases]);
          setIsCreateModalOpen(false);
        }}
      />

      {/* Edit Case Modal */}
      <EditDeliveryCaseModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSuccess={handleEditSuccess}
        caseData={selectedCase}
      />
    </div>
  );
}
