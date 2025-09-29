'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Search, Filter, MoreVertical, Edit, RefreshCw, X, AlertTriangle, Check } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import CreateIncidentModal from './CreateIncidentModal';
import EditIncidentModal from './EditIncidentModal';

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
  reporter?: Employee;
  handler: Employee;
  incidentType: string;
  customerName?: string; // Thêm trường customerName
  customer?: {
    id: string;
    fullCompanyName: string;
    shortName: string;
    contactPerson?: string;
    contactPhone?: string;
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

export default function IncidentPage() {
  const { data: session, status } = useSession();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [closingCaseId, setClosingCaseId] = useState<string | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [casesPerPage] = useState(10);
  
  // Filter states
  const [filters, setFilters] = useState({
    handler: '',
    incidentType: '',
    customer: '',
    status: '',
    startDate: '',
    endDate: ''
  });

  // Fetch incidents from API with caching
  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/incidents?page=1&limit=100', {
        method: 'GET',
        headers: {
          'Cache-Control': 'max-age=60',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Incidents API response:', data);
        console.log('Number of incidents fetched:', data.data?.length || 0);
        setIncidents(data.data || []);
      } else {
        console.error('Failed to fetch incidents:', response.status, response.statusText);
        try {
          const errorData = await response.json();
          console.error('Error details:', errorData);
        } catch (e) {
          console.error('Could not parse error response');
        }
        setIncidents([]);
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
      setIncidents([]);
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

  // Refresh incidents
  const refreshIncidents = async () => {
    setRefreshing(true);
    await fetchIncidents();
    setRefreshing(false);
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

  const handleCloseCase = async (caseId: string) => {
    if (!confirm('Bạn có chắc chắn muốn đóng case này?')) {
      return;
    }

    try {
      setClosingCaseId(caseId);
      
      const response = await fetch(`/api/incidents/${caseId}/close`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Case đã được đóng thành công!');
        // Optimistic update - update the case status locally
        setIncidents(prevIncidents => 
          prevIncidents.map(incident => 
            incident.id === caseId 
              ? { ...incident, status: 'COMPLETED', endDate: new Date().toISOString() }
              : incident
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

  // Load incidents and customers on component mount
  useEffect(() => {
    if (status === 'authenticated') {
      fetchIncidents();
      fetchCustomers();
    }
  }, [status, fetchIncidents, fetchCustomers]);

  // Close customer dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.customer-dropdown-container')) {
        setIsCustomerDropdownOpen(false);
      }
    };

    if (isCustomerDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCustomerDropdownOpen]);

  // Filter incidents based on search term and filters
  const filteredIncidents = incidents.filter(incident => {
    // Search term filter
    const matchesSearch = searchTerm === '' || (
      incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (incident.reporter?.fullName && incident.reporter.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (incident.handler?.fullName && incident.handler.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      incident.incidentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Handler filter
    const matchesHandler = filters.handler === '' || 
      (incident.handler?.fullName && incident.handler.fullName.toLowerCase().includes(filters.handler.toLowerCase()));
    
    // Incident type filter
    const matchesIncidentType = filters.incidentType === '' || 
      incident.incidentType === filters.incidentType;
    
    // Customer filter
    const matchesCustomer = filters.customer === '' || 
      incident.customer?.id === filters.customer;
    
    // Status filter
    const matchesStatus = filters.status === '' || 
      incident.status === filters.status;
    
    // Date range filter
    const incidentDate = new Date(incident.startDate);
    const startDate = filters.startDate ? new Date(filters.startDate) : null;
    const endDate = filters.endDate ? new Date(filters.endDate) : null;
    
    const matchesDateRange = (!startDate || incidentDate >= startDate) && 
      (!endDate || incidentDate <= endDate);
    
    return matchesSearch && matchesHandler && 
           matchesIncidentType && matchesCustomer && matchesStatus && matchesDateRange;
  });

  // Pagination logic
  const totalCases = filteredIncidents.length;
  const totalPages = Math.ceil(totalCases / casesPerPage);
  const startIndex = (currentPage - 1) * casesPerPage;
  const endIndex = startIndex + casesPerPage;
  const paginatedIncidents = filteredIncidents.slice(startIndex, endIndex);

  // Debug pagination
  console.log('Pagination Debug:', {
    totalIncidents: incidents.length,
    filteredIncidents: filteredIncidents.length,
    totalCases,
    totalPages,
    currentPage,
    casesPerPage,
    paginatedCount: paginatedIncidents.length
  });

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
  const getUniqueHandlers = () => {
    const handlers = incidents.map(incident => incident.handler?.fullName).filter(handler => handler != null);
    return [...new Set(handlers)].sort();
  };

  const getUniqueIncidentTypes = () => {
    const incidentTypes = incidents.map(incident => incident.incidentType).filter(type => type != null);
    return [...new Set(incidentTypes)].sort();
  };


  const getUniqueStatuses = () => {
    const statuses = incidents.map(incident => incident.status).filter(status => status != null);
    return [...new Set(statuses)].sort();
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      handler: '',
      incidentType: '',
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

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => {
    const searchLower = customerSearchTerm.toLowerCase();
    return (
      customer.fullCompanyName.toLowerCase().includes(searchLower) ||
      customer.shortName.toLowerCase().includes(searchLower) ||
      (customer.contactPerson && customer.contactPerson.toLowerCase().includes(searchLower))
    );
  });

  // Handle customer selection
  const handleCustomerSelect = (customerId: string) => {
    setFilters(prev => ({ ...prev, customer: customerId }));
    setIsCustomerDropdownOpen(false);
    setCustomerSearchTerm('');
  };

  // Clear customer filter
  const clearCustomerFilter = () => {
    setFilters(prev => ({ ...prev, customer: '' }));
    setCustomerSearchTerm('');
  };

  // Get selected customer name for display
  const getSelectedCustomerName = () => {
    if (!filters.customer) return '';
    const customer = customers.find(c => c.id === filters.customer);
    return customer ? `${customer.shortName} (${customer.fullCompanyName})` : '';
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
      <div className="max-w-full mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Quản Lý Sự Cố</h1>
              <p className="text-slate-600">Theo dõi và xử lý các sự cố bảo mật và hệ thống</p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:from-red-700 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Tạo Case Xử Lý Sự Cố</span>
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
                    placeholder="Tìm kiếm theo tên sự cố, người xử lý, loại sự cố..."
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-2">
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

                  {/* Loại sự cố */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-0.5">
                      <div className="flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                        <span>Loại</span>
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

                  {/* Khách hàng */}
                  <div className="relative customer-dropdown-container">
                    <label className="block text-xs font-medium text-gray-600 mb-0.5">
                      <div className="flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                        <span>Khách hàng</span>
                      </div>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Tìm kiếm khách hàng..."
                        value={filters.customer ? getSelectedCustomerName() : customerSearchTerm}
                        onChange={(e) => {
                          setCustomerSearchTerm(e.target.value);
                          if (filters.customer) {
                            clearCustomerFilter();
                          }
                        }}
                        onFocus={() => setIsCustomerDropdownOpen(true)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                      />
                      {filters.customer && (
                        <button
                          onClick={clearCustomerFilter}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    {/* Dropdown */}
                    {isCustomerDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map(customer => (
                            <div
                              key={customer.id}
                              onClick={() => handleCustomerSelect(customer.id)}
                              className="px-3 py-2 hover:bg-purple-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-normal text-gray-900">{customer.shortName}</div>
                              {customer.contactPerson && (
                                <div className="text-xs text-gray-400">Liên hệ: {customer.contactPerson}</div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            Không tìm thấy khách hàng nào
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Trạng thái */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-0.5">
                      <div className="flex items-center space-x-1">
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
                    <label className="block text-xs font-medium text-gray-600 mb-0.5">
                      <div className="flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
                        <span>Từ</span>
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
                    <label className="block text-xs font-medium text-gray-600 mb-0.5">
                      <div className="flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div>
                        <span>Đến</span>
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
                  Hiển thị <span className="font-medium text-gray-900">{startIndex + 1}-{Math.min(endIndex, totalCases)}</span> trong tổng số <span className="font-medium text-gray-900">{totalCases}</span> sự cố
                  {hasActiveFilters() && (
                    <span className="ml-2 text-red-600 font-medium">
                      (đã lọc từ {incidents.length} sự cố)
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
                    Loại sự cố
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-80">
                    Thông tin Sự cố
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
                        <RefreshCw className="h-5 w-5 animate-spin text-red-600" />
                        <span className="text-slate-600">Đang tải danh sách sự cố...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedIncidents.length > 0 ? (
                  paginatedIncidents.map((incident, index) => (
                    <tr key={incident.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                      {/* STT */}
                      <td className="px-2 py-1 text-center w-16">
                        <span className="text-sm font-medium text-slate-600">
                          {totalCases - startIndex - index}
                        </span>
                      </td>
                      
                      {/* Người xử lý */}
                      <td className="px-2 py-1 w-32">
                        <div>
                          <div className="text-sm text-slate-900">{incident.handler.fullName}</div>
                          <div className="text-xs text-slate-500">{incident.handler.position}</div>
                        </div>
                      </td>
                      
                      {/* Khách hàng */}
                      <td className="px-2 py-1 w-48">
                        <div>
                          {incident.customer ? (
                            <>
                              <div className="text-sm font-bold text-slate-900">
                                {incident.customer.shortName}
                              </div>
                              <div className="text-xs text-slate-600">
                                {incident.customer.fullCompanyName}
                              </div>
                              <div className="text-xs text-slate-500">
                                Liên hệ: {incident.customer.contactPerson || incident.customerName || '-'}
                              </div>
                            </>
                          ) : (
                            <div className="text-sm text-slate-700">
                              {incident.customerName || '-'}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      {/* Loại sự cố */}
                      <td className="px-2 py-1 w-32">
                        <div className="text-sm text-slate-700">{formatIncidentType(incident.incidentType)}</div>
                      </td>
                      
                      {/* Thông tin Sự cố */}
                      <td className="px-2 py-1 w-80">
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
                      
                      {/* Ghi chú */}
                      <td className="px-2 py-1 w-32">
                        <div className="text-xs text-slate-600 max-w-32">
                          {incident.notes ? (
                            <div className="bg-green-50 border border-green-200 rounded-md p-2">
                              <div className="text-xs font-medium text-green-800 mb-1">Ghi chú:</div>
                              <div className="text-xs text-green-700 line-clamp-3 break-words">
                                {incident.notes}
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
                          {incident.crmReferenceCode ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                              {incident.crmReferenceCode}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Chưa có</span>
                          )}
                        </div>
                      </td>
                      
                      {/* Trạng thái */}
                      <td className="px-2 py-1 w-24">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(incident.status)}`}>
                          {getStatusText(incident.status)}
                        </span>
                      </td>
                      
                      {/* Thời gian */}
                      <td className="px-2 py-1 w-36">
                        <div className="text-xs space-y-1">
                          <div className="flex items-center">
                            <span className="text-green-600 font-medium">Bắt đầu:</span>
                            <span className="text-green-600 ml-1">{formatDate(incident.startDate)}</span>
                          </div>
                          {incident.endDate && (
                            <div className="flex items-center">
                              <span className="text-red-600 font-medium">Kết thúc:</span>
                              <span className="text-red-600 ml-1">{formatDate(incident.endDate)}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      
                      {/* Hành động */}
                      <td className="px-2 py-1 w-20 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {incident.status !== 'COMPLETED' && (
                            <button 
                              onClick={() => handleOpenEditModal(incident)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors duration-200"
                              title="Chỉnh sửa"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          
                          {incident.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleCloseCase(incident.id)}
                              disabled={closingCaseId === incident.id}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Đóng case"
                            >
                              {closingCaseId === incident.id ? (
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
                        <AlertTriangle className="h-16 w-16 mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 mb-2">Không tìm thấy sự cố nào</h3>
                      <p className="text-slate-500">Thử thay đổi từ khóa tìm kiếm hoặc tạo case xử lý sự cố mới</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
        </div>

        {/* Pagination */}
        {totalCases > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
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
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Hiển thị <span className="font-medium">{startIndex + 1}</span> đến{' '}
                  <span className="font-medium">{Math.min(endIndex, totalCases)}</span> trong tổng số{' '}
                  <span className="font-medium">{totalCases}</span> kết quả
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Page numbers */}
                  {(() => {
                    const pages = [];
                    const maxVisiblePages = 5;
                    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                    
                    if (endPage - startPage + 1 < maxVisiblePages) {
                      startPage = Math.max(1, endPage - maxVisiblePages + 1);
                    }
                    
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => goToPage(i)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            i === currentPage
                              ? 'z-10 bg-red-50 border-red-500 text-red-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }
                    return pages;
                  })()}
                  
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
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

      {/* Create Incident Modal */}
      <CreateIncidentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(newIncident: any) => {
          setIncidents(prevIncidents => [newIncident as Incident, ...prevIncidents]);
        }}
      />

      {/* Edit Incident Modal */}
      <EditIncidentModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSuccess={handleEditSuccess}
        incidentData={selectedIncident}
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
  );
}
