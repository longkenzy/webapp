'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Settings, Wrench, FileText, Calendar, Zap, Search, RefreshCw } from 'lucide-react';
import { useEvaluationForm } from '@/hooks/useEvaluation';
import { useEvaluation } from '@/contexts/EvaluationContext';
import { EvaluationType, EvaluationCategory } from '@/contexts/EvaluationContext';
import { useInternalCases } from '@/hooks/useInternalCases';
import { useCaseTypes } from '@/hooks/useCaseTypes';
import InternalCaseTable from '@/components/admin/InternalCaseTable';

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
  userDifficultyLevel?: number;
  userEstimatedTime?: number;
  userImpactLevel?: number;
  userUrgencyLevel?: number;
  userFormScore?: number;
  userAssessmentDate?: string;
  adminDifficultyLevel?: number;
  adminEstimatedTime?: number;
  adminImpactLevel?: number;
  adminUrgencyLevel?: number;
  adminAssessmentDate?: string;
  adminAssessmentNotes?: string;
}

export default function AdminInternalWorkPageOptimized() {
  // Admin evaluation categories
  const adminCategories = [
    EvaluationCategory.DIFFICULTY,
    EvaluationCategory.TIME,
    EvaluationCategory.IMPACT,
    EvaluationCategory.URGENCY,
  ];

  const { getFieldOptions } = useEvaluationForm(EvaluationType.ADMIN, adminCategories);
  const { fetchConfigs } = useEvaluation();

  // Use custom hooks for state management
  const {
    filteredCases,
    loading,
    refreshing,
    searchTerm,
    selectedHandler,
    selectedStatus,
    dateFrom,
    dateTo,
    expandedRows,
    uniqueHandlers,
    uniqueStatuses,
    setSearchTerm,
    setSelectedHandler,
    setSelectedStatus,
    setDateFrom,
    setDateTo,
    fetchInternalCases,
    refreshInternalCases,
    toggleRowExpansion,
    clearFilters,
    deleteCase,
  } = useInternalCases();

  const {
    caseTypes,
    loading: caseTypesLoading,
    showModal: showCaseTypeModal,
    editingCaseType,
    formData: caseTypeForm,
    setFormData: setCaseTypeForm,
    fetchCaseTypes,
    createCaseType,
    updateCaseType,
    deleteCaseType,
    toggleCaseTypeStatus,
    openCreateModal,
    openEditModal,
    closeModal,
    submitForm,
  } = useCaseTypes();

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<InternalCase | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'cases'>('cases');

  // States for evaluation form
  const [evaluationForm, setEvaluationForm] = useState({
    adminDifficultyLevel: '',
    adminEstimatedTime: '',
    adminImpactLevel: '',
    adminUrgencyLevel: ''
  });
  const [evaluating, setEvaluating] = useState(false);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchInternalCases(),
          fetchCaseTypes()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, [fetchInternalCases, fetchCaseTypes]);

  // Case management functions
  const handleViewCase = useCallback((case_: InternalCase) => {
    setSelectedCase(case_);
    // Add view modal logic here
  }, []);

  const handleEditCase = useCallback((case_: InternalCase) => {
    setSelectedCase(case_);
    setShowAddModal(true);
  }, []);

  const handleDeleteCase = useCallback((case_: InternalCase) => {
    setSelectedCase(case_);
    setShowDeleteModal(true);
  }, []);

  const handleEvaluateCase = useCallback((case_: InternalCase) => {
    setSelectedCase(case_);
    setEvaluationForm({
      adminDifficultyLevel: case_.adminDifficultyLevel?.toString() || '',
      adminEstimatedTime: case_.adminEstimatedTime?.toString() || '',
      adminImpactLevel: case_.adminImpactLevel?.toString() || '',
      adminUrgencyLevel: case_.adminUrgencyLevel?.toString() || ''
    });
    setShowEvaluationModal(true);
  }, []);

  const confirmDeleteCase = useCallback(async () => {
    if (!selectedCase) return;

    setDeleting(true);
    try {
      await deleteCase(selectedCase);
      setShowDeleteModal(false);
      setSelectedCase(null);
    } catch (error) {
      console.error('Error deleting case:', error);
    } finally {
      setDeleting(false);
    }
  }, [selectedCase, deleteCase]);

  const handleSubmitEvaluation = useCallback(async () => {
    if (!selectedCase) return;

    setEvaluating(true);
    try {
      const response = await fetch(`/api/internal-cases/${selectedCase.id}/evaluation`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminDifficultyLevel: parseInt(evaluationForm.adminDifficultyLevel),
          adminEstimatedTime: parseInt(evaluationForm.adminEstimatedTime),
          adminImpactLevel: parseInt(evaluationForm.adminImpactLevel),
          adminUrgencyLevel: parseInt(evaluationForm.adminUrgencyLevel),
        }),
      });

      if (response.ok) {
        setShowEvaluationModal(false);
        setSelectedCase(null);
        await refreshInternalCases();
      } else {
        throw new Error('Failed to submit evaluation');
      }
    } catch (error) {
      console.error('Error submitting evaluation:', error);
    } finally {
      setEvaluating(false);
    }
  }, [selectedCase, evaluationForm, refreshInternalCases]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Case Nội bộ</h1>
        <p className="text-gray-600">Quản lý và đánh giá các case nội bộ</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('cases')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'cases'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              Danh sách Case
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'config'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="h-4 w-4 inline mr-2" />
              Cấu hình Case Type
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'cases' && (
        <>
          {/* Filters and Actions */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm case..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                  />
                </div>
              </div>
              
              <select
                value={selectedHandler}
                onChange={(e) => setSelectedHandler(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tất cả người xử lý</option>
                {uniqueHandlers.map(handler => (
                  <option key={handler.id} value={handler.id}>
                    {handler.fullName}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tất cả trạng thái</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Từ ngày"
              />

              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Đến ngày"
              />

              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Xóa bộ lọc
              </button>

              <button
                onClick={refreshInternalCases}
                disabled={refreshing}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Làm mới</span>
              </button>
            </div>
          </div>

          {/* Cases Table */}
          <div className="bg-white shadow rounded-lg">
            <InternalCaseTable
              cases={filteredCases}
              loading={loading}
              expandedRows={expandedRows}
              onToggleExpand={toggleRowExpansion}
              onView={handleViewCase}
              onEdit={handleEditCase}
              onDelete={handleDeleteCase}
              onEvaluate={handleEvaluateCase}
            />
          </div>
        </>
      )}

      {activeTab === 'config' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Quản lý Case Type</h2>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm Case Type</span>
            </button>
          </div>

          {caseTypesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Đang tải...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {caseTypes.map((caseType) => (
                <div key={caseType.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-medium text-gray-900">{caseType.name}</h3>
                      <p className="text-sm text-gray-500">
                        {caseType.isActive ? 'Đang hoạt động' : 'Đã tắt'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleCaseTypeStatus(caseType)}
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        caseType.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {caseType.isActive ? 'Tắt' : 'Bật'}
                    </button>
                    <button
                      onClick={() => openEditModal(caseType)}
                      className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      onClick={() => deleteCaseType(caseType.id)}
                      className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-800"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Case Type Modal */}
      {showCaseTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingCaseType ? 'Chỉnh sửa Case Type' : 'Thêm Case Type mới'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên Case Type
                </label>
                <input
                  type="text"
                  value={caseTypeForm.name}
                  onChange={(e) => setCaseTypeForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập tên case type"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={caseTypeForm.isActive}
                  onChange={(e) => setCaseTypeForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Đang hoạt động
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={submitForm}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                {editingCaseType ? 'Cập nhật' : 'Thêm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evaluation Modal */}
      {showEvaluationModal && selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Đánh giá Case: {selectedCase.title}</h3>
            <div className="grid grid-cols-2 gap-4">
              {adminCategories.map((category) => (
                <div key={category}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {getFieldOptions(category).label}
                  </label>
                  <select
                    value={evaluationForm[category as keyof typeof evaluationForm]}
                    onChange={(e) => setEvaluationForm(prev => ({ ...prev, [category]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Chọn điểm</option>
                    {getFieldOptions(category).options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEvaluationModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitEvaluation}
                disabled={evaluating}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {evaluating ? 'Đang lưu...' : 'Lưu đánh giá'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Xác nhận xóa</h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa case &quot;{selectedCase.title}&quot;? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={confirmDeleteCase}
                disabled={deleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
