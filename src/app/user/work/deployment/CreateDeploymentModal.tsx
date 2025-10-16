'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { X, User, Rocket, FileText, Calendar, Settings, CheckCircle, RefreshCw, Building2, AlertCircle, Star } from 'lucide-react';
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

interface CreateDeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newCase: any) => void;
}

export default function CreateDeploymentModal({ isOpen, onClose, onSuccess }: CreateDeploymentModalProps) {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [deploymentTypes, setDeploymentTypes] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
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
  const [formData, setFormData] = useState(() => ({
    customerTitle: 'Anh', // Default title
    customerName: '',
    handler: '',
    deploymentType: '',
    customer: '',
    title: '',
    description: '',
    startDate: new Date() as Date | null,
    endDate: null as Date | null,
    status: 'RECEIVED',
    notes: '',
    crmReferenceCode: '', // Thêm trường Mã CRM
    // User self-assessment fields
    difficultyLevel: '',
    estimatedTime: '',
    impactLevel: '',
    urgencyLevel: '',
    form: 'Onsite',
    formScore: '2' // Default for Onsite
  }));

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await fetch('/api/employees/list', {
        method: 'GET',
        headers: {
          'Cache-Control': 'max-age=300',
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

  const fetchCurrentEmployee = useCallback(async () => {
    if (!session?.user?.email) return;
    
    try {
      const response = await fetch('/api/user/basic-info');
      if (response.ok) {
        const data = await response.json();
        console.log('User basic info data:', data);
        
        // Transform the data to match Employee interface
        if (data.employee) {
          setCurrentEmployee({
            id: data.employee.id,
            fullName: data.employee.fullName,
            position: data.employee.position,
            department: data.employee.department,
            companyEmail: data.employee.companyEmail || session.user.email
          });
        } else {
          // Fallback to user data if no employee record
          setCurrentEmployee({
            id: data.id,
            fullName: data.name || data.email,
            position: 'Nhân viên',
            department: data.department || 'Chưa xác định',
            companyEmail: session.user.email
          });
        }
      } else {
        console.error('Failed to load user basic info:', response.status);
      }
    } catch (error) {
      console.error('Error loading current employee:', error);
    }
  }, [session?.user?.email]);

  const fetchPartners = useCallback(async () => {
    try {
      const response = await fetch('/api/partners/list', {
        method: 'GET',
        headers: {
          'Cache-Control': 'max-age=300',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPartners(data || []);
      } else {
        console.error('Failed to fetch partners:', response.status, response.statusText);
        setPartners([]);
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
      setPartners([]);
    }
  }, []);

  const fetchDeploymentTypes = useCallback(async () => {
    try {
      const response = await fetch(`/api/deployment-types?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Store full objects for easier access to id and name
        setDeploymentTypes(data.data || []);
      } else {
        console.error('Failed to fetch deployment types:', response.status, response.statusText);
        setDeploymentTypes([]);
      }
    } catch (error) {
      console.error('Error fetching deployment types:', error);
      setDeploymentTypes([]);
    }
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      customerTitle: 'Anh',
      customerName: '',
      handler: currentEmployee?.id || '',
      deploymentType: '',
      customer: '',
      title: '',
      description: '',
      startDate: new Date(),
      endDate: null,
      status: 'RECEIVED',
      notes: '',
      crmReferenceCode: '', // Reset Mã CRM
      // User self-assessment fields
      difficultyLevel: '',
      estimatedTime: '',
      impactLevel: '',
      urgencyLevel: '',
      form: 'Onsite',
      formScore: '2' // Default for Onsite
    });
    setCustomerSearch('');
    setShowCustomerDropdown(false);
  }, [currentEmployee?.id]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  // Auto-select current employee when both currentEmployee and employees are loaded
  useEffect(() => {
    if (currentEmployee && employees.length > 0 && formData.handler === '') {
      setFormData(prev => ({
        ...prev,
        handler: currentEmployee.id
      }));
    }
  }, [currentEmployee, employees, formData.handler]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.customer-dropdown-container')) {
        setShowCustomerDropdown(false);
      }
    };

    if (showCustomerDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCustomerDropdown]);

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCurrentEmployee();
      fetchEmployees();
      fetchPartners();
      fetchDeploymentTypes();
      // Refresh evaluation configs to get latest options
      fetchConfigs();
    }
  }, [isOpen, fetchCurrentEmployee, fetchEmployees, fetchPartners, fetchDeploymentTypes]);

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

  const handleInputChange = (field: string, value: string | Date | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-fill position when reporter is selected
    if (field === 'reporter' && typeof value === 'string') {
      const selectedEmployee = employees.find(emp => emp.id === value);
      if (selectedEmployee) {
        setFormData(prev => ({
          ...prev,
          reporter: value,
          position: selectedEmployee.position || ''
        }));
      }
    }
  };

  // Filter partners based on search
  const filteredPartners = partners.filter(partner =>
    partner.fullCompanyName.toLowerCase().includes(customerSearch.toLowerCase()) ||
    partner.shortName.toLowerCase().includes(customerSearch.toLowerCase())
  );

  // Handle customer selection
  const handleCustomerSelect = (partnerId: string) => {
    const selectedPartner = partners.find(p => p.id === partnerId);
    setFormData(prev => ({
      ...prev,
      customer: partnerId
    }));
    setCustomerSearch(selectedPartner ? selectedPartner.shortName : '');
    setShowCustomerDropdown(false);
  };

  // Handle customer search change
  const handleCustomerSearchChange = (value: string) => {
    setCustomerSearch(value);
    setShowCustomerDropdown(true);
    
    // If search is cleared, clear customer selection
    if (!value) {
      setFormData(prev => ({
        ...prev,
        customer: ''
      }));
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
      if (formData.endDate <= formData.startDate) {
        toast.error('Ngày kết thúc phải lớn hơn ngày bắt đầu!', {
          duration: 3000,
          position: 'top-right',
        });
        return;
      }
    }
    
    setLoading(true);
    
    try {
      // Get deployment type id from deployment types
      const selectedDeploymentType = deploymentTypes.find(dt => dt.id === formData.deploymentType);
      
      if (!selectedDeploymentType) {
        toast.error('Vui lòng chọn loại triển khai!', {
          duration: 3000,
          position: 'top-right',
        });
        return;
      }

      // Validate required fields
      if (!formData.handler) {
        toast.error('Vui lòng chọn người xử lý!', {
          duration: 3000,
          position: 'top-right',
        });
        return;
      }

      if (!formData.customerName.trim()) {
        toast.error('Vui lòng nhập tên khách hàng!', {
          duration: 3000,
          position: 'top-right',
        });
        return;
      }

      // Combine customer title and name
      const fullCustomerName = `${formData.customerTitle} ${formData.customerName}`.trim();

      // Convert dates to ISO strings - handle both Date objects and strings
      console.log('🔍 Debug startDate:', {
        value: formData.startDate,
        type: typeof formData.startDate,
        isDate: formData.startDate instanceof Date,
        isValid: formData.startDate instanceof Date ? !isNaN(formData.startDate.getTime()) : false
      });
      
      // Helper function to convert to ISO string
      const toISOString = (dateValue: Date | string | null): string | null => {
        if (!dateValue) return null;
        
        try {
          if (dateValue instanceof Date) {
            return !isNaN(dateValue.getTime()) ? dateValue.toISOString() : null;
          }
          // If it's a string, try to parse it
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
      
      console.log('🔍 Converted dates:', { startDateISO, endDateISO });

      // Final validation: startDate must be valid
      if (!startDateISO) {
        toast.error('Ngày bắt đầu không hợp lệ. Vui lòng chọn lại!', {
          duration: 4000,
          position: 'top-right',
        });
        setLoading(false);
        return;
      }

      // Prepare data for API
      const deploymentData = {
        title: formData.title,
        description: formData.description,
        customerName: fullCustomerName,
        reporterId: session?.user?.id, // Current user as reporter
        handlerId: formData.handler, // Use selected handler
        deploymentTypeId: selectedDeploymentType.id,
        customerId: formData.customer || null,
        startDate: startDateISO,
        endDate: endDateISO,
        status: formData.status,
        notes: formData.notes || null,
        crmReferenceCode: formData.crmReferenceCode || null, // Thêm Mã CRM
        // User self-assessment data
        userDifficultyLevel: formData.difficultyLevel,
        userEstimatedTime: formData.estimatedTime,
        userImpactLevel: formData.impactLevel,
        userUrgencyLevel: formData.urgencyLevel,
        userFormScore: formData.formScore
      };

      // Send to API
      const response = await fetch('/api/deployment-cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deploymentData),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Show success message
        toast.success('Tạo case triển khai thành công!', {
          duration: 3000,
          position: 'top-right',
        });
        
        // Trigger case creation event for real-time notifications
        window.dispatchEvent(new CustomEvent('case-created'));
        
        // Reset form data
        resetForm();
        
        // Call onSuccess callback with new deployment data
        if (onSuccess && result.data) {
          onSuccess(result.data);
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
         
        console.error('Failed to create deployment:', error);
        toast.error(`Lỗi: ${error.error || 'Không thể tạo case triển khai'}`, {
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
         {/* Header - Màu xanh lá cây để phân biệt với Admin */}
         <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded">
                <Rocket className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Tạo Case Triển Khai</h2>
                <p className="text-emerald-50 text-xs mt-0.5">Quản lý triển khai sản phẩm/dịch vụ</p>
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
            {/* Row 1: Người thực hiện + Loại triển khai */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Section 1: Người thực hiện */}
              <div className="bg-white rounded border border-gray-200">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-emerald-600" />
                    <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Người xử lý</h3>
                  </div>
                  <span className="text-red-500 text-sm">*</span>
                </div>
                
                <div className="p-3">
                  <select
                    value={formData.handler}
                    onChange={(e) => handleInputChange('handler', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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

              {/* Section 2: Loại triển khai */}
              <div className="bg-white rounded border border-gray-200">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-emerald-600" />
                    <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Loại triển khai</h3>
                  </div>
                  <span className="text-red-500 text-sm">*</span>
                </div>
                
                <div className="p-3">
                  <select
                    value={formData.deploymentType}
                    onChange={(e) => handleInputChange('deploymentType', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    required
                  >
                    <option value="">Chọn loại triển khai</option>
                    {deploymentTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                    {deploymentTypes.length === 0 && (
                      <option value="" disabled>
                        Chưa có loại triển khai nào được cấu hình
                      </option>
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Thông tin khách hàng */}
            <div className="bg-white rounded border border-gray-200">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Thông tin khách hàng</h3>
              </div>
              
              <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Tên khách hàng <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.customerTitle}
                      onChange={(e) => handleInputChange('customerTitle', e.target.value)}
                      className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    >
                      <option value="Anh">Anh</option>
                      <option value="Chị">Chị</option>
                    </select>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => handleInputChange('customerName', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      placeholder="Nhập tên khách hàng..."
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Tên công ty</label>
                  <div className="relative customer-dropdown-container">
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => handleCustomerSearchChange(e.target.value)}
                      onFocus={() => setShowCustomerDropdown(true)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      placeholder="Tìm kiếm khách hàng..."
                    />
                    {showCustomerDropdown && (
                      <div className="absolute z-[9999] w-full mt-1.5 bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-y-auto">
                        {filteredPartners.length > 0 ? (
                          filteredPartners.map((partner) => (
                            <div
                              key={partner.id}
                              onClick={() => handleCustomerSelect(partner.id)}
                              className="px-3 py-2.5 hover:bg-emerald-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                            >
                              <div className="font-medium text-sm text-gray-900">{partner.shortName}</div>
                              <div className="text-xs text-gray-600 mt-0.5">{partner.fullCompanyName}</div>
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-6 text-center text-sm text-gray-500">
                            Không tìm thấy khách hàng
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Chi tiết triển khai */}
            <div className="bg-white rounded border border-gray-200">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Chi tiết triển khai</h3>
              </div>
              
              <div className="p-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Tiêu đề triển khai <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      placeholder="Nhập tiêu đề triển khai"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Mã CRM</label>
                    <input
                      type="text"
                      value={formData.crmReferenceCode || ''}
                      onChange={(e) => handleInputChange('crmReferenceCode', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      placeholder="Nhập mã CRM"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Mô tả chi tiết <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
                    placeholder="Mô tả chi tiết triển khai..."
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Thời gian */}
            <div className="bg-white rounded border border-gray-200">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-600" />
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

            {/* Section 6: Trạng thái & Ghi chú */}
            <div className="bg-white rounded border border-gray-200">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Trạng thái & Ghi chú</h3>
              </div>
              
              <div className="p-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Trạng thái case</label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    >
                      <option value="RECEIVED">Tiếp nhận</option>
                      <option value="PROCESSING">Đang xử lý</option>
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
                    className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                    placeholder="Nhập ghi chú cho case triển khai..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Section 7: Đánh giá công việc */}
            <div className="bg-white rounded border border-amber-200">
              <div className="bg-amber-50 px-3 py-2 border-b border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-600" />
                  <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Đánh giá công việc</h3>
                </div>
                <button
                  type="button"
                  onClick={fetchConfigs}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-100 rounded transition-colors font-medium"
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
                        // Auto-set form score based on selection
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
              className="px-5 py-2 text-sm bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-sm flex items-center gap-2 cursor-pointer"
              style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Đang tạo...</span>
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4" />
                  <span>Tạo Case Triển Khai</span>
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
