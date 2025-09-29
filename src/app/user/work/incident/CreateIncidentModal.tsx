'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { X, User, AlertTriangle, FileText, Calendar, Settings, CheckCircle, RefreshCw } from 'lucide-react';
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

interface CreateIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newIncident: any) => void;
}

export default function CreateIncidentModal({ isOpen, onClose, onSuccess }: CreateIncidentModalProps) {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [incidentTypes, setIncidentTypes] = useState<any[]>([]);
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
  const [formData, setFormData] = useState({
    customerTitle: 'Anh', // Default title
    customerName: '',
    handler: '',
    incidentType: '',
    customer: '',
    title: '',
    description: '',
    startDate: new Date().toISOString().slice(0, 16),
    endDate: '',
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
  });

  const fetchCurrentEmployee = useCallback(async () => {
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
  }, []);

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

  const fetchIncidentTypes = useCallback(async () => {
    try {
      const response = await fetch('/api/incident-types');
      if (response.ok) {
        const data = await response.json();
        setIncidentTypes(data.data || []);
      } else {
        console.error('Failed to fetch incident types:', response.status, response.statusText);
        setIncidentTypes([]);
      }
    } catch (error) {
      console.error('Error fetching incident types:', error);
      setIncidentTypes([]);
    }
  }, []);

  const resetForm = () => {
    setFormData({
      customerTitle: 'Anh',
      customerName: '',
      handler: '',
      incidentType: '',
      customer: '',
      title: '',
      description: '',
      startDate: new Date().toISOString().slice(0, 16),
      endDate: '',
      status: 'RECEIVED',
      notes: '',
      crmReferenceCode: '', // Reset Mã CRM
      difficultyLevel: '',
      estimatedTime: '',
      impactLevel: '',
      urgencyLevel: '',
      form: 'Onsite',
      formScore: '2'
    });
    setCustomerSearch('');
    setShowCustomerDropdown(false);
  };

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
      fetchIncidentTypes();
      // Refresh evaluation configs to get latest options
      fetchConfigs();
    }
  }, [isOpen, fetchCurrentEmployee, fetchEmployees, fetchPartners, fetchIncidentTypes]);

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

    // Auto-fill position when reporter is selected
    if (field === 'reporter') {
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
    setCustomerSearch(selectedPartner ? `${selectedPartner.fullCompanyName} (${selectedPartner.shortName})` : '');
    setShowCustomerDropdown(false);
  };

  // Handle customer search change
  const handleCustomerSearchChange = (value: string) => {
    setCustomerSearch(value);
    setShowCustomerDropdown(true);
    
    // Clear selected customer if search is cleared
    if (!value) {
      setFormData(prev => ({
        ...prev,
        customer: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) {
      toast.error('Bạn cần đăng nhập để thực hiện chức năng này!');
      return;
    }

    // Validate required fields
    if (!formData.customerName.trim()) {
      toast.error('Vui lòng nhập tên khách hàng!');
      return;
    }

    if (!formData.handler) {
      toast.error('Vui lòng chọn người xử lý!');
      return;
    }

    if (!formData.incidentType) {
      toast.error('Vui lòng chọn loại sự cố!');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề sự cố!');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Vui lòng nhập mô tả sự cố!');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare data for API
      const fullCustomerName = `${formData.customerTitle} ${formData.customerName}`.trim();
      
      // Find incident type name from ID
      const selectedIncidentType = incidentTypes.find(type => type.id === formData.incidentType);
      const incidentTypeName = selectedIncidentType ? selectedIncidentType.name : formData.incidentType;

      const incidentData = {
        title: formData.title,
        description: formData.description,
        customerName: fullCustomerName,
        reporterId: session.user.id,
        handlerId: formData.handler,
        incidentType: incidentTypeName,
        customerId: formData.customer || null,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        status: formData.status,
        notes: formData.notes,
        crmReferenceCode: formData.crmReferenceCode || null, // Thêm Mã CRM
        // User assessment fields
        userDifficultyLevel: formData.difficultyLevel ? parseInt(formData.difficultyLevel) : null,
        userEstimatedTime: formData.estimatedTime ? parseInt(formData.estimatedTime) : null,
        userImpactLevel: formData.impactLevel ? parseInt(formData.impactLevel) : null,
        userUrgencyLevel: formData.urgencyLevel ? parseInt(formData.urgencyLevel) : null,
        userFormScore: formData.formScore ? parseInt(formData.formScore) : null,
        userAssessmentDate: new Date().toISOString()
      };

      // Send to API
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(incidentData),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Show success notification
        toast.success('Tạo case xử lý sự cố thành công!', {
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#10B981',
            color: '#fff',
          },
        });
        
        // Dispatch custom event for case creation
        window.dispatchEvent(new CustomEvent('case-created'));
        
        // Reset form data
        resetForm();
        
        // Call onSuccess callback with new incident data
        if (onSuccess && result.data) {
          onSuccess(result.data);
        }
        
        // Close modal
        onClose();
      } else {
        let errorMessage = 'Unknown error';
        let errorDetails = '';
        
        try {
          const responseText = await response.text();
          console.error('Raw response:', responseText);
          console.error('Response status:', response.status);
          console.error('Response statusText:', response.statusText);
          
          if (responseText) {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || errorMessage;
            errorDetails = errorData.details || '';
          } else {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        const fullErrorMessage = errorDetails ? `${errorMessage} (${errorDetails})` : errorMessage;
        
        // Show error notification
        toast.error(`Lỗi tạo case: ${fullErrorMessage}`, {
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#EF4444',
            color: '#fff',
          },
        });
      }
    } catch (error) {
      console.error('Error creating incident:', error);
      toast.error('Có lỗi xảy ra khi tạo case xử lý sự cố. Vui lòng thử lại.', {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#EF4444',
          color: '#fff',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto my-8">
        {/* Compact Header */}
        <div className="sticky top-0 z-20 bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-md">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Tạo Case Xử Lý Sự Cố</h2>
                <p className="text-red-100 text-sm">Hệ thống quản lý sự cố</p>
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
                <div className="p-1.5 bg-red-100 rounded-md">
                  <User className="h-4 w-4 text-red-600" />
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
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
                    <span className="w-24">Loại sự cố</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    value={formData.incidentType}
                    onChange={(e) => handleInputChange('incidentType', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
                    required
                  >
                    <option value="">Chọn loại sự cố</option>
                    {incidentTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                    {incidentTypes.length === 0 && (
                      <option value="" disabled>
                        Chưa có loại sự cố nào được cấu hình
                      </option>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 flex items-center h-5">
                    <span className="w-24">Khách hàng</span>
                    <span className="ml-1 w-2"></span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.customerTitle}
                      onChange={(e) => handleInputChange('customerTitle', e.target.value)}
                      className="w-20 px-2 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
                    >
                      <option value="Anh">Anh</option>
                      <option value="Chị">Chị</option>
                    </select>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => handleInputChange('customerName', e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
                      placeholder="Nhập tên khách hàng..."
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 flex items-center h-5">
                    <span className="w-24">Tên công ty</span>
                    <span className="ml-1 w-2"></span>
                  </label>
                  <div className="relative customer-dropdown-container">
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => handleCustomerSearchChange(e.target.value)}
                      onFocus={() => setShowCustomerDropdown(true)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
                      placeholder="Tìm kiếm khách hàng..."
                    />
                    {showCustomerDropdown && (
                      <div className="absolute z-30 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {filteredPartners.length > 0 ? (
                          filteredPartners.map((partner) => (
                            <div
                              key={partner.id}
                              onClick={() => handleCustomerSelect(partner.id)}
                              className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium">{partner.shortName}</div>
                              <div className="text-gray-500 text-xs">{partner.fullCompanyName}</div>
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

              </div>
            </div>

            {/* Section 2: Chi tiết sự cố */}
            <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-1.5 bg-red-100 rounded-md">
                  <FileText className="h-4 w-4 text-red-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Chi tiết sự cố</h3>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600 flex items-center">
                      <span>Tiêu đề sự cố</span>
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
                      placeholder="Nhập tiêu đề sự cố..."
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600 flex items-center">
                      <span>Mã CRM</span>
                    </label>
                    <input
                      type="text"
                      value={formData.crmReferenceCode || ''}
                      onChange={(e) => handleInputChange('crmReferenceCode', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
                      placeholder="Nhập mã CRM (tùy chọn)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Mã tham chiếu từ hệ thống CRM
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 flex items-center">
                    <span>Mô tả chi tiết</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors resize-none"
                    placeholder="Mô tả chi tiết về sự cố..."
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Thời gian */}
            <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-1.5 bg-red-100 rounded-md">
                  <Calendar className="h-4 w-4 text-red-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Thời gian</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Thời gian bắt đầu</label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Thời gian kết thúc (dự kiến)</label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Đánh giá của User */}
            <div className="bg-yellow-50 rounded-md p-4 border border-yellow-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-yellow-100 rounded-md">
                    <Settings className="h-4 w-4 text-yellow-600" />
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

                {/* Thời gian dự kiến */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-yellow-600 flex items-center">
                    <span className="w-32">Thời gian dự kiến</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    value={formData.estimatedTime}
                    onChange={(e) => handleInputChange('estimatedTime', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-yellow-200 rounded focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                    required
                  >
                    <option value="">Chọn thời gian dự kiến</option>
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

            {/* Section 5: Trạng thái */}
            <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-1.5 bg-red-100 rounded-md">
                  <CheckCircle className="h-4 w-4 text-red-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Trạng thái</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
                  >
                    <option value="RECEIVED">Tiếp nhận</option>
                    <option value="PROCESSING">Đang xử lý</option>
                    <option value="COMPLETED">Hoàn thành</option>
                    <option value="CANCELLED">Hủy</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Ghi chú</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors resize-none"
                    placeholder="Ghi chú thêm..."
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-orange-600 rounded-md hover:from-red-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Tạo Case
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}