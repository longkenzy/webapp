'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Settings, Wrench, FileText, Calendar, Zap, Search, RefreshCw, Eye, Edit, Trash, AlertTriangle, CheckCircle, Download, X, User } from 'lucide-react';
import { useEvaluationForm } from '@/hooks/useEvaluation';
import { useEvaluation } from '@/contexts/EvaluationContext';
import { EvaluationType, EvaluationCategory } from '@/contexts/EvaluationContext';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import EditInternalCaseModal from './EditInternalCaseModal';
import ConfigurationTab from '@/components/shared/ConfigurationTab';
import CreateInternalCaseModal from '../../../user/work/internal/CreateInternalCaseModal';

interface CaseType {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

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

export default function AdminInternalWorkPage() {
  const [caseTypes, setCaseTypes] = useState<CaseType[]>([]);
  const [caseTypesLoading, setCaseTypesLoading] = useState(true);

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<InternalCase | null>(null);
  const [editingCase, setEditingCase] = useState<InternalCase | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deletedCases, setDeletedCases] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  // Case Type Management States
  const [showCaseTypeModal, setShowCaseTypeModal] = useState(false);
  const [editingCaseType, setEditingCaseType] = useState<CaseType | null>(null);
  const [caseTypeForm, setCaseTypeForm] = useState({
    name: '',
    isActive: true
  });
  
  // Inline editing states
  const [isAddingNewRow, setIsAddingNewRow] = useState(false);
  const [newCaseTypeName, setNewCaseTypeName] = useState('');
  const [saving, setSaving] = useState(false);

  // Helper function to generate unique keys
  const generateUniqueKey = (caseType: CaseType, index: number) => {
    if (caseType.id) {
      return `case-type-${caseType.id}`;
    }
    return `case-type-temp-${index}-${Date.now()}`;
  };
  
  // States for internal cases list
  const [internalCases, setInternalCases] = useState<InternalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'config' | 'cases'>('cases');
  
  // Filter states
  const [selectedHandler, setSelectedHandler] = useState<string>('');
  const [selectedRequester, setSelectedRequester] = useState<string>('');
  const [selectedCaseType, setSelectedCaseType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
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


  // Helper function to check if case is evaluated by admin
  const isCaseEvaluatedByAdmin = (case_: InternalCase) => {
    return case_.adminDifficultyLevel !== null && 
           case_.adminDifficultyLevel !== undefined &&
           case_.adminEstimatedTime !== null && 
           case_.adminEstimatedTime !== undefined &&
           case_.adminImpactLevel !== null && 
           case_.adminImpactLevel !== undefined &&
           case_.adminUrgencyLevel !== null && 
           case_.adminUrgencyLevel !== undefined;
  };

  // Fetch case types from API with caching
  const fetchCaseTypes = useCallback(async (bypassCache = false) => {
    try {
      setCaseTypesLoading(true);
      const url = bypassCache 
        ? `/api/case-types?_t=${Date.now()}` 
        : '/api/case-types';
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': bypassCache ? 'no-cache' : 'max-age=300',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCaseTypes(data.data || []);
      } else {
        console.error('Failed to fetch case types');
      }
    } catch (error) {
      console.error('Error fetching case types:', error);
    } finally {
      setCaseTypesLoading(false);
    }
  }, []);

  // Fetch internal cases from API with caching and retry
  const fetchInternalCases = useCallback(async (retryCount = 0) => {
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
        setInternalCases(data.data || []);
      } else {
        console.error('Failed to fetch internal cases:', response.status, response.statusText);
        if (retryCount < 2) {
          console.log(`Retrying fetch internal cases... (${retryCount + 1}/2)`);
          setTimeout(() => fetchInternalCases(retryCount + 1), 1000);
        } else {
          setInternalCases([]);
        }
      }
    } catch (error) {
      console.error('Error fetching internal cases:', error);
      if (retryCount < 2) {
        console.log(`Retrying fetch internal cases... (${retryCount + 1}/2)`);
        setTimeout(() => fetchInternalCases(retryCount + 1), 1000);
      } else {
        setInternalCases([]);
      }
    } finally {
      if (retryCount === 0) {
        setLoading(false);
      }
    }
  }, []);

  // Refresh internal cases
  const refreshInternalCases = async () => {
    setRefreshing(true);
    await fetchInternalCases();
    setRefreshing(false);
  };

  // Case Type Management Functions
  const handleAddCaseType = () => {
    setEditingCaseType(null);
    setCaseTypeForm({
      name: '',
      isActive: true
    });
    setShowCaseTypeModal(true);
  };

  // Inline editing functions
  const handleAddNewRow = () => {
    setIsAddingNewRow(true);
    setNewCaseTypeName('');
  };

  const handleCancelAddRow = () => {
    setIsAddingNewRow(false);
    setNewCaseTypeName('');
  };

  const handleSaveNewCaseType = async () => {
    if (!newCaseTypeName.trim()) {
      toast.error('Vui lòng nhập tên loại case', {
        duration: 3000,
        position: 'top-right',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/case-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCaseTypeName.trim(),
          isActive: true
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('API Response:', responseData); // Debug log
        
        // Extract case type from response data
        const newCaseType = responseData.data || responseData;
        
        // Only add to state if we have a valid ID from server
        if (newCaseType && newCaseType.id) {
          const newCaseTypeWithId = {
            id: newCaseType.id,
            name: newCaseType.name || newCaseTypeName.trim() || 'Case Type Mới',
            isActive: newCaseType.isActive !== undefined ? newCaseType.isActive : true,
            createdAt: newCaseType.createdAt || new Date().toISOString(),
            updatedAt: newCaseType.updatedAt || new Date().toISOString()
          };
          console.log('New Case Type to add:', newCaseTypeWithId); // Debug log
          setCaseTypes(prevCaseTypes => [...prevCaseTypes, newCaseTypeWithId]);
        } else {
          console.error('No ID returned from server, refetching...');
          console.error('Response data:', responseData);
          // If no ID, fallback to refetching
          await fetchCaseTypes();
        }
        
        setIsAddingNewRow(false);
        setNewCaseTypeName('');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Có lỗi xảy ra khi thêm loại case', {
          duration: 4000,
          position: 'top-right',
        });
      }
    } catch (error) {
      console.error('Error adding case type:', error);
      toast.error('Có lỗi xảy ra khi thêm loại case', {
        duration: 4000,
        position: 'top-right',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditCaseType = (caseType: CaseType) => {
    setEditingCaseType(caseType);
    setCaseTypeForm({
      name: caseType.name,
      isActive: caseType.isActive
    });
    setShowCaseTypeModal(true);
  };

  const handleCloseCaseTypeModal = () => {
    setShowCaseTypeModal(false);
    setEditingCaseType(null);
    setCaseTypeForm({
      name: '',
      isActive: true
    });
  };

  const handleCaseTypeSubmit = async () => {
    try {
      const url = editingCaseType 
        ? `/api/case-types/${editingCaseType.id}`
        : '/api/case-types';
      
      const method = editingCaseType ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(caseTypeForm),
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('Modal API Response:', responseData); // Debug log
        
        // Extract case type from response data
        const updatedCaseType = responseData.data || responseData;
        
        if (editingCaseType) {
          // Update existing case type in state
          setCaseTypes(prevCaseTypes => 
            prevCaseTypes.map(ct => 
              ct.id === editingCaseType.id 
                ? { ...ct, ...updatedCaseType, id: updatedCaseType.id || ct.id }
                : ct
            )
          );
        } else {
          // Add new case type to state - only if we have valid ID
          if (updatedCaseType && updatedCaseType.id) {
            const newCaseTypeWithId = {
              ...updatedCaseType,
              id: updatedCaseType.id,
              name: updatedCaseType.name || caseTypeForm.name,
              isActive: updatedCaseType.isActive !== undefined ? updatedCaseType.isActive : caseTypeForm.isActive
            };
            setCaseTypes(prevCaseTypes => [...prevCaseTypes, newCaseTypeWithId]);
          } else {
            console.error('No ID returned from server in modal, refetching...');
            console.error('Response data:', responseData);
            // If no ID, fallback to refetching
            await fetchCaseTypes();
          }
        }
        
        toast.success(editingCaseType ? 'Cập nhật loại case thành công!' : 'Tạo loại case thành công!', {
          duration: 3000,
          position: 'top-right',
        });
        handleCloseCaseTypeModal();
      } else {
        const error = await response.json();
        toast.error(`Lỗi: ${error.error || 'Không thể lưu loại case'}`, {
          duration: 4000,
          position: 'top-right',
        });
      }
    } catch (error) {
      console.error('Error saving case type:', error);
      toast.error('Lỗi kết nối. Vui lòng thử lại!', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  const handleDeleteCaseType = async (caseType: CaseType) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa loại case "${caseType.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/case-types/${caseType.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Optimistically remove the case type from state instead of refetching
        setCaseTypes(prevCaseTypes => 
          prevCaseTypes.filter(ct => ct.id !== caseType.id)
        );
        toast.success('Xóa loại case thành công!', {
          duration: 3000,
          position: 'top-right',
        });
      } else {
        const error = await response.json();
        if (response.status === 404) {
          // Case type not found, remove from state anyway
          setCaseTypes(prevCaseTypes => 
            prevCaseTypes.filter(ct => ct.id !== caseType.id)
          );
          toast.error('Case type đã được xóa hoặc không tồn tại', {
            duration: 3000,
            position: 'top-right',
          });
        } else {
          toast.error(`Lỗi: ${error.error || 'Không thể xóa loại case'}`, {
            duration: 4000,
            position: 'top-right',
          });
        }
      }
    } catch (error) {
      console.error('Error deleting case type:', error);
      toast.error('Lỗi kết nối. Vui lòng thử lại!', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  const toggleCaseTypeStatus = async (caseType: CaseType) => {
    try {
      const response = await fetch(`/api/case-types/${caseType.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...caseType,
          isActive: !caseType.isActive
        }),
      });

      if (response.ok) {
        // Optimistically update the case type status in state instead of refetching
        setCaseTypes(prevCaseTypes => 
          prevCaseTypes.map(ct => 
            ct.id === caseType.id 
              ? { ...ct, isActive: !ct.isActive, updatedAt: new Date().toISOString() }
              : ct
          )
        );
        toast.success(`Đã ${caseType.isActive ? 'tắt' : 'bật'} loại case thành công!`, {
          duration: 3000,
          position: 'top-right',
        });
      } else {
        const error = await response.json();
        toast.error(`Lỗi: ${error.error || 'Không thể cập nhật trạng thái'}`, {
          duration: 4000,
          position: 'top-right',
        });
      }
    } catch (error) {
      console.error('Error toggling case type status:', error);
      toast.error('Lỗi kết nối. Vui lòng thử lại!', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchInternalCases(),
          fetchCaseTypes()
        ]);
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };
    
    loadData();
  }, [fetchInternalCases, fetchCaseTypes]);

  // Get unique handlers, requesters, case types and statuses for filter options
  const uniqueHandlers = Array.from(new Set(internalCases.map(case_ => case_.handler.fullName))).sort();
  const uniqueRequesters = Array.from(new Set(internalCases.map(case_ => case_.requester.fullName))).sort();
  const uniqueCaseTypes = Array.from(new Set(internalCases.map(case_ => case_.caseType))).sort();
  const uniqueStatuses = Array.from(new Set(internalCases.map(case_ => case_.status))).sort();

  // Filter internal cases based on search term and filters
  const filteredInternalCases = internalCases.filter(case_ => {
    const matchesSearch = case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    case_.requester.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    case_.handler.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         case_.caseType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesHandler = !selectedHandler || case_.handler.fullName === selectedHandler;
    const matchesRequester = !selectedRequester || case_.requester.fullName === selectedRequester;
    const matchesCaseType = !selectedCaseType || case_.caseType === selectedCaseType;
    const matchesStatus = !selectedStatus || case_.status === selectedStatus;
    
    // Date range filtering
    let matchesDateRange = true;
    if (dateFrom || dateTo) {
      const caseDate = new Date(case_.startDate);
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo) : null;
      
      if (fromDate && toDate) {
        matchesDateRange = caseDate >= fromDate && caseDate <= toDate;
      } else if (fromDate) {
        matchesDateRange = caseDate >= fromDate;
      } else if (toDate) {
        matchesDateRange = caseDate <= toDate;
      }
    }
    
    return matchesSearch && matchesHandler && matchesRequester && matchesCaseType && matchesStatus && matchesDateRange;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Pagination logic
  const totalItems = filteredInternalCases.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCases = filteredInternalCases.slice(startIndex, endIndex);

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
  }, [searchTerm, selectedHandler, selectedRequester, selectedCaseType, selectedStatus, dateFrom, dateTo]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedHandler('');
    setSelectedRequester('');
    setSelectedCaseType('');
    setSelectedStatus('');
    setDateFrom('');
    setDateTo('');
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || selectedHandler || selectedRequester || selectedCaseType || selectedStatus || dateFrom || dateTo;

  const handleAddCaseTypeOld = () => {
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
  };

  const handleOpenEvaluationModal = (case_: InternalCase) => {
    setSelectedCase(case_);
    setEvaluationForm({
      adminDifficultyLevel: case_.adminDifficultyLevel?.toString() || '',
      adminEstimatedTime: case_.adminEstimatedTime?.toString() || '',
      adminImpactLevel: case_.adminImpactLevel?.toString() || '',
      adminUrgencyLevel: case_.adminUrgencyLevel?.toString() || ''
    });
    setShowEvaluationModal(true);
    
    // Refresh evaluation configs to get latest options
    fetchConfigs();
  };

  const handleCloseEvaluationModal = () => {
    setShowEvaluationModal(false);
    setSelectedCase(null);
    setEvaluationForm({
      adminDifficultyLevel: '',
      adminEstimatedTime: '',
      adminImpactLevel: '',
      adminUrgencyLevel: ''
    });
  };

  const handleEvaluationSubmit = async () => {
    if (!selectedCase) return;

    try {
      setEvaluating(true);
      const response = await fetch(`/api/internal-cases/${selectedCase.id}/evaluation`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(evaluationForm),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Optimistic update - update the case in the list without full reload
        setInternalCases(prevCases => 
          prevCases.map(case_ => 
            case_.id === selectedCase.id 
              ? { ...case_, ...result.data }
              : case_
          )
        );
        
        toast.success('Cập nhật đánh giá thành công!', {
          duration: 3000,
          position: 'top-right',
        });
        
        handleCloseEvaluationModal();
      } else {
        const error = await response.json();
        toast.error(`Lỗi: ${error.error || 'Không thể cập nhật đánh giá'}`, {
          duration: 4000,
          position: 'top-right',
        });
      }
    } catch (error) {
      console.error('Error updating evaluation:', error);
      toast.error('Lỗi kết nối. Vui lòng thử lại!', {
        duration: 4000,
        position: 'top-right',
      });
    } finally {
      setEvaluating(false);
    }
  };

  const handleOpenEditModal = (case_: InternalCase) => {
    setSelectedCase(case_);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedCase(null);
  };

  const handleEditSuccess = (updatedCase: InternalCase) => {
    // Update the case in the list
    setInternalCases(prevCases => 
      prevCases.map(case_ => 
        case_.id === updatedCase.id 
          ? updatedCase
          : case_
      )
    );
    
    toast.success('Cập nhật case thành công!', {
      duration: 3000,
      position: 'top-right',
    });
  };


  const handleOpenDeleteModal = (case_: InternalCase) => {
    setSelectedCase(case_);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedCase(null);
    setDeleting(false);
  };

  const handleDeleteCase = async () => {
    if (!selectedCase) return;

    const caseToDelete = selectedCase;
    
    try {
      setDeleting(true);
      
      // Mark case as being deleted for visual feedback
      setDeletedCases(prev => new Set(prev).add(caseToDelete.id));
      
      // Optimistic update - remove from UI immediately for better UX
      setInternalCases(prevCases => 
        prevCases.filter(case_ => case_.id !== caseToDelete.id)
      );
      
      // Close modal immediately
      handleCloseDeleteModal();
      
      // Make API call in background
      const response = await fetch(`/api/internal-cases/${caseToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // If API call fails, restore the case to the list
        setInternalCases(prevCases => [...prevCases, caseToDelete]);
        setDeletedCases(prev => {
          const newSet = new Set(prev);
          newSet.delete(caseToDelete.id);
          return newSet;
        });
        
        const error = await response.json();
        console.error('Error deleting case:', error);
      } else {
        // Success - remove from deleted cases tracking
        setDeletedCases(prev => {
          const newSet = new Set(prev);
          newSet.delete(caseToDelete.id);
          return newSet;
        });
      }
      
    } catch (error) {
      console.error('Error deleting case:', error);
      
      // Restore the case to the list on network error
      setInternalCases(prevCases => [...prevCases, caseToDelete]);
      setDeletedCases(prev => {
        const newSet = new Set(prev);
        newSet.delete(caseToDelete.id);
        return newSet;
      });
    } finally {
      setDeleting(false);
    }
  };

  const toggleRowExpansion = (caseId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(caseId)) {
      newExpandedRows.delete(caseId);
    } else {
      newExpandedRows.add(caseId);
    }
    setExpandedRows(newExpandedRows);
  };

  const toggleCaseTypeStatusOld = (id: string) => {
    setCaseTypes(prev => 
      prev.map(ct => 
        ct.id === id ? { ...ct, isActive: !ct.isActive } : ct
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
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

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    
    if (diffMs < 0) return '0h 0m';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  };

  const getEstimatedTimeInMinutes = (estimatedTime: number) => {
    switch (estimatedTime) {
      case 1: return 30; // < 30 phút
      case 2: return 45; // 30-60 phút (trung bình 45 phút)
      case 3: return 90; // 1-2 giờ (trung bình 1.5 giờ)
      case 4: return 180; // 2-4 giờ (trung bình 3 giờ)
      case 5: return 300; // > 4 giờ (giả định 5 giờ)
      default: return 0;
    }
  };

  const calculateTimeComparison = (startDate: string, endDate: string, estimatedTime: number) => {
    if (!endDate || !estimatedTime) return null;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const actualMs = end.getTime() - start.getTime();
    const actualMinutes = Math.floor(actualMs / (1000 * 60));
    const estimatedMinutes = getEstimatedTimeInMinutes(estimatedTime);
    
    const diffMinutes = actualMinutes - estimatedMinutes;
    
    if (diffMinutes <= 0) {
      return 'Đúng dự kiến';
    } else {
      const diffHours = Math.floor(diffMinutes / 60);
      const remainingMinutes = diffMinutes % 60;
      
      if (diffHours > 0) {
        return `Trễ ${diffHours}h ${remainingMinutes}m`;
      } else {
        return `Trễ ${remainingMinutes}m`;
      }
    }
  };

  // Calculate total time from all completed cases
  const calculateTotalTime = () => {
    const completedCases = filteredInternalCases.filter(case_ => case_.endDate);
    let totalMinutes = 0;
    
    completedCases.forEach(case_ => {
      if (case_.endDate) {
        const start = new Date(case_.startDate);
        const end = new Date(case_.endDate);
        const diffMs = end.getTime() - start.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        if (diffMinutes > 0) {
          totalMinutes += diffMinutes;
        }
      }
    });
    
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    
    return { totalHours, remainingMinutes, totalMinutes };
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

  const getDifficultyText = (level: number) => {
    switch (level) {
      case 1: return 'Rất dễ';
      case 2: return 'Dễ';
      case 3: return 'Trung bình';
      case 4: return 'Khó';
      case 5: return 'Rất khó';
      default: return 'Chưa đánh giá';
    }
  };

  const getEstimatedTimeText = (level: number) => {
    switch (level) {
      case 1: return '< 30 phút';
      case 2: return '30-60 phút';
      case 3: return '1-2 giờ';
      case 4: return '2-4 giờ';
      case 5: return '> 4 giờ';
      default: return 'Chưa đánh giá';
    }
  };

  const getImpactText = (level: number) => {
    switch (level) {
      case 1: return 'Rất thấp';
      case 2: return 'Thấp';
      case 3: return 'Trung bình';
      case 4: return 'Cao';
      case 5: return 'Rất cao';
      default: return 'Chưa đánh giá';
    }
  };

  const getUrgencyText = (level: number) => {
    switch (level) {
      case 1: return 'Rất thấp';
      case 2: return 'Thấp';
      case 3: return 'Trung bình';
      case 4: return 'Cao';
      case 5: return 'Rất cao';
      default: return 'Chưa đánh giá';
    }
  };

  const getFormText = (score: number | null | undefined) => {
    if (score === null || score === undefined) return 'Chưa đánh giá';
    switch (score) {
      case 1: return 'Offsite/Remote';
      case 2: return 'Onsite';
      default: return 'Chưa đánh giá';
    }
  };

  // Export to Excel function
  const exportToExcel = () => {
    try {
      // Prepare data for export
      const exportData = filteredInternalCases.map((case_, index) => {
        const userTotalScore = ((case_.userDifficultyLevel || 0) + (case_.userEstimatedTime || 0) + (case_.userImpactLevel || 0) + (case_.userUrgencyLevel || 0) + (case_.userFormScore || 0));
        const adminTotalScore = ((case_.adminDifficultyLevel || 0) + (case_.adminEstimatedTime || 0) + (case_.adminImpactLevel || 0) + (case_.adminUrgencyLevel || 0));
        const grandTotal = ((userTotalScore * 0.4) + (adminTotalScore * 0.6)).toFixed(2);
        
        return {
          'STT': filteredInternalCases.length - index,
          'Tiêu đề Case': case_.title,
          'Mô tả': case_.description,
          'Người yêu cầu': case_.requester.fullName,
          'Vị trí người yêu cầu': case_.requester.position,
          'Phòng ban người yêu cầu': case_.requester.department,
          'Người xử lý': case_.handler.fullName,
          'Vị trí người xử lý': case_.handler.position,
          'Phòng ban người xử lý': case_.handler.department,
          'Loại case': formatCaseType(case_.caseType),
          'Hình thức': case_.form,
          'Trạng thái': getStatusText(case_.status),
          'Ngày bắt đầu': formatDate(case_.startDate),
          'Ngày kết thúc': case_.endDate ? formatDate(case_.endDate) : 'Chưa hoàn thành',
          'Thời gian xử lý': case_.endDate ? calculateDuration(case_.startDate, case_.endDate) : 'Đang xử lý',
          'Ngày tạo': formatDate(case_.createdAt),
          'Ngày cập nhật': formatDate(case_.updatedAt),
          'Ghi chú': case_.notes || '',
          // User evaluation
          'User - Mức độ khó': getDifficultyText(case_.userDifficultyLevel || 0),
          'User - Thời gian ước tính': getEstimatedTimeText(case_.userEstimatedTime || 0),
          'User - Mức độ ảnh hưởng': getImpactText(case_.userImpactLevel || 0),
          'User - Mức độ khẩn cấp': getUrgencyText(case_.userUrgencyLevel || 0),
          'User - Hình thức': getFormText(case_.userFormScore),
          'User - Tổng điểm': userTotalScore,
          // Admin evaluation
          'Admin - Mức độ khó': case_.adminDifficultyLevel ? getDifficultyText(case_.adminDifficultyLevel) : 'Chưa đánh giá',
          'Admin - Thời gian ước tính': case_.adminEstimatedTime ? getEstimatedTimeText(case_.adminEstimatedTime) : 'Chưa đánh giá',
          'Admin - Mức độ ảnh hưởng': case_.adminImpactLevel ? getImpactText(case_.adminImpactLevel) : 'Chưa đánh giá',
          'Admin - Mức độ khẩn cấp': case_.adminUrgencyLevel ? getUrgencyText(case_.adminUrgencyLevel) : 'Chưa đánh giá',
          'Admin - Tổng điểm': adminTotalScore || 'Chưa đánh giá',
          'Admin - Ngày đánh giá': case_.adminAssessmentDate ? formatDate(case_.adminAssessmentDate) : 'Chưa đánh giá',
          'Admin - Ghi chú đánh giá': case_.adminAssessmentNotes || '',
          // Total score
          'Tổng điểm cuối cùng': grandTotal,
          'Trạng thái đánh giá': isCaseEvaluatedByAdmin(case_) ? 'Đã đánh giá' : 'Chưa đánh giá'
        };
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const colWidths = [
        { wch: 5 },   // STT
        { wch: 30 },  // Tiêu đề Case
        { wch: 40 },  // Mô tả
        { wch: 20 },  // Người yêu cầu
        { wch: 20 },  // Vị trí người yêu cầu
        { wch: 20 },  // Phòng ban người yêu cầu
        { wch: 20 },  // Người xử lý
        { wch: 20 },  // Vị trí người xử lý
        { wch: 20 },  // Phòng ban người xử lý
        { wch: 20 },  // Loại case
        { wch: 15 },  // Hình thức
        { wch: 15 },  // Trạng thái
        { wch: 20 },  // Ngày bắt đầu
        { wch: 20 },  // Ngày kết thúc
        { wch: 15 },  // Thời gian xử lý
        { wch: 20 },  // Ngày tạo
        { wch: 20 },  // Ngày cập nhật
        { wch: 30 },  // Ghi chú
        { wch: 20 },  // User - Mức độ khó
        { wch: 20 },  // User - Thời gian ước tính
        { wch: 20 },  // User - Mức độ ảnh hưởng
        { wch: 20 },  // User - Mức độ khẩn cấp
        { wch: 15 },  // User - Hình thức
        { wch: 15 },  // User - Tổng điểm
        { wch: 20 },  // Admin - Mức độ khó
        { wch: 20 },  // Admin - Thời gian ước tính
        { wch: 20 },  // Admin - Mức độ ảnh hưởng
        { wch: 20 },  // Admin - Mức độ khẩn cấp
        { wch: 15 },  // Admin - Tổng điểm
        { wch: 20 },  // Admin - Ngày đánh giá
        { wch: 30 },  // Admin - Ghi chú đánh giá
        { wch: 20 },  // Tổng điểm cuối cùng
        { wch: 20 }   // Trạng thái đánh giá
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Case Nội Bộ");

      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `Case_Noi_Bo_${currentDate}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);

      // Show success message
      toast.success(`Đã xuất thành công ${exportData.length} case ra file Excel: ${filename}`, {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#10B981',
          color: '#fff',
        },
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Có lỗi xảy ra khi xuất file Excel. Vui lòng thử lại!', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-full mx-auto px-4">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Wrench className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Quản lý case nội bộ</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Quản lý và theo dõi các case nội bộ của công ty
                  </p>
                  
                  {activeTab === 'cases' && (
                    <div className="mt-2 flex items-center space-x-4 text-xs">
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-600">
                          Đã đánh giá: {filteredInternalCases.filter(isCaseEvaluatedByAdmin).length}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="text-yellow-600">
                          Chưa đánh giá: {filteredInternalCases.filter(case_ => !isCaseEvaluatedByAdmin(case_)).length}
                        </span>
                      </div>
                      {hasActiveFilters && (
                        <div className="flex items-center space-x-1">
                          <Search className="h-4 w-4 text-blue-500" />
                          <span className="text-blue-600">
                            Đang lọc: {filteredInternalCases.length}/{internalCases.length}
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
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-sm"
                  >
                    <User className="h-4 w-4" />
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
                      <span>Danh sách Case</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        hasActiveFilters 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {hasActiveFilters ? `${filteredInternalCases.length}/${internalCases.length}` : internalCases.length}
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
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">
                        {caseTypes.length}
                      </span>
                    </div>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full mx-auto px-4 py-8">
        {activeTab === 'cases' ? (
          /* Cases Tab Content */
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
                      <p className="text-xs text-gray-600">Tìm kiếm và lọc case theo nhiều tiêu chí</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={exportToExcel}
                      disabled={filteredInternalCases.length === 0}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="text-sm font-medium">Xuất Excel</span>
                    </button>
                    <button 
                      onClick={refreshInternalCases}
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
                        placeholder="Tìm kiếm theo tên case, người yêu cầu, người xử lý..."
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
                            <option key={handler} value={handler}>
                              {handler}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Requester Filter */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          <div className="flex items-center space-x-1.5">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            <span>Người yêu cầu</span>
                          </div>
                        </label>
                        <select
                          value={selectedRequester}
                          onChange={(e) => setSelectedRequester(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                        >
                          <option value="">Tất cả người yêu cầu</option>
                          {uniqueRequesters.map((requester) => (
                            <option key={requester} value={requester}>
                              {requester}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Case Type Filter */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          <div className="flex items-center space-x-1.5">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                            <span>Loại case</span>
                          </div>
                        </label>
                        <select
                          value={selectedCaseType}
                          onChange={(e) => setSelectedCaseType(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                        >
                          <option value="">Tất cả loại case</option>
                          {uniqueCaseTypes.map((caseType) => (
                            <option key={caseType} value={caseType}>
                              {caseType}
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
                              {getStatusText(status)}
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
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                            <span>Đến ngày</span>
                          </div>
                        </label>
                        <input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Active Filters & Actions */}
                  {hasActiveFilters && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md p-3 border border-blue-100">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-1.5 mb-1.5">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            <span className="text-xs font-semibold text-gray-800">Bộ lọc đang áp dụng</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {searchTerm && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                <Search className="h-2.5 w-2.5 mr-1" />
                                &quot;{searchTerm}&quot;
                              </span>
                            )}
                            {selectedHandler && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
                                {selectedHandler}
                              </span>
                            )}
                            {selectedStatus && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></div>
                                {getStatusText(selectedStatus)}
                              </span>
                            )}
                            {dateFrom && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                <Calendar className="h-2.5 w-2.5 mr-1" />
                                Từ: {new Date(dateFrom).toLocaleDateString('vi-VN')}
                              </span>
                            )}
                            {dateTo && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                                <Calendar className="h-2.5 w-2.5 mr-1" />
                                Đến: {new Date(dateTo).toLocaleDateString('vi-VN')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-right">
                            <div className="text-xs font-semibold text-gray-800">
                              {filteredInternalCases.length} kết quả
                            </div>
                            <div className="text-xs text-gray-500">
                              từ {internalCases.length} case
                            </div>
                          </div>
                          <button
                            onClick={clearFilters}
                            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 cursor-pointer shadow-sm"
                          >
                            <span className="text-xs font-medium">Xóa bộ lọc</span>
                            <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                              {[searchTerm, selectedHandler, selectedStatus, dateFrom, dateTo].filter(Boolean).length}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

          {/* Cases Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                  <tr>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      STT
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Thông tin Case
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Người xử lý
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                      Trạng thái
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-40">
                      Thời gian
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Tổng điểm User
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Điểm Admin
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Tổng điểm
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="px-3 py-8 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                          <span className="text-gray-600">Đang tải danh sách case...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedCases.length > 0 ? (
                    paginatedCases.map((case_, index) => {
                      const isExpanded = expandedRows.has(case_.id);
                      const userTotalScore = ((case_.userDifficultyLevel || 0) + (case_.userEstimatedTime || 0) + (case_.userImpactLevel || 0) + (case_.userUrgencyLevel || 0) + (case_.userFormScore || 0));
                      const adminTotalScore = ((case_.adminDifficultyLevel || 0) + (case_.adminEstimatedTime || 0) + (case_.adminImpactLevel || 0) + (case_.adminUrgencyLevel || 0));
                      const grandTotal = ((userTotalScore * 0.4) + (adminTotalScore * 0.6)).toFixed(2);
                      const isEvaluated = isCaseEvaluatedByAdmin(case_);
                      
                      return (
                                                    <React.Fragment key={case_.id}>
                              {/* Main Row */}
                              <tr 
                                className={`hover:bg-gray-50/50 transition-colors duration-150 cursor-pointer ${
                                  !isEvaluated ? 'bg-yellow-50/50 border-l-4 border-l-yellow-400' : ''
                                } ${
                                  deletedCases.has(case_.id) ? 'opacity-50 bg-red-50/30' : ''
                                }`}
                                onClick={() => !deletedCases.has(case_.id) && toggleRowExpansion(case_.id)}
                              >
                                <td className="px-3 py-2 text-center">
                          <span className="text-xs font-medium text-gray-600">
                            {filteredInternalCases.length - index}
                          </span>
                        </td>
                                <td className="px-3 py-2">
                          <div>
                                    <div className="text-xs font-medium text-gray-900">
                              {case_.title}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {case_.description}
                            </div>
                            <div className="text-xs text-gray-500">
                                      Tạo: {formatDate(case_.createdAt)}
                            </div>
                          </div>
                        </td>
                            <td className="px-3 py-2 text-center">
                          <div>
                            <div className="text-xs text-gray-900">{case_.handler.fullName}</div>
                            <div className="text-xs text-gray-500">{case_.handler.position}</div>
                          </div>
                        </td>
                            <td className="px-3 py-2 text-center w-32">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(case_.status)}`}>
                            {getStatusText(case_.status)}
                          </span>
                        </td>
                            <td className="px-3 py-2 w-40">
                          <div className="text-xs">
                            <div className="text-blue-600 font-medium whitespace-nowrap">
                              Bắt đầu: {formatDate(case_.startDate)}
                            </div>
                            {case_.endDate && (
                              <>
                                <div className="text-red-600 font-medium whitespace-nowrap">
                                  Kết thúc: {formatDate(case_.endDate)}
                                </div>
                                <div className="text-purple-600 font-semibold whitespace-nowrap mt-1">
                                  Thời gian: {calculateDuration(case_.startDate, case_.endDate)}
                                </div>
                              </>
                            )}
                            {!case_.endDate && (
                              <div className="text-gray-500 font-medium whitespace-nowrap">
                                Đang xử lý...
                              </div>
                            )}
                          </div>
                        </td>
                            <td className="px-3 py-2 text-center">
                              <span className="text-xs font-medium text-blue-600">
                                {userTotalScore}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center">
                              {isEvaluated ? (
                                <span className="text-xs font-medium text-green-600">
                                  {adminTotalScore}
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
                            <td className="px-3 py-2 text-center">
                              <span className="text-xs font-bold text-purple-600">
                                {grandTotal}
                              </span>
                            </td>
                                                            <td className="px-3 py-2 text-center">
                                  <div className="flex items-center justify-center space-x-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingCase(case_);
                                        setShowCreateModal(true);
                                      }}
                                      className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors duration-200 cursor-pointer"
                                      title="Chỉnh sửa case"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenEvaluationModal(case_);
                                      }}
                                      className={`p-1.5 rounded-md transition-colors duration-200 cursor-pointer ${
                                        isEvaluated 
                                          ? 'text-green-600 hover:bg-green-50' 
                                          : 'text-yellow-600 hover:bg-yellow-50 bg-yellow-100'
                                      }`}
                                      title={isEvaluated ? "Đánh giá case" : "⚠️ Chưa đánh giá - Click để đánh giá"}
                                    >
                              {isEvaluated ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                            </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (!deletedCases.has(case_.id)) {
                                          handleOpenDeleteModal(case_);
                                        }
                                      }}
                                      disabled={deletedCases.has(case_.id)}
                                      className={`p-1.5 rounded-md transition-colors duration-200 ${
                                        deletedCases.has(case_.id) 
                                          ? 'text-gray-400 cursor-not-allowed' 
                                          : 'text-red-600 hover:bg-red-50 cursor-pointer'
                                      }`}
                                      title={deletedCases.has(case_.id) ? "Đang xóa..." : "Xóa case"}
                                    >
                              {deletedCases.has(case_.id) ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                          
                          {/* Expanded Row */}
                          {isExpanded && (
                            <tr className="bg-gray-50/30">
                              <td colSpan={9} className="px-3 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  <div>
                                    <h4 className="text-xs font-medium text-gray-900 mb-2">Mô tả chi tiết</h4>
                                    <p className="text-xs text-gray-600">{case_.description}</p>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-medium text-gray-900 mb-2">Người yêu cầu</h4>
                                    <div className="text-xs text-gray-600">
                                      <div>{case_.requester.fullName}</div>
                                      <div className="text-xs text-gray-500">{case_.requester.position} - {case_.requester.department}</div>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-medium text-gray-900 mb-2">Loại case</h4>
                                    <div className="text-xs text-gray-600">{formatCaseType(case_.caseType)}</div>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-medium text-gray-900 mb-2">Thời gian xử lý</h4>
                                    <div className="text-xs text-gray-600">
                                      <div>Bắt đầu: {formatDate(case_.startDate)}</div>
                                      {case_.endDate && (
                                        <>
                                          <div>Kết thúc: {formatDate(case_.endDate)}</div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-3 py-8 text-center">
                        <div className="text-gray-400 mb-4">
                          <Search className="h-16 w-16 mx-auto" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy case nào</h3>
                        <p className="text-gray-500">Thử thay đổi từ khóa tìm kiếm</p>
                      </td>
                    </tr>
                  )}
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
          </div>
        </div>
        ) : (
          /* Configuration Tab Content */
          <ConfigurationTab
            title="Quản lý loại case"
            items={caseTypes.map(type => ({
              id: type.id,
              name: type.name,
              description: type.description
            }))}
            onAdd={async (name) => {
              const response = await fetch('/api/case-types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
              });
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add case type');
              }
              await fetchCaseTypes(true); // Bypass cache
              toast.success('Thêm loại case thành công');
            }}
            onEdit={async (id, name) => {
              const response = await fetch(`/api/case-types/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
              });
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update case type');
              }
              await fetchCaseTypes(true); // Bypass cache
              toast.success('Cập nhật loại case thành công');
            }}
            onDelete={async (id) => {
              const response = await fetch(`/api/case-types/${id}`, {
                method: 'DELETE'
              });
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete case type');
              }
              await fetchCaseTypes(true); // Bypass cache
              toast.success('Xóa loại case thành công');
            }}
            iconColor="purple"
            placeholder="Nhập tên loại case..."
          />
        )}
      </div>

      {/* Add Case Type Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Thêm Loại Case Mới</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên loại case
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nhập tên loại case"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Mô tả chi tiết loại case"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SLA Phản hồi
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="1h">1 giờ</option>
                      <option value="2h">2 giờ</option>
                      <option value="4h">4 giờ</option>
                      <option value="8h">8 giờ</option>
                      <option value="24h">24 giờ</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SLA Xử lý
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="2h">2 giờ</option>
                      <option value="4h">4 giờ</option>
                      <option value="8h">8 giờ</option>
                      <option value="24h">24 giờ</option>
                      <option value="48h">48 giờ</option>
                      <option value="72h">72 giờ</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer">
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evaluation Modal */}
      {showEvaluationModal && selectedCase && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Đánh giá Case: {selectedCase.title}</h3>
              <p className="text-sm text-gray-600">Đánh giá mức độ khó, thời gian, ảnh hưởng và khẩn cấp</p>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {/* User Evaluation Display */}
                <div className="bg-blue-50 rounded-md p-4 border border-blue-200">
                  <h4 className="text-sm font-semibold text-blue-800 mb-3">Đánh giá của User</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Mức độ khó: {getDifficultyText(selectedCase.userDifficultyLevel || 0)}</div>
                    <div>Thời gian ước tính: {getEstimatedTimeText(selectedCase.userEstimatedTime || 0)}</div>
                    <div>Mức độ ảnh hưởng: {getImpactText(selectedCase.userImpactLevel || 0)}</div>
                    <div>Mức độ khẩn cấp: {getUrgencyText(selectedCase.userUrgencyLevel || 0)}</div>
                    <div>Hình thức: {getFormText(selectedCase.userFormScore)}</div>
                    <div className="font-medium text-blue-600">
                      Tổng: {((selectedCase.userDifficultyLevel || 0) + (selectedCase.userEstimatedTime || 0) + (selectedCase.userImpactLevel || 0) + (selectedCase.userUrgencyLevel || 0) + (selectedCase.userFormScore || 0))}
                    </div>
                  </div>
                </div>

                {/* Admin Evaluation Form */}
                <div className="bg-green-50 rounded-md p-4 border border-green-200">
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
                onClick={handleCloseEvaluationModal}
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
      {showDeleteModal && selectedCase && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa case</h3>
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
                    Bạn có chắc chắn muốn xóa case này không?
                  </p>
                  <div className="bg-gray-50 rounded-md p-3 text-sm">
                    <div className="font-medium text-gray-900">{selectedCase.title}</div>
                    <div className="text-gray-600 mt-1">
                      <div>Người yêu cầu: {selectedCase.requester.fullName}</div>
                      <div>Người xử lý: {selectedCase.handler.fullName}</div>
                      <div>Loại: {formatCaseType(selectedCase.caseType)}</div>
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
                onClick={handleCloseDeleteModal}
                disabled={deleting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteCase}
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
                    Xóa case
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Case Type Modal */}
      {showCaseTypeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCaseType ? 'Chỉnh sửa loại case' : 'Thêm loại case mới'}
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên loại case *
                  </label>
                  <input
                    type="text"
                    value={caseTypeForm.name}
                    onChange={(e) => setCaseTypeForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nhập tên loại case"
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={caseTypeForm.isActive}
                      onChange={(e) => setCaseTypeForm(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Kích hoạt loại case này</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleCloseCaseTypeModal}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleCaseTypeSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
              >
                {editingCaseType ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Case Modal */}
      {/* Create/Edit Internal Case Modal */}
      <CreateInternalCaseModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingCase(null);
        }}
        editingCase={editingCase}
        onSuccess={(internalCase: any) => {
          console.log('Internal case saved:', internalCase);
          
          if (editingCase) {
            // Update existing case in state (no reload needed)
            setInternalCases(prev => prev.map(c => 
              c.id === internalCase.id ? internalCase as InternalCase : c
            ));
          } else {
            // Add new case to the beginning of the list
            setInternalCases(prev => [internalCase as InternalCase, ...prev]);
          }
          
          setEditingCase(null);
          // Don't show toast here - modal already shows it
        }}
      />

      <EditInternalCaseModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        onSuccess={handleEditSuccess}
        caseData={selectedCase}
      />
    </div>
  );
}
