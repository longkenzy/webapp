'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { X, User, Wrench, FileText, Calendar, Settings, CheckCircle, RefreshCw } from 'lucide-react';
import { useEvaluationForm } from '@/hooks/useEvaluation';
import { useEvaluation } from '@/contexts/EvaluationContext';
import { EvaluationType, EvaluationCategory } from '@/contexts/EvaluationContext';
import toast from 'react-hot-toast';

interface Employee {
  id: string;
  fullName: string;
  position: string;
  department: string;
  companyEmail: string;
}

interface CaseType {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface InternalCase {
  id: string;
  title: string;
  description: string;
  requester: {
    id: string;
    fullName: string;
    position: string;
    department: string;
  };
  handler: {
    id: string;
    fullName: string;
    position: string;
    department: string;
  };
  caseType: string;
  form: string;
  startDate: string;
  endDate?: string;
  status: string;
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
  createdAt: string;
  updatedAt: string;
}

interface EditInternalCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updatedCase: InternalCase) => void;
  caseData: InternalCase | null;
}

export default function EditInternalCaseModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  caseData 
}: EditInternalCaseModalProps) {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [caseTypes, setCaseTypes] = useState<CaseType[]>([]);
  const [loading, setLoading] = useState(false);

  // User evaluation categories
  const userCategories = [
    EvaluationCategory.DIFFICULTY,
    EvaluationCategory.TIME,
    EvaluationCategory.IMPACT,
    EvaluationCategory.URGENCY,
    EvaluationCategory.FORM,
  ];

  // Admin evaluation categories
  const adminCategories = [
    EvaluationCategory.DIFFICULTY,
    EvaluationCategory.TIME,
    EvaluationCategory.IMPACT,
    EvaluationCategory.URGENCY,
  ];

  const { getFieldOptions: getUserFieldOptions } = useEvaluationForm(EvaluationType.USER, userCategories);
  const { getFieldOptions: getAdminFieldOptions } = useEvaluationForm(EvaluationType.ADMIN, adminCategories);
  const { fetchConfigs } = useEvaluation();

  const [formData, setFormData] = useState({
    requester: '',
    position: '',
    handler: '',
    caseType: '',
    form: '',
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    status: '',
    notes: '',
    // User self-assessment fields
    difficultyLevel: '',
    estimatedTime: '',
    impactLevel: '',
    urgencyLevel: '',
    formScore: '',
    // Admin assessment fields
    adminDifficultyLevel: '',
    adminEstimatedTime: '',
    adminImpactLevel: '',
    adminUrgencyLevel: '',
    adminAssessmentNotes: ''
  });

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await fetch('/api/employees/list', {
        method: 'GET',
        headers: {
          'Cache-Control': 'max-age=600',
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

  const fetchCaseTypes = useCallback(async () => {
    try {
      const response = await fetch('/api/case-types', {
        method: 'GET',
        headers: {
          'Cache-Control': 'max-age=600',
        },
      });
      if (response.ok) {
        const result = await response.json();
        
        if (result.success && Array.isArray(result.data)) {
          const activeCaseTypes = result.data.filter((caseType: CaseType) => caseType.isActive);
          setCaseTypes(activeCaseTypes);
        } else {
          console.error('Invalid response format:', result);
          setCaseTypes([]);
        }
      } else {
        console.error('Failed to fetch case types:', response.status, response.statusText);
        setCaseTypes([]);
      }
    } catch (error) {
      console.error('Error fetching case types:', error);
      setCaseTypes([]);
    }
  }, []);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && caseData) {
      setFormData({
        requester: caseData.requester.id,
        position: caseData.requester.position || '',
        handler: caseData.handler.id,
        caseType: caseData.caseType,
        form: caseData.form,
        title: caseData.title,
        description: caseData.description,
        startDate: new Date(caseData.startDate).toISOString().slice(0, 16),
        endDate: caseData.endDate ? new Date(caseData.endDate).toISOString().slice(0, 16) : '',
        status: caseData.status,
        notes: caseData.notes || '',
        // User self-assessment fields
        difficultyLevel: caseData.userDifficultyLevel?.toString() || '',
        estimatedTime: caseData.userEstimatedTime?.toString() || '',
        impactLevel: caseData.userImpactLevel?.toString() || '',
        urgencyLevel: caseData.userUrgencyLevel?.toString() || '',
        formScore: caseData.userFormScore?.toString() || '',
        // Admin assessment fields
        adminDifficultyLevel: caseData.adminDifficultyLevel?.toString() || '',
        adminEstimatedTime: caseData.adminEstimatedTime?.toString() || '',
        adminImpactLevel: caseData.adminImpactLevel?.toString() || '',
        adminUrgencyLevel: caseData.adminUrgencyLevel?.toString() || '',
        adminAssessmentNotes: caseData.adminAssessmentNotes || ''
      });
    }
  }, [isOpen, caseData]);

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
      fetchCaseTypes();
      fetchConfigs();
    }
  }, [isOpen, fetchEmployees, fetchCaseTypes, fetchConfigs]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-fill position when requester is selected
    if (field === 'requester') {
      const selectedEmployee = employees.find(emp => emp.id === value);
      if (selectedEmployee) {
        setFormData(prev => ({
          ...prev,
          requester: value,
          position: selectedEmployee.position || ''
        }));
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!caseData) return;

    // Validate end date
    if (formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (endDate <= startDate) {
        toast.error('Ngày kết thúc phải lớn hơn ngày bắt đầu!', {
          duration: 3000,
          position: 'top-right',
        });
        return;
      }
    }

    try {
      setLoading(true);
      
      // Prepare data for API
      const updateData = {
        requesterId: formData.requester,
        handlerId: formData.handler,
        caseType: formData.caseType,
        form: formData.form,
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        status: formData.status,
        notes: formData.notes || null,
        // User self-assessment data
        userDifficultyLevel: formData.difficultyLevel ? parseInt(formData.difficultyLevel) : null,
        userEstimatedTime: formData.estimatedTime ? parseInt(formData.estimatedTime) : null,
        userImpactLevel: formData.impactLevel ? parseInt(formData.impactLevel) : null,
        userUrgencyLevel: formData.urgencyLevel ? parseInt(formData.urgencyLevel) : null,
        userFormScore: formData.formScore ? parseInt(formData.formScore) : null,
        // Admin assessment data
        adminDifficultyLevel: formData.adminDifficultyLevel ? parseInt(formData.adminDifficultyLevel) : null,
        adminEstimatedTime: formData.adminEstimatedTime ? parseInt(formData.adminEstimatedTime) : null,
        adminImpactLevel: formData.adminImpactLevel ? parseInt(formData.adminImpactLevel) : null,
        adminUrgencyLevel: formData.adminUrgencyLevel ? parseInt(formData.adminUrgencyLevel) : null,
        adminAssessmentNotes: formData.adminAssessmentNotes || null
      };

      console.log('=== Updating Internal Case ===');
      console.log('Case ID:', caseData.id);
      console.log('Update data:', updateData);

      // Send to API
      const response = await fetch(`/api/internal-cases/${caseData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const result = await response.json();
        
        toast.success('Cập nhật case thành công!', {
          duration: 3000,
          position: 'top-right',
        });
        
        // Close modal and pass updated data
        onClose();
        if (onSuccess && result.data) {
          onSuccess(result.data);
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to update case:', errorData);
        toast.error(`Lỗi: ${errorData.error || 'Không thể cập nhật case'}`, {
          duration: 4000,
          position: 'top-right',
        });
      }
    } catch (error) {
      console.error('Error updating case:', error);
      toast.error('Lỗi kết nối. Vui lòng thử lại!', {
        duration: 4000,
        position: 'top-right',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !caseData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto my-4 sm:my-8">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 sm:px-6 py-3 sm:py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-md">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Chỉnh sửa Case Nội Bộ</h2>
                <p className="text-blue-100 text-sm">Hệ thống quản lý case</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-md transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-3 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Section 1: Thông tin cơ bản */}
            <div className="bg-gray-50 rounded-md p-3 sm:p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <div className="p-1.5 bg-blue-100 rounded-md">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Thông tin cơ bản</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 flex items-center">
                    <span className="w-28">Người yêu cầu</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    value={formData.requester}
                    onChange={(e) => handleInputChange('requester', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                    disabled={loading}
                  >
                    <option value="">
                      {loading ? 'Đang tải...' : 'Chọn nhân viên'}
                    </option>
                    {employees.length > 0 ? (
                      employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.fullName}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        {loading ? 'Đang tải...' : 'Không có nhân viên nào'}
                      </option>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 flex items-center">
                    <span className="w-28">Chức danh</span>
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Tự động điền khi chọn nhân viên"
                    readOnly
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 flex items-center">
                    <span className="w-28">Người xử lý</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    value={formData.handler}
                    onChange={(e) => handleInputChange('handler', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                    disabled={loading}
                  >
                    <option value="">
                      {loading ? 'Đang tải...' : 'Chọn nhân viên'}
                    </option>
                    {employees.length > 0 ? (
                      employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.fullName}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        {loading ? 'Đang tải...' : 'Không có nhân viên nào'}
                      </option>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 flex items-center">
                    <span className="w-28">Loại case</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    value={formData.caseType}
                    onChange={(e) => handleInputChange('caseType', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                    disabled={loading}
                  >
                    <option value="">
                      {loading ? 'Đang tải...' : 'Chọn loại case'}
                    </option>
                    {caseTypes.length > 0 ? (
                      caseTypes.map((caseType) => (
                        <option key={caseType.id} value={caseType.name}>
                          {caseType.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        {loading ? 'Đang tải...' : 'Chưa có loại case nào'}
                      </option>
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Chi tiết case */}
            <div className="bg-gray-50 rounded-md p-3 sm:p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <div className="p-1.5 bg-purple-100 rounded-md">
                  <FileText className="h-4 w-4 text-purple-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Chi tiết case</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 flex items-center">
                    <span className="w-28">Vụ việc</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Nhập tiêu đề vụ việc"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 flex items-center">
                    <span className="w-28">Mô tả chi tiết</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    placeholder="Mô tả chi tiết vấn đề..."
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Thời gian */}
            <div className="bg-gray-50 rounded-md p-3 sm:p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <div className="p-1.5 bg-orange-100 rounded-md">
                  <Calendar className="h-4 w-4 text-orange-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Thời gian</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 flex items-center">
                    <span className="w-28">Bắt đầu</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 flex items-center">
                    <span className="w-28">Kết thúc</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="dd/mm/yyyy --:--"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Đánh giá của User */}
            <div className="bg-yellow-50 rounded-md p-4 border border-yellow-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-yellow-100 rounded-md">
                    <CheckCircle className="h-4 w-4 text-yellow-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-yellow-700">Đánh giá của User</h3>
                </div>
                <button
                  type="button"
                  onClick={fetchConfigs}
                  className="flex items-center space-x-1 px-2 py-1 text-xs text-yellow-700 hover:text-yellow-800 hover:bg-yellow-100 rounded transition-colors"
                  title="Làm mới options đánh giá"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Làm mới</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mức độ khó */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-yellow-600 flex items-center">
                    <span className="w-32">Mức độ khó</span>
                  </label>
                  <select
                    value={formData.difficultyLevel}
                    onChange={(e) => handleInputChange('difficultyLevel', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-yellow-200 rounded focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                  >
                    <option value="">Chọn mức độ khó</option>
                    {getUserFieldOptions(EvaluationCategory.DIFFICULTY).map((option) => (
                      <option key={option.id} value={option.points}>
                        {option.points} - {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Thời gian ước tính */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-yellow-600 flex items-center">
                    <span className="w-32">Thời gian ước tính</span>
                  </label>
                  <select
                    value={formData.estimatedTime}
                    onChange={(e) => handleInputChange('estimatedTime', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-yellow-200 rounded focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                  >
                    <option value="">Chọn thời gian ước tính</option>
                    {getUserFieldOptions(EvaluationCategory.TIME).map((option) => (
                      <option key={option.id} value={option.points}>
                        {option.points} - {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mức độ ảnh hưởng */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-yellow-600 flex items-center">
                    <span className="w-32">Mức độ ảnh hưởng</span>
                  </label>
                  <select
                    value={formData.impactLevel}
                    onChange={(e) => handleInputChange('impactLevel', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-yellow-200 rounded focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                  >
                    <option value="">Chọn mức độ ảnh hưởng</option>
                    {getUserFieldOptions(EvaluationCategory.IMPACT).map((option) => (
                      <option key={option.id} value={option.points}>
                        {option.points} - {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mức độ khẩn cấp */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-yellow-600 flex items-center">
                    <span className="w-32">Mức độ khẩn cấp</span>
                  </label>
                  <select
                    value={formData.urgencyLevel}
                    onChange={(e) => handleInputChange('urgencyLevel', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-yellow-200 rounded focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                  >
                    <option value="">Chọn mức độ khẩn cấp</option>
                    {getUserFieldOptions(EvaluationCategory.URGENCY).map((option) => (
                      <option key={option.id} value={option.points}>
                        {option.points} - {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Hình thức làm việc */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-yellow-600 flex items-center">
                    <span className="w-32">Hình thức làm việc</span>
                  </label>
                  <select
                    value={formData.form}
                    onChange={(e) => {
                      handleInputChange('form', e.target.value);
                      // Auto-set form score based on selection
                      const selectedOption = getUserFieldOptions(EvaluationCategory.FORM).find(
                        option => option.label === e.target.value
                      );
                      if (selectedOption) {
                        handleInputChange('formScore', selectedOption.points.toString());
                      }
                    }}
                    className="w-full px-3 py-2 text-sm border border-yellow-200 rounded focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                  >
                    <option value="">Chọn hình thức làm việc</option>
                    {getUserFieldOptions(EvaluationCategory.FORM).map((option) => (
                      <option key={option.id} value={option.label}>
                        {option.label} ({option.points} điểm)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 5: Đánh giá của Admin */}
            <div className="bg-green-50 rounded-md p-4 border border-green-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-green-100 rounded-md">
                    <Settings className="h-4 w-4 text-green-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-green-700">Đánh giá của Admin</h3>
                </div>
                <button
                  type="button"
                  onClick={fetchConfigs}
                  className="flex items-center space-x-1 px-2 py-1 text-xs text-green-700 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
                  title="Làm mới options đánh giá"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Làm mới</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mức độ khó Admin */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-green-600 flex items-center">
                    <span className="w-32">Mức độ khó</span>
                  </label>
                  <select
                    value={formData.adminDifficultyLevel}
                    onChange={(e) => handleInputChange('adminDifficultyLevel', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-green-200 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors"
                  >
                    <option value="">Chọn mức độ khó</option>
                    {getAdminFieldOptions(EvaluationCategory.DIFFICULTY).map((option) => (
                      <option key={option.id} value={option.points}>
                        {option.points} - {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Thời gian ước tính Admin */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-green-600 flex items-center">
                    <span className="w-32">Thời gian ước tính</span>
                  </label>
                  <select
                    value={formData.adminEstimatedTime}
                    onChange={(e) => handleInputChange('adminEstimatedTime', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-green-200 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors"
                  >
                    <option value="">Chọn thời gian ước tính</option>
                    {getAdminFieldOptions(EvaluationCategory.TIME).map((option) => (
                      <option key={option.id} value={option.points}>
                        {option.points} - {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mức độ ảnh hưởng Admin */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-green-600 flex items-center">
                    <span className="w-32">Mức độ ảnh hưởng</span>
                  </label>
                  <select
                    value={formData.adminImpactLevel}
                    onChange={(e) => handleInputChange('adminImpactLevel', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-green-200 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors"
                  >
                    <option value="">Chọn mức độ ảnh hưởng</option>
                    {getAdminFieldOptions(EvaluationCategory.IMPACT).map((option) => (
                      <option key={option.id} value={option.points}>
                        {option.points} - {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mức độ khẩn cấp Admin */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-green-600 flex items-center">
                    <span className="w-32">Mức độ khẩn cấp</span>
                  </label>
                  <select
                    value={formData.adminUrgencyLevel}
                    onChange={(e) => handleInputChange('adminUrgencyLevel', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-green-200 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors"
                  >
                    <option value="">Chọn mức độ khẩn cấp</option>
                    {getAdminFieldOptions(EvaluationCategory.URGENCY).map((option) => (
                      <option key={option.id} value={option.points}>
                        {option.points} - {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Admin Assessment Notes */}
              <div className="mt-4">
                <label className="text-xs font-medium text-green-600 flex items-center">
                  <span className="w-32">Ghi chú đánh giá</span>
                </label>
                <textarea
                  value={formData.adminAssessmentNotes}
                  onChange={(e) => handleInputChange('adminAssessmentNotes', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-green-200 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                  placeholder="Ghi chú đánh giá của admin..."
                />
              </div>
            </div>

            {/* Section 6: Trạng thái & Ghi chú */}
            <div className="bg-gray-50 rounded-md p-3 sm:p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <div className="p-1.5 bg-gray-100 rounded-md">
                  <CheckCircle className="h-4 w-4 text-gray-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Trạng thái & Ghi chú</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 flex items-center">
                    <span className="w-28">Trạng thái</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  >
                    <option value="RECEIVED">Tiếp nhận</option>
                    <option value="IN_PROGRESS">Đang xử lý</option>
                    <option value="COMPLETED">Hoàn thành</option>
                    <option value="CANCELLED">Hủy</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 flex items-center">
                    <span className="w-28">Ghi chú</span>
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    placeholder="Ghi chú thêm (nếu có)..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-2 sm:space-x-3 pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 sm:px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="h-4 w-4 mr-1 sm:mr-2" />
              {loading ? 'Đang cập nhật...' : 'Cập nhật Case'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
