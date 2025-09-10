'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Search, Filter, Eye, Edit, RefreshCw, Package, X } from 'lucide-react';
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
      const response = await fetch('/api/delivery-cases', {
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
                  <th className="px-2 py-1 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-28">
                    Thời gian
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
                    <td colSpan={7} className="px-2 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="h-5 w-5 animate-spin text-green-600" />
                        <span className="text-slate-600">Đang tải danh sách case...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-2 py-4 text-center">
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
                ) : filteredCases.length > 0 ? (
                  filteredCases.map((case_, index) => (
                    <tr key={case_.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                      {/* STT */}
                      <td className="px-2 py-1 text-center w-16">
                        <span className="text-sm font-medium text-slate-600">
                          {filteredCases.length - index}
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
                                <div className="space-y-1">
                                  {products.map((product, idx) => (
                                    <div key={product.id} className="text-sm text-slate-900">
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
                                <div className="text-sm text-slate-500 italic">
                                  {case_.description || 'Không có mô tả sản phẩm'}
                                </div>
                              );
                            }
                          })()}
                        </div>
                      </td>

                      {/* Thời gian */}
                      <td className="px-2 py-1 w-28">
                        <div className="text-sm text-slate-700">
                          <div>Bắt đầu: {formatDate(case_.startDate)}</div>
                          {case_.endDate && (
                            <div className="text-slate-500">Kết thúc: {formatDate(case_.endDate)}</div>
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
                          <button 
                            onClick={() => handleOpenEditModal(case_)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors duration-200"
                            title="Chỉnh sửa"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-2 py-4 text-center">
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
