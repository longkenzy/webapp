import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { X, User, Wrench, FileText, Calendar, Settings, CheckCircle, RefreshCw, AlertTriangle, Save, Star, Target, Building2, ChevronDown, Search } from 'lucide-react';
import { useEvaluationForm } from '@/hooks/useEvaluation';
import { useEvaluation } from '@/contexts/EvaluationContext';
import { EvaluationType, EvaluationCategory } from '@/contexts/EvaluationContext';
import { convertISOToLocalInput, convertLocalInputToISO } from '@/lib/date-utils';
import toast from 'react-hot-toast';
import { DateTimePicker } from '@mantine/dates';
import 'dayjs/locale/vi';

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
    form: 'Onsite',
    title: '',
    description: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
    status: '',
    notes: '',
    // User self-assessment fields
    difficultyLevel: '',
    estimatedTime: '',
    impactLevel: '',
    urgencyLevel: '',
    formScore: '2',
    // Admin assessment fields
    adminDifficultyLevel: '',
    adminEstimatedTime: '',
    adminImpactLevel: '',
    adminUrgencyLevel: '',
    adminAssessmentNotes: ''
  });

  const [saving, setSaving] = useState(false);
  const scrollPositionRef = useRef(0);

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await fetch('/api/employees/list', {
        method: 'GET',
        headers: {
          'Cache-Control': 'max-age=600',
        },
      });
      if (response.ok) {
        const result = await response.json();
        // API returns { success: true, data: [...] }
        setEmployees(result.data || result);
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

  // Fetch data when modal opens FIRST
  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
      fetchCaseTypes();
      fetchConfigs();
    }
  }, [isOpen, fetchEmployees, fetchCaseTypes, fetchConfigs]);

  // Initialize form data AFTER employees are loaded
  useEffect(() => {
    if (isOpen && caseData && employees.length > 0) {
      console.log('=== Initializing Form Data ===');

      const startDate = caseData.startDate ? new Date(caseData.startDate) : null;
      const endDate = caseData.endDate ? new Date(caseData.endDate) : null;

      // Form label sync
      const formOptions = getUserFieldOptions(EvaluationCategory.FORM);
      const matchedForm = formOptions.find(opt => opt.points.toString() === caseData.userFormScore?.toString());
      const formLabel = matchedForm ? matchedForm.label : (caseData.userFormScore === 2 || !caseData.userFormScore ? 'Onsite' : '');

      setFormData({
        requester: caseData.requester.id,
        position: caseData.requester.position || '',
        handler: caseData.handler.id,
        caseType: caseData.caseType || '',
        form: formLabel,
        title: caseData.title || '',
        description: caseData.description || '',
        startDate,
        endDate,
        status: caseData.status || '',
        notes: caseData.notes || '',
        // User self-assessment fields
        difficultyLevel: caseData.userDifficultyLevel?.toString() || '',
        estimatedTime: caseData.userEstimatedTime?.toString() || '',
        impactLevel: caseData.userImpactLevel?.toString() || '',
        urgencyLevel: caseData.userUrgencyLevel?.toString() || '',
        formScore: caseData.userFormScore?.toString() || '2',
        // Admin assessment fields
        adminDifficultyLevel: caseData.adminDifficultyLevel?.toString() || '',
        adminEstimatedTime: caseData.adminEstimatedTime?.toString() || '',
        adminImpactLevel: caseData.adminImpactLevel?.toString() || '',
        adminUrgencyLevel: caseData.adminUrgencyLevel?.toString() || '',
        adminAssessmentNotes: caseData.adminAssessmentNotes || ''
      });
    }
  }, [isOpen, caseData, employees, getUserFieldOptions]);

  // Second effect to re-sync form label once config is loaded
  useEffect(() => {
    if (isOpen && caseData) {
      const formOptions = getUserFieldOptions(EvaluationCategory.FORM);
      if (formOptions.length > 0) {
        const matchedForm = formOptions.find(opt => opt.points.toString() === caseData.userFormScore?.toString());
        if (matchedForm) {
          setFormData(prev => ({
            ...prev,
            form: matchedForm.label
          }));
        }
      }
    }
  }, [isOpen, caseData?.userFormScore, getUserFieldOptions]);

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

  const handleInputChange = (field: string, value: any) => {
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

    // Validate end date (only if both dates exist) - allow any past/future dates
    if (formData.startDate && formData.endDate && formData.endDate <= formData.startDate) {
      toast.error('Thời gian kết thúc phải lớn hơn thời gian bắt đầu!');
      return;
    }

    try {
      setSaving(true);

      // Prepare data for API
      const updateData = {
        requesterId: formData.requester,
        handlerId: formData.handler,
        caseType: formData.caseType,
        form: getUserFieldOptions(EvaluationCategory.FORM).find(o => o.label === formData.form)?.label || formData.form,
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate ? formData.startDate.toISOString() : null,
        endDate: formData.endDate ? formData.endDate.toISOString() : null,
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
      setSaving(false);
    }
  };

  if (!isOpen || !caseData) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 flex items-center justify-between flex-shrink-0 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
                Chỉnh sửa Case nội bộ (Admin)
              </h2>
              <p className="text-blue-100 text-xs mt-0.5">Cập nhật thông tin xử lý vụ việc nội bộ</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-5 space-y-4">
              {/* Row 1: Người xử lý + Loại case */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Section 1: Người xử lý */}
                <div className="bg-white rounded border border-gray-200 shadow-sm">
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Người xử lý</h3>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded">IT Admin</span>
                  </div>

                  <div className="p-3">
                    <select
                      value={formData.handler}
                      onChange={(e) => handleInputChange('handler', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                      disabled={saving}
                    >
                      <option value="">Chọn nhân viên</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Section 2: Loại case */}
                <div className="bg-white rounded border border-gray-200 shadow-sm">
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-blue-600" />
                      <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Loại case</h3>
                    </div>
                    <span className="text-red-500 text-sm">*</span>
                  </div>

                  <div className="p-3">
                    <select
                      value={formData.caseType}
                      onChange={(e) => handleInputChange('caseType', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                      disabled={saving}
                    >
                      <option value="">Chọn loại case</option>
                      {caseTypes.map((type) => (
                        <option key={type.id} value={type.name}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Thông tin người yêu cầu */}
              <div className="bg-white rounded border border-gray-200 shadow-sm">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Thông tin người yêu cầu</h3>
                </div>

                <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Người yêu cầu <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.requester}
                      onChange={(e) => handleInputChange('requester', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                      disabled={saving}
                    >
                      <option value="">Chọn nhân viên</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Chức danh</label>
                    <input
                      type="text"
                      value={formData.position}
                      readOnly
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-100 bg-gray-50 rounded text-gray-600 cursor-not-allowed"
                      placeholder="Tự động điền..."
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Chi tiết vụ việc */}
              <div className="bg-white rounded border border-gray-200 shadow-sm">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Chi tiết vụ việc</h3>
                </div>

                <div className="p-3 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Tiêu đề <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Nhập tiêu đề vụ việc..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Mô tả chi tiết <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
                      placeholder="Mô tả chi tiết..."
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Thời gian */}
              <div className="bg-white rounded border border-gray-200 shadow-sm">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Thời gian</h3>
                </div>

                <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Bắt đầu <span className="text-red-500">*</span></label>
                    <DateTimePicker
                      value={formData.startDate}
                      onChange={(value) => handleInputChange('startDate', value)}
                      placeholder="Chọn ngày bắt đầu"
                      locale="vi"
                      valueFormat="DD/MM/YYYY HH:mm"
                      clearable
                      withSeconds={false}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Kết thúc</label>
                    <DateTimePicker
                      value={formData.endDate}
                      onChange={(value) => handleInputChange('endDate', value)}
                      placeholder="Chọn ngày kết thúc"
                      locale="vi"
                      valueFormat="DD/MM/YYYY HH:mm"
                      clearable
                      minDate={formData.startDate || undefined}
                      withSeconds={false}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Section 6: Trạng thái & Ghi chú */}
              <div className="bg-white rounded border border-gray-200 shadow-sm">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Trạng thái & Ghi chú</h3>
                </div>

                <div className="p-3 space-y-3">
                  <div className="w-full md:w-1/2">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Trạng thái <span className="text-red-500">*</span></label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    >
                      <option value="RECEIVED">Tiếp nhận</option>
                      <option value="IN_PROGRESS">Đang xử lý</option>
                      <option value="COMPLETED">Hoàn thành</option>
                      <option value="CANCELLED">Hủy</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Ghi chú</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={2}
                      className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
                      placeholder="Ghi chú thêm..."
                    />
                  </div>
                </div>
              </div>

              {/* Section 7: Đánh giá (User Assessment) */}
              <div className="bg-white rounded border border-amber-200 shadow-sm">
                <div className="bg-amber-50 px-3 py-2 border-b border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-600" />
                    <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Đánh giá của User</h3>
                  </div>
                  <button
                    type="button"
                    onClick={fetchConfigs}
                    className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-amber-700 hover:text-amber-800 hover:bg-amber-100 rounded transition-colors font-bold uppercase"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Làm mới</span>
                  </button>
                </div>

                <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Mức độ khó</label>
                    <select
                      value={formData.difficultyLevel}
                      onChange={(e) => handleInputChange('difficultyLevel', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                    >
                      <option value="">Chọn mức độ</option>
                      {getUserFieldOptions(EvaluationCategory.DIFFICULTY).map((opt) => (
                        <option key={opt.id} value={opt.points}>{opt.points} - {opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Thời gian ước tính</label>
                    <select
                      value={formData.estimatedTime}
                      onChange={(e) => handleInputChange('estimatedTime', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                    >
                      <option value="">Chọn thời gian</option>
                      {getUserFieldOptions(EvaluationCategory.TIME).map((opt) => (
                        <option key={opt.id} value={opt.points}>{opt.points} - {opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Ảnh hưởng</label>
                    <select
                      value={formData.impactLevel}
                      onChange={(e) => handleInputChange('impactLevel', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                    >
                      <option value="">Chọn mức độ</option>
                      {getUserFieldOptions(EvaluationCategory.IMPACT).map((opt) => (
                        <option key={opt.id} value={opt.points}>{opt.points} - {opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Khẩn cấp</label>
                    <select
                      value={formData.urgencyLevel}
                      onChange={(e) => handleInputChange('urgencyLevel', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                    >
                      <option value="">Chọn mức độ</option>
                      {getUserFieldOptions(EvaluationCategory.URGENCY).map((opt) => (
                        <option key={opt.id} value={opt.points}>{opt.points} - {opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Hình thức làm việc</label>
                    <select
                      value={formData.form}
                      onChange={(e) => {
                        handleInputChange('form', e.target.value);
                        const matched = getUserFieldOptions(EvaluationCategory.FORM).find(o => o.label === e.target.value);
                        if (matched) handleInputChange('formScore', matched.points.toString());
                      }}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                    >
                      <option value="">Chọn hình thức</option>
                      {getUserFieldOptions(EvaluationCategory.FORM).map((opt) => (
                        <option key={opt.id} value={opt.label}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 8: Admin Assessment */}
              <div className="bg-white rounded border border-green-200 shadow-sm">
                <div className="bg-green-50 px-3 py-2 border-b border-green-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-600" />
                    <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Đánh giá của Admin</h3>
                  </div>
                  <button
                    type="button"
                    onClick={fetchConfigs}
                    className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-green-700 hover:text-green-800 hover:bg-green-100 rounded transition-colors font-bold uppercase"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Làm mới</span>
                  </button>
                </div>

                <div className="p-3 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Mức độ khó</label>
                      <select
                        value={formData.adminDifficultyLevel}
                        onChange={(e) => handleInputChange('adminDifficultyLevel', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      >
                        <option value="">Chọn mức độ</option>
                        {getAdminFieldOptions(EvaluationCategory.DIFFICULTY).map((opt) => (
                          <option key={opt.id} value={opt.points}>{opt.points} - {opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Thời gian nhận</label>
                      <select
                        value={formData.adminEstimatedTime}
                        onChange={(e) => handleInputChange('adminEstimatedTime', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      >
                        <option value="">Chọn thời gian</option>
                        {getAdminFieldOptions(EvaluationCategory.TIME).map((opt) => (
                          <option key={opt.id} value={opt.points}>{opt.points} - {opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Ảnh hưởng</label>
                      <select
                        value={formData.adminImpactLevel}
                        onChange={(e) => handleInputChange('adminImpactLevel', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      >
                        <option value="">Chọn mức độ</option>
                        {getAdminFieldOptions(EvaluationCategory.IMPACT).map((opt) => (
                          <option key={opt.id} value={opt.points}>{opt.points} - {opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Khẩn cấp</label>
                      <select
                        value={formData.adminUrgencyLevel}
                        onChange={(e) => handleInputChange('adminUrgencyLevel', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      >
                        <option value="">Chọn mức độ</option>
                        {getAdminFieldOptions(EvaluationCategory.URGENCY).map((opt) => (
                          <option key={opt.id} value={opt.points}>{opt.points} - {opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Ghi chú của Admin</label>
                    <textarea
                      value={formData.adminAssessmentNotes}
                      onChange={(e) => handleInputChange('adminAssessmentNotes', e.target.value)}
                      rows={2}
                      className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none transition-colors"
                      placeholder="Ghi chú đánh giá của admin..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Cập nhật Case</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
