'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Settings, Wrench, FileText, Calendar, Zap, Search, RefreshCw, Eye, Edit, Trash, AlertTriangle, CheckCircle, Download, ChevronDown, ChevronRight } from 'lucide-react';
import { useEvaluationForm } from '@/hooks/useEvaluation';
import { useEvaluation } from '@/contexts/EvaluationContext';
import { EvaluationType, EvaluationCategory } from '@/contexts/EvaluationContext';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

interface Employee {
  id: string;
  fullName: string;
  position: string;
  department: string;
}

interface Equipment {
  id: string;
  name: string;
  model?: string;
  serialNumber?: string;
  location?: string;
}

interface MaintenanceCase {
  id: string;
  title: string;
  description: string;
  reporter: Employee;
  handler: Employee;
  maintenanceType: string;
  equipment: Equipment;
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
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMaintenanceCase, setSelectedMaintenanceCase] = useState<MaintenanceCase | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deletedMaintenanceCases, setDeletedMaintenanceCases] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  // States for maintenance cases list
  const [maintenanceCases, setMaintenanceCases] = useState<MaintenanceCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'config' | 'cases'>('cases');
  
  // Filter states
  const [selectedHandler, setSelectedHandler] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedMaintenanceType, setSelectedMaintenanceType] = useState<string>('');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('');
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

  // Maintenance Type Management States
  const [maintenanceTypes, setMaintenanceTypes] = useState<string[]>([]);
  const [maintenanceTypesLoading, setMaintenanceTypesLoading] = useState(true);
  const [newMaintenanceType, setNewMaintenanceType] = useState('');
  const [addingMaintenanceType, setAddingMaintenanceType] = useState(false);

  // Equipment Management States
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [equipmentLoading, setEquipmentLoading] = useState(true);
  const [newEquipment, setNewEquipment] = useState({
    name: '',
    model: '',
    serialNumber: '',
    location: ''
  });
  const [addingEquipment, setAddingEquipment] = useState(false);

  // Employees list for filters
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Fetch maintenance cases
  const fetchMaintenanceCases = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/maintenance-cases', {
        method: 'GET',
        headers: {
          'Cache-Control': 'max-age=60',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        setMaintenanceCases(result.data || []);
      } else {
        console.error('Failed to fetch maintenance cases:', response.status, response.statusText);
        setMaintenanceCases([]);
      }
    } catch (error) {
      console.error('Error fetching maintenance cases:', error);
      setMaintenanceCases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    try {
      const response = await fetch('/api/employees/list', {
        method: 'GET',
        headers: {
          'Cache-Control': 'max-age=300',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      } else {
        console.error('Failed to fetch employees:', response.status, response.statusText);
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    }
  }, []);

  // Fetch equipment
  const fetchEquipment = useCallback(async () => {
    try {
      setEquipmentLoading(true);
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
    } finally {
      setEquipmentLoading(false);
    }
  }, []);

  // Get unique maintenance types from data
  const getUniqueMaintenanceTypes = () => {
    const types = maintenanceCases
      .map(case_ => case_.maintenanceType)
      .filter((type, index, arr) => arr.indexOf(type) === index);
    return types.sort();
  };

  // Get unique statuses from data
  const getUniqueStatuses = () => {
    const statuses = maintenanceCases
      .map(case_ => case_.status)
      .filter((status, index, arr) => arr.indexOf(status) === index);
    return statuses.sort();
  };

  // Filter maintenance cases
  const filteredMaintenanceCases = maintenanceCases.filter(case_ => {
    const matchesSearch = !searchTerm || 
      case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.reporter.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.handler.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.equipment.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesHandler = !selectedHandler || case_.handler.id === selectedHandler;
    const matchesStatus = !selectedStatus || case_.status === selectedStatus;
    const matchesMaintenanceType = !selectedMaintenanceType || case_.maintenanceType === selectedMaintenanceType;
    const matchesEquipment = !selectedEquipment || case_.equipment.id === selectedEquipment;

    const matchesDateFrom = !dateFrom || new Date(case_.startDate) >= new Date(dateFrom);
    const matchesDateTo = !dateTo || new Date(case_.startDate) <= new Date(dateTo);

    return matchesSearch && matchesHandler && matchesStatus && 
           matchesMaintenanceType && matchesEquipment && 
           matchesDateFrom && matchesDateTo;
  });

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMaintenanceCases();
    setRefreshing(false);
  };

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
        toast.success('Đánh giá thành công!');
        setShowEvaluationModal(false);
        setSelectedMaintenanceCase(null);
        setEvaluationForm({
          adminDifficultyLevel: '',
          adminEstimatedTime: '',
          adminImpactLevel: '',
          adminUrgencyLevel: ''
        });
        await fetchMaintenanceCases();
      } else {
        toast.error('Lỗi khi đánh giá!');
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
        await fetchMaintenanceCases();
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

  // Export to Excel
  const handleExport = () => {
    const exportData = filteredMaintenanceCases.map(case_ => ({
      'ID': case_.id,
      'Tiêu đề': case_.title,
      'Mô tả': case_.description,
      'Người báo cáo': case_.reporter.fullName,
      'Người xử lý': case_.handler.fullName,
      'Loại bảo trì': case_.maintenanceType,
      'Thiết bị': case_.equipment.name,
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

  // Check if maintenance case is evaluated by admin
  const isMaintenanceCaseEvaluatedByAdmin = (case_: MaintenanceCase) => {
    return case_.adminDifficultyLevel && 
           case_.adminEstimatedTime && 
           case_.adminImpactLevel && 
           case_.adminUrgencyLevel;
  };

  // Check if there are active filters
  const hasActiveFilters = searchTerm || selectedHandler || selectedStatus || selectedMaintenanceType || selectedEquipment || dateFrom || dateTo;

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
    fetchMaintenanceCases();
    fetchEmployees();
    fetchEquipment();
    fetchConfigs();
  }, [fetchMaintenanceCases, fetchEmployees, fetchEquipment, fetchConfigs]);

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
                    {hasActiveFilters && (
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
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Làm mới"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Xuất Excel</span>
              </button>
            </div>
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
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'cases'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Danh sách bảo trì</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    hasActiveFilters 
                      ? 'bg-orange-100 text-orange-600' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {hasActiveFilters ? `${filteredMaintenanceCases.length}/${maintenanceCases.length}` : maintenanceCases.length}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('config')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'config'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Cấu hình</span>
                </div>
              </button>
            </nav>
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
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3 border-b border-gray-100">
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
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span className="text-sm font-medium">Xuất Excel</span>
                      </button>
                      <button 
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50 shadow-sm"
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
                            {getUniqueStatuses().map((status) => (
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
                            {getUniqueMaintenanceTypes().map((type) => (
                              <option key={type} value={type}>
                                {formatMaintenanceType(type)}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Equipment Filter */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            <div className="flex items-center space-x-1.5">
                              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                              <span>Thiết bị</span>
                            </div>
                          </label>
                          <select
                            value={selectedEquipment}
                            onChange={(e) => setSelectedEquipment(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                          >
                            <option value="">Tất cả thiết bị</option>
                            {equipment.map((eq) => (
                              <option key={eq.id} value={eq.id}>
                                {eq.name}
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
              </div>

            {/* Maintenance Cases Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Đang tải...</p>
                </div>
              ) : filteredMaintenanceCases.length === 0 ? (
                <div className="p-8 text-center">
                  <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Không có case bảo trì nào</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Case Bảo Trì
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Người Xử Lý
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thiết Bị
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trạng Thái
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thời Gian
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thao Tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredMaintenanceCases.map((case_) => (
                        <React.Fragment key={case_.id}>
                          <tr className={`hover:bg-gray-50 ${deletedMaintenanceCases.has(case_.id) ? 'opacity-50' : ''}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <button
                                  onClick={() => toggleRowExpansion(case_.id)}
                                  className="mr-2 p-1 hover:bg-gray-200 rounded"
                                >
                                  {expandedRows.has(case_.id) ? (
                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-gray-500" />
                                  )}
                                </button>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {case_.title}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {formatMaintenanceType(case_.maintenanceType)}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{case_.handler.fullName}</div>
                              <div className="text-sm text-gray-500">{case_.handler.position}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{case_.equipment.name}</div>
                              <div className="text-sm text-gray-500">{case_.equipment.location}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(case_.status)}`}>
                                {getStatusLabel(case_.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div>{new Date(case_.startDate).toLocaleDateString('vi-VN')}</div>
                              {case_.endDate && (
                                <div className="text-gray-500">
                                  {new Date(case_.endDate).toLocaleDateString('vi-VN')}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => {
                                    setSelectedMaintenanceCase(case_);
                                    setShowEvaluationModal(true);
                                  }}
                                  className="text-orange-600 hover:text-orange-900"
                                  title="Đánh giá"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedMaintenanceCase(case_);
                                    setShowDeleteModal(true);
                                  }}
                                  className="text-red-600 hover:text-red-900"
                                  title="Xóa"
                                >
                                  <Trash className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expandedRows.has(case_.id) && (
                            <tr>
                              <td colSpan={6} className="px-6 py-4 bg-gray-50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Thông tin chi tiết</h4>
                                    <div className="space-y-1 text-sm text-gray-600">
                                      <p><span className="font-medium">Mô tả:</span> {case_.description}</p>
                                      <p><span className="font-medium">Người báo cáo:</span> {case_.reporter.fullName}</p>
                                      <p><span className="font-medium">Ghi chú:</span> {case_.notes || 'Không có'}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Đánh giá</h4>
                                    <div className="space-y-1 text-sm text-gray-600">
                                      <p><span className="font-medium">Khó (User):</span> {case_.userDifficultyLevel || 'Chưa đánh giá'}</p>
                                      <p><span className="font-medium">Thời gian (User):</span> {case_.userEstimatedTime || 'Chưa đánh giá'}</p>
                                      <p><span className="font-medium">Ảnh hưởng (User):</span> {case_.userImpactLevel || 'Chưa đánh giá'}</p>
                                      <p><span className="font-medium">Khẩn cấp (User):</span> {case_.userUrgencyLevel || 'Chưa đánh giá'}</p>
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
            <div className="space-y-6">
              {/* Config Tab Content */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Cấu hình hệ thống</h3>
                <p className="text-gray-600">Các tùy chọn cấu hình sẽ được thêm vào đây.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Evaluation Modal */}
      {showEvaluationModal && selectedMaintenanceCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Đánh giá Case Bảo Trì
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mức độ khó
                  </label>
                  <select
                    value={evaluationForm.adminDifficultyLevel}
                    onChange={(e) => setEvaluationForm(prev => ({ ...prev, adminDifficultyLevel: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Chọn mức độ khó</option>
                    {getFieldOptions(EvaluationCategory.DIFFICULTY).map((option) => (
                      <option key={option.id} value={option.points}>
                        {option.points} - {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thời gian ước tính
                  </label>
                  <select
                    value={evaluationForm.adminEstimatedTime}
                    onChange={(e) => setEvaluationForm(prev => ({ ...prev, adminEstimatedTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Chọn thời gian ước tính</option>
                    {getFieldOptions(EvaluationCategory.TIME).map((option) => (
                      <option key={option.id} value={option.points}>
                        {option.points} - {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mức độ ảnh hưởng
                  </label>
                  <select
                    value={evaluationForm.adminImpactLevel}
                    onChange={(e) => setEvaluationForm(prev => ({ ...prev, adminImpactLevel: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Chọn mức độ ảnh hưởng</option>
                    {getFieldOptions(EvaluationCategory.IMPACT).map((option) => (
                      <option key={option.id} value={option.points}>
                        {option.points} - {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mức độ khẩn cấp
                  </label>
                  <select
                    value={evaluationForm.adminUrgencyLevel}
                    onChange={(e) => setEvaluationForm(prev => ({ ...prev, adminUrgencyLevel: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEvaluationModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleEvaluation}
                  disabled={evaluating}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {evaluating ? 'Đang đánh giá...' : 'Đánh giá'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedMaintenanceCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-red-100 rounded-lg mr-3">
                  <Trash className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  Xác nhận xóa
                </h3>
              </div>
              <p className="text-gray-600 mb-6">
                Bạn có chắc chắn muốn xóa case bảo trì "{selectedMaintenanceCase.title}"? 
                Hành động này không thể hoàn tác.
              </p>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Đang xóa...' : 'Xóa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
