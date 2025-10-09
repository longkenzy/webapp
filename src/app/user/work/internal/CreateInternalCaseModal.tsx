'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { X, User, Wrench, FileText, Calendar, Settings, CheckCircle, RefreshCw } from 'lucide-react';
import { useEvaluationForm } from '@/hooks/useEvaluation';
import { useEvaluation } from '@/contexts/EvaluationContext';
import { EvaluationType, EvaluationCategory } from '@/contexts/EvaluationContext';
import { getCurrentVietnamDateTime, convertLocalInputToISO } from '@/lib/date-utils';
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

interface InternalCaseData {
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
    avatar?: string | null;
  };
  caseType: string;
  form: string;
  status: string;
  startDate: string;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
  notes?: string | null;
  userDifficultyLevel?: number | null;
  userEstimatedTime?: number | null;
  userImpactLevel?: number | null;
  userUrgencyLevel?: number | null;
  userFormScore?: number | null;
  userAssessmentDate?: string | null;
  adminDifficultyLevel?: number | null;
  adminEstimatedTime?: number | null;
  adminImpactLevel?: number | null;
  adminUrgencyLevel?: number | null;
  adminAssessmentDate?: string | null;
  adminAssessmentNotes?: string | null;
}

interface CreateInternalCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newCase: InternalCaseData) => void;
  editingCase?: any; // Case data for editing
}

export default function CreateInternalCaseModal({ isOpen, onClose, onSuccess, editingCase }: CreateInternalCaseModalProps) {
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
    startDate: '', // Empty by default - user must select time
    endDate: '',
    status: 'RECEIVED', // Changed to English value
    notes: '',
    // User self-assessment fields
    difficultyLevel: '',
    estimatedTime: '',
    impactLevel: '',
    urgencyLevel: '',
    formScore: '2' // Default for Onsite
  });

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await fetch('/api/employees/list', {
        method: 'GET',
        headers: {
          'Cache-Control': 'max-age=600', // Increased cache time
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
          'Cache-Control': 'max-age=600', // Increased cache time
        },
      });
      if (response.ok) {
        const result = await response.json();
        
        // Check if response has data array
        if (result.success && Array.isArray(result.data)) {
          // Filter only active case types
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
      handler: '',
      caseType: '',
      form: 'Onsite',
      title: '',
      description: '',
      startDate: new Date().toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Ho_Chi_Minh'
      }),
      endDate: '',
      status: 'RECEIVED', // Changed to English value
      notes: '',
      // User self-assessment fields
      difficultyLevel: '',
      estimatedTime: '',
      impactLevel: '',
      urgencyLevel: '',
      formScore: '2' // Default for Onsite
    });
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
      fetchCaseTypes();
      // Refresh evaluation configs to get latest options
      fetchConfigs();
    }
  }, [isOpen, fetchEmployees, fetchCaseTypes, fetchConfigs]);

  // Populate form when editing
  useEffect(() => {
    if (isOpen && editingCase) {
      // Populate form with editing case data
      // Convert datetime to local timezone for datetime-local input
      let startDateLocal = '';
      if (editingCase.startDate) {
        const startDateObj = new Date(editingCase.startDate);
        const year = startDateObj.getFullYear();
        const month = String(startDateObj.getMonth() + 1).padStart(2, '0');
        const day = String(startDateObj.getDate()).padStart(2, '0');
        const hours = String(startDateObj.getHours()).padStart(2, '0');
        const minutes = String(startDateObj.getMinutes()).padStart(2, '0');
        startDateLocal = `${year}-${month}-${day}T${hours}:${minutes}`;
      }

      let endDateLocal = '';
      if (editingCase.endDate) {
        const endDateObj = new Date(editingCase.endDate);
        const year = endDateObj.getFullYear();
        const month = String(endDateObj.getMonth() + 1).padStart(2, '0');
        const day = String(endDateObj.getDate()).padStart(2, '0');
        const hours = String(endDateObj.getHours()).padStart(2, '0');
        const minutes = String(endDateObj.getMinutes()).padStart(2, '0');
        endDateLocal = `${year}-${month}-${day}T${hours}:${minutes}`;
      }

      setFormData({
        requester: editingCase.requester?.id || '',
        position: editingCase.requester?.position || '',
        handler: editingCase.handler?.id || '',
        caseType: editingCase.caseType || '',
        title: editingCase.title || '',
        description: editingCase.description || '',
        startDate: startDateLocal,
        endDate: endDateLocal,
        status: editingCase.status || 'RECEIVED',
        notes: editingCase.notes || '',
        difficultyLevel: editingCase.userDifficultyLevel?.toString() || '',
        estimatedTime: editingCase.userEstimatedTime?.toString() || '',
        impactLevel: editingCase.userImpactLevel?.toString() || '',
        urgencyLevel: editingCase.userUrgencyLevel?.toString() || '',
        form: editingCase.form || 'Onsite',
        formScore: editingCase.userFormScore?.toString() || '2'
      });
      
      console.log('Editing internal case:', editingCase);
      console.log('Converted startDate:', startDateLocal);
      console.log('Converted endDate:', endDateLocal);
    } else if (isOpen && !editingCase) {
      // Reset form for new case
      resetForm();
    }
  }, [isOpen, editingCase, resetForm]);

  // Auto-fill handler with current user when employees are loaded (ONLY for CREATE mode, NOT for EDIT mode)
  useEffect(() => {
    // CRITICAL: Only auto-select handler when creating NEW case, NOT when editing
    if (employees.length > 0 && session?.user && !editingCase) {
      console.log('Session user:', session.user);
      console.log('Available employees:', employees.map(emp => ({ id: emp.id, fullName: emp.fullName, companyEmail: emp.companyEmail })));
      
      // Try to find current user by email first
      let currentUser = null;
      if (session.user.email) {
        currentUser = employees.find(emp => emp.companyEmail === session.user.email);
      }
      
      // If not found by email, try to find by username or name
      if (!currentUser && session.user.name) {
        currentUser = employees.find(emp => 
          emp.fullName.toLowerCase().includes(session.user.name?.toLowerCase() || '') ||
          emp.companyEmail.toLowerCase().includes(session.user.name?.toLowerCase() || '')
        );
      }
      
      // If still not found, try to find by email from session
      if (!currentUser && session.user.email) {
        currentUser = employees.find(emp => 
          emp.companyEmail.toLowerCase().includes(session.user.email?.toLowerCase() || '')
        );
      }
      
      if (currentUser) {
        console.log('Auto-selected handler (CREATE mode only):', currentUser.fullName);
        setFormData(prev => ({
          ...prev,
          handler: currentUser.id
        }));
      } else {
        console.log('Could not find current user in employees list');
        console.log('Session user email:', session.user.email);
        console.log('Session user name:', session.user.name);
      }
    }
  }, [employees, session?.user, editingCase]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      
      // Prevent body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore body scroll
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        
        // Restore scroll position
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ONLY validate: if both dates exist, endDate must be > startDate
    // NO validation against current time - allow any past/future dates
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      console.log('=== Date Validation ===');
      console.log('Start Date Input:', formData.startDate);
      console.log('End Date Input:', formData.endDate);
      console.log('Start Date Object:', startDate);
      console.log('End Date Object:', endDate);
      console.log('End Date <= Start Date?', endDate <= startDate);
      
      if (endDate <= startDate) {
        toast.error('Thời gian kết thúc phải lớn hơn thời gian bắt đầu!', {
          duration: 3000,
          position: 'top-right',
        });
        return;
      }
    }
    
    try {
      // Prepare data for API
      const caseData = {
        title: formData.title,
        description: formData.description,
        requesterId: formData.requester,
        handlerId: formData.handler,
        caseType: formData.caseType,
        form: formData.form,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        status: formData.status,
        notes: formData.notes || null,
        // User self-assessment data
        userDifficultyLevel: formData.difficultyLevel,
        userEstimatedTime: formData.estimatedTime,
        userImpactLevel: formData.impactLevel,
        userUrgencyLevel: formData.urgencyLevel,
        userFormScore: formData.formScore
      };

      console.log('=== Submitting Internal Case ===');
      console.log('Form data:', formData);
      console.log('Case data to send:', caseData);

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
        
        // Show success message (you can add a toast notification here)
        toast.success(isEditing ? 'Cập nhật case nội bộ thành công!' : 'Tạo case nội bộ thành công!', {
          duration: 3000,
          position: 'top-right',
        });
        
        // Trigger case creation event for real-time notifications
        window.dispatchEvent(new CustomEvent('case-created'));
        
        // Reset form data
        resetForm();
        
        // Call onSuccess callback with new case data
        if (onSuccess && result.data) {
          console.log('=== Case Created Successfully ===');
          console.log('New case data:', result.data);
          await onSuccess(result.data);
        }
        
        // Close modal
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
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto my-4 sm:my-8">
        {/* Compact Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 sm:px-6 py-3 sm:py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-md">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {editingCase ? 'Chỉnh sửa Case Nội Bộ' : 'Tạo Case Nội Bộ'}
                </h2>
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

        {/* Compact Form */}
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
                  <label className="text-xs font-medium text-gray-600 flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="w-28">Người xử lý</span>
                      <span className="text-red-500 ml-1">*</span>
                    </div>
                    {session?.user && (
                      <button
                        type="button"
                        onClick={() => {
                          // Try to auto-select current user again
                          if (employees.length > 0 && session?.user) {
                            let currentUser = null;
                            if (session.user.email) {
                              currentUser = employees.find(emp => emp.companyEmail === session.user.email);
                            }
                            if (!currentUser && session.user.name) {
                              currentUser = employees.find(emp => 
                                emp.fullName.toLowerCase().includes(session.user.name?.toLowerCase() || '') ||
                                emp.companyEmail.toLowerCase().includes(session.user.name?.toLowerCase() || '')
                              );
                            }
                            if (!currentUser && session.user.email) {
                              currentUser = employees.find(emp =>
                                emp.companyEmail.toLowerCase().includes(session.user.email?.toLowerCase() || '')
                              );
                            }
                            if (currentUser) {
                              setFormData(prev => ({
                                ...prev,
                                handler: currentUser.id
                              }));
                            }
                          }
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                        title="Tự động chọn user hiện tại"
                      >
                        Chọn tôi
                      </button>
                    )}
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
                  {!formData.handler && employees.length > 0 && session?.user && (
                    <p className="text-xs text-orange-600 mt-1">
                      ⚠️ Không tìm thấy user hiện tại trong danh sách nhân viên
                    </p>
                  )}
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
                  {caseTypes.length === 0 && !loading && (
                    <p className="text-xs text-orange-600 mt-1">
                      ⚠️ Chưa có loại case nào. Vui lòng liên hệ admin để tạo loại case.
                    </p>
                  )}
                </div>

              </div>
            </div>


            {/* Section 3: Chi tiết case */}
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

            {/* Section 4: Thời gian */}
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


            {/* Section 5: Đánh giá của User */}
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
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    value={formData.difficultyLevel}
                    onChange={(e) => handleInputChange('difficultyLevel', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-yellow-200 rounded focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                    required
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
                <div className="space-y-1">
                  <label className="text-xs font-medium text-yellow-600 flex items-center">
                    <span className="w-32">Thời gian ước tính</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    value={formData.estimatedTime}
                    onChange={(e) => handleInputChange('estimatedTime', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-yellow-200 rounded focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                    required
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
                <div className="space-y-1">
                  <label className="text-xs font-medium text-yellow-600 flex items-center">
                    <span className="w-32">Mức độ ảnh hưởng</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    value={formData.impactLevel}
                    onChange={(e) => handleInputChange('impactLevel', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-yellow-200 rounded focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                    required
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
                <div className="space-y-1">
                  <label className="text-xs font-medium text-yellow-600 flex items-center">
                    <span className="w-32">Mức độ khẩn cấp</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    value={formData.urgencyLevel}
                    onChange={(e) => handleInputChange('urgencyLevel', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-yellow-200 rounded focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                    required
                  >
                    <option value="">Chọn mức độ khẩn cấp</option>
                    {getFieldOptions(EvaluationCategory.URGENCY).map((option) => (
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
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    value={formData.form}
                    onChange={(e) => {
                      handleInputChange('form', e.target.value);
                      // Auto-set form score based on selection
                      const selectedOption = getFieldOptions(EvaluationCategory.FORM).find(
                        option => option.label === e.target.value
                      );
                      if (selectedOption) {
                        handleInputChange('formScore', selectedOption.points.toString());
                      }
                    }}
                    className="w-full px-3 py-2 text-sm border border-yellow-200 rounded focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
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

          {/* Compact Form Actions */}
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
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1 sm:mr-2 animate-spin" />
                  {editingCase ? 'Đang cập nhật...' : 'Đang tạo...'}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-1 sm:mr-2" />
                  {editingCase ? 'Cập nhật Case' : 'Tạo Case'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
