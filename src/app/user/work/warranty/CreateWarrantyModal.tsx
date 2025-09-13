'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { X, User, Shield, FileText, Calendar, Settings, CheckCircle, RefreshCw } from 'lucide-react';
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

interface CreateWarrantyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newWarranty: unknown) => void;
}

export default function CreateWarrantyModal({ isOpen, onClose, onSuccess }: CreateWarrantyModalProps) {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [warrantyTypes, setWarrantyTypes] = useState<(string | { id: string; name: string; description?: string })[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
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
    handler: '',
    warrantyType: '',
    customer: '',
    customerName: '',
    title: '',
    description: '',
    startDate: new Date().toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }),
    endDate: '',
    status: 'RECEIVED',
    notes: '',
    // User self-assessment fields
    difficultyLevel: '',
    estimatedTime: '',
    impactLevel: '',
    urgencyLevel: '',
    form: 'Onsite',
    formScore: '2' // Default for Onsite
  });

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

  const fetchWarrantyTypes = useCallback(async () => {
    try {
      const response = await fetch('/api/warranty-types', {
        method: 'GET',
        headers: {
          'Cache-Control': 'max-age=300',
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Warranty types API response:', data);
        // Convert to array of strings for backward compatibility
        const typeNames = data.data?.map((type: any) => type.name) || [];
        console.log('Processed warranty types:', typeNames);
        setWarrantyTypes(typeNames);
      } else {
        console.error('Failed to fetch warranty types:', response.status, response.statusText);
        setWarrantyTypes([]);
      }
    } catch (error) {
      console.error('Error fetching warranty types:', error);
      setWarrantyTypes([]);
    }
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      handler: '',
      warrantyType: '',
      customer: '',
      customerName: '',
      title: '',
      description: '',
      startDate: new Date().toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      endDate: '',
      status: 'RECEIVED',
      notes: '',
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
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

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
      fetchEmployees();
      fetchPartners();
      fetchWarrantyTypes();
      // Refresh evaluation configs to get latest options
      fetchConfigs();
    }
  }, [isOpen, fetchEmployees, fetchPartners, fetchWarrantyTypes]);

  // Auto-fill handler with current user when employees are loaded
  useEffect(() => {
    if (employees.length > 0 && session?.user?.email) {
      // Find current user in employees list
      const currentUser = employees.find(emp => emp.companyEmail === session.user.email);
      if (currentUser) {
        setFormData(prev => ({
          ...prev,
          handler: currentUser.id
        }));
      }
    }
  }, [employees, session?.user?.email]);

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
      customer: partnerId,
      customerName: selectedPartner ? selectedPartner.fullCompanyName : ''
    }));
    setCustomerSearch(selectedPartner ? `${selectedPartner.fullCompanyName} (${selectedPartner.shortName})` : '');
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
        customer: '',
        customerName: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      // Prepare data for API
      const warrantyData = {
        title: formData.title,
        description: formData.description,
        handlerId: formData.handler,
        warrantyTypeId: formData.warrantyType,
        customerId: formData.customer || null,
        customerName: formData.customerName || null,
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

      console.log('=== Submitting Warranty ===');
      console.log('Form data:', formData);
      console.log('Warranty data to send:', warrantyData);

      // Send to API
      const response = await fetch('/api/warranties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(warrantyData),
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Warranty created successfully:', result);
        
        // Show success message
        toast.success('Tạo case bảo hành thành công!', {
          duration: 3000,
          position: 'top-right',
        });
        
        // Reset form data
        resetForm();
        
        // Call onSuccess callback with new warranty data
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
         
        console.error('Failed to create warranty:', error);
        toast.error(`Lỗi: ${error.error || 'Không thể tạo case bảo hành'}`, {
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto my-8">
        {/* Compact Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-md">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Tạo Case Bảo Hành</h2>
                <p className="text-blue-100 text-sm">Hệ thống quản lý bảo hành</p>
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
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Section 1: Thông tin cơ bản */}
            <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-1.5 bg-blue-100 rounded-md">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Thông tin cơ bản</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 flex items-center">
                    <span className="w-24">Người xử lý</span>
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
                    <span className="w-24">Loại bảo hành</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    value={formData.warrantyType}
                    onChange={(e) => handleInputChange('warrantyType', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  >
                    <option value="">Chọn loại bảo hành</option>
                    {warrantyTypes.map((type) => (
                      <option key={typeof type === 'string' ? type : type.id} value={typeof type === 'string' ? type : type.id}>
                        {typeof type === 'string' ? type : type.name}
                      </option>
                    ))}
                    {warrantyTypes.length === 0 && (
                      <option value="" disabled>
                        Chưa có loại bảo hành nào được cấu hình
                      </option>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 flex items-center">
                    <span className="w-24">Khách hàng</span>
                    <span className="ml-1 w-2"></span>
                  </label>
                  <div className="relative customer-dropdown-container">
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => handleCustomerSearchChange(e.target.value)}
                      onFocus={() => setShowCustomerDropdown(true)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Tìm kiếm khách hàng..."
                    />
                    {showCustomerDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {filteredPartners.length > 0 ? (
                          filteredPartners.map((partner) => (
                            <div
                              key={partner.id}
                              onClick={() => handleCustomerSelect(partner.id)}
                              className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium">{partner.fullCompanyName}</div>
                              <div className="text-gray-500 text-xs">{partner.shortName}</div>
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            Không tìm thấy khách hàng
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 flex items-center">
                    <span className="w-24">Tên khách hàng</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Nhập tên khách hàng"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Chi tiết bảo hành */}
            <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-1.5 bg-purple-100 rounded-md">
                  <FileText className="h-4 w-4 text-purple-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Chi tiết bảo hành</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 flex items-center">
                    <span className="w-24">Tiêu đề case</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Nhập tiêu đề case bảo hành"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 flex items-center">
                    <span className="w-24">Mô tả chi tiết</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    placeholder="Mô tả chi tiết vấn đề bảo hành..."
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Thời gian */}
            <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-1.5 bg-orange-100 rounded-md">
                  <Calendar className="h-4 w-4 text-orange-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Thời gian</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 flex items-center h-5">
                    <span className="w-32">Thời gian bắt đầu</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors min-h-[38px]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 flex items-center h-5">
                    <span className="w-32">Thời gian kết thúc</span>
                    <span className="ml-1 w-2"></span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors min-h-[38px]"
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

            {/* Section 5: Trạng thái & Ghi chú */}
            <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-1.5 bg-gray-100 rounded-md">
                  <CheckCircle className="h-4 w-4 text-gray-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Trạng thái & Ghi chú</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 flex items-center">
                    <span className="w-24">Trạng thái</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  >
                    <option value="RECEIVED">Tiếp nhận</option>
                    <option value="PROCESSING">Đang xử lý</option>
                    <option value="COMPLETED">Hoàn thành</option>
                    <option value="CANCELLED">Hủy</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 flex items-center">
                    <span className="w-24">Ghi chú</span>
                    <span className="ml-1 w-2"></span>
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
          <div className="flex items-center justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium flex items-center"
            >
              <Shield className="h-4 w-4 mr-2" />
              Tạo Case Bảo Hành
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
