'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Search, Filter, MoreVertical, Edit, RefreshCw, X } from 'lucide-react';
import CreateInternalCaseModal from './CreateInternalCaseModal';
import EditInternalCaseModal from './EditInternalCaseModal';

interface Employee {
  id: string;
  fullName: string;
  position: string;
  department: string;
}

interface InternalCase {
  id: string;
  title: string;
  description: string;
  requester: Employee;
  handler: Employee;
  caseType: string;
  form: string;
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

export default function InternalCasePage() {
  const { data: session, status } = useSession();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<InternalCase | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cases, setCases] = useState<InternalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    requester: '',
    handler: '',
    caseType: '',
    status: '',
    startDate: '',
    endDate: ''
  });

  // Fetch internal cases from API with caching
  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/internal-cases', {
        method: 'GET',
        headers: {
          'Cache-Control': 'max-age=60',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCases(data.data || []);
      } else {
        console.error('Failed to fetch cases:', response.status, response.statusText);
        setCases([]);
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since it doesn't depend on any props/state

  // Refresh cases
  const refreshCases = async () => {
    setRefreshing(true);
    await fetchCases();
    setRefreshing(false);
  };

  // Handle edit modal
  const handleOpenEditModal = (caseData: InternalCase) => {
    setSelectedCase(caseData);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedCase(null);
  };

  const handleEditSuccess = (updatedCase: InternalCase) => {
    // Update the case in the current list instead of refetching
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
  }, [status, fetchCases]); // Include fetchCases in dependencies

  // Filter and sort cases based on search term and filters
  const filteredCases = cases
    .filter(case_ => {
      // Search term filter
      const matchesSearch = searchTerm === '' || (
      case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.requester.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.handler.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.caseType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      // Requester filter
      const matchesRequester = filters.requester === '' || 
        case_.requester.fullName.toLowerCase().includes(filters.requester.toLowerCase());
      
      // Handler filter
      const matchesHandler = filters.handler === '' || 
        case_.handler.fullName.toLowerCase().includes(filters.handler.toLowerCase());
      
      // Case type filter
      const matchesCaseType = filters.caseType === '' || 
        case_.caseType === filters.caseType;
      
      // Status filter
      const matchesStatus = filters.status === '' || 
        case_.status === filters.status;
      
      // Date range filter
      const caseDate = new Date(case_.startDate);
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;
      
      const matchesDateRange = (!startDate || caseDate >= startDate) && 
        (!endDate || caseDate <= endDate);
      
      return matchesSearch && matchesRequester && matchesHandler && 
             matchesCaseType && matchesStatus && matchesDateRange;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Sort by newest first

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
      case 'IN_PROGRESS':
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

  const formatCaseType = (caseType: string) => {
    switch (caseType) {
      case 'cai-dat-phan-mem':
        return 'Cài đặt phần mềm';
      case 'bao-tri':
        return 'Bảo trì';
      case 'kiem-tra-bao-mat':
        return 'Kiểm tra bảo mật';
      case 'cai-dat-thiet-bi':
        return 'Cài đặt thiết bị';
      case 'ho-tro-ky-thuat':
        return 'Hỗ trợ kỹ thuật';
      default:
        return caseType;
    }
  };

  // Get unique values for filter dropdowns
  const getUniqueRequesters = () => {
    const requesters = cases.map(case_ => case_.requester.fullName);
    return [...new Set(requesters)].sort();
  };

  const getUniqueHandlers = () => {
    const handlers = cases.map(case_ => case_.handler.fullName);
    return [...new Set(handlers)].sort();
  };

  const getUniqueCaseTypes = () => {
    const caseTypes = cases.map(case_ => case_.caseType);
    return [...new Set(caseTypes)].sort();
  };

  const getUniqueStatuses = () => {
    const statuses = cases.map(case_ => case_.status);
    return [...new Set(statuses)].sort();
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      requester: '',
      handler: '',
      caseType: '',
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
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Case Nội Bộ</h1>
              <p className="text-slate-600">Quản lý và theo dõi các case nội bộ của công ty</p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Plus className="h-4 w-4" />
              <span>Tạo Case Nội Bộ</span>
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
                  <p className="text-xs text-gray-600">Tìm kiếm và lọc case nội bộ theo nhiều tiêu chí</p>
              </div>
            </div>
              <button 
                onClick={refreshCases}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Làm mới</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="space-y-3">
              {/* Search Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tìm kiếm
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên case, người yêu cầu, người xử lý, loại case..."
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-2">
                  {/* Người yêu cầu */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-0.5">
                      <div className="flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <span>Yêu cầu</span>
                      </div>
                    </label>
                    <select
                      value={filters.requester}
                      onChange={(e) => setFilters(prev => ({ ...prev, requester: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                    >
                      <option value="">Tất cả người yêu cầu</option>
                      {getUniqueRequesters().map(requester => (
                        <option key={requester} value={requester}>{requester}</option>
                      ))}
                    </select>
                  </div>

                  {/* Người xử lý */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-0.5">
                      <div className="flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span>Xử lý</span>
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

                  {/* Loại case */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-0.5">
                      <div className="flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                        <span>Loại</span>
                      </div>
                    </label>
                    <select
                      value={filters.caseType}
                      onChange={(e) => setFilters(prev => ({ ...prev, caseType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                    >
                      <option value="">Tất cả loại case</option>
                      {getUniqueCaseTypes().map(caseType => (
                        <option key={caseType} value={caseType}>{formatCaseType(caseType)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Trạng thái */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-0.5">
                      <div className="flex items-center space-x-1">
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
                    <label className="block text-xs font-medium text-gray-600 mb-0.5">
                      <div className="flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                        <span>Từ</span>
                      </div>
                    </label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                    />
                  </div>

                  {/* Đến ngày */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-0.5">
                      <div className="flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
                        <span>Đến</span>
                      </div>
                    </label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm ${
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
                        {filters.requester && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1"></div>
                            Yêu cầu: {filters.requester}
                          </span>
                        )}
                        {filters.handler && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
                            Xử lý: {filters.handler}
                          </span>
                        )}
                        {filters.caseType && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1"></div>
                            Loại: {formatCaseType(filters.caseType)}
                          </span>
                        )}
                        {filters.status && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1"></div>
                            Trạng thái: {getStatusText(filters.status)}
                          </span>
                        )}
                        {filters.startDate && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1"></div>
                            Từ: {new Date(filters.startDate).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                        {filters.endDate && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800 border border-teal-200">
                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-1"></div>
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
                    <span className="ml-2 text-blue-600 font-medium">
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
              <thead className="bg-gradient-to-r from-slate-50 to-blue-50">
                <tr>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    STT
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Thông tin Case
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Người yêu cầu
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Người xử lý
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Loại case
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
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
                ) : filteredCases.length > 0 ? (
                  filteredCases.map((case_, index) => (
                    <tr key={case_.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                      <td className="px-3 py-2 text-center">
                        <span className="text-sm font-medium text-slate-600">
                          {filteredCases.length - index}
                        </span>
                      </td>
                      <td className="px-3 py-2">
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
                      <td className="px-3 py-2">
                        <div>
                          <div className="text-sm text-slate-900">{case_.requester.fullName}</div>
                          <div className="text-xs text-slate-500">{case_.requester.position}</div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div>
                          <div className="text-sm text-slate-900">{case_.handler.fullName}</div>
                          <div className="text-xs text-slate-500">{case_.handler.position}</div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-sm text-slate-700">{formatCaseType(case_.caseType)}</div>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(case_.status)}`}>
                          {getStatusText(case_.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-sm text-slate-700">
                          <div>Bắt đầu: {formatDate(case_.startDate)}</div>
                          {case_.endDate && (
                            <div className="text-slate-500">Kết thúc: {formatDate(case_.endDate)}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
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
                    <td colSpan={8} className="px-3 py-8 text-center">
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
      <CreateInternalCaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(newCase: any) => {
          // Add new case to the beginning of the list (since we sort by newest first)
          setCases(prevCases => [newCase as InternalCase, ...prevCases]);
        }}
      />

      {/* Edit Case Modal */}
      <EditInternalCaseModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSuccess={handleEditSuccess}
        caseData={selectedCase}
      />
    </div>
  );
}
