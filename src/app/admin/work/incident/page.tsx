'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Settings, Shield, FileText, Calendar, Zap, Search, RefreshCw, Eye, Edit, Trash, AlertTriangle, CheckCircle, Download, X } from 'lucide-react';
import { useEvaluationForm } from '@/hooks/useEvaluation';
import { useEvaluation } from '@/contexts/EvaluationContext';
import { EvaluationType, EvaluationCategory } from '@/contexts/EvaluationContext';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import ConfigurationTab from '@/components/shared/ConfigurationTab';
import EditIncidentModal from './EditIncidentModal';
import CreateIncidentModal from '../../../user/work/incident/CreateIncidentModal';

interface Employee {
  id: string;
  fullName: string;
  position: string;
  department: string;
  companyEmail: string;
}

interface Incident {
  id: string;
  title: string;
  description: string;
  customerName: string;
  handler: Employee;
  incidentType: string;
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

export default function AdminIncidentWorkPage() {
  // Admin evaluation categories
  const adminCategories = [
    EvaluationCategory.DIFFICULTY,
    EvaluationCategory.TIME,
    EvaluationCategory.IMPACT,
    EvaluationCategory.URGENCY,
  ];

  const { getFieldOptions } = useEvaluationForm(EvaluationType.ADMIN, adminCategories);
  const { fetchConfigs } = useEvaluation();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deletedIncidents, setDeletedIncidents] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  // States for incidents list
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'config' | 'cases'>('cases');
  
  // Pre-loaded data for modals (to avoid re-fetching)
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [employeesLoaded, setEmployeesLoaded] = useState(false);
  const [customersLoaded, setCustomersLoaded] = useState(false);
  
  // Filter states
  const [selectedHandler, setSelectedHandler] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedIncidentType, setSelectedIncidentType] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  
  // States for evaluation form
  const [evaluationForm, setEvaluationForm] = useState({
    adminDifficultyLevel: '',
    adminEstimatedTime: '',
    adminImpactLevel: '',
    adminUrgencyLevel: ''
  });
  const [evaluating, setEvaluating] = useState(false);

  // Incident Type Management States
  const [incidentTypes, setIncidentTypes] = useState<Array<{id: string, name: string, description?: string}>>([]);
  const [incidentTypesLoading, setIncidentTypesLoading] = useState(true);
  const [showIncidentTypeModal, setShowIncidentTypeModal] = useState(false);
  const [editingIncidentType, setEditingIncidentType] = useState<{id: string, name: string} | null>(null);
  const [incidentTypeForm, setIncidentTypeForm] = useState({
    name: '',
    isActive: true
  });
  
  // Inline editing states
  const [isAddingNewRow, setIsAddingNewRow] = useState(false);
  const [newIncidentTypeName, setNewIncidentTypeName] = useState('');
  const [saving, setSaving] = useState(false);

  // Helper function to check if incident is evaluated by admin
  const isIncidentEvaluatedByAdmin = (incident: Incident) => {
    return incident.adminDifficultyLevel !== null && 
           incident.adminDifficultyLevel !== undefined &&
           incident.adminEstimatedTime !== null && 
           incident.adminEstimatedTime !== undefined &&
           incident.adminImpactLevel !== null && 
           incident.adminImpactLevel !== undefined &&
           incident.adminUrgencyLevel !== null && 
           incident.adminUrgencyLevel !== undefined;
  };

  // Helper functions to get evaluation text
  const getDifficultyText = (level: number) => {
    const options = getFieldOptions(EvaluationCategory.DIFFICULTY);
    const option = options.find(opt => opt.points === level);
    return option ? `${option.points} - ${option.label}` : 'Chưa đánh giá';
  };

  const getEstimatedTimeText = (level: number) => {
    const options = getFieldOptions(EvaluationCategory.TIME);
    const option = options.find(opt => opt.points === level);
    return option ? `${option.points} - ${option.label}` : 'Chưa đánh giá';
  };

  const getImpactText = (level: number) => {
    const options = getFieldOptions(EvaluationCategory.IMPACT);
    const option = options.find(opt => opt.points === level);
    return option ? `${option.points} - ${option.label}` : 'Chưa đánh giá';
  };

  const getUrgencyText = (level: number) => {
    const options = getFieldOptions(EvaluationCategory.URGENCY);
    const option = options.find(opt => opt.points === level);
    return option ? `${option.points} - ${option.label}` : 'Chưa đánh giá';
  };

  const getFormText = (score?: number) => {
    if (score === undefined || score === null) return 'Chưa đánh giá';
    return `${score} điểm`;
  };

  // Pre-load employees (cached, only load once)
  const fetchEmployees = useCallback(async () => {
    if (employeesLoaded) return; // Skip if already loaded
    
    try {
      const response = await fetch('/api/employees/list', {
        headers: { 'Cache-Control': 'max-age=600' }
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data || []);
        setEmployeesLoaded(true);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  }, [employeesLoaded]);

  // Pre-load customers (cached, only load once)
  const fetchCustomers = useCallback(async () => {
    if (customersLoaded) return; // Skip if already loaded
    
    try {
      const response = await fetch('/api/partners/list', {
        headers: { 'Cache-Control': 'max-age=600' }
      });
      if (response.ok) {
        const data = await response.json();
        setCustomers(data || []);
        setCustomersLoaded(true);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  }, [customersLoaded]);

  // Fetch incidents from API with caching and retry
  const fetchIncidents = useCallback(async (retryCount = 0) => {
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
      } else if (response.status === 401 && retryCount < 2) {
        // Retry on auth error
        setTimeout(() => fetchIncidents(retryCount + 1), 1000);
        return;
      } else {
        console.error('Failed to fetch incidents:', response.status, response.statusText);
        setIncidents([]);
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
      if (retryCount < 2) {
        setTimeout(() => fetchIncidents(retryCount + 1), 1000);
        return;
      }
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh incidents
  const refreshIncidents = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/incidents', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setIncidents(data.data || []);
        toast.success('Danh sách sự cố đã được cập nhật');
      } else {
        console.error('Failed to refresh incidents');
        toast.error('Không thể cập nhật danh sách sự cố');
      }
    } catch (error) {
      console.error('Error refreshing incidents:', error);
      toast.error('Lỗi khi cập nhật danh sách sự cố');
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Delete incident
  const deleteIncident = useCallback(async (incidentId: string) => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/incidents/${incidentId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setIncidents(prev => prev.filter(incident => incident.id !== incidentId));
        setDeletedIncidents(prev => new Set([...prev, incidentId]));
        toast.success('Xóa sự cố thành công');
        setShowDeleteModal(false);
        setSelectedIncident(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Không thể xóa sự cố');
      }
    } catch (error) {
      console.error('Error deleting incident:', error);
      toast.error('Lỗi khi xóa sự cố');
    } finally {
      setDeleting(false);
    }
  }, []);

  // Toggle row expansion
  const toggleRowExpansion = useCallback((incidentId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(incidentId)) {
        newSet.delete(incidentId);
      } else {
        newSet.add(incidentId);
      }
      return newSet;
    });
  }, []);

  // Handle edit modal
  const handleOpenEditModal = useCallback((incident: Incident) => {
    setSelectedIncident(incident);
    setShowEditModal(true);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);
    setSelectedIncident(null);
  }, []);

  const handleEditSuccess = useCallback((updatedIncident: Incident) => {
    setIncidents(prev => prev.map(incident => 
      incident.id === updatedIncident.id ? updatedIncident : incident
    ));
    toast.success('Cập nhật sự cố thành công');
  }, []);

  // Check if any filters are active
  const hasActiveFilters = useCallback(() => {
    return searchTerm !== '' || 
           selectedHandler !== '' || 
           selectedStatus !== '' || 
           selectedIncidentType !== '' || 
           selectedCustomer !== '' || 
           dateFrom !== '' || 
           dateTo !== '';
  }, [searchTerm, selectedHandler, selectedStatus, selectedIncidentType, selectedCustomer, dateFrom, dateTo]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedHandler('');
    setSelectedStatus('');
    setSelectedIncidentType('');
    setSelectedCustomer('');
    setDateFrom('');
    setDateTo('');
  }, []);

  // Filter incidents
  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = !searchTerm || 
      incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.handler.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.incidentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (incident.customer?.fullCompanyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (incident.customer?.shortName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesHandler = !selectedHandler || incident.handler.id === selectedHandler;
    const matchesStatus = !selectedStatus || incident.status === selectedStatus;
    const matchesIncidentType = !selectedIncidentType || incident.incidentType === selectedIncidentType;
    const matchesCustomer = !selectedCustomer || incident.customer?.id === selectedCustomer;
    
    const matchesDateFrom = !dateFrom || new Date(incident.startDate) >= new Date(dateFrom);
    const matchesDateTo = !dateTo || new Date(incident.startDate) <= new Date(dateTo);

    return matchesSearch && matchesHandler && matchesStatus && matchesIncidentType && 
           matchesCustomer && matchesDateFrom && matchesDateTo;
  });

  // Get unique values for filters
  const uniqueHandlers = Array.from(new Set(incidents.map(incident => incident.handler.id)))
    .map(id => incidents.find(incident => incident.handler.id === id)?.handler)
    .filter(Boolean) as Employee[];

  const uniqueStatuses = Array.from(new Set(incidents.map(incident => incident.status)));
  const uniqueIncidentTypes = Array.from(new Set(incidents.map(incident => incident.incidentType)));
  const uniqueCustomers = Array.from(new Set(incidents.map(incident => incident.customer?.id).filter(Boolean)))
    .map(id => incidents.find(incident => incident.customer?.id === id)?.customer)
    .filter(Boolean);

  // Handle evaluation submission
  const handleEvaluationSubmit = useCallback(async () => {
    if (!selectedIncident) return;

    setEvaluating(true);
    try {
      const response = await fetch(`/api/incidents/${selectedIncident.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminDifficultyLevel: evaluationForm.adminDifficultyLevel || null,
          adminEstimatedTime: evaluationForm.adminEstimatedTime || null,
          adminImpactLevel: evaluationForm.adminImpactLevel || null,
          adminUrgencyLevel: evaluationForm.adminUrgencyLevel || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIncidents(prev => prev.map(incident => 
          incident.id === selectedIncident.id ? data.data : incident
        ));
        toast.success('Đánh giá sự cố thành công');
        setShowEvaluationModal(false);
        setSelectedIncident(null);
        setEvaluationForm({
          adminDifficultyLevel: '',
          adminEstimatedTime: '',
          adminImpactLevel: '',
          adminUrgencyLevel: ''
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Không thể đánh giá sự cố');
      }
    } catch (error) {
      console.error('Error evaluating incident:', error);
      toast.error('Lỗi khi đánh giá sự cố');
    } finally {
      setEvaluating(false);
    }
  }, [selectedIncident, evaluationForm]);

  // Export to Excel
  const exportToExcel = useCallback(() => {
    const exportData = filteredIncidents.map(incident => ({
      'Tiêu đề': incident.title,
      'Mô tả': incident.description,
      'Tên khách hàng': incident.customerName,
      'Người xử lý': incident.handler.fullName,
      'Loại sự cố': incident.incidentType,
      'Khách hàng': incident.customer?.fullCompanyName || 'N/A',
      'Trạng thái': incident.status,
      'Ngày bắt đầu': new Date(incident.startDate).toLocaleDateString('vi-VN'),
      'Ngày kết thúc': incident.endDate ? new Date(incident.endDate).toLocaleDateString('vi-VN') : 'Chưa hoàn thành',
      'Ngày tạo': new Date(incident.createdAt).toLocaleDateString('vi-VN'),
      'Độ khó (User)': incident.userDifficultyLevel || 'N/A',
      'Thời gian ước tính (User)': incident.userEstimatedTime || 'N/A',
      'Tác động (User)': incident.userImpactLevel || 'N/A',
      'Độ khẩn cấp (User)': incident.userUrgencyLevel || 'N/A',
      'Độ khó (Admin)': incident.adminDifficultyLevel || 'N/A',
      'Thời gian ước tính (Admin)': incident.adminEstimatedTime || 'N/A',
      'Tác động (Admin)': incident.adminImpactLevel || 'N/A',
      'Độ khẩn cấp (Admin)': incident.adminUrgencyLevel || 'N/A',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách sự cố');
    
    const fileName = `danh-sach-su-co-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success('Xuất file Excel thành công');
  }, [filteredIncidents]);

  // Fetch incident types from API
  const fetchIncidentTypes = useCallback(async () => {
    try {
      setIncidentTypesLoading(true);
      const response = await fetch(`/api/incident-types?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Store full objects with id, name, and description
        const types = data.data || [];
        setIncidentTypes(types);
      } else {
        console.error('Failed to fetch incident types');
        setIncidentTypes([]);
      }
    } catch (error) {
      console.error('Error fetching incident types:', error);
      setIncidentTypes([]);
    } finally {
      setIncidentTypesLoading(false);
    }
  }, []);

  // Incident Type Management Functions
  const handleAddIncidentType = () => {
    setIsAddingNewRow(true);
    setNewIncidentTypeName('');
  };

  const handleEditIncidentType = (type: {id: string, name: string}) => {
    setEditingIncidentType(type);
    setIncidentTypeForm({
      name: type.name,
      isActive: true
    });
    setShowIncidentTypeModal(true);
  };

  const handleDeleteIncidentType = async (type: {id: string, name: string}) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa loại sự cố "${type.name}"?`)) {
      try {
        const response = await fetch(`/api/incident-types/${type.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          // Remove from local state
          setIncidentTypes(prev => prev.filter(t => t.id !== type.id));
          toast.success('Xóa loại sự cố thành công');
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || 'Lỗi khi xóa loại sự cố');
        }
      } catch (error) {
        console.error('Error deleting incident type:', error);
        toast.error('Lỗi khi xóa loại sự cố');
      }
    }
  };

  const handleSaveNewIncidentType = async () => {
    if (!newIncidentTypeName.trim()) {
      toast.error('Vui lòng nhập tên loại sự cố');
      return;
    }

    if (incidentTypes.some(type => type.name === newIncidentTypeName.trim())) {
      toast.error('Loại sự cố này đã tồn tại');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/incident-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newIncidentTypeName.trim(),
          description: null
        }),
      });

      if (response.ok) {
        setNewIncidentTypeName('');
        setIsAddingNewRow(false);
        toast.success('Thêm loại sự cố thành công');
        // Refresh the list
        await fetchIncidentTypes();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Lỗi khi thêm loại sự cố');
      }
    } catch (error) {
      console.error('Error adding incident type:', error);
      toast.error('Lỗi khi thêm loại sự cố');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelNewIncidentType = () => {
    setIsAddingNewRow(false);
    setNewIncidentTypeName('');
  };

  const handleSubmitIncidentTypeForm = async () => {
    if (!incidentTypeForm.name.trim()) {
      toast.error('Vui lòng nhập tên loại sự cố');
      return;
    }

    setSaving(true);
    try {
      if (editingIncidentType) {
        // Update existing type
        const response = await fetch(`/api/incident-types/${editingIncidentType.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: incidentTypeForm.name.trim(),
            description: null,
            isActive: incidentTypeForm.isActive
          }),
        });

        if (response.ok) {
          toast.success('Cập nhật loại sự cố thành công');
          // Refresh the list to sync with API
          await fetchIncidentTypes();
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || 'Lỗi khi cập nhật loại sự cố');
          return;
        }
      } else {
        // Add new type
        if (incidentTypes.some(type => type.name === incidentTypeForm.name.trim())) {
          toast.error('Loại sự cố này đã tồn tại');
          return;
        }

        const response = await fetch('/api/incident-types', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: incidentTypeForm.name.trim(),
            description: null
          }),
        });

        if (response.ok) {
          toast.success('Thêm loại sự cố thành công');
          // Refresh the list to sync with API
          await fetchIncidentTypes();
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || 'Lỗi khi thêm loại sự cố');
          return;
        }
      }
      
      setShowIncidentTypeModal(false);
      setEditingIncidentType(null);
      setIncidentTypeForm({ name: '', isActive: true });
    } catch (error) {
      console.error('Error saving incident type:', error);
      toast.error('Lỗi khi lưu loại sự cố');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseIncidentTypeModal = () => {
    setShowIncidentTypeModal(false);
    setEditingIncidentType(null);
    setIncidentTypeForm({ name: '', isActive: true });
  };

  // Load data on component mount
  // Load all data in parallel on mount
  useEffect(() => {
    Promise.all([
      fetchIncidents(),
      fetchConfigs(),
      fetchIncidentTypes(),
      fetchEmployees(),
      fetchCustomers()
    ]).then(() => {
      console.log('✅ All data loaded');
    }).catch(err => {
      console.error('❌ Error loading data:', err);
    });
  }, [fetchIncidents, fetchConfigs, fetchIncidentTypes, fetchEmployees, fetchCustomers]);

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return 'bg-blue-100 text-blue-800';
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status label
  const getStatusLabel = (status: string) => {
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


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-full mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Quản lý sự cố</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Quản lý và theo dõi các sự cố hệ thống
                </p>
                {activeTab === 'cases' && (
                  <div className="mt-2 flex items-center space-x-4 text-xs">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">
                        Đã đánh giá: {filteredIncidents.filter(isIncidentEvaluatedByAdmin).length}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="text-yellow-600">
                        Chưa đánh giá: {filteredIncidents.filter(incident => !isIncidentEvaluatedByAdmin(incident)).length}
                      </span>
                    </div>
                    {hasActiveFilters() && (
                      <div className="flex items-center space-x-1">
                        <Search className="h-4 w-4 text-blue-500" />
                        <span className="text-blue-600">
                          Đang lọc: {filteredIncidents.length}/{incidents.length}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Create Case Button */}
            {activeTab === 'cases' && (
              <div className="mr-2">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700 transition-all duration-200 shadow-sm"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Tạo Case</span>
                </button>
              </div>
            )}
          </div>
          
          {/* Tabs */}
          <div className="mt-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('cases')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm cursor-pointer ${
                    activeTab === 'cases'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Danh sách sự cố</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      hasActiveFilters() 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {hasActiveFilters() ? `${filteredIncidents.length}/${incidents.length}` : incidents.length}
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('config')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm cursor-pointer ${
                    activeTab === 'config'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span>Cấu hình</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                      {incidentTypes.length}
                    </span>
                  </div>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full mx-auto px-4 py-8">

        {/* Cases Tab Content */}
        {activeTab === 'cases' ? (
          <div className="space-y-6">
            {/* Search and Filter Bar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-blue-100 rounded-md">
                      <Search className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Tìm kiếm & Lọc</h3>
                      <p className="text-xs text-gray-600">Tìm kiếm và lọc sự cố theo nhiều tiêu chí</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={exportToExcel}
                      disabled={filteredIncidents.length === 0}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="text-sm font-medium">Xuất Excel</span>
                    </button>
                    <button 
                      onClick={refreshIncidents}
                      disabled={refreshing}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                      <span className="text-sm font-medium">Làm mới</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="space-y-4">
                  {/* Search Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tìm kiếm
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Tìm kiếm theo tên sự cố, người báo cáo, người xử lý..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                      />
                    </div>
                  </div>

                  {/* Filters Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bộ lọc
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Handler Filter */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          <div className="flex items-center space-x-1.5">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                            <span>Người xử lý</span>
                          </div>
                        </label>
                        <select
                          value={selectedHandler}
                          onChange={(e) => setSelectedHandler(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                        >
                          <option value="">Tất cả người xử lý</option>
                          {uniqueHandlers.map((handler) => (
                            <option key={handler.id} value={handler.id}>
                              {handler.fullName}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Status Filter */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          <div className="flex items-center space-x-1.5">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                            <span>Trạng thái</span>
                          </div>
                        </label>
                        <select
                          value={selectedStatus}
                          onChange={(e) => setSelectedStatus(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                        >
                          <option value="">Tất cả trạng thái</option>
                          {uniqueStatuses.map((status) => (
                            <option key={status} value={status}>
                              {getStatusLabel(status)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Incident Type Filter */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          <div className="flex items-center space-x-1.5">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                            <span>Loại sự cố</span>
                          </div>
                        </label>
                        <select
                          value={selectedIncidentType}
                          onChange={(e) => setSelectedIncidentType(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                        >
                          <option value="">Tất cả loại sự cố</option>
                          {uniqueIncidentTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Customer Filter */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          <div className="flex items-center space-x-1.5">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                            <span>Khách hàng</span>
                          </div>
                        </label>
                        <select
                          value={selectedCustomer}
                          onChange={(e) => setSelectedCustomer(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                        >
                          <option value="">Tất cả khách hàng</option>
                          {uniqueCustomers.map((customer) => (
                            <option key={customer?.id} value={customer?.id}>
                              {customer?.shortName}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Date From Filter */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          <div className="flex items-center space-x-1.5">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            <span>Từ ngày</span>
                          </div>
                        </label>
                        <input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                        />
                      </div>

                      {/* Date To Filter */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          <div className="flex items-center space-x-1.5">
                            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div>
                            <span>Đến ngày</span>
                          </div>
                        </label>
                        <input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                        />
                      </div>

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
                          {selectedHandler && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
                              Xử lý: {uniqueHandlers.find(h => h.id === selectedHandler)?.fullName || selectedHandler}
                            </span>
                          )}
                          {selectedStatus && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1"></div>
                              Trạng thái: {getStatusLabel(selectedStatus)}
                            </span>
                          )}
                          {selectedIncidentType && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1"></div>
                              Loại: {formatIncidentType(selectedIncidentType)}
                            </span>
                          )}
                          {selectedCustomer && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1"></div>
                              Khách hàng: {uniqueCustomers.find(c => c?.id === selectedCustomer)?.shortName || selectedCustomer}
                            </span>
                          )}
                          {dateFrom && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800 border border-teal-200">
                              <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-1"></div>
                              Từ: {new Date(dateFrom).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                          {dateTo && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800 border border-cyan-200">
                              <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-1"></div>
                              Đến: {new Date(dateTo).toLocaleDateString('vi-VN')}
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
                          <span>Xóa bộ lọc</span>
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
                      <span className="ml-2 text-blue-600 font-medium">
                        (đã lọc)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Incidents Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Đang tải...</span>
                </div>
              ) : filteredIncidents.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Không có sự cố nào</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {hasActiveFilters()
                      ? 'Không tìm thấy sự cố phù hợp với bộ lọc.'
                      : 'Chưa có sự cố nào được tạo.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                        STT
                      </th>
                      <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                        Thông tin case
                      </th>
                      <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        Người xử lý
                      </th>
                      <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                        Khách hàng
                      </th>
                      <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        Trạng thái
                      </th>
                      <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                        Thời gian
                      </th>
                      <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        Tổng điểm User
                      </th>
                      <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        Điểm Admin
                      </th>
                      <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        Tổng điểm
                      </th>
                      <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredIncidents.map((incident, index) => (
                      <React.Fragment key={incident.id}>
                        <tr 
                          className={`hover:bg-gray-50/50 transition-colors duration-150 cursor-pointer ${
                            !isIncidentEvaluatedByAdmin(incident) ? 'bg-yellow-50/50 border-l-4 border-l-yellow-400' : ''
                          }`}
                          onClick={() => toggleRowExpansion(incident.id)}
                        >
                          {/* STT */}
                          <td className="px-2 py-4 whitespace-nowrap text-center w-16">
                            <span className="text-xs font-medium text-gray-600">
                              {filteredIncidents.length - index}
                            </span>
                          </td>
                          
                          {/* Thông tin case */}
                          <td className="px-2 py-4 whitespace-nowrap w-64">
                            <div>
                              <div className="text-xs font-medium text-gray-900">
                                {incident.title}
                              </div>
                              <div className="text-xs text-gray-500">
                                Tạo: {new Date(incident.createdAt).toLocaleString('vi-VN')}
                              </div>
                            </div>
                          </td>
                          
                          {/* Người xử lý */}
                          <td className="px-2 py-4 whitespace-nowrap w-32">
                            <div className="text-xs text-gray-900">{incident.handler.fullName}</div>
                            <div className="text-xs text-gray-500">{incident.handler.position}</div>
                          </td>
                          
                          {/* Khách hàng */}
                          <td className="px-2 py-4 whitespace-nowrap w-48">
                            <div className="text-xs font-medium text-gray-900">
                              {incident.customer?.shortName || incident.customerName}
                            </div>
                          </td>
                          
                          {/* Trạng thái */}
                          <td className="px-2 py-4 whitespace-nowrap w-24">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(incident.status)}`}>
                              {getStatusLabel(incident.status)}
                            </span>
                          </td>
                          
                          {/* Thời gian */}
                          <td className="px-2 py-4 whitespace-nowrap text-xs text-gray-900 w-36">
                            <div>Bắt đầu: {new Date(incident.startDate).toLocaleString('vi-VN', { 
                              year: 'numeric', 
                              month: '2-digit', 
                              day: '2-digit', 
                              hour: '2-digit', 
                              minute: '2-digit',
                              timeZone: 'Asia/Ho_Chi_Minh'
                            })}</div>
                            {incident.endDate && (
                              <div>Kết thúc: {new Date(incident.endDate).toLocaleString('vi-VN', { 
                                year: 'numeric', 
                                month: '2-digit', 
                                day: '2-digit', 
                                hour: '2-digit', 
                                minute: '2-digit',
                                timeZone: 'Asia/Ho_Chi_Minh'
                              })}</div>
                            )}
                          </td>
                          
                          {/* Tổng điểm User */}
                          <td className="px-2 py-4 whitespace-nowrap text-center w-24">
                            {incident.userDifficultyLevel && incident.userEstimatedTime && incident.userImpactLevel && incident.userUrgencyLevel ? (
                              <span className="text-xs font-medium text-blue-600">
                                {incident.userDifficultyLevel + incident.userEstimatedTime + incident.userImpactLevel + incident.userUrgencyLevel}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                          
                          {/* Điểm Admin */}
                          <td className="px-2 py-4 whitespace-nowrap text-center w-24">
                            {isIncidentEvaluatedByAdmin(incident) ? (
                              <span className="text-xs font-medium text-green-600">
                                {(incident.adminDifficultyLevel || 0) + (incident.adminEstimatedTime || 0) + (incident.adminImpactLevel || 0) + (incident.adminUrgencyLevel || 0)}
                              </span>
                            ) : (
                              <div className="flex items-center justify-center space-x-1">
                                <AlertTriangle className="h-3 w-3 text-yellow-500" />
                                <span className="text-xs font-medium text-yellow-600">
                                  Chưa đánh giá
                                </span>
                              </div>
                            )}
                          </td>
                          
                          {/* Tổng điểm */}
                          <td className="px-2 py-4 whitespace-nowrap text-center w-24">
                            {(() => {
                              const userScore = incident.userDifficultyLevel && incident.userEstimatedTime && incident.userImpactLevel && incident.userUrgencyLevel 
                                ? incident.userDifficultyLevel + incident.userEstimatedTime + incident.userImpactLevel + incident.userUrgencyLevel 
                                : 0;
                              const adminScore = incident.adminDifficultyLevel && incident.adminEstimatedTime && incident.adminImpactLevel && incident.adminUrgencyLevel 
                                ? incident.adminDifficultyLevel + incident.adminEstimatedTime + incident.adminImpactLevel + incident.adminUrgencyLevel 
                                : 0;
                              const totalScore = userScore + adminScore;
                              const isAdminEvaluated = isIncidentEvaluatedByAdmin(incident);
                              
                              if (totalScore > 0) {
                                return (
                                  <span className="text-xs font-bold text-purple-600">
                                    {totalScore}
                                  </span>
                                );
                              } else if (!isAdminEvaluated) {
                                return (
                                  <div className="flex items-center justify-center space-x-1">
                                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                                    <span className="text-xs font-medium text-yellow-600">
                                      Chưa đánh giá
                                    </span>
                                  </div>
                                );
                              } else {
                                return <span className="text-xs text-gray-400">-</span>;
                              }
                            })()}
                          </td>
                          
                          {/* Hành động */}
                          <td className="px-2 py-4 whitespace-nowrap text-sm font-medium w-20">
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingIncident(incident);
                                  setShowCreateModal(true);
                                }}
                                className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                                title="Chỉnh sửa sự cố"
                              >
                                <Edit className="h-3 w-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedIncident(incident);
                                  setShowEvaluationModal(true);
                                  setEvaluationForm({
                                    adminDifficultyLevel: incident.adminDifficultyLevel?.toString() || '',
                                    adminEstimatedTime: incident.adminEstimatedTime?.toString() || '',
                                    adminImpactLevel: incident.adminImpactLevel?.toString() || '',
                                    adminUrgencyLevel: incident.adminUrgencyLevel?.toString() || ''
                                  });
                                }}
                                className={`p-1.5 rounded-md transition-colors duration-200 ${
                                  isIncidentEvaluatedByAdmin(incident) 
                                    ? 'text-green-600 hover:bg-green-50' 
                                    : 'text-yellow-600 hover:bg-yellow-50 bg-yellow-100'
                                }`}
                                title={isIncidentEvaluatedByAdmin(incident) ? "Đánh giá case" : "⚠️ Chưa đánh giá - Click để đánh giá"}
                              >
                                {isIncidentEvaluatedByAdmin(incident) ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedIncident(incident);
                                  setShowDeleteModal(true);
                                }}
                                className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors duration-200"
                                title="Xóa"
                              >
                                <Trash className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Expanded Row Content */}
                        {expandedRows.has(incident.id) && (
                          <tr>
                            <td colSpan={10} className="px-3 py-6 bg-gray-50" onClick={(e) => e.stopPropagation()}>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Mô tả chi tiết */}
                                <div>
                                  <h4 className="text-xs font-medium text-gray-900 mb-2 flex items-center">
                                    <FileText className="h-3 w-3 mr-2 text-blue-600" />
                                    Mô tả chi tiết
                                  </h4>
                                  <p className="text-xs text-gray-600 leading-relaxed">{incident.description}</p>
                                </div>
                                
                                {/* Tên công ty đầy đủ */}
                                <div>
                                  <h4 className="text-xs font-medium text-gray-900 mb-2 flex items-center">
                                    <AlertTriangle className="h-3 w-3 mr-2 text-orange-600" />
                                    Tên công ty đầy đủ
                                  </h4>
                                  <div className="text-xs text-gray-600">
                                    <div className="font-medium text-gray-900">
                                      {incident.customer?.fullCompanyName || 'N/A'}
                                    </div>
                                    {incident.customer?.contactPerson && (
                                      <div className="mt-1 text-gray-500">
                                        Người liên hệ: {incident.customer.contactPerson}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Configuration Tab Content */
          <ConfigurationTab
            title="Quản lý loại sự cố"
            items={incidentTypes.map(type => ({
              id: type.id,
              name: type.name,
              description: type.description
            }))}
            onAdd={async (name) => {
              const response = await fetch('/api/incident-types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
              });
              if (!response.ok) throw new Error('Failed to add incident type');
              await fetchIncidentTypes();
            }}
            onEdit={async (id, name) => {
              const response = await fetch(`/api/incident-types/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
              });
              if (!response.ok) throw new Error('Failed to update incident type');
              await fetchIncidentTypes();
            }}
            onDelete={async (id) => {
              const response = await fetch(`/api/incident-types/${id}`, {
                method: 'DELETE'
              });
              if (!response.ok) throw new Error('Failed to delete incident type');
              await fetchIncidentTypes();
            }}
            iconColor="red"
            placeholder="Nhập tên loại sự cố..."
          />
        )}
      </div>

        {/* Evaluation Modal */}
        {showEvaluationModal && selectedIncident && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Đánh giá Case: {selectedIncident.title}</h3>
                <p className="text-sm text-gray-600">Đánh giá mức độ khó, thời gian, ảnh hưởng và khẩn cấp</p>
              </div>
              
              <div className="p-6">
                <div className="space-y-6">
                  {/* User Assessment Display */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-blue-800">Đánh giá của User</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>Mức độ khó: {getDifficultyText(selectedIncident.userDifficultyLevel || 0)}</div>
                      <div>Thời gian ước tính: {getEstimatedTimeText(selectedIncident.userEstimatedTime || 0)}</div>
                      <div>Mức độ ảnh hưởng: {getImpactText(selectedIncident.userImpactLevel || 0)}</div>
                      <div>Mức độ khẩn cấp: {getUrgencyText(selectedIncident.userUrgencyLevel || 0)}</div>
                      <div>Hình thức: {getFormText(selectedIncident.userFormScore)}</div>
                      <div className="font-medium text-blue-600">
                        Tổng: {((selectedIncident.userDifficultyLevel || 0) + (selectedIncident.userEstimatedTime || 0) + (selectedIncident.userImpactLevel || 0) + (selectedIncident.userUrgencyLevel || 0) + (selectedIncident.userFormScore || 0))}
                      </div>
                    </div>
                  </div>

                  {/* Admin Assessment Form */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-green-800">Đánh giá của Admin</h4>
                      <button
                        type="button"
                        onClick={fetchConfigs}
                        className="flex items-center space-x-1 px-2 py-1 text-xs text-green-700 hover:text-green-800 hover:bg-green-100 rounded transition-colors cursor-pointer"
                        title="Làm mới options đánh giá"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Làm mới</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Mức độ khó */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mức độ khó
                        </label>
                        <select
                          value={evaluationForm.adminDifficultyLevel}
                          onChange={(e) => setEvaluationForm(prev => ({ ...prev, adminDifficultyLevel: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="">Chọn mức độ khó</option>
                          {getFieldOptions(EvaluationCategory.DIFFICULTY).map((option) => (
                            <option key={option.id} value={option.points}>
                              {option.points} - {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Thời gian ước tính */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Thời gian ước tính
                        </label>
                        <select
                          value={evaluationForm.adminEstimatedTime}
                          onChange={(e) => setEvaluationForm(prev => ({ ...prev, adminEstimatedTime: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="">Chọn thời gian ước tính</option>
                          {getFieldOptions(EvaluationCategory.TIME).map((option) => (
                            <option key={option.id} value={option.points}>
                              {option.points} - {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Mức độ ảnh hưởng */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mức độ ảnh hưởng
                        </label>
                        <select
                          value={evaluationForm.adminImpactLevel}
                          onChange={(e) => setEvaluationForm(prev => ({ ...prev, adminImpactLevel: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="">Chọn mức độ ảnh hưởng</option>
                          {getFieldOptions(EvaluationCategory.IMPACT).map((option) => (
                            <option key={option.id} value={option.points}>
                              {option.points} - {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Mức độ khẩn cấp */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mức độ khẩn cấp
                        </label>
                        <select
                          value={evaluationForm.adminUrgencyLevel}
                          onChange={(e) => setEvaluationForm(prev => ({ ...prev, adminUrgencyLevel: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="">Chọn mức độ khẩn cấp</option>
                          {getFieldOptions(EvaluationCategory.URGENCY).map((option) => (
                            <option key={option.id} value={option.points}>
                              {option.points} - {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Ghi chú đánh giá */}
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEvaluationModal(false);
                    setSelectedIncident(null);
                    setEvaluationForm({
                      adminDifficultyLevel: '',
                      adminEstimatedTime: '',
                      adminImpactLevel: '',
                      adminUrgencyLevel: ''
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={handleEvaluationSubmit}
                  disabled={evaluating}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {evaluating ? 'Đang cập nhật...' : 'Cập nhật đánh giá'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedIncident && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa sự cố</h3>
              </div>
              <div className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <Trash className="h-5 w-5 text-red-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 mb-2">
                      Bạn có chắc chắn muốn xóa sự cố này không?
                    </p>
                    <div className="bg-gray-50 rounded-md p-3 text-sm">
                      <div className="font-medium text-gray-900">{selectedIncident.title}</div>
                      <div className="text-gray-600 mt-1">
                        <div>Tên khách hàng: {selectedIncident.customerName}</div>
                        <div>Người xử lý: {selectedIncident.handler.fullName}</div>
                        <div>Loại: {selectedIncident.incidentType}</div>
                      </div>
                    </div>
                    <p className="text-xs text-red-600 mt-2">
                      ⚠️ Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedIncident(null);
                  }}
                  disabled={deleting}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={() => deleteIncident(selectedIncident.id)}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center"
                >
                  {deleting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Đang xóa...
                    </>
                  ) : (
                    <>
                      <Trash className="h-4 w-4 mr-2" />
                      Xóa sự cố
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Incident Modal */}
        <CreateIncidentModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setEditingIncident(null);
          }}
          editingIncident={editingIncident}
          employees={employees}
          customers={customers}
          incidentTypes={incidentTypes}
          onSuccess={(incident) => {
            console.log('Incident saved:', incident);
            
            if (editingIncident) {
              // Update existing incident in state (no reload needed)
              setIncidents(prev => prev.map(i => 
                i.id === incident.id ? incident : i
              ));
            } else {
              // Add new incident to the beginning of the list
              setIncidents(prev => [incident, ...prev]);
            }
            
            setEditingIncident(null);
            // Don't show toast here - modal already shows it
          }}
        />

        {/* Edit Incident Modal */}
        <EditIncidentModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          onSuccess={handleEditSuccess}
          incidentData={selectedIncident}
          employees={employees}
          customers={customers}
          incidentTypes={incidentTypes}
        />

        {/* Incident Type Modal */}
        {showIncidentTypeModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingIncidentType ? 'Chỉnh sửa loại sự cố' : 'Thêm loại sự cố mới'}
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên loại sự cố *
                    </label>
                    <input
                      type="text"
                      value={incidentTypeForm.name}
                      onChange={(e) => setIncidentTypeForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nhập tên loại sự cố"
                    />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={handleCloseIncidentTypeModal}
                  disabled={saving}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmitIncidentTypeForm}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      {editingIncidentType ? 'Cập nhật' : 'Thêm mới'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
