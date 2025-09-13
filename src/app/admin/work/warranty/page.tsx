'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Plus, Settings, Shield, FileText, Calendar, Zap, Search, RefreshCw, Eye, Edit, Trash, AlertTriangle, CheckCircle, Download, X } from 'lucide-react';
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

interface Warranty {
  id: string;
  title: string;
  description: string;
  customerName: string;
  handler: Employee;
  warrantyType: string | { id: string; name: string; description?: string };
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

export default function AdminWarrantyWorkPage() {
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
  const [selectedWarranty, setSelectedWarranty] = useState<Warranty | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deletedWarranties, setDeletedWarranties] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  // States for incidents list
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'config' | 'cases'>('cases');
  
  // Filter states
  const [selectedHandler, setSelectedHandler] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedWarrantyType, setSelectedWarrantyType] = useState<string>('');
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
  const [warrantyTypes, setWarrantyTypes] = useState<Array<{id: string, name: string, description?: string}>>([]);
  const [warrantyTypesLoading, setWarrantyTypesLoading] = useState(true);
  const [showWarrantyTypeModal, setShowWarrantyTypeModal] = useState(false);
  const [editingWarrantyType, setEditingWarrantyType] = useState<{id: string, name: string} | null>(null);
  const [warrantyTypeForm, setWarrantyTypeForm] = useState({
    name: '',
    isActive: true
  });
  
  // Inline editing states
  const [isAddingNewRow, setIsAddingNewRow] = useState(false);
  const [newWarrantyTypeName, setNewWarrantyTypeName] = useState('');
  const [saving, setSaving] = useState(false);

  // Helper function to check if warranty is evaluated by admin
  const isWarrantyEvaluatedByAdmin = (warranty: Warranty) => {
    return warranty.adminDifficultyLevel !== null && 
           warranty.adminDifficultyLevel !== undefined &&
           warranty.adminEstimatedTime !== null && 
           warranty.adminEstimatedTime !== undefined &&
           warranty.adminImpactLevel !== null && 
           warranty.adminImpactLevel !== undefined &&
           warranty.adminUrgencyLevel !== null && 
           warranty.adminUrgencyLevel !== undefined;
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

  // Fetch warranties from API with caching and retry
  const fetchWarranties = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/warranties', {
        method: 'GET',
        headers: {
          'Cache-Control': 'max-age=60',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setWarranties(data.data || []);
      } else if (response.status === 401 && retryCount < 2) {
        // Retry on auth error
        setTimeout(() => fetchWarranties(retryCount + 1), 1000);
        return;
      } else {
        console.error('Failed to fetch incidents:', response.status, response.statusText);
        setWarranties([]);
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
      if (retryCount < 2) {
        setTimeout(() => fetchWarranties(retryCount + 1), 1000);
        return;
      }
      setWarranties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh warranties
  const refreshWarranties = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/warranties', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setWarranties(data.data || []);
        toast.success('Danh sách bảo hành đã được cập nhật');
      } else {
        console.error('Failed to refresh incidents');
        toast.error('Không thể cập nhật danh sách bảo hành');
      }
    } catch (error) {
      console.error('Error refreshing incidents:', error);
      toast.error('Lỗi khi cập nhật danh sách bảo hành');
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Delete warranty
  const deleteWarranty = useCallback(async (warrantyId: string) => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/warranties/${warrantyId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setWarranties(prev => prev.filter(warranty => warranty.id !== warrantyId));
        setDeletedWarranties(prev => new Set([...prev, warrantyId]));
        toast.success('Xóa bảo hành thành công');
        setShowDeleteModal(false);
        setSelectedWarranty(null);
      } else {
        try {
          const errorData = await response.json();
          toast.error(errorData.error || 'Không thể xóa bảo hành');
        } catch (jsonError) {
          console.error('Failed to parse error response:', jsonError);
          toast.error(`Không thể xóa bảo hành (${response.status}: ${response.statusText})`);
        }
      }
    } catch (error) {
      console.error('Error deleting incident:', error);
      toast.error('Lỗi khi xóa bảo hành');
    } finally {
      setDeleting(false);
    }
  }, []);

  // Toggle row expansion
  const toggleRowExpansion = useCallback((warrantyId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(warrantyId)) {
        newSet.delete(warrantyId);
      } else {
        newSet.add(warrantyId);
      }
      return newSet;
    });
  }, []);

  // Check if any filters are active
  const hasActiveFilters = useCallback(() => {
    return searchTerm !== '' || 
           selectedHandler !== '' || 
           selectedStatus !== '' || 
           selectedWarrantyType !== '' || 
           selectedCustomer !== '' || 
           dateFrom !== '' || 
           dateTo !== '';
  }, [searchTerm, selectedHandler, selectedStatus, selectedWarrantyType, selectedCustomer, dateFrom, dateTo]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedHandler('');
    setSelectedStatus('');
    setSelectedWarrantyType('');
    setSelectedCustomer('');
    setDateFrom('');
    setDateTo('');
  }, []);

  // Filter warranties (memoized for performance)
  const filteredWarranties = useMemo(() => warranties.filter(warranty => {
    const matchesSearch = !searchTerm || 
      warranty.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warranty.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warranty.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warranty.handler.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeof warranty.warrantyType === 'string' ? warranty.warrantyType : warranty.warrantyType.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (warranty.customer?.fullCompanyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (warranty.customer?.shortName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesHandler = !selectedHandler || warranty.handler.id === selectedHandler;
    const matchesStatus = !selectedStatus || warranty.status === selectedStatus;
    const matchesWarrantyType = !selectedWarrantyType || 
      (typeof warranty.warrantyType === 'string' ? warranty.warrantyType : warranty.warrantyType.name) === selectedWarrantyType;
    const matchesCustomer = !selectedCustomer || warranty.customer?.id === selectedCustomer;
    
    const matchesDateFrom = !dateFrom || new Date(warranty.startDate) >= new Date(dateFrom);
    const matchesDateTo = !dateTo || new Date(warranty.startDate) <= new Date(dateTo);

    return matchesSearch && matchesHandler && matchesStatus && matchesWarrantyType && 
           matchesCustomer && matchesDateFrom && matchesDateTo;
  }), [warranties, searchTerm, selectedHandler, selectedStatus, selectedWarrantyType, selectedCustomer, dateFrom, dateTo]);

  // Get unique values for filters (memoized for performance)
  const uniqueHandlers = useMemo(() => 
    Array.from(new Set(warranties.map(warranty => warranty.handler.id)))
      .map(id => warranties.find(warranty => warranty.handler.id === id)?.handler)
      .filter(Boolean) as Employee[], [warranties]);

  const uniqueStatuses = useMemo(() => 
    Array.from(new Set(warranties.map(warranty => warranty.status))), [warranties]);
    
  const uniqueWarrantyTypes = useMemo(() => 
    Array.from(new Set(warranties.map(warranty => 
      typeof warranty.warrantyType === 'string' ? warranty.warrantyType : warranty.warrantyType.name
    ))), [warranties]);
    
  const uniqueCustomers = useMemo(() => 
    Array.from(new Set(warranties.map(warranty => warranty.customer?.id).filter(Boolean)))
      .map(id => warranties.find(warranty => warranty.customer?.id === id)?.customer)
      .filter(Boolean), [warranties]);

  // Handle evaluation submission
  const handleEvaluationSubmit = useCallback(async () => {
    if (!selectedWarranty) return;

    setEvaluating(true);
    try {
      const response = await fetch(`/api/warranties/${selectedWarranty.id}/evaluation`, {
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
        setWarranties(prev => prev.map(warranty => 
          warranty.id === selectedWarranty.id ? data.data : warranty
        ));
        toast.success('Đánh giá bảo hành thành công');
        setShowEvaluationModal(false);
        setSelectedWarranty(null);
        setEvaluationForm({
          adminDifficultyLevel: '',
          adminEstimatedTime: '',
          adminImpactLevel: '',
          adminUrgencyLevel: ''
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Không thể đánh giá bảo hành');
      }
    } catch (error) {
      console.error('Error evaluating incident:', error);
      toast.error('Lỗi khi đánh giá bảo hành');
    } finally {
      setEvaluating(false);
    }
  }, [selectedWarranty, evaluationForm]);

  // Export to Excel
  const exportToExcel = useCallback(() => {
    const exportData = filteredWarranties.map(warranty => ({
      'Tiêu đề': warranty.title,
      'Mô tả': warranty.description,
      'Tên khách hàng': warranty.customerName,
      'Người xử lý': warranty.handler.fullName,
      'Loại bảo hành': typeof warranty.warrantyType === 'string' ? warranty.warrantyType : warranty.warrantyType.name,
      'Khách hàng': warranty.customer?.fullCompanyName || 'N/A',
      'Trạng thái': warranty.status,
      'Ngày bắt đầu': new Date(warranty.startDate).toLocaleDateString('vi-VN'),
      'Ngày kết thúc': warranty.endDate ? new Date(warranty.endDate).toLocaleDateString('vi-VN') : 'Chưa hoàn thành',
      'Ngày tạo': new Date(warranty.createdAt).toLocaleDateString('vi-VN'),
      'Độ khó (User)': warranty.userDifficultyLevel || 'N/A',
      'Thời gian ước tính (User)': warranty.userEstimatedTime || 'N/A',
      'Tác động (User)': warranty.userImpactLevel || 'N/A',
      'Độ khẩn cấp (User)': warranty.userUrgencyLevel || 'N/A',
      'Độ khó (Admin)': warranty.adminDifficultyLevel || 'N/A',
      'Thời gian ước tính (Admin)': warranty.adminEstimatedTime || 'N/A',
      'Tác động (Admin)': warranty.adminImpactLevel || 'N/A',
      'Độ khẩn cấp (Admin)': warranty.adminUrgencyLevel || 'N/A',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách sự cố');
    
    const fileName = `danh-sach-bao-hanh-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success('Xuất file Excel thành công');
  }, [filteredWarranties]);

  // Fetch warranty types from API
  const fetchWarrantyTypes = useCallback(async () => {
    try {
      setWarrantyTypesLoading(true);
      const response = await fetch(`/api/warranty-types?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Store full objects with id, name, and description
        const types = data.data || [];
        setWarrantyTypes(types);
      } else {
        console.error('Failed to fetch incident types');
        setWarrantyTypes([]);
      }
    } catch (error) {
      console.error('Error fetching incident types:', error);
      setWarrantyTypes([]);
    } finally {
      setWarrantyTypesLoading(false);
    }
  }, []);

  // Warranty Type Management Functions
  const handleAddWarrantyType = () => {
    setIsAddingNewRow(true);
    setNewWarrantyTypeName('');
  };

  const handleEditWarrantyType = (type: {id: string, name: string}) => {
    setEditingWarrantyType(type);
    setWarrantyTypeForm({
      name: type.name,
      isActive: true
    });
    setShowWarrantyTypeModal(true);
  };

  const handleDeleteWarrantyType = async (type: {id: string, name: string}) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa loại bảo hành "${type.name}"?`)) {
      try {
        const response = await fetch(`/api/warranty-types/${type.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          // Remove from local state
          setWarrantyTypes(prev => prev.filter(t => t.id !== type.id));
          toast.success('Xóa loại bảo hành thành công');
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || 'Lỗi khi xóa loại bảo hành');
        }
      } catch (error) {
        console.error('Error deleting incident type:', error);
        toast.error('Lỗi khi xóa loại bảo hành');
      }
    }
  };

  const handleSaveNewIncidentType = async () => {
    if (!newWarrantyTypeName.trim()) {
      toast.error('Vui lòng nhập tên loại sự cố');
      return;
    }

    if (warrantyTypes.some(type => type.name === newWarrantyTypeName.trim())) {
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
          name: newWarrantyTypeName.trim(),
          description: null
        }),
      });

      if (response.ok) {
        setNewWarrantyTypeName('');
        setIsAddingNewRow(false);
        toast.success('Thêm loại sự cố thành công');
        // Refresh the list
        await fetchWarrantyTypes();
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
    setNewWarrantyTypeName('');
  };

  const handleSubmitIncidentTypeForm = async () => {
    if (!warrantyTypeForm.name.trim()) {
      toast.error('Vui lòng nhập tên loại sự cố');
      return;
    }

    setSaving(true);
    try {
      if (editingWarrantyType) {
        // Update existing type
        const response = await fetch(`/api/warranty-types/${editingWarrantyType.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: warrantyTypeForm.name.trim(),
            description: null,
            isActive: warrantyTypeForm.isActive
          }),
        });

        if (response.ok) {
          toast.success('Cập nhật loại sự cố thành công');
          // Refresh the list to sync with API
          await fetchWarrantyTypes();
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || 'Lỗi khi cập nhật loại sự cố');
          return;
        }
      } else {
        // Add new type
        if (warrantyTypes.some(type => type.name === warrantyTypeForm.name.trim())) {
          toast.error('Loại sự cố này đã tồn tại');
          return;
        }

        const response = await fetch('/api/incident-types', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: warrantyTypeForm.name.trim(),
            description: null
          }),
        });

        if (response.ok) {
          toast.success('Thêm loại sự cố thành công');
          // Refresh the list to sync with API
          await fetchWarrantyTypes();
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || 'Lỗi khi thêm loại sự cố');
          return;
        }
      }
      
      setShowWarrantyTypeModal(false);
      setEditingWarrantyType(null);
      setWarrantyTypeForm({ name: '', isActive: true });
    } catch (error) {
      console.error('Error saving incident type:', error);
      toast.error('Lỗi khi lưu loại sự cố');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseIncidentTypeModal = () => {
    setShowWarrantyTypeModal(false);
    setEditingWarrantyType(null);
    setWarrantyTypeForm({ name: '', isActive: true });
  };

  // Load data on component mount
  useEffect(() => {
    fetchWarranties();
    fetchConfigs();
    fetchWarrantyTypes();
  }, [fetchWarranties, fetchConfigs, fetchWarrantyTypes]);

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


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-full mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Quản lý bảo hành</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Quản lý và theo dõi các yêu cầu bảo hành
                </p>
                {activeTab === 'cases' && (
                  <div className="mt-2 flex items-center space-x-4 text-xs">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">
                        Đã đánh giá: {filteredWarranties.filter(isWarrantyEvaluatedByAdmin).length}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="text-yellow-600">
                        Chưa đánh giá: {filteredWarranties.filter(warranty => !isWarrantyEvaluatedByAdmin(warranty)).length}
                      </span>
                    </div>
                    {hasActiveFilters() && (
                      <div className="flex items-center space-x-1">
                        <Search className="h-4 w-4 text-blue-500" />
                        <span className="text-blue-600">
                          Đang lọc: {filteredWarranties.length}/{warranties.length}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
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
                    <span>Danh sách bảo hành</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      hasActiveFilters() 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {hasActiveFilters() ? `${filteredWarranties.length}/${warranties.length}` : warranties.length}
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
                      <p className="text-xs text-gray-600">Tìm kiếm và lọc bảo hành theo nhiều tiêu chí</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={exportToExcel}
                      disabled={filteredWarranties.length === 0}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="text-sm font-medium">Xuất Excel</span>
                    </button>
                    <button 
                      onClick={refreshWarranties}
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
                        placeholder="Tìm kiếm theo tên bảo hành, người báo cáo, người xử lý..."
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
                            <span>Loại bảo hành</span>
                          </div>
                        </label>
                        <select
                          value={selectedWarrantyType}
                          onChange={(e) => setSelectedWarrantyType(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                        >
                          <option value="">Tất cả loại bảo hành</option>
                          {uniqueWarrantyTypes.map((type) => (
                            <option key={type} value={type}>
                              {formatWarrantyType(type)}
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
                          {selectedWarrantyType && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1"></div>
                              Loại: {formatWarrantyType(selectedWarrantyType)}
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
                    Hiển thị <span className="font-medium text-gray-900">{filteredWarranties.length}</span> trong tổng số <span className="font-medium text-gray-900">{warranties.length}</span> bảo hành
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
              ) : filteredWarranties.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Không có bảo hành nào</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {hasActiveFilters()
                      ? 'Không tìm thấy bảo hành phù hợp với bộ lọc.'
                      : 'Chưa có bảo hành nào được tạo.'}
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
                    {filteredWarranties.map((warranty, index) => (
                          <React.Fragment key={warranty.id}>
                        <tr 
                          className={`hover:bg-gray-50/50 transition-colors duration-150 cursor-pointer ${
                            !isWarrantyEvaluatedByAdmin(warranty) ? 'bg-yellow-50/50 border-l-4 border-l-yellow-400' : ''
                          }`}
                          onClick={() => toggleRowExpansion(warranty.id)}
                        >
                          {/* STT */}
                          <td className="px-2 py-4 whitespace-nowrap text-center w-16">
                            <span className="text-xs font-medium text-gray-600">
                              {filteredWarranties.length - index}
                            </span>
                          </td>
                          
                          {/* Thông tin case */}
                          <td className="px-2 py-4 whitespace-nowrap w-64">
                            <div>
                              <div className="text-xs font-medium text-gray-900">
                                {warranty.title}
                              </div>
                              <div className="text-xs text-gray-500">
                                Tạo: {new Date(warranty.createdAt).toLocaleString('vi-VN')}
                              </div>
                            </div>
                          </td>
                          
                          {/* Người xử lý */}
                          <td className="px-2 py-4 whitespace-nowrap w-32">
                            <div className="text-xs text-gray-900">{warranty.handler.fullName}</div>
                            <div className="text-xs text-gray-500">{warranty.handler.position}</div>
                          </td>
                          
                          {/* Khách hàng */}
                          <td className="px-2 py-4 whitespace-nowrap w-48">
                            <div className="text-xs font-medium text-gray-900">
                              {warranty.customer?.shortName || warranty.customerName}
                            </div>
                          </td>
                          
                          {/* Trạng thái */}
                          <td className="px-2 py-4 whitespace-nowrap w-24">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(warranty.status)}`}>
                              {getStatusLabel(warranty.status)}
                            </span>
                          </td>
                          
                          {/* Thời gian */}
                          <td className="px-2 py-4 whitespace-nowrap text-xs text-gray-900 w-36">
                            <div>Bắt đầu: {new Date(warranty.startDate).toLocaleString('vi-VN', { 
                              year: 'numeric', 
                              month: '2-digit', 
                              day: '2-digit', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}</div>
                            {warranty.endDate && (
                              <div>Kết thúc: {new Date(warranty.endDate).toLocaleString('vi-VN', { 
                                year: 'numeric', 
                                month: '2-digit', 
                                day: '2-digit', 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}</div>
                            )}
                          </td>
                          
                          {/* Tổng điểm User */}
                          <td className="px-2 py-4 whitespace-nowrap text-center w-24">
                            {warranty.userDifficultyLevel && warranty.userEstimatedTime && warranty.userImpactLevel && warranty.userUrgencyLevel ? (
                              <span className="text-xs font-medium text-blue-600">
                                {warranty.userDifficultyLevel + warranty.userEstimatedTime + warranty.userImpactLevel + warranty.userUrgencyLevel}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                          
                          {/* Điểm Admin */}
                          <td className="px-2 py-4 whitespace-nowrap text-center w-24">
                            {isWarrantyEvaluatedByAdmin(warranty) ? (
                              <span className="text-xs font-medium text-green-600">
                                {(warranty.adminDifficultyLevel || 0) + (warranty.adminEstimatedTime || 0) + (warranty.adminImpactLevel || 0) + (warranty.adminUrgencyLevel || 0)}
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
                              const userScore = warranty.userDifficultyLevel && warranty.userEstimatedTime && warranty.userImpactLevel && warranty.userUrgencyLevel 
                                ? warranty.userDifficultyLevel + warranty.userEstimatedTime + warranty.userImpactLevel + warranty.userUrgencyLevel 
                                : 0;
                              const adminScore = warranty.adminDifficultyLevel && warranty.adminEstimatedTime && warranty.adminImpactLevel && warranty.adminUrgencyLevel 
                                ? warranty.adminDifficultyLevel + warranty.adminEstimatedTime + warranty.adminImpactLevel + warranty.adminUrgencyLevel 
                                : 0;
                              const totalScore = userScore + adminScore;
                              const isAdminEvaluated = isWarrantyEvaluatedByAdmin(warranty);
                              
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
                                  setSelectedWarranty(warranty);
                                  setShowEvaluationModal(true);
                                  setEvaluationForm({
                                    adminDifficultyLevel: warranty.adminDifficultyLevel?.toString() || '',
                                    adminEstimatedTime: warranty.adminEstimatedTime?.toString() || '',
                                    adminImpactLevel: warranty.adminImpactLevel?.toString() || '',
                                    adminUrgencyLevel: warranty.adminUrgencyLevel?.toString() || ''
                                  });
                                }}
                                className={`p-1.5 rounded-md transition-colors duration-200 ${
                                  isWarrantyEvaluatedByAdmin(warranty) 
                                    ? 'text-green-600 hover:bg-green-50' 
                                    : 'text-yellow-600 hover:bg-yellow-50 bg-yellow-100'
                                }`}
                                title={isWarrantyEvaluatedByAdmin(warranty) ? "Đánh giá case" : "⚠️ Chưa đánh giá - Click để đánh giá"}
                              >
                                {isWarrantyEvaluatedByAdmin(warranty) ? <Edit className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedWarranty(warranty);
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
                        {expandedRows.has(warranty.id) && (
                          <tr>
                            <td colSpan={10} className="px-3 py-6 bg-gray-50" onClick={(e) => e.stopPropagation()}>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Mô tả chi tiết */}
                                <div>
                                  <h4 className="text-xs font-medium text-gray-900 mb-2 flex items-center">
                                    <FileText className="h-3 w-3 mr-2 text-blue-600" />
                                    Mô tả chi tiết
                                  </h4>
                                  <p className="text-xs text-gray-600 leading-relaxed">{warranty.description}</p>
                                </div>
                                
                                {/* Tên công ty đầy đủ */}
                                <div>
                                  <h4 className="text-xs font-medium text-gray-900 mb-2 flex items-center">
                                    <AlertTriangle className="h-3 w-3 mr-2 text-orange-600" />
                                    Tên công ty đầy đủ
                                  </h4>
                                  <div className="text-xs text-gray-600">
                                    <div className="font-medium text-gray-900">
                                      {warranty.customer?.fullCompanyName || 'N/A'}
                                    </div>
                                    {warranty.customer?.contactPerson && (
                                      <div className="mt-1 text-gray-500">
                                        Người liên hệ: {warranty.customer.contactPerson}
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
          <div className="space-y-6">
            {/* Warranty Types Management */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-blue-100 rounded-md">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Quản lý loại bảo hành</h3>
                  </div>
                  <button
                    onClick={handleAddWarrantyType}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Thêm loại bảo hành</span>
                  </button>
                </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Quản lý các loại bảo hành hệ thống
                  </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Loại bảo hành
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {warrantyTypesLoading ? (
                      <tr key="loading-state">
                        <td colSpan={2} className="px-6 py-8 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                            <span className="text-gray-600">Đang tải danh sách loại bảo hành...</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <>
                        {/* Existing incident types */}
                        {warrantyTypes.map((warrantyType, index) => (
                          <tr key={`warranty-type-${warrantyType.id}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{warrantyType.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleEditWarrantyType(warrantyType)}
                                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium hover:bg-blue-200 transition-colors cursor-pointer"
                                >
                                  Sửa
                                </button>
                                <button
                                  onClick={() => handleDeleteWarrantyType(warrantyType)}
                                  className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium hover:bg-red-200 transition-colors cursor-pointer"
                                >
                                  Xóa
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        
                        {/* Inline editing row */}
                        {isAddingNewRow && (
                          <tr key="inline-editing-row" className="bg-blue-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="text"
                                value={newWarrantyTypeName}
                                onChange={(e) => setNewWarrantyTypeName(e.target.value)}
                                placeholder="Nhập tên loại sự cố..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveNewIncidentType();
                                  } else if (e.key === 'Escape') {
                                    handleCancelNewIncidentType();
                                  }
                                }}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={handleSaveNewIncidentType}
                                  disabled={saving}
                                  className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  {saving ? 'Đang lưu...' : 'Lưu'}
                                </button>
                                <button
                                  onClick={handleCancelNewIncidentType}
                                  disabled={saving}
                                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  Hủy
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                        
                        {/* Empty state */}
                        {warrantyTypes.length === 0 && !isAddingNewRow && (
                          <tr>
                            <td colSpan={2} className="px-6 py-8 text-center">
                              <div className="text-gray-400 mb-4">
                                <FileText className="h-16 w-16 mx-auto" />
                              </div>
                              <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có loại sự cố nào</h3>
                              <p className="text-gray-500 mb-4">Thêm loại sự cố đầu tiên để bắt đầu quản lý</p>
                              <button
                                onClick={handleAddWarrantyType}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Thêm loại sự cố
                              </button>
                            </td>
                          </tr>
                        )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

        {/* Evaluation Modal */}
        {showEvaluationModal && selectedWarranty && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Đánh giá Case: {selectedWarranty.title}</h3>
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
                      <div>Mức độ khó: {getDifficultyText(selectedWarranty.userDifficultyLevel || 0)}</div>
                      <div>Thời gian ước tính: {getEstimatedTimeText(selectedWarranty.userEstimatedTime || 0)}</div>
                      <div>Mức độ ảnh hưởng: {getImpactText(selectedWarranty.userImpactLevel || 0)}</div>
                      <div>Mức độ khẩn cấp: {getUrgencyText(selectedWarranty.userUrgencyLevel || 0)}</div>
                      <div>Hình thức: {getFormText(selectedWarranty.userFormScore)}</div>
                      <div className="font-medium text-blue-600">
                        Tổng: {((selectedWarranty.userDifficultyLevel || 0) + (selectedWarranty.userEstimatedTime || 0) + (selectedWarranty.userImpactLevel || 0) + (selectedWarranty.userUrgencyLevel || 0) + (selectedWarranty.userFormScore || 0))}
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

                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEvaluationModal(false);
                    setSelectedWarranty(null);
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
        {showDeleteModal && selectedWarranty && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa bảo hành</h3>
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
                      Bạn có chắc chắn muốn xóa bảo hành này không?
                    </p>
                    <div className="bg-gray-50 rounded-md p-3 text-sm">
                      <div className="font-medium text-gray-900">{selectedWarranty.title}</div>
                      <div className="text-gray-600 mt-1">
                        <div>Tên khách hàng: {selectedWarranty.customerName}</div>
                        <div>Người xử lý: {selectedWarranty.handler.fullName}</div>
                        <div>Loại: {formatWarrantyType(selectedWarranty.warrantyType)}</div>
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
                    setSelectedWarranty(null);
                  }}
                  disabled={deleting}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={() => deleteWarranty(selectedWarranty.id)}
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
                      Xóa bảo hành
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Warranty Type Modal */}
        {showWarrantyTypeModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingWarrantyType ? 'Chỉnh sửa loại bảo hành' : 'Thêm loại bảo hành mới'}
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên loại bảo hành *
                    </label>
                    <input
                      type="text"
                      value={warrantyTypeForm.name}
                      onChange={(e) => setWarrantyTypeForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nhập tên loại bảo hành"
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
                      {editingWarrantyType ? 'Cập nhật' : 'Thêm mới'}
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
