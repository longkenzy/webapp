'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Search, RefreshCw, X, ChevronDown, User, Building2, Calendar, Settings } from 'lucide-react';
import CreateInternalCaseModal from './CreateInternalCaseModal';
import EditInternalCaseModal from './EditInternalCaseModal';
import InternalCaseRow from './InternalCaseRow';
import InternalCaseCard from './InternalCaseCard';
import { useInternalCases } from '@/hooks/useInternalCases';

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
  const [showFilters, setShowFilters] = useState(false);
  
  // Use optimized hook
  const {
    internalCases: cases,
    filteredCases,
    paginatedCases,
    loading,
    refreshing,
    searchTerm,
    setSearchTerm,
    selectedHandler,
    setSelectedHandler,
    selectedRequester,
    setSelectedRequester,
    selectedCaseType,
    setSelectedCaseType,
    selectedStatus,
    setSelectedStatus,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    fetchInternalCases,
    refreshInternalCases,
    clearFilters,
    uniqueHandlers,
    uniqueRequesters,
    uniqueCaseTypes,
    uniqueStatuses,
    // Pagination
    currentPage,
    totalPages,
    totalCases,
    casesPerPage,
    goToPage,
    goToNextPage,
    goToPrevPage,
    // Optimistic updates
    addCase,
    closeCase,
  } = useInternalCases();

  // Memoized filter summary
  const filterSummary = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedHandler) count++;
    if (selectedRequester) count++;
    if (selectedCaseType) count++;
    if (selectedStatus) count++;
    if (dateFrom) count++;
    if (dateTo) count++;
    
    return {
      hasActiveFilters: count > 0,
      filterCount: count,
      isDateRangeValid: !dateFrom || !dateTo || new Date(dateFrom) <= new Date(dateTo)
    };
  }, [searchTerm, selectedHandler, selectedRequester, selectedCaseType, selectedStatus, dateFrom, dateTo]);

  // Handle edit modal
  const handleOpenEditModal = useCallback((caseData: InternalCase) => {
    setSelectedCase(caseData);
    setIsEditModalOpen(true);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setSelectedCase(null);
  }, []);

  const handleEditSuccess = useCallback(async (updatedCase: InternalCase) => {
    // Refresh cases to get updated data without showing loading
    await fetchInternalCases(0, false);
  }, [fetchInternalCases]);

  const handleCloseCase = useCallback(async (caseId: string) => {
    try {
      // Use optimistic update from hook - UI updates immediately
      return await closeCase(caseId);
    } catch (error) {
      console.error('Error closing case:', error);
      throw error;
    }
  }, [closeCase]);

  // Load cases on component mount
  useEffect(() => {
    if (status === 'authenticated') {
      fetchInternalCases();
    }
  }, [status, fetchInternalCases]);

  // Memoized utility functions
  const getStatusColor = useCallback((status: string) => {
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
  }, []);

  const getStatusText = useCallback((status: string) => {
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
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Ho_Chi_Minh'
    });
  }, []);

  const formatCaseType = useCallback((caseType: string) => {
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
  }, []);


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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-2 md:p-6">
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

      <div className="max-w-full mx-auto px-1 md:px-4">
        {/* Header - Responsive */}
        <div className="mb-3 md:mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-slate-900 mb-1 md:mb-2">Case Nội Bộ</h1>
              <p className="text-xs md:text-sm text-slate-600 hidden md:block">Quản lý và theo dõi các case nội bộ của công ty</p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1 md:gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-2.5 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Tạo Case Nội Bộ</span>
              <span className="sm:hidden">Tạo</span>
            </button>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-3 md:mb-4">
          {/* Mobile: Collapsible Header */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden w-full flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors rounded-t-lg cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-800">Tìm kiếm & Bộ lọc</span>
              {filterSummary.filterCount > 0 && (
                <span className="bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {filterSummary.filterCount}
                </span>
              )}
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Desktop: Static Header */}
          <div className="hidden md:block bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
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
                onClick={refreshInternalCases}
                disabled={refreshing}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs sm:text-sm"
              >
                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Làm mới</span>
                <span className="sm:hidden">Mới</span>
              </button>
            </div>
          </div>

          {/* Content - Collapsible on mobile */}
          <div className={`p-3 md:p-4 ${showFilters ? 'block' : 'hidden md:block'}`}>
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
                      Yêu cầu
                    </label>
                    <select
                      value={selectedRequester}
                      onChange={(e) => setSelectedRequester(e.target.value)}
                      className="w-full px-2.5 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white text-xs md:text-sm"
                    >
                      <option value="">Tất cả</option>
                      {uniqueRequesters.map(requester => (
                        <option key={requester.id} value={requester.id}>{requester.fullName}</option>
                      ))}
                    </select>
                  </div>

                  {/* Người xử lý */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-0.5">
                      Xử lý
                    </label>
                    <select
                      value={selectedHandler}
                      onChange={(e) => setSelectedHandler(e.target.value)}
                      className="w-full px-2.5 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 focus:bg-white text-xs md:text-sm"
                    >
                      <option value="">Tất cả</option>
                      {uniqueHandlers.map(handler => (
                        <option key={handler.id} value={handler.id}>{handler.fullName}</option>
                      ))}
                    </select>
                  </div>

                  {/* Loại case */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-0.5">
                      Loại
                    </label>
                    <select
                      value={selectedCaseType}
                      onChange={(e) => setSelectedCaseType(e.target.value)}
                      className="w-full px-2.5 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-gray-50 focus:bg-white text-xs md:text-sm"
                    >
                      <option value="">Tất cả</option>
                      {uniqueCaseTypes.map(caseType => (
                        <option key={caseType} value={caseType}>{caseType}</option>
                      ))}
                    </select>
                  </div>

                  {/* Trạng thái */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-0.5">
                      Trạng thái
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-2.5 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 focus:bg-white text-xs md:text-sm"
                    >
                      <option value="">Tất cả</option>
                      {uniqueStatuses.map(status => (
                        <option key={status} value={status}>{getStatusText(status)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Từ ngày */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-0.5">
                      Từ
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-2.5 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white text-xs md:text-sm"
                    />
                  </div>

                  {/* Đến ngày */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-0.5">
                      Đến
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className={`w-full px-2.5 md:px-3 py-1.5 md:py-2 border rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-gray-50 focus:bg-white text-xs md:text-sm ${
                        !filterSummary.isDateRangeValid ? 'border-red-300' : 'border-gray-200'
                      }`}
                    />
                    {!filterSummary.isDateRangeValid && (
                      <p className="text-xs text-red-600 mt-1">Ngày kết thúc phải sau ngày bắt đầu</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Filters & Actions */}
              {filterSummary.hasActiveFilters && (
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
                        {selectedHandler && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
                            Xử lý: {uniqueHandlers.find(h => h.id === selectedHandler)?.fullName}
                          </span>
                        )}
                        {selectedStatus && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1"></div>
                            Trạng thái: {getStatusText(selectedStatus)}
                          </span>
                        )}
                        {dateFrom && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1"></div>
                            Từ: {new Date(dateFrom + 'T00:00:00').toLocaleDateString('vi-VN')}
                          </span>
                        )}
                        {dateTo && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800 border border-teal-200">
                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-1"></div>
                            Đến: {new Date(dateTo + 'T00:00:00').toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={clearFilters}
                        className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-md transition-colors cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                        <span>Xóa tất cả</span>
              </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Results Summary - Simplified on mobile */}
              <div className="flex items-center justify-between pt-2 md:pt-3 border-t border-gray-200">
                <div className="text-xs md:text-sm text-gray-600">
                  <span className="md:hidden">{filteredCases.length} / {totalCases} case</span>
                  <span className="hidden md:inline">
                    Trang {currentPage} / {totalPages} - Hiển thị <span className="font-medium text-gray-900">{filteredCases.length}</span> case
                    {filterSummary.hasActiveFilters && (
                      <span className="ml-2 text-blue-600 font-medium">
                        (đã lọc)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cases Display - Responsive */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200/50 overflow-hidden">
          {/* Mobile Card Layout */}
          <div className="block sm:hidden p-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="text-slate-600">Đang tải danh sách case...</span>
                </div>
              </div>
            ) : paginatedCases.length > 0 ? (
              <div className="space-y-3">
                {paginatedCases.map((case_, index) => {
                  // Calculate correct STT based on filtered results
                  const actualIndex = totalCases - ((currentPage - 1) * casesPerPage + index);
                  return (
                    <InternalCaseCard
                      key={case_.id}
                      case_={case_}
                      index={actualIndex}
                      onEdit={handleOpenEditModal}
                      onClose={handleCloseCase}
                      getStatusColor={getStatusColor}
                      getStatusText={getStatusText}
                      formatDate={formatDate}
                      formatCaseType={formatCaseType}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center">
                <div className="text-slate-400 mb-4">
                  <Search className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">Không tìm thấy case nào</h3>
                <p className="text-slate-500">Thử thay đổi từ khóa tìm kiếm hoặc tạo case mới</p>
              </div>
            )}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden sm:block overflow-x-auto -mx-1 sm:mx-0">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-blue-50">
                <tr>
                  <th className="px-2 sm:px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    STT
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Thông tin Case
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Ghi chú
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Người yêu cầu
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Người xử lý
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Loại case
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                        <span className="text-slate-600">Đang tải danh sách case...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedCases.length > 0 ? (
                  paginatedCases.map((case_, index) => {
                    // Calculate correct STT based on filtered results
                    const actualIndex = totalCases - ((currentPage - 1) * casesPerPage + index);
                    return (
                      <InternalCaseRow
                        key={case_.id}
                        case_={case_}
                        index={actualIndex}
                        onEdit={handleOpenEditModal}
                        onClose={handleCloseCase}
                        getStatusColor={getStatusColor}
                        getStatusText={getStatusText}
                        formatDate={formatDate}
                        formatCaseType={formatCaseType}
                      />
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center">
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
          
          {/* Pagination - Desktop style on both mobile and desktop */}
          {totalPages > 1 && (
            <div className="bg-white px-2 md:px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="flex-1 flex items-center justify-between md:justify-between">
                <div className="hidden md:block">
                  <p className="text-sm text-gray-700">
                    Hiển thị{' '}
                    <span className="font-medium">{(currentPage - 1) * casesPerPage + 1}</span>
                    {' '}đến{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * casesPerPage, totalCases)}
                    </span>
                    {' '}của{' '}
                    <span className="font-medium">{totalCases}</span>
                    {' '}kết quả
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={goToPrevPage}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-1.5 md:px-2 py-1.5 md:py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                          className={`relative inline-flex items-center px-2.5 md:px-4 py-1.5 md:py-2 border text-xs md:text-sm font-medium cursor-pointer ${
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
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-1.5 md:px-2 py-1.5 md:py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
      </div>

      {/* Create Case Modal */}
      <CreateInternalCaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(newCase) => {
          // Use optimistic update - add case immediately to UI
          if (newCase) {
            // Convert null to undefined for type compatibility
            const caseToAdd = {
              ...newCase,
              endDate: newCase.endDate ?? undefined,
              notes: newCase.notes ?? undefined,
              userDifficultyLevel: newCase.userDifficultyLevel ?? undefined,
              userEstimatedTime: newCase.userEstimatedTime ?? undefined,
              userImpactLevel: newCase.userImpactLevel ?? undefined,
              userUrgencyLevel: newCase.userUrgencyLevel ?? undefined,
              userFormScore: newCase.userFormScore ?? undefined,
              userAssessmentDate: newCase.userAssessmentDate ?? undefined,
              adminDifficultyLevel: newCase.adminDifficultyLevel ?? undefined,
              adminEstimatedTime: newCase.adminEstimatedTime ?? undefined,
              adminImpactLevel: newCase.adminImpactLevel ?? undefined,
              adminUrgencyLevel: newCase.adminUrgencyLevel ?? undefined,
              adminAssessmentDate: newCase.adminAssessmentDate ?? undefined,
              adminAssessmentNotes: newCase.adminAssessmentNotes ?? undefined,
            } as InternalCase;
            addCase(caseToAdd);
          }
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
