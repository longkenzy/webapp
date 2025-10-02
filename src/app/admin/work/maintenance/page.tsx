'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Settings, Wrench, FileText, Calendar, Zap, Search, RefreshCw, Eye, Edit, Trash, AlertTriangle, CheckCircle, Download, ChevronDown, ChevronRight, X } from 'lucide-react';
import { useEvaluationForm } from '@/hooks/useEvaluation';
import { useEvaluation } from '@/contexts/EvaluationContext';
import { EvaluationType, EvaluationCategory } from '@/contexts/EvaluationContext';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import ConfigurationTab from '@/components/shared/ConfigurationTab';
import CreateMaintenanceModal from './CreateMaintenanceModal';

interface Employee {
  id: string;
  fullName: string;
  position: string;
  department: string;
  companyEmail: string;
}


interface MaintenanceCase {
  id: string;
  title: string;
  description: string;
  reporter: Employee;
  handler: Employee;
  maintenanceType: string;
  maintenanceCaseType?: {
    id: string;
    name: string;
  };
  customerName?: string;
  customerId?: string;
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
  equipment?: {
    id: string;
    name: string;
    model?: string;
    serialNumber?: string;
    location?: string;
  };
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

export default function AdminMaintenanceWorkPage() {
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
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMaintenanceCase, setSelectedMaintenanceCase] = useState<MaintenanceCase | null>(null);
  const [editingMaintenanceCase, setEditingMaintenanceCase] = useState<MaintenanceCase | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deletedMaintenanceCases, setDeletedMaintenanceCases] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  // States for maintenance cases list
  const [maintenanceCases, setMaintenanceCases] = useState<MaintenanceCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'config' | 'cases'>('cases');
  
  // Filter states
  const [selectedHandler, setSelectedHandler] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedMaintenanceType, setSelectedMaintenanceType] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  
  // States for evaluation form
  const [evaluationForm, setEvaluationForm] = useState({
    adminDifficultyLevel: '',
    adminEstimatedTime: '',
    adminImpactLevel: '',
    adminUrgencyLevel: ''
  });
  const [evaluating, setEvaluating] = useState(false);

  // Maintenance Type Management States
  const [maintenanceTypes, setMaintenanceTypes] = useState<any[]>([]);
  const [maintenanceTypesLoading, setMaintenanceTypesLoading] = useState(true);
  const [newMaintenanceType, setNewMaintenanceType] = useState({
    name: ''
  });
  const [addingMaintenanceType, setAddingMaintenanceType] = useState(false);
  const [editingMaintenanceType, setEditingMaintenanceType] = useState<any>(null);
  const [showMaintenanceTypeModal, setShowMaintenanceTypeModal] = useState(false);


  // Pre-loaded data for filters and modals
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [employeesLoaded, setEmployeesLoaded] = useState(false);
  const [partnersLoaded, setPartnersLoaded] = useState(false);

  // Fetch maintenance cases
  const fetchMaintenanceCases = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      const headers: HeadersInit = {};
      
      // Only use cache for initial load, not for refreshes
      if (!forceRefresh) {
        headers['Cache-Control'] = 'max-age=60';
      } else {
        headers['Cache-Control'] = 'no-cache';
      }
      
      const response = await fetch('/api/maintenance-cases?limit=1000', {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Fetched maintenance cases:', result.data?.length || 0, 'cases');
      setMaintenanceCases(result.data || []);
    } catch (error) {
      console.error('Error fetching maintenance cases:', error);
      setMaintenanceCases([]);
      toast.error('Không thể tải danh sách case bảo trì');
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Pre-load partners (cached, only load once)
  const fetchPartners = useCallback(async () => {
    if (partnersLoaded) return; // Skip if already loaded
    
    try {
      const response = await fetch('/api/partners/list', {
        headers: { 'Cache-Control': 'max-age=600' }
      });
      if (response.ok) {
        const data = await response.json();
        setPartners(data || []);
        setPartnersLoaded(true);
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
    }
  }, [partnersLoaded]);


  // Fetch maintenance types
  const fetchMaintenanceTypes = useCallback(async () => {
    try {
      setMaintenanceTypesLoading(true);
      console.log('Fetching maintenance types...');
      const response = await fetch('/api/maintenance-types', {
        method: 'GET',
        headers: {
          'Cache-Control': 'max-age=300',
        },
      });
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Maintenance types result:', result);
        setMaintenanceTypes(result.data || []);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch maintenance types:', response.status, response.statusText, errorText);
        setMaintenanceTypes([]);
      }
    } catch (error) {
      console.error('Error fetching maintenance types:', error);
      setMaintenanceTypes([]);
    } finally {
      setMaintenanceTypesLoading(false);
    }
  }, []);

  // Get unique maintenance types from data (memoized for performance)
  const uniqueMaintenanceTypes = useMemo(() => {
    const types = maintenanceCases
      .map(case_ => case_.maintenanceCaseType?.name || case_.maintenanceType)
      .filter((type, index, arr) => arr.indexOf(type) === index);
    return types.sort();
  }, [maintenanceCases]);

  // Get unique statuses from data (memoized for performance)
  const uniqueStatuses = useMemo(() => {
    const statuses = maintenanceCases
      .map(case_ => case_.status)
      .filter((status, index, arr) => arr.indexOf(status) === index);
    return statuses.sort();
  }, [maintenanceCases]);

  // Filter maintenance cases (memoized for performance)
  const filteredMaintenanceCases = useMemo(() => {
    return maintenanceCases.filter(case_ => {
      const matchesSearch = !searchTerm || 
        case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.reporter.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.handler.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (case_.maintenanceCaseType?.name || case_.maintenanceType).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (case_.customerName || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesHandler = !selectedHandler || case_.handler.id === selectedHandler;
      const matchesStatus = !selectedStatus || case_.status === selectedStatus;
      const matchesMaintenanceType = !selectedMaintenanceType || (case_.maintenanceCaseType?.name || case_.maintenanceType) === selectedMaintenanceType;
      const matchesCustomer = !selectedCustomer || case_.customerId === selectedCustomer;

      const matchesDateFrom = !dateFrom || new Date(case_.startDate) >= new Date(dateFrom);
      const matchesDateTo = !dateTo || new Date(case_.startDate) <= new Date(dateTo);

      return matchesSearch && matchesHandler && matchesStatus && 
             matchesMaintenanceType && matchesCustomer &&
             matchesDateFrom && matchesDateTo;
    }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [maintenanceCases, searchTerm, selectedHandler, selectedStatus, selectedMaintenanceType, selectedCustomer, dateFrom, dateTo]);

  // Pagination logic
  const totalItems = filteredMaintenanceCases.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMaintenanceCases = filteredMaintenanceCases.slice(startIndex, endIndex);

  // Pagination functions
  const goToPage = (page: number) => {
    setCurrentPage(page);
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
  }, [searchTerm, selectedHandler, selectedStatus, selectedMaintenanceType, selectedCustomer, dateFrom, dateTo]);


  // Handle evaluation
  const handleEvaluation = async () => {
    if (!selectedMaintenanceCase) return;

    setEvaluating(true);
    try {
      const response = await fetch(`/api/maintenance-cases/${selectedMaintenanceCase.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...selectedMaintenanceCase,
          adminDifficultyLevel: parseInt(evaluationForm.adminDifficultyLevel),
          adminEstimatedTime: parseInt(evaluationForm.adminEstimatedTime),
          adminImpactLevel: parseInt(evaluationForm.adminImpactLevel),
          adminUrgencyLevel: parseInt(evaluationForm.adminUrgencyLevel),
          adminAssessmentDate: new Date().toISOString(),
          adminAssessmentNotes: 'Admin evaluation completed'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Evaluation update successful:', result);
        
        toast.success('Đánh giá thành công!');
        
        // Close modal and reset form first
        setShowEvaluationModal(false);
        setSelectedMaintenanceCase(null);
        setEvaluationForm({
          adminDifficultyLevel: '',
          adminEstimatedTime: '',
          adminImpactLevel: '',
          adminUrgencyLevel: ''
        });
        
        // Force refresh the maintenance cases list
        console.log('Refreshing maintenance cases list...');
        await fetchMaintenanceCases(true);
        
        // Also force a small delay to ensure state updates
        setTimeout(() => {
          console.log('Maintenance cases refreshed');
        }, 100);
        
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Evaluation update failed:', response.status, errorData);
        toast.error(`Lỗi khi đánh giá: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Error evaluating maintenance case:', error);
      toast.error('Lỗi khi đánh giá!');
    } finally {
      setEvaluating(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedMaintenanceCase) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/maintenance-cases/${selectedMaintenanceCase.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Xóa case bảo trì thành công!');
        setShowDeleteModal(false);
        setSelectedMaintenanceCase(null);
        setDeletedMaintenanceCases(prev => new Set([...prev, selectedMaintenanceCase.id]));
        await fetchMaintenanceCases(true);
      } else {
        toast.error('Lỗi khi xóa case bảo trì!');
      }
    } catch (error) {
      console.error('Error deleting maintenance case:', error);
      toast.error('Lỗi khi xóa case bảo trì!');
    } finally {
      setDeleting(false);
    }
  };

  // Handle add maintenance type
  const handleAddMaintenanceType = async () => {
    if (!newMaintenanceType.name.trim()) {
      toast.error('Vui lòng nhập tên loại bảo trì');
      return;
    }

    setAddingMaintenanceType(true);
    try {
      const response = await fetch('/api/maintenance-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newMaintenanceType.name,
          description: null
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Thêm loại bảo trì thành công!');
        setNewMaintenanceType({ name: '' });
        setShowMaintenanceTypeModal(false);
        // Thêm trực tiếp vào state thay vì gọi lại API
        setMaintenanceTypes(prev => [...prev, result.data]);
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('maintenance-types-updated'));
      } else {
        const error = await response.json();
        toast.error(error.message || 'Lỗi khi thêm loại bảo trì');
      }
    } catch (error) {
      console.error('Error adding maintenance type:', error);
      toast.error('Lỗi khi thêm loại bảo trì');
    } finally {
      setAddingMaintenanceType(false);
    }
  };

  // Handle edit maintenance type
  const handleEditMaintenanceType = async () => {
    if (!editingMaintenanceType?.name?.trim()) {
      toast.error('Vui lòng nhập tên loại bảo trì');
      return;
    }

    try {
      const response = await fetch(`/api/maintenance-types/${editingMaintenanceType.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingMaintenanceType.name,
          description: null,
          isActive: editingMaintenanceType.isActive,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Cập nhật loại bảo trì thành công!');
        setEditingMaintenanceType(null);
        setShowMaintenanceTypeModal(false);
        // Cập nhật trực tiếp trong state thay vì gọi lại API
        setMaintenanceTypes(prev => prev.map(type => 
          type.id === editingMaintenanceType.id ? result.data : type
        ));
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('maintenance-types-updated'));
      } else {
        const error = await response.json();
        toast.error(error.message || 'Lỗi khi cập nhật loại bảo trì');
      }
    } catch (error) {
      console.error('Error updating maintenance type:', error);
      toast.error('Lỗi khi cập nhật loại bảo trì');
    }
  };

  // Handle delete maintenance type
  const handleDeleteMaintenanceType = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa loại bảo trì này?')) {
      return;
    }

    try {
      const response = await fetch(`/api/maintenance-types/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Xóa loại bảo trì thành công!');
        // Xóa trực tiếp khỏi state thay vì gọi lại API
        setMaintenanceTypes(prev => prev.filter(type => type.id !== id));
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('maintenance-types-updated'));
      } else {
        const error = await response.json();
        toast.error(error.message || 'Lỗi khi xóa loại bảo trì');
      }
    } catch (error) {
      console.error('Error deleting maintenance type:', error);
      toast.error('Lỗi khi xóa loại bảo trì');
    }
  };

  // Export to Excel
  const handleExport = () => {
    const exportData = filteredMaintenanceCases.map(case_ => ({
      'ID': case_.id,
      'Tiêu đề': case_.title,
      'Mô tả': case_.description,
      'Người báo cáo': case_.reporter.fullName,
      'Người xử lý': case_.handler.fullName,
      'Loại bảo trì': case_.maintenanceCaseType?.name || case_.maintenanceType,
      'Trạng thái': case_.status,
      'Ngày bắt đầu': new Date(case_.startDate).toLocaleDateString('vi-VN'),
      'Ngày kết thúc': case_.endDate ? new Date(case_.endDate).toLocaleDateString('vi-VN') : '',
      'Ngày tạo': new Date(case_.createdAt).toLocaleDateString('vi-VN'),
      'Ghi chú': case_.notes || '',
      'Đánh giá khó (User)': case_.userDifficultyLevel || '',
      'Thời gian ước tính (User)': case_.userEstimatedTime || '',
      'Mức độ ảnh hưởng (User)': case_.userImpactLevel || '',
      'Mức độ khẩn cấp (User)': case_.userUrgencyLevel || '',
      'Đánh giá khó (Admin)': case_.adminDifficultyLevel || '',
      'Thời gian ước tính (Admin)': case_.adminEstimatedTime || '',
      'Mức độ ảnh hưởng (Admin)': case_.adminImpactLevel || '',
      'Mức độ khẩn cấp (Admin)': case_.adminUrgencyLevel || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Maintenance Cases');
    XLSX.writeFile(wb, `maintenance-cases-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Xuất file Excel thành công!');
  };

  // Format maintenance type
  const formatMaintenanceType = (type: string) => {
    switch (type) {
      case 'PREVENTIVE':
        return 'Bảo trì phòng ngừa';
      case 'CORRECTIVE':
        return 'Bảo trì sửa chữa';
      case 'EMERGENCY':
        return 'Bảo trì khẩn cấp';
      case 'ROUTINE':
        return 'Bảo trì định kỳ';
      case 'UPGRADE':
        return 'Nâng cấp thiết bị';
      case 'INSPECTION':
        return 'Kiểm tra thiết bị';
      default:
        return type;
    }
  };


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
        return 'Đã nhận';
      case 'PROCESSING':
        return 'Đang xử lý';
      case 'COMPLETED':
        return 'Đã hoàn thành';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
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

  // Check if maintenance case is evaluated by admin
  const isMaintenanceCaseEvaluatedByAdmin = (case_: MaintenanceCase) => {
    return case_.adminDifficultyLevel !== null && 
           case_.adminDifficultyLevel !== undefined &&
           case_.adminEstimatedTime !== null && 
           case_.adminEstimatedTime !== undefined &&
           case_.adminImpactLevel !== null && 
           case_.adminImpactLevel !== undefined &&
           case_.adminUrgencyLevel !== null && 
           case_.adminUrgencyLevel !== undefined;
  };

  // Check if there are active filters
  const hasActiveFilters = useCallback(() => {
    return searchTerm !== '' || 
           selectedHandler !== '' || 
           selectedStatus !== '' || 
           selectedMaintenanceType !== '' || 
           selectedCustomer !== '' || 
           dateFrom !== '' || 
           dateTo !== '';
  }, [searchTerm, selectedHandler, selectedStatus, selectedMaintenanceType, selectedCustomer, dateFrom, dateTo]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedHandler('');
    setSelectedStatus('');
    setSelectedMaintenanceType('');
    setSelectedCustomer('');
    setDateFrom('');
    setDateTo('');
  }, []);

  // Toggle row expansion
  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Load data on component mount
  useEffect(() => {
    // Fetch all data in parallel for better performance
    Promise.all([
      fetchMaintenanceCases(),
      fetchEmployees(),
      fetchPartners(),
      fetchMaintenanceTypes(),
      fetchConfigs()
    ]).then(() => {
      console.log('✅ All maintenance data loaded');
    }).catch(error => {
      console.error('❌ Error fetching initial data:', error);
    });
  }, [fetchMaintenanceCases, fetchEmployees, fetchPartners, fetchMaintenanceTypes, fetchConfigs]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-full mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Wrench className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Quản lý bảo trì</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Quản lý và theo dõi các case bảo trì thiết bị
                </p>
                {activeTab === 'cases' && (
                  <div className="mt-2 flex items-center space-x-4 text-xs">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">
                        Đã đánh giá: {filteredMaintenanceCases.filter(isMaintenanceCaseEvaluatedByAdmin).length}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="text-yellow-600">
                        Chưa đánh giá: {filteredMaintenanceCases.filter(case_ => !isMaintenanceCaseEvaluatedByAdmin(case_)).length}
                      </span>
                    </div>
                    {hasActiveFilters() && (
                      <div className="flex items-center space-x-1">
                        <Search className="h-4 w-4 text-blue-500" />
                        <span className="text-blue-600">
                          Đang lọc: {filteredMaintenanceCases.length}/{maintenanceCases.length}
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
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 transition-all duration-200 shadow-sm"
                >
                  <Wrench className="h-4 w-4" />
                  <span className="font-medium">Tạo Case</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="mt-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('cases')}
                className={`py-2 px-1 border-b-2 font-medium text-sm cursor-pointer ${
                  activeTab === 'cases'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Danh sách bảo trì</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    hasActiveFilters() 
                      ? 'bg-orange-100 text-orange-600' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {hasActiveFilters() ? `${filteredMaintenanceCases.length}/${maintenanceCases.length}` : maintenanceCases.length}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('config')}
                className={`py-2 px-1 border-b-2 font-medium text-sm cursor-pointer ${
                  activeTab === 'config'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Cấu hình</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
                    {maintenanceTypes.length}
                  </span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-full mx-auto px-2 py-8">

          {/* Cases Tab Content */}
          {activeTab === 'cases' ? (
            <div className="space-y-6">
              {/* Search and Filter Bar */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-3 py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-orange-100 rounded-md">
                        <Search className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">Tìm kiếm & Lọc</h3>
                        <p className="text-xs text-gray-600">Tìm kiếm và lọc case bảo trì theo nhiều tiêu chí</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={handleExport}
                        disabled={filteredMaintenanceCases.length === 0}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span className="text-sm font-medium">Xuất Excel</span>
                      </button>
                      <button 
                        onClick={() => fetchMaintenanceCases(true)}
                        disabled={loading}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                        title="Làm mới danh sách bảo trì"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span className="text-sm font-medium">Làm mới</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3">
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
                          placeholder="Tìm kiếm theo tên case bảo trì, người báo cáo, người xử lý..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
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
                            {employees.map((employee) => (
                              <option key={employee.id} value={employee.id}>
                                {employee.fullName}
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

                        {/* Maintenance Type Filter */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            <div className="flex items-center space-x-1.5">
                              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                              <span>Loại bảo trì</span>
                            </div>
                          </label>
                          <select
                            value={selectedMaintenanceType}
                            onChange={(e) => setSelectedMaintenanceType(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                          >
                            <option value="">Tất cả loại bảo trì</option>
                            {uniqueMaintenanceTypes.map((type) => (
                              <option key={type} value={type}>
                                {formatMaintenanceType(type)}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Customer Filter */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            <div className="flex items-center space-x-1.5">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                              <span>Khách hàng</span>
                            </div>
                          </label>
                          <select
                            value={selectedCustomer}
                            onChange={(e) => setSelectedCustomer(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                          >
                            <option value="">Tất cả khách hàng</option>
                            {partners.map((partner) => (
                              <option key={partner.id} value={partner.id}>
                                {partner.shortName}
                              </option>
                            ))}
                          </select>
                        </div>

                      </div>

                      {/* Date Range Filters */}
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            <div className="flex items-center space-x-1.5">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                              <span>Đến ngày</span>
                            </div>
                          </label>
                          <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                          />
                        </div>
                      </div>
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
                          {selectedHandler && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
                              Xử lý: {employees.find(e => e.id === selectedHandler)?.fullName || selectedHandler}
                            </span>
                          )}
                          {selectedStatus && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1"></div>
                              Trạng thái: {getStatusLabel(selectedStatus)}
                            </span>
                          )}
                          {selectedMaintenanceType && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1"></div>
                              Loại: {formatMaintenanceType(selectedMaintenanceType)}
                            </span>
                          )}
                          {selectedCustomer && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1"></div>
                              Khách hàng: {partners.find(p => p.id === selectedCustomer)?.shortName || selectedCustomer}
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
                <div className="flex items-center justify-between px-3 py-3 border-t border-gray-200">
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

          {/* Maintenance Cases Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                <span className="ml-2 text-gray-600">Đang tải...</span>
              </div>
            ) : filteredMaintenanceCases.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Không có case bảo trì nào</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {hasActiveFilters()
                    ? 'Không tìm thấy case bảo trì phù hợp với bộ lọc.'
                    : 'Chưa có case bảo trì nào được tạo.'}
                </p>
              </div>
            ) : (
              <>
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
                    {paginatedMaintenanceCases.map((case_, index) => (
                      <React.Fragment key={case_.id}>
                        <tr 
                          className={`hover:bg-gray-50/50 transition-colors duration-150 cursor-pointer ${
                            !isMaintenanceCaseEvaluatedByAdmin(case_) ? 'bg-yellow-50/50 border-l-4 border-l-yellow-400' : ''
                          }`}
                          onClick={() => toggleRowExpansion(case_.id)}
                        >
                          {/* STT */}
                          <td className="px-2 py-4 whitespace-nowrap text-center w-16">
                            <span className="text-xs font-medium text-gray-600">
                              {totalItems - startIndex - index}
                            </span>
                          </td>
                          
                          {/* Thông tin case */}
                          <td className="px-2 py-4 whitespace-nowrap w-64">
                            <div>
                              <div className="text-xs font-medium text-gray-900">
                                {case_.title}
                              </div>
                              <div className="text-xs text-gray-500">
                                Tạo: {new Date(case_.createdAt).toLocaleString('vi-VN')}
                              </div>
                            </div>
                          </td>
                          
                          {/* Người xử lý */}
                          <td className="px-2 py-4 whitespace-nowrap w-32">
                            <div className="text-xs text-gray-900">{case_.handler.fullName}</div>
                            <div className="text-xs text-gray-500">{case_.handler.position}</div>
                          </td>
                          
                          {/* Khách hàng */}
                          <td className="px-2 py-4 whitespace-nowrap w-48">
                            <div className="text-xs font-medium text-gray-900">
                              {case_.customer?.shortName || case_.customerName || 'N/A'}
                            </div>
                          </td>
                          
                          {/* Trạng thái */}
                          <td className="px-2 py-4 whitespace-nowrap w-24">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(case_.status)}`}>
                              {getStatusLabel(case_.status)}
                            </span>
                          </td>
                          
                          {/* Thời gian */}
                          <td className="px-2 py-4 whitespace-nowrap text-xs text-gray-900 w-36">
                            <div>Bắt đầu: {new Date(case_.startDate).toLocaleString('vi-VN', { 
                              year: 'numeric', 
                              month: '2-digit', 
                              day: '2-digit', 
                              hour: '2-digit', 
                              minute: '2-digit',
                              timeZone: 'Asia/Ho_Chi_Minh'
                            })}</div>
                            {case_.endDate && (
                              <div>Kết thúc: {new Date(case_.endDate).toLocaleString('vi-VN', { 
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
                            {case_.userDifficultyLevel && case_.userEstimatedTime && case_.userImpactLevel && case_.userUrgencyLevel ? (
                              <span className="text-xs font-medium text-blue-600">
                                {case_.userDifficultyLevel + case_.userEstimatedTime + case_.userImpactLevel + case_.userUrgencyLevel}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                          
                          {/* Điểm Admin */}
                          <td className="px-2 py-4 whitespace-nowrap text-center w-24">
                            {isMaintenanceCaseEvaluatedByAdmin(case_) ? (
                              <span className="text-xs font-medium text-green-600">
                                {(case_.adminDifficultyLevel || 0) + (case_.adminEstimatedTime || 0) + (case_.adminImpactLevel || 0) + (case_.adminUrgencyLevel || 0)}
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
                              const userScore = case_.userDifficultyLevel && case_.userEstimatedTime && case_.userImpactLevel && case_.userUrgencyLevel 
                                ? case_.userDifficultyLevel + case_.userEstimatedTime + case_.userImpactLevel + case_.userUrgencyLevel 
                                : 0;
                              const adminScore = case_.adminDifficultyLevel && case_.adminEstimatedTime && case_.adminImpactLevel && case_.adminUrgencyLevel 
                                ? case_.adminDifficultyLevel + case_.adminEstimatedTime + case_.adminImpactLevel + case_.adminUrgencyLevel 
                                : 0;
                              const totalScore = userScore + adminScore;
                              const isAdminEvaluated = isMaintenanceCaseEvaluatedByAdmin(case_);
                              
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
                                  setEditingMaintenanceCase(case_);
                                  setShowCreateModal(true);
                                }}
                                className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                                title="Chỉnh sửa case"
                              >
                                <Edit className="h-3 w-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMaintenanceCase(case_);
                                  setShowEvaluationModal(true);
                                  setEvaluationForm({
                                    adminDifficultyLevel: case_.adminDifficultyLevel?.toString() || '',
                                    adminEstimatedTime: case_.adminEstimatedTime?.toString() || '',
                                    adminImpactLevel: case_.adminImpactLevel?.toString() || '',
                                    adminUrgencyLevel: case_.adminUrgencyLevel?.toString() || ''
                                  });
                                }}
                                className={`p-1.5 rounded-md transition-colors duration-200 ${
                                  isMaintenanceCaseEvaluatedByAdmin(case_) 
                                    ? 'text-green-600 hover:bg-green-50' 
                                    : 'text-yellow-600 hover:bg-yellow-50 bg-yellow-100'
                                }`}
                                title={isMaintenanceCaseEvaluatedByAdmin(case_) ? "Đánh giá case" : "⚠️ Chưa đánh giá - Click để đánh giá"}
                              >
                                {isMaintenanceCaseEvaluatedByAdmin(case_) ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMaintenanceCase(case_);
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
                        {expandedRows.has(case_.id) && (
                          <tr>
                            <td colSpan={10} className="px-3 py-6 bg-gray-50" onClick={(e) => e.stopPropagation()}>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Mô tả chi tiết */}
                                <div>
                                  <h4 className="text-xs font-medium text-gray-900 mb-2 flex items-center">
                                    <FileText className="h-3 w-3 mr-2 text-blue-600" />
                                    Mô tả chi tiết
                                  </h4>
                                  <p className="text-xs text-gray-600 leading-relaxed">{case_.description}</p>
                                </div>
                                
                                {/* Tên công ty đầy đủ */}
                                <div>
                                  <h4 className="text-xs font-medium text-gray-900 mb-2 flex items-center">
                                    <AlertTriangle className="h-3 w-3 mr-2 text-orange-600" />
                                    Tên công ty đầy đủ
                                  </h4>
                                  <div className="text-xs text-gray-600">
                                    <div className="font-medium text-gray-900">
                                      {case_.customer?.fullCompanyName || case_.customerName || 'N/A'}
                                    </div>
                                    {case_.customer?.contactPerson && (
                                      <div className="mt-1 text-gray-500">
                                        Người liên hệ: {case_.customer.contactPerson}
                                      </div>
                                    )}
                                    <div className="mt-1 text-gray-500">
                                      Loại bảo trì: {case_.maintenanceCaseType?.name || formatMaintenanceType(case_.maintenanceType)}
                                    </div>
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
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between">
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
                            Hiển thị{' '}
                            <span className="font-medium">{startIndex + 1}</span>
                            {' '}đến{' '}
                            <span className="font-medium">
                              {Math.min(endIndex, totalItems)}
                            </span>
                            {' '}của{' '}
                            <span className="font-medium">{totalItems}</span>
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
                              disabled={currentPage === totalPages}
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
                </>
              )}
          </div>
            </div>
        ) : (
          /* Configuration Tab Content */
          <ConfigurationTab
            title="Quản lý loại bảo trì"
            items={maintenanceTypes.map(type => ({
              id: type.id,
              name: type.name,
              description: type.description
            }))}
            onAdd={async (name) => {
              const response = await fetch('/api/maintenance-types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
              });
              if (!response.ok) throw new Error('Failed to add maintenance type');
              await fetchMaintenanceTypes();
            }}
            onEdit={async (id, name) => {
              const response = await fetch(`/api/maintenance-types/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
              });
              if (!response.ok) throw new Error('Failed to update maintenance type');
              await fetchMaintenanceTypes();
            }}
            onDelete={async (id) => {
              const response = await fetch(`/api/maintenance-types/${id}`, {
                method: 'DELETE'
              });
              if (!response.ok) throw new Error('Failed to delete maintenance type');
              await fetchMaintenanceTypes();
            }}
            iconColor="orange"
            placeholder="Nhập tên loại bảo trì..."
          />
        )}
        </div>
      </div>

        {/* Maintenance Type Modal */}
        {showMaintenanceTypeModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="px-4 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingMaintenanceType ? 'Chỉnh sửa loại bảo trì' : 'Thêm loại bảo trì mới'}
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên loại bảo trì *
                    </label>
                    <input
                      type="text"
                      value={editingMaintenanceType ? editingMaintenanceType.name : newMaintenanceType.name}
                      onChange={(e) => {
                        if (editingMaintenanceType) {
                          setEditingMaintenanceType({
                            ...editingMaintenanceType,
                            name: e.target.value
                          });
                        } else {
                          setNewMaintenanceType({
                            ...newMaintenanceType,
                            name: e.target.value
                          });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Nhập tên loại bảo trì"
                    />
                  </div>
                </div>
              </div>
              <div className="px-4 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowMaintenanceTypeModal(false);
                    setEditingMaintenanceType(null);
                    setNewMaintenanceType({ name: '' });
                  }}
                  disabled={addingMaintenanceType}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={editingMaintenanceType ? handleEditMaintenanceType : handleAddMaintenanceType}
                  disabled={addingMaintenanceType}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center"
                >
                  {addingMaintenanceType ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      {editingMaintenanceType ? 'Cập nhật' : 'Thêm mới'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Evaluation Modal */}
        {showEvaluationModal && selectedMaintenanceCase && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="px-4 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Đánh giá Case: {selectedMaintenanceCase.title}</h3>
                <p className="text-sm text-gray-600">Đánh giá mức độ khó, thời gian, ảnh hưởng và khẩn cấp</p>
              </div>
              
              <div className="p-4">
                <div className="space-y-6">
                  {/* User Assessment Display */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-blue-800">Đánh giá của User</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>Mức độ khó: {getDifficultyText(selectedMaintenanceCase.userDifficultyLevel || 0)}</div>
                      <div>Thời gian ước tính: {getEstimatedTimeText(selectedMaintenanceCase.userEstimatedTime || 0)}</div>
                      <div>Mức độ ảnh hưởng: {getImpactText(selectedMaintenanceCase.userImpactLevel || 0)}</div>
                      <div>Mức độ khẩn cấp: {getUrgencyText(selectedMaintenanceCase.userUrgencyLevel || 0)}</div>
                      <div>Hình thức: {getFormText(selectedMaintenanceCase.userFormScore)}</div>
                      <div className="font-medium text-blue-600">
                        Tổng: {((selectedMaintenanceCase.userDifficultyLevel || 0) + (selectedMaintenanceCase.userEstimatedTime || 0) + (selectedMaintenanceCase.userImpactLevel || 0) + (selectedMaintenanceCase.userUrgencyLevel || 0) + (selectedMaintenanceCase.userFormScore || 0))}
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
              
              <div className="px-4 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEvaluationModal(false);
                    setSelectedMaintenanceCase(null);
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
                  onClick={handleEvaluation}
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
        {showDeleteModal && selectedMaintenanceCase && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="px-4 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa case bảo trì</h3>
              </div>
              <div className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <Trash className="h-5 w-5 text-red-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 mb-2">
                      Bạn có chắc chắn muốn xóa case bảo trì này không?
                    </p>
                    <div className="bg-gray-50 rounded-md p-3 text-sm">
                      <div className="font-medium text-gray-900">{selectedMaintenanceCase.title}</div>
                      <div className="text-gray-600 mt-1">
                        <div>Người báo cáo: {selectedMaintenanceCase.reporter.fullName}</div>
                        <div>Người xử lý: {selectedMaintenanceCase.handler.fullName}</div>
                        <div>Thiết bị: {selectedMaintenanceCase.equipment?.name || 'Không có thông tin thiết bị'}</div>
                      </div>
                    </div>
                    <p className="text-xs text-red-600 mt-2">
                      ⚠️ Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-4 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedMaintenanceCase(null);
                  }}
                  disabled={deleting}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDelete}
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
                      Xóa case bảo trì
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Maintenance Modal */}
        <CreateMaintenanceModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setEditingMaintenanceCase(null);
          }}
          editingMaintenance={editingMaintenanceCase}
          employees={employees}
          customers={partners}
          maintenanceTypes={maintenanceTypes}
          onSuccess={(maintenance: any) => {
            console.log('Maintenance saved:', maintenance);
            
            if (editingMaintenanceCase) {
              // Update existing case in state (no reload needed)
              setMaintenanceCases(prev => prev.map(c => 
                c.id === maintenance.id ? maintenance as MaintenanceCase : c
              ));
              toast.success('Cập nhật case bảo trì thành công!');
            } else {
              // Add new case to the beginning of the list
              setMaintenanceCases(prev => [maintenance as MaintenanceCase, ...prev]);
              toast.success('Tạo case bảo trì thành công!');
            }
            
            setEditingMaintenanceCase(null);
          }}
        />
    </div>
  );
}
