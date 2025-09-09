'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Search, Filter, MoreVertical, Eye, Edit, RefreshCw, X, Wrench } from 'lucide-react';
import CreateMaintenanceModal from './CreateMaintenanceModal';
import EditMaintenanceModal from './EditMaintenanceModal';
import ViewMaintenanceModal from './ViewMaintenanceModal';

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
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState<MaintenanceCase | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [maintenanceCases, setMaintenanceCases] = useState<MaintenanceCase[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    handler: '',
    maintenanceType: '',
    equipment: '',
    status: '',
    startDate: '',
    endDate: ''
  });

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

  // Fetch equipment from API
  const fetchEquipment = useCallback(async () => {
    try {
      const response = await fetch('/api/equipment/list', {
        method: 'GET',
        headers: {
          'Cache-Control': 'max-age=300',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setEquipment(data || []);
      } else {
        console.error('Failed to fetch equipment:', response.status, response.statusText);
        setEquipment([]);
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
      setEquipment([]);
    }
  }, []);

  // Refresh maintenance cases
  const refreshMaintenanceCases = async () => {
    setRefreshing(true);
    await fetchMaintenanceCases();
    setRefreshing(false);
  };

  // Handle view modal
  const handleOpenViewModal = (maintenanceData: MaintenanceCase) => {
    setSelectedMaintenance(maintenanceData);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedMaintenance(null);
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
    setMaintenanceCases(prevMaintenance => 
      prevMaintenance.map(maintenance => 
        maintenance.id === updatedMaintenance.id ? updatedMaintenance : maintenance
      )
    );
  };

  // Load maintenance cases and equipment on component mount
  useEffect(() => {
    if (status === 'authenticated') {
      fetchMaintenanceCases();
      fetchEquipment();
    }
  }, [status, fetchMaintenanceCases, fetchEquipment]);

  // Filter maintenance cases based on search term and filters
  const filteredMaintenanceCases = maintenanceCases.filter(maintenance => {
    // Search term filter
    const matchesSearch = searchTerm === '' || (
      maintenance.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maintenance.reporter.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maintenance.handler.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maintenance.maintenanceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maintenance.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Handler filter
    const matchesHandler = filters.handler === '' || 
      maintenance.handler.fullName.toLowerCase().includes(filters.handler.toLowerCase());
    
    // Maintenance type filter
    const matchesMaintenanceType = filters.maintenanceType === '' || 
      maintenance.maintenanceType === filters.maintenanceType;
    
    // Equipment filter
    const matchesEquipment = filters.equipment === '' || 
      maintenance.equipment?.id === filters.equipment;
    
    // Status filter
    const matchesStatus = filters.status === '' || 
      maintenance.status === filters.status;
    
    // Date range filter
    const maintenanceDate = new Date(maintenance.startDate);
    const startDate = filters.startDate ? new Date(filters.startDate) : null;
    const endDate = filters.endDate ? new Date(filters.endDate) : null;
    
    const matchesDateRange = (!startDate || maintenanceDate >= startDate) && 
      (!endDate || maintenanceDate <= endDate);
    
    return matchesSearch && matchesHandler && 
           matchesMaintenanceType && matchesEquipment && matchesStatus && matchesDateRange;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
      case 'Đã lên lịch':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IN_PROGRESS':
      case 'Đang thực hiện':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'COMPLETED':
      case 'Hoàn thành':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
      case 'Hủy':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'PENDING':
      case 'Chờ xử lý':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'Đã lên lịch';
      case 'IN_PROGRESS':
        return 'Đang thực hiện';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'CANCELLED':
        return 'Hủy';
      case 'PENDING':
        return 'Chờ xử lý';
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

  const formatMaintenanceType = (maintenanceType: string) => {
    switch (maintenanceType) {
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
        return maintenanceType;
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
      equipment: '',
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50 p-6 pt-4">
      <div className="max-w-full mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Quản Lý Bảo Trì</h1>
              <p className="text-slate-600">Theo dõi và thực hiện các công việc bảo trì thiết bị</p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:from-orange-700 hover:to-amber-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Wrench className="h-4 w-4" />
              <span>Tạo Case Bảo Trì</span>
            </button>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Search className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Tìm kiếm & Lọc</h3>
                  <p className="text-xs text-gray-600">Tìm kiếm và lọc case bảo trì theo nhiều tiêu chí</p>
                </div>
              </div>
              <button 
                onClick={refreshMaintenanceCases}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50"
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
                    placeholder="Tìm kiếm theo tên case, người xử lý, loại bảo trì..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
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

                  {/* Loại bảo trì */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                        <span>Loại bảo trì</span>
                      </div>
                    </label>
                    <select
                      value={filters.maintenanceType}
                      onChange={(e) => setFilters(prev => ({ ...prev, maintenanceType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                    >
                      <option value="">Tất cả loại bảo trì</option>
                      {getUniqueMaintenanceTypes().map(maintenanceType => (
                        <option key={maintenanceType} value={maintenanceType}>{formatMaintenanceType(maintenanceType)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Thiết bị */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                        <span>Thiết bị</span>
                      </div>
                    </label>
                    <select
                      value={filters.equipment}
                      onChange={(e) => setFilters(prev => ({ ...prev, equipment: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                    >
                      <option value="">Tất cả thiết bị</option>
                      {equipment.map(eq => (
                        <option key={eq.id} value={eq.id}>
                          {eq.name} {eq.model && `(${eq.model})`}
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
                        {filters.equipment && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1"></div>
                            Thiết bị: {equipment.find(eq => eq.id === filters.equipment)?.name || filters.equipment}
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
                  Hiển thị <span className="font-medium text-gray-900">{filteredMaintenanceCases.length}</span> trong tổng số <span className="font-medium text-gray-900">{maintenanceCases.length}</span> case bảo trì
                  {hasActiveFilters() && (
                    <span className="ml-2 text-orange-600 font-medium">
                      (đã lọc)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance Cases Table */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-orange-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    STT
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Người xử lý
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Thiết bị
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Loại bảo trì
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Thông tin Case
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
                    <td colSpan={8} className="px-3 py-8 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="h-5 w-5 animate-spin text-orange-600" />
                        <span className="text-slate-600">Đang tải danh sách case bảo trì...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredMaintenanceCases.length > 0 ? (
                  filteredMaintenanceCases.map((maintenance, index) => (
                    <tr key={maintenance.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                      {/* STT */}
                      <td className="px-3 py-2 text-center">
                        <span className="text-sm font-medium text-slate-600">
                          {index + 1}
                        </span>
                      </td>
                      
                      {/* Người xử lý */}
                      <td className="px-3 py-2">
                        <div>
                          <div className="text-sm text-slate-900">{maintenance.handler.fullName}</div>
                          <div className="text-xs text-slate-500">{maintenance.handler.position}</div>
                        </div>
                      </td>
                      
                      {/* Thiết bị */}
                      <td className="px-3 py-2">
                        <div className="text-sm text-slate-700">
                          {maintenance.equipment ? (
                            <div>
                              <div className="font-medium">{maintenance.equipment.name}</div>
                              <div className="text-xs text-slate-500">
                                {maintenance.equipment.model && `${maintenance.equipment.model}`}
                                {maintenance.equipment.location && ` - ${maintenance.equipment.location}`}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </div>
                      </td>
                      
                      {/* Loại bảo trì */}
                      <td className="px-3 py-2">
                        <div className="text-sm text-slate-700">{formatMaintenanceType(maintenance.maintenanceType)}</div>
                      </td>
                      
                      {/* Thông tin Case */}
                      <td className="px-3 py-2">
                        <div>
                          <div className="text-sm font-medium text-slate-900 mb-1">
                            {maintenance.title}
                          </div>
                          <div className="text-xs text-slate-500 mb-1 line-clamp-2">
                            {maintenance.description}
                          </div>
                          <div className="text-xs text-slate-500">
                            Tạo: {formatDate(maintenance.createdAt)}
                          </div>
                        </div>
                      </td>
                      
                      {/* Trạng thái */}
                      <td className="px-3 py-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(maintenance.status)}`}>
                          {getStatusText(maintenance.status)}
                        </span>
                      </td>
                      
                      {/* Thời gian */}
                      <td className="px-3 py-2">
                        <div className="text-sm text-slate-700">
                          <div>Bắt đầu: {formatDate(maintenance.startDate)}</div>
                          {maintenance.endDate && (
                            <div className="text-slate-500">Kết thúc: {formatDate(maintenance.endDate)}</div>
                          )}
                        </div>
                      </td>
                      
                      {/* Hành động */}
                      <td className="px-3 py-2">
                        <div className="flex items-center space-x-1">
                          <button 
                            onClick={() => handleOpenViewModal(maintenance)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleOpenEditModal(maintenance)}
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
      </div>

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

      {/* View Maintenance Modal */}
      <ViewMaintenanceModal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        maintenanceData={selectedMaintenance}
      />
    </div>
  );
}
