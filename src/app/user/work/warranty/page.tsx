'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Search, Filter, MoreVertical, Eye, Edit, RefreshCw, X, Shield } from 'lucide-react';
import CreateWarrantyModal from './CreateWarrantyModal';
import EditWarrantyModal from './EditWarrantyModal';
import ViewWarrantyModal from './ViewWarrantyModal';

interface Employee {
  id: string;
  fullName: string;
  position: string;
  department: string;
}

interface Warranty {
  id: string;
  title: string;
  description: string;
  reporter: Employee;
  handler: Employee;
  warrantyType: string | { id: string; name: string; description?: string };
  customer?: {
    id: string;
    fullCompanyName: string;
    shortName: string;
    contactPerson?: string;
    contactPhone?: string;
  };
  customerName?: string;
  status: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
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

export default function WarrantyPage() {
  const { data: session, status } = useSession();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedWarranty, setSelectedWarranty] = useState<Warranty | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    handler: '',
    warrantyType: '',
    customer: '',
    status: '',
    startDate: '',
    endDate: ''
  });

  // Fetch warranties from API with caching
  const fetchWarranties = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/warranties', {
        method: 'GET',
        headers: {
          'Cache-Control': 'max-age=60',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Warranties API response:', data);
        setWarranties(data.data || []);
      } else {
        console.error('Failed to fetch warranties:', response.status, response.statusText);
        try {
          const errorData = await response.json();
          console.error('Error details:', errorData);
        } catch (e) {
          console.error('Could not parse error response');
        }
        setWarranties([]);
      }
    } catch (error) {
      console.error('Error fetching warranties:', error);
      setWarranties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch customers from API
  const fetchCustomers = useCallback(async () => {
    try {
      const response = await fetch('/api/partners/list', {
        method: 'GET',
        headers: {
          'Cache-Control': 'max-age=300',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCustomers(data || []);
      } else {
        console.error('Failed to fetch customers:', response.status, response.statusText);
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    }
  }, []);

  // Refresh warranties
  const refreshWarranties = async () => {
    setRefreshing(true);
    await fetchWarranties();
    setRefreshing(false);
  };

  // Handle view modal
  const handleOpenViewModal = (warrantyData: Warranty) => {
    setSelectedWarranty(warrantyData);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedWarranty(null);
  };

  // Handle edit modal
  const handleOpenEditModal = (warrantyData: Warranty) => {
    setSelectedWarranty(warrantyData);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedWarranty(null);
  };

  const handleEditSuccess = (updatedWarranty: Warranty) => {
    setWarranties(prevWarranties => 
      prevWarranties.map(warranty => 
        warranty.id === updatedWarranty.id ? updatedWarranty : warranty
      )
    );
  };

  // Load warranties and customers on component mount
  useEffect(() => {
    if (status === 'authenticated') {
      fetchWarranties();
      fetchCustomers();
    }
  }, [status, fetchWarranties, fetchCustomers]);

  // Filter warranties based on search term and filters
  const filteredWarranties = warranties
    .filter(warranty => {
      // Get warranty type name once
      const warrantyTypeName = typeof warranty.warrantyType === 'string' 
        ? warranty.warrantyType 
        : warranty.warrantyType.name;
      
      // Search term filter
      const matchesSearch = searchTerm === '' || (
        warranty.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        warranty.reporter.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        warranty.handler.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        warrantyTypeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        warranty.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      // Handler filter
      const matchesHandler = filters.handler === '' || 
        warranty.handler.fullName.toLowerCase().includes(filters.handler.toLowerCase());
      
      // Warranty type filter
      const matchesWarrantyType = filters.warrantyType === '' || 
        warrantyTypeName === filters.warrantyType;
      
      // Customer filter
      const matchesCustomer = filters.customer === '' || 
        warranty.customer?.id === filters.customer;
      
      // Status filter
      const matchesStatus = filters.status === '' || 
        warranty.status === filters.status;
      
      // Date range filter
      const warrantyDate = new Date(warranty.startDate);
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;
      
      const matchesDateRange = (!startDate || warrantyDate >= startDate) && 
        (!endDate || warrantyDate <= endDate);
      
      return matchesSearch && matchesHandler && 
             matchesWarrantyType && matchesCustomer && matchesStatus && matchesDateRange;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Sort by newest first

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
      minute: '2-digit'
    });
  };

  const formatWarrantyType = (warrantyType: string | { id: string; name: string; description?: string }) => {
    // Handle object case
    if (typeof warrantyType === 'object' && warrantyType !== null) {
      const typeName = warrantyType.name;
      switch (typeName) {
        case 'hardware-warranty':
          return 'Bảo hành phần cứng';
        case 'software-warranty':
          return 'Bảo hành phần mềm';
        case 'service-warranty':
          return 'Bảo hành dịch vụ';
        case 'extended-warranty':
          return 'Bảo hành mở rộng';
        case 'replacement-warranty':
          return 'Bảo hành thay thế';
        case 'repair-warranty':
          return 'Bảo hành sửa chữa';
        default:
          return typeName;
      }
    }
    
    // Handle string case
    switch (warrantyType) {
      case 'hardware-warranty':
        return 'Bảo hành phần cứng';
      case 'software-warranty':
        return 'Bảo hành phần mềm';
      case 'service-warranty':
        return 'Bảo hành dịch vụ';
      case 'extended-warranty':
        return 'Bảo hành mở rộng';
      case 'replacement-warranty':
        return 'Bảo hành thay thế';
      case 'repair-warranty':
        return 'Bảo hành sửa chữa';
      default:
        return warrantyType;
    }
  };

  // Get unique values for filter dropdowns
  const getUniqueHandlers = () => {
    const handlers = warranties.map(warranty => warranty.handler.fullName);
    return [...new Set(handlers)].sort();
  };

  const getUniqueWarrantyTypes = () => {
    const warrantyTypes = warranties.map(warranty => 
      typeof warranty.warrantyType === 'string' 
        ? warranty.warrantyType 
        : warranty.warrantyType.name
    );
    return [...new Set(warrantyTypes)].sort();
  };

  const getUniqueStatuses = () => {
    const statuses = warranties.map(warranty => warranty.status);
    return [...new Set(statuses)].sort();
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      handler: '',
      warrantyType: '',
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
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Quản Lý Bảo Hành</h1>
              <p className="text-slate-600">Theo dõi và xử lý các case bảo hành sản phẩm và dịch vụ</p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Shield className="h-4 w-4" />
              <span>Tạo Case Bảo Hành</span>
            </button>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Search className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Tìm kiếm & Lọc</h3>
                  <p className="text-xs text-gray-600">Tìm kiếm và lọc case bảo hành theo nhiều tiêu chí</p>
                </div>
              </div>
              <button 
                onClick={refreshWarranties}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
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
                    placeholder="Tìm kiếm theo tên case, người xử lý, loại bảo hành..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                  />
                </div>
              </div>

              {/* Filters Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Bộ lọc
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  {/* Người xử lý */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span>Người xử lý</span>
                      </div>
                    </label>
                    <select
                      value={filters.handler}
                      onChange={(e) => setFilters(prev => ({ ...prev, handler: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                    >
                      <option value="">Tất cả người xử lý</option>
                      {getUniqueHandlers().map(handler => (
                        <option key={handler} value={handler}>{handler}</option>
                      ))}
                    </select>
                  </div>

                  {/* Loại bảo hành */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                        <span>Loại bảo hành</span>
                      </div>
                    </label>
                    <select
                      value={filters.warrantyType}
                      onChange={(e) => setFilters(prev => ({ ...prev, warrantyType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                    >
                      <option value="">Tất cả loại bảo hành</option>
                      {getUniqueWarrantyTypes().map(warrantyType => (
                        <option key={warrantyType} value={warrantyType}>{formatWarrantyType(warrantyType)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Khách hàng */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                        <span>Khách hàng</span>
                      </div>
                    </label>
                    <select
                      value={filters.customer}
                      onChange={(e) => setFilters(prev => ({ ...prev, customer: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                    >
                      <option value="">Tất cả khách hàng</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.fullCompanyName} ({customer.shortName})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Trạng thái */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                        <span>Trạng thái</span>
                      </div>
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
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
                        <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
                        <span>Từ ngày</span>
                      </div>
                    </label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                    />
                  </div>

                  {/* Đến ngày */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div>
                        <span>Đến ngày</span>
                      </div>
                    </label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm ${
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
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md p-2.5 border border-blue-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-1.5 mb-1">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <span className="text-xs font-semibold text-gray-800">Bộ lọc đang áp dụng</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {searchTerm && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
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
                        {filters.warrantyType && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1"></div>
                            Loại: {formatWarrantyType(filters.warrantyType)}
                          </span>
                        )}
                        {filters.customer && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1"></div>
                            Khách hàng: {customers.find(c => c.id === filters.customer)?.fullCompanyName || filters.customer}
                          </span>
                        )}
                        {filters.status && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1"></div>
                            Trạng thái: {getStatusText(filters.status)}
                          </span>
                        )}
                        {filters.startDate && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800 border border-teal-200">
                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-1"></div>
                            Từ: {new Date(filters.startDate).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                        {filters.endDate && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800 border border-cyan-200">
                            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-1"></div>
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
                  Hiển thị <span className="font-medium text-gray-900">{filteredWarranties.length}</span> trong tổng số <span className="font-medium text-gray-900">{warranties.length}</span> case bảo hành
                  {hasActiveFilters() && (
                    <span className="ml-2 text-blue-600 font-medium">
                      (đã lọc)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Warranties Table */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200/50 overflow-hidden">
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
                    Loại bảo hành
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-80">
                    Thông tin Case
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
                    <td colSpan={8} className="px-2 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                        <span className="text-slate-600">Đang tải danh sách case bảo hành...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredWarranties.length > 0 ? (
                  filteredWarranties.map((warranty, index) => (
                    <tr key={warranty.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                      {/* STT */}
                      <td className="px-2 py-1 text-center w-16">
                        <span className="text-sm font-medium text-slate-600">
                          {filteredWarranties.length - index}
                        </span>
                      </td>
                      
                      {/* Người xử lý */}
                      <td className="px-2 py-1 w-32">
                        <div>
                          <div className="text-sm text-slate-900">{warranty.handler.fullName}</div>
                          <div className="text-xs text-slate-500">{warranty.handler.position}</div>
                        </div>
                      </td>
                      
                      {/* Khách hàng */}
                      <td className="px-2 py-1 w-48">
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {warranty.customer ? warranty.customer.shortName : (warranty.customerName || '-')}
                          </div>
                          {warranty.customer && (
                            <div className="text-xs text-slate-500">{warranty.customer.fullCompanyName}</div>
                          )}
                        </div>
                      </td>
                      
                      {/* Loại bảo hành */}
                      <td className="px-2 py-1 w-32">
                        <div className="text-sm text-slate-700">{formatWarrantyType(warranty.warrantyType)}</div>
                      </td>
                      
                      {/* Thông tin Case */}
                      <td className="px-2 py-1 w-80">
                        <div>
                          <div className="text-sm font-medium text-slate-900 mb-1 break-words">
                            {warranty.title}
                          </div>
                          <div className="text-xs text-slate-500 mb-1 break-words">
                            {warranty.description}
                          </div>
                          <div className="text-xs text-slate-500">
                            Tạo: {formatDate(warranty.createdAt)}
                          </div>
                        </div>
                      </td>
                      
                      {/* Trạng thái */}
                      <td className="px-2 py-1 w-24">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(warranty.status)}`}>
                          {getStatusText(warranty.status)}
                        </span>
                      </td>
                      
                      {/* Thời gian */}
                      <td className="px-2 py-1 w-36">
                        <div className="text-sm text-slate-700">
                          <div>Bắt đầu: {formatDate(warranty.startDate)}</div>
                          {warranty.endDate && (
                            <div className="text-slate-500">Kết thúc: {formatDate(warranty.endDate)}</div>
                          )}
                        </div>
                      </td>
                      
                      {/* Hành động */}
                      <td className="px-2 py-1 w-20 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button 
                            onClick={() => handleOpenEditModal(warranty)}
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
                    <td colSpan={8} className="px-2 py-4 text-center">
                      <div className="text-slate-400 mb-4">
                        <Shield className="h-16 w-16 mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 mb-2">Không tìm thấy case bảo hành nào</h3>
                      <p className="text-slate-500">Thử thay đổi từ khóa tìm kiếm hoặc tạo case bảo hành mới</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Warranty Modal */}
      <CreateWarrantyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(newWarranty: any) => {
          setWarranties(prevWarranties => [...prevWarranties, newWarranty as Warranty]);
        }}
      />

      {/* Edit Warranty Modal */}
      <EditWarrantyModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSuccess={handleEditSuccess}
        warrantyData={selectedWarranty}
      />

      {/* View Warranty Modal */}
      <ViewWarrantyModal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        warrantyData={selectedWarranty}
      />
    </div>
  );
}
