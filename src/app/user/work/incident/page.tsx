'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Search, Filter, MoreVertical, Eye, Edit, RefreshCw, X, AlertTriangle } from 'lucide-react';
import CreateIncidentModal from './CreateIncidentModal';
import EditIncidentModal from './EditIncidentModal';
import ViewIncidentModal from './ViewIncidentModal';

interface Employee {
  id: string;
  fullName: string;
  position: string;
  department: string;
}

interface Incident {
  id: string;
  title: string;
  description: string;
  reporter: Employee;
  handler: Employee;
  incidentType: string;
  priority: string;
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

export default function IncidentPage() {
  const { data: session, status } = useSession();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    reporter: '',
    handler: '',
    incidentType: '',
    priority: '',
    status: '',
    startDate: '',
    endDate: ''
  });

  // Fetch incidents from API with caching
  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/incidents', {
        method: 'GET',
        headers: {
          'Cache-Control': 'max-age=60',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setIncidents(data.data || []);
      } else {
        console.error('Failed to fetch incidents:', response.status, response.statusText);
        setIncidents([]);
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh incidents
  const refreshIncidents = async () => {
    setRefreshing(true);
    await fetchIncidents();
    setRefreshing(false);
  };

  // Handle view modal
  const handleOpenViewModal = (incidentData: Incident) => {
    setSelectedIncident(incidentData);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedIncident(null);
  };

  // Handle edit modal
  const handleOpenEditModal = (incidentData: Incident) => {
    setSelectedIncident(incidentData);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedIncident(null);
  };

  const handleEditSuccess = (updatedIncident: Incident) => {
    setIncidents(prevIncidents => 
      prevIncidents.map(incident => 
        incident.id === updatedIncident.id ? updatedIncident : incident
      )
    );
  };

  // Load incidents on component mount
  useEffect(() => {
    if (status === 'authenticated') {
      fetchIncidents();
    }
  }, [status, fetchIncidents]);

  // Filter incidents based on search term and filters
  const filteredIncidents = incidents.filter(incident => {
    // Search term filter
    const matchesSearch = searchTerm === '' || (
      incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.reporter.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.handler.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.incidentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Reporter filter
    const matchesReporter = filters.reporter === '' || 
      incident.reporter.fullName.toLowerCase().includes(filters.reporter.toLowerCase());
    
    // Handler filter
    const matchesHandler = filters.handler === '' || 
      incident.handler.fullName.toLowerCase().includes(filters.handler.toLowerCase());
    
    // Incident type filter
    const matchesIncidentType = filters.incidentType === '' || 
      incident.incidentType === filters.incidentType;
    
    // Priority filter
    const matchesPriority = filters.priority === '' || 
      incident.priority === filters.priority;
    
    // Status filter
    const matchesStatus = filters.status === '' || 
      incident.status === filters.status;
    
    // Date range filter
    const incidentDate = new Date(incident.startDate);
    const startDate = filters.startDate ? new Date(filters.startDate) : null;
    const endDate = filters.endDate ? new Date(filters.endDate) : null;
    
    const matchesDateRange = (!startDate || incidentDate >= startDate) && 
      (!endDate || incidentDate <= endDate);
    
    return matchesSearch && matchesReporter && matchesHandler && 
           matchesIncidentType && matchesPriority && matchesStatus && matchesDateRange;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REPORTED':
      case 'Báo cáo':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'INVESTIGATING':
      case 'Đang điều tra':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'RESOLVED':
      case 'Đã giải quyết':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CLOSED':
      case 'Đóng':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'ESCALATED':
      case 'Nâng cấp':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'REPORTED':
        return 'Báo cáo';
      case 'INVESTIGATING':
        return 'Đang điều tra';
      case 'RESOLVED':
        return 'Đã giải quyết';
      case 'CLOSED':
        return 'Đóng';
      case 'ESCALATED':
        return 'Nâng cấp';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
      case 'Nghiêm trọng':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
      case 'Cao':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM':
      case 'Trung bình':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
      case 'Thấp':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'Nghiêm trọng';
      case 'HIGH':
        return 'Cao';
      case 'MEDIUM':
        return 'Trung bình';
      case 'LOW':
        return 'Thấp';
      default:
        return priority;
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

  const formatIncidentType = (incidentType: string) => {
    switch (incidentType) {
      case 'security-breach':
        return 'Vi phạm bảo mật';
      case 'system-failure':
        return 'Lỗi hệ thống';
      case 'data-loss':
        return 'Mất dữ liệu';
      case 'network-issue':
        return 'Sự cố mạng';
      case 'hardware-failure':
        return 'Lỗi phần cứng';
      case 'software-bug':
        return 'Lỗi phần mềm';
      default:
        return incidentType;
    }
  };

  // Get unique values for filter dropdowns
  const getUniqueReporters = () => {
    const reporters = incidents.map(incident => incident.reporter.fullName);
    return [...new Set(reporters)].sort();
  };

  const getUniqueHandlers = () => {
    const handlers = incidents.map(incident => incident.handler.fullName);
    return [...new Set(handlers)].sort();
  };

  const getUniqueIncidentTypes = () => {
    const incidentTypes = incidents.map(incident => incident.incidentType);
    return [...new Set(incidentTypes)].sort();
  };

  const getUniquePriorities = () => {
    const priorities = incidents.map(incident => incident.priority);
    return [...new Set(priorities)].sort();
  };

  const getUniqueStatuses = () => {
    const statuses = incidents.map(incident => incident.status);
    return [...new Set(statuses)].sort();
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      reporter: '',
      handler: '',
      incidentType: '',
      priority: '',
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 p-6 pt-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Quản Lý Sự Cố</h1>
              <p className="text-slate-600">Theo dõi và xử lý các sự cố bảo mật và hệ thống</p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-md font-medium hover:from-red-700 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <AlertTriangle className="h-5 w-5" />
              <span>Báo Cáo Sự Cố</span>
            </button>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Search className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Tìm kiếm & Lọc</h3>
                  <p className="text-xs text-gray-600">Tìm kiếm và lọc sự cố theo nhiều tiêu chí</p>
                </div>
              </div>
              <button 
                onClick={refreshIncidents}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
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
                    placeholder="Tìm kiếm theo tên sự cố, người báo cáo, người xử lý, loại sự cố..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                  />
                </div>
              </div>

              {/* Filters Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Bộ lọc
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                  {/* Người báo cáo */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                        <span>Người báo cáo</span>
                      </div>
                    </label>
                    <select
                      value={filters.reporter}
                      onChange={(e) => setFilters(prev => ({ ...prev, reporter: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                    >
                      <option value="">Tất cả người báo cáo</option>
                      {getUniqueReporters().map(reporter => (
                        <option key={reporter} value={reporter}>{reporter}</option>
                      ))}
                    </select>
                  </div>

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

                  {/* Loại sự cố */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                        <span>Loại sự cố</span>
                      </div>
                    </label>
                    <select
                      value={filters.incidentType}
                      onChange={(e) => setFilters(prev => ({ ...prev, incidentType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                    >
                      <option value="">Tất cả loại sự cố</option>
                      {getUniqueIncidentTypes().map(incidentType => (
                        <option key={incidentType} value={incidentType}>{formatIncidentType(incidentType)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Mức độ ưu tiên */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                        <span>Mức độ ưu tiên</span>
                      </div>
                    </label>
                    <select
                      value={filters.priority}
                      onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                    >
                      <option value="">Tất cả mức độ</option>
                      {getUniquePriorities().map(priority => (
                        <option key={priority} value={priority}>{getPriorityText(priority)}</option>
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
                <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-md p-2.5 border border-red-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-1.5 mb-1">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                        <span className="text-xs font-semibold text-gray-800">Bộ lọc đang áp dụng</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {searchTerm && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                            <Search className="h-2.5 w-2.5 mr-1" />
                            &quot;{searchTerm}&quot;
                          </span>
                        )}
                        {filters.reporter && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1"></div>
                            Báo cáo: {filters.reporter}
                          </span>
                        )}
                        {filters.handler && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
                            Xử lý: {filters.handler}
                          </span>
                        )}
                        {filters.incidentType && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1"></div>
                            Loại: {formatIncidentType(filters.incidentType)}
                          </span>
                        )}
                        {filters.priority && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1"></div>
                            Ưu tiên: {getPriorityText(filters.priority)}
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
                  Hiển thị <span className="font-medium text-gray-900">{filteredIncidents.length}</span> trong tổng số <span className="font-medium text-gray-900">{incidents.length}</span> sự cố
                  {hasActiveFilters() && (
                    <span className="ml-2 text-red-600 font-medium">
                      (đã lọc)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Incidents Table */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-red-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    STT
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Thông tin Sự cố
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Người báo cáo
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Người xử lý
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Loại sự cố
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Mức độ ưu tiên
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="h-5 w-5 animate-spin text-red-600" />
                        <span className="text-slate-600">Đang tải danh sách sự cố...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredIncidents.length > 0 ? (
                  filteredIncidents.map((incident, index) => (
                    <tr key={incident.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                      <td className="px-3 py-2 text-center">
                        <span className="text-sm font-medium text-slate-600">
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div>
                          <div className="text-sm font-medium text-slate-900 mb-1">
                            {incident.title}
                          </div>
                          <div className="text-xs text-slate-500 mb-1 line-clamp-2">
                            {incident.description}
                          </div>
                          <div className="text-xs text-slate-500">
                            Tạo: {formatDate(incident.createdAt)}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div>
                          <div className="text-sm text-slate-900">{incident.reporter.fullName}</div>
                          <div className="text-xs text-slate-500">{incident.reporter.position}</div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div>
                          <div className="text-sm text-slate-900">{incident.handler.fullName}</div>
                          <div className="text-xs text-slate-500">{incident.handler.position}</div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-sm text-slate-700">{formatIncidentType(incident.incidentType)}</div>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${getPriorityColor(incident.priority)}`}>
                          {getPriorityText(incident.priority)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(incident.status)}`}>
                          {getStatusText(incident.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-sm text-slate-700">
                          <div>Bắt đầu: {formatDate(incident.startDate)}</div>
                          {incident.endDate && (
                            <div className="text-slate-500">Kết thúc: {formatDate(incident.endDate)}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center space-x-1">
                          <button 
                            onClick={() => handleOpenViewModal(incident)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleOpenEditModal(incident)}
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
                    <td colSpan={9} className="px-3 py-8 text-center">
                      <div className="text-slate-400 mb-4">
                        <AlertTriangle className="h-16 w-16 mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 mb-2">Không tìm thấy sự cố nào</h3>
                      <p className="text-slate-500">Thử thay đổi từ khóa tìm kiếm hoặc báo cáo sự cố mới</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Incident Modal */}
      <CreateIncidentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(newIncident: any) => {
          setIncidents(prevIncidents => [...prevIncidents, newIncident as Incident]);
        }}
      />

      {/* Edit Incident Modal */}
      <EditIncidentModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSuccess={handleEditSuccess}
        incidentData={selectedIncident}
      />

      {/* View Incident Modal */}
      <ViewIncidentModal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        incidentData={selectedIncident}
      />
    </div>
  );
}
