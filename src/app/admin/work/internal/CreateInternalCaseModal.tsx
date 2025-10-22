'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { X, User, Wrench, FileText, Calendar, Settings, CheckCircle, RefreshCw, Star, Save } from 'lucide-react';
import { useEvaluationForm } from '@/hooks/useEvaluation';
import { useEvaluation } from '@/contexts/EvaluationContext';
import { EvaluationType, EvaluationCategory } from '@/contexts/EvaluationContext';
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

interface CreateInternalCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newCase: any) => void;
  editingCase?: any;
  employees?: Employee[];
  caseTypes?: CaseType[];
}

export default function CreateInternalCaseModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  editingCase,
  employees: preloadedEmployees = [],
  caseTypes: preloadedCaseTypes = []
}: CreateInternalCaseModalProps) {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<Employee[]>(preloadedEmployees);
  const [caseTypes, setCaseTypes] = useState<CaseType[]>(preloadedCaseTypes);
  const [loading, setLoading] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);

  // User evaluation categories
  const userCategories = [
    EvaluationCategory.DIFFICULTY,
    EvaluationCategory.TIME,
    EvaluationCategory.IMPACT,
    EvaluationCategory.URGENCY,
    EvaluationCategory.FORM,
  ];

  const { getFieldOptions } = useEvaluationForm(EvaluationType.USER, userCategories);
  const { fetchConfigs } = useEvaluation();

  const [formData, setFormData] = useState({
    requester: '',
    position: '',
    handler: '',
    caseType: '',
    form: 'Onsite',
    title: '',
    description: '',
    startDate: new Date() as Date | null,
    endDate: null as Date | null,
    status: 'RECEIVED',
    notes: '',
    difficultyLevel: '',
    estimatedTime: '',
    impactLevel: '',
    urgencyLevel: '',
    formScore: '2'
  });

  const fetchCurrentEmployee = useCallback(async () => {
    if (!session?.user?.email) return;
    
    try {
      const response = await fetch('/api/user/basic-info');
      if (response.ok) {
        const data = await response.json();
        if (data.employee) {
          setCurrentEmployee({
            id: data.employee.id,
            fullName: data.employee.fullName,
            position: data.employee.position,
            department: data.employee.department,
            companyEmail: data.employee.companyEmail
          });
        } else {
          setCurrentEmployee({
            id: data.id,
            fullName: data.name || '',
            position: '',
            department: '',
            companyEmail: data.email || ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching current employee:', error);
    }
  }, [session?.user?.email]);

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

  const resetForm = useCallback(() => {
    setFormData({
      requester: '',
      position: '',
      handler: currentEmployee?.id || '',
      caseType: '',
      form: 'Onsite',
      title: '',
      description: '',
      startDate: new Date(),
      endDate: null,
      status: 'RECEIVED',
      notes: '',
      difficultyLevel: '',
      estimatedTime: '',
      impactLevel: '',
      urgencyLevel: '',
      formScore: '2'
    });
  }, [currentEmployee?.id]);

  // Populate form when editing
  useEffect(() => {
    if (isOpen && editingCase) {
      setFormData({
        requester: editingCase.requester?.id || '',
        position: editingCase.requester?.position || '',
        handler: editingCase.handler?.id || '',
        caseType: editingCase.caseType || '',
        form: editingCase.form || 'Onsite',
        title: editingCase.title || '',
        description: editingCase.description || '',
        startDate: editingCase.startDate ? new Date(editingCase.startDate) : new Date(),
        endDate: editingCase.endDate ? new Date(editingCase.endDate) : null,
        status: editingCase.status || 'RECEIVED',
        notes: editingCase.notes || '',
        difficultyLevel: editingCase.userDifficultyLevel?.toString() || '',
        estimatedTime: editingCase.userEstimatedTime?.toString() || '',
        impactLevel: editingCase.userImpactLevel?.toString() || '',
        urgencyLevel: editingCase.userUrgencyLevel?.toString() || '',
        formScore: editingCase.userFormScore?.toString() || '2'
      });
    } else if (isOpen && !editingCase) {
      resetForm();
    }
  }, [isOpen, editingCase, resetForm]);

  // Auto-fill handler with current user when employees are loaded (ONLY for CREATE mode, NOT for EDIT mode)
  useEffect(() => {
    if (employees.length > 0 && currentEmployee && !editingCase && formData.handler === '') {
      setFormData(prev => ({
        ...prev,
        handler: currentEmployee.id
      }));
    }
  }, [employees, currentEmployee, editingCase, formData.handler]);

  // Sync preloaded data
  useEffect(() => {
    if (preloadedEmployees.length > 0) setEmployees(preloadedEmployees);
  }, [preloadedEmployees]);

  useEffect(() => {
    if (preloadedCaseTypes.length > 0) setCaseTypes(preloadedCaseTypes);
  }, [preloadedCaseTypes]);

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCurrentEmployee();
      fetchConfigs();
      
      if (employees.length === 0) fetchEmployees();
      if (caseTypes.length === 0) fetchCaseTypes();
    }
  }, [isOpen, fetchCurrentEmployee, fetchConfigs]);

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

  const handleInputChange = (field: string, value: string | Date | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-fill position when requester is selected
    if (field === 'requester' && typeof value === 'string') {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate dates
    if (!formData.startDate) {
      toast.error('Vui lòng chọn ngày bắt đầu!', {
        duration: 3000,
        position: 'top-right',
      });
      return;
    }

    if (formData.endDate && formData.startDate) {
      const startDate = formData.startDate instanceof Date 
        ? formData.startDate 
        : new Date(formData.startDate);
      const endDate = formData.endDate instanceof Date 
        ? formData.endDate 
        : new Date(formData.endDate);
      
      if (endDate <= startDate) {
        toast.error('Thời gian kết thúc phải lớn hơn thời gian bắt đầu!', {
          duration: 3000,
          position: 'top-right',
        });
        return;
      }
    }
    
    try {
      setLoading(true);
      
      // Helper function to convert to ISO string
      const toISOString = (dateValue: Date | string | null): string | null => {
        if (!dateValue) return null;
        
        try {
          if (dateValue instanceof Date) {
            return !isNaN(dateValue.getTime()) ? dateValue.toISOString() : null;
          }
          if (typeof dateValue === 'string') {
            const parsed = new Date(dateValue);
            return !isNaN(parsed.getTime()) ? parsed.toISOString() : null;
          }
        } catch (error) {
          console.error('Error converting date:', error);
        }
        return null;
      };
      
      const startDateISO = toISOString(formData.startDate);
      const endDateISO = toISOString(formData.endDate);

      if (!startDateISO) {
        toast.error('Ngày bắt đầu không hợp lệ. Vui lòng chọn lại!', {
          duration: 4000,
          position: 'top-right',
        });
        return;
      }

      // Prepare data for API
      const caseData = {
        title: formData.title,
        description: formData.description,
        requesterId: formData.requester,
        handlerId: formData.handler,
        caseType: formData.caseType,
        form: formData.form,
        startDate: startDateISO,
        endDate: endDateISO,
        status: formData.status,
        notes: formData.notes || null,
        userDifficultyLevel: formData.difficultyLevel,
        userEstimatedTime: formData.estimatedTime,
        userImpactLevel: formData.impactLevel,
        userUrgencyLevel: formData.urgencyLevel,
        userFormScore: formData.formScore
      };

      // Send to API
      const isEditing = !!editingCase;
      const url = isEditing ? `/api/internal-cases/${editingCase.id}` : '/api/internal-cases';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(caseData),
      });

      if (response.ok) {
        const result = await response.json();
        
        toast.success(isEditing ? 'Cập nhật case nội bộ thành công!' : 'Tạo case nội bộ thành công!', {
          duration: 3000,
          position: 'top-right',
        });
        
        window.dispatchEvent(new CustomEvent('case-created'));
        
        resetForm();
        
        if (onSuccess && result.data) {
          await onSuccess(result.data);
        }
        
        onClose();
      } else {
        const responseText = await response.text();
        console.error('Response text:', responseText);
        
        let error;
        try {
          error = JSON.parse(responseText);
        } catch (e) {
          error = { error: 'Invalid JSON response' };
        }
         
        console.error('Failed to create case:', error);
        toast.error(`Lỗi: ${error.error || 'Không thể tạo case'}`, {
          duration: 4000,
          position: 'top-right',
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Lỗi kết nối. Vui lòng thử lại!', {
        duration: 4000,
        position: 'top-right',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .ios-input-fix input,
        .ios-input-fix select,
        .ios-input-fix textarea {
          -webkit-text-fill-color: #111827 !important;
          opacity: 1 !important;
          color: #111827 !important;
        }
        .ios-input-fix input::placeholder,
        .ios-input-fix textarea::placeholder {
          -webkit-text-fill-color: #9ca3af !important;
          opacity: 0.6 !important;
          color: #9ca3af !important;
        }
      `}} />
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="ios-input-fix bg-white rounded shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded">
                <Wrench className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
                  {editingCase ? 'Chỉnh sửa Case Nội Bộ (Admin)' : 'Tạo Case Nội Bộ (Admin)'}
                </h2>
                <p className="text-blue-50 text-xs mt-0.5">Quản lý công việc nội bộ</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/90 hover:text-white hover:bg-white/20 rounded transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-5 space-y-4">
            {/* Row 1: Người yêu cầu + Người xử lý  */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Section 1: Người yêu cầu */}
              <div className="bg-white rounded border border-gray-200">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Người yêu cầu</h3>
                  </div>
                  <span className="text-red-500 text-sm">*</span>
                </div>
                
                <div className="p-3">
                  <select
                    value={formData.requester}
                    onChange={(e) => handleInputChange('requester', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                  {formData.position && (
                    <div className="mt-2 text-xs text-gray-600">
                      <span className="font-medium">Chức danh:</span> {formData.position}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Người xử lý */}
              <div className="bg-white rounded border border-gray-200">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Người xử lý</h3>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">Admin</span>
                </div>
                
                <div className="p-3">
                  <select
                    value={formData.handler}
                    onChange={(e) => handleInputChange('handler', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
              </div>
            </div>

            {/* Row 2: Loại case */}
            <div className="bg-white rounded border border-gray-200">
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
                >
                  <option value="">Chọn loại case</option>
                  {caseTypes.map((type) => (
                    <option key={type.id} value={type.name}>
                      {type.name}
                    </option>
                  ))}
                  {caseTypes.length === 0 && (
                    <option value="" disabled>
                      Chưa có loại case nào được cấu hình
                    </option>
                  )}
                </select>
              </div>
            </div>

            {/* Section 3: Chi tiết case */}
            <div className="bg-white rounded border border-gray-200">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Chi tiết case</h3>
              </div>
              
              <div className="p-3">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Tiêu đề case <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Nhập tiêu đề case"
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
                      className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                      placeholder="Mô tả chi tiết case..."
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Thời gian */}
            <div className="bg-white rounded border border-gray-200">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Thời gian</h3>
              </div>
              
              <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <DateTimePicker
                    value={formData.startDate}
                    onChange={(value) => handleInputChange('startDate', value)}
                    placeholder="Chọn ngày bắt đầu"
                    locale="vi"
                    valueFormat="DD/MM/YYYY HH:mm"
                    clearable
                    withSeconds={false}
                    styles={{
                      input: {
                        fontSize: '0.875rem',
                        padding: '0.375rem 0.625rem',
                        borderColor: '#d1d5db',
                        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                        borderRadius: '0.25rem',
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Ngày kết thúc
                  </label>
                  <DateTimePicker
                    value={formData.endDate}
                    onChange={(value) => handleInputChange('endDate', value)}
                    placeholder="Chọn ngày kết thúc"
                    locale="vi"
                    valueFormat="DD/MM/YYYY HH:mm"
                    clearable
                    minDate={formData.startDate || undefined}
                    withSeconds={false}
                    styles={{
                      input: {
                        fontSize: '0.875rem',
                        padding: '0.375rem 0.625rem',
                        borderColor: '#d1d5db',
                        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                        borderRadius: '0.25rem',
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Trạng thái & Ghi chú */}
            <div className="bg-white rounded border border-gray-200">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Trạng thái & Ghi chú</h3>
              </div>
              
              <div className="p-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Trạng thái case</label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="RECEIVED">Tiếp nhận</option>
                      <option value="IN_PROGRESS">Đang xử lý</option>
                      <option value="COMPLETED">Hoàn thành</option>
                      <option value="CANCELLED">Hủy</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Ghi chú</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Nhập ghi chú cho case nội bộ..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Section 6: Đánh giá công việc */}
            <div className="bg-white rounded border border-amber-200">
              <div className="bg-amber-50 px-3 py-2 border-b border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-600" />
                  <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Đánh giá công việc</h3>
                </div>
                <button
                  type="button"
                  onClick={fetchConfigs}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-100 rounded transition-colors font-medium cursor-pointer"
                  title="Làm mới cấu hình"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Làm mới</span>
                </button>
              </div>
              
              <div className="p-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Mức độ khó */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Mức độ khó <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.difficultyLevel}
                      onChange={(e) => handleInputChange('difficultyLevel', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                      required
                    >
                      <option value="">Chọn mức độ khó</option>
                      {getFieldOptions(EvaluationCategory.DIFFICULTY).map((option) => (
                        <option key={option.id} value={option.points}>
                          {option.points} điểm - {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Thời gian ước tính */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Thời gian ước tính <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.estimatedTime}
                      onChange={(e) => handleInputChange('estimatedTime', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                      required
                    >
                      <option value="">Chọn thời gian ước tính</option>
                      {getFieldOptions(EvaluationCategory.TIME).map((option) => (
                        <option key={option.id} value={option.points}>
                          {option.points} điểm - {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Mức độ ảnh hưởng */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Mức độ ảnh hưởng <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.impactLevel}
                      onChange={(e) => handleInputChange('impactLevel', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                      required
                    >
                      <option value="">Chọn mức độ ảnh hưởng</option>
                      {getFieldOptions(EvaluationCategory.IMPACT).map((option) => (
                        <option key={option.id} value={option.points}>
                          {option.points} điểm - {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Mức độ khẩn cấp */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Mức độ khẩn cấp <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.urgencyLevel}
                      onChange={(e) => handleInputChange('urgencyLevel', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                      required
                    >
                      <option value="">Chọn mức độ khẩn cấp</option>
                      {getFieldOptions(EvaluationCategory.URGENCY).map((option) => (
                        <option key={option.id} value={option.points}>
                          {option.points} điểm - {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Hình thức làm việc */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Hình thức làm việc <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.form}
                      onChange={(e) => {
                        handleInputChange('form', e.target.value);
                        const selectedOption = getFieldOptions(EvaluationCategory.FORM).find(
                          option => option.label === e.target.value
                        );
                        if (selectedOption) {
                          handleInputChange('formScore', selectedOption.points.toString());
                        }
                      }}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                      required
                    >
                      <option value="">Chọn hình thức làm việc</option>
                      {getFieldOptions(EvaluationCategory.FORM).map((option) => (
                        <option key={option.id} value={option.label}>
                          {option.label} ({option.points} điểm)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Actions */}
          <div className="sticky bottom-0 bg-white border-t border-gray-300 px-5 py-3 flex items-center justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors font-medium cursor-pointer"
              style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-sm flex items-center gap-2 cursor-pointer"
              style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>{editingCase ? 'Đang cập nhật...' : 'Đang tạo...'}</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{editingCase ? 'Cập nhật Case' : 'Tạo Case Nội Bộ'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}
