'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { X, User, Rocket, FileText, Calendar, Settings, CheckCircle, RefreshCw } from 'lucide-react';
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

interface DeploymentCase {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string | null;
  status: string;
  notes: string | null;
  crmReferenceCode: string | null;
  userDifficultyLevel: number | null;
  userEstimatedTime: number | null;
  userImpactLevel: number | null;
  userUrgencyLevel: number | null;
  userFormScore: number | null;
  userAssessmentDate: string | null;
  customerName: string;
  customer?: {
    id: string;
    shortName: string;
    fullCompanyName: string;
  } | null;
  deploymentType: {
    id: string;
    name: string;
    description?: string;
  };
  handler: {
    id: string;
    fullName: string;
  };
}

interface CreateDeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newCase: any) => void;
  editData?: DeploymentCase | null;
  // Pre-loaded data for performance
  employees?: Employee[];
  partners?: any[];
  deploymentTypes?: any[];
}

export default function CreateDeploymentModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  editData,
  employees: preloadedEmployees,
  partners: preloadedPartners,
  deploymentTypes: preloadedDeploymentTypes
}: CreateDeploymentModalProps) {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<Employee[]>(preloadedEmployees || []);
  const [partners, setPartners] = useState<any[]>(preloadedPartners || []);
  const [deploymentTypes, setDeploymentTypes] = useState<any[]>(preloadedDeploymentTypes || []);
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

  // Populate form data when in edit mode
  useEffect(() => {
    if (editData && isOpen) {
      console.log('=== Populating form data for edit ===');
      console.log('Edit data:', editData);
      console.log('Customer:', editData.customer);
      
      // Get form options to map the correct label
      const formOptions = getFieldOptions(EvaluationCategory.FORM);
      console.log('Form options:', formOptions);
      
      const defaultFormOption = formOptions.find(option => option.points === 2) || formOptions[0];
      const selectedFormOption = formOptions.find(option => 
        (editData.userFormScore && option.points === editData.userFormScore)
      );
      
      console.log('Default form option:', defaultFormOption);
      console.log('Selected form option:', selectedFormOption);
      
      // Convert datetime to local timezone for datetime-local input
      let startDateLocal = '';
      if (editData.startDate) {
        const startDateObj = new Date(editData.startDate);
        const year = startDateObj.getFullYear();
        const month = String(startDateObj.getMonth() + 1).padStart(2, '0');
        const day = String(startDateObj.getDate()).padStart(2, '0');
        const hours = String(startDateObj.getHours()).padStart(2, '0');
        const minutes = String(startDateObj.getMinutes()).padStart(2, '0');
        startDateLocal = `${year}-${month}-${day}T${hours}:${minutes}`;
      }

      let endDateLocal = '';
      if (editData.endDate) {
        const endDateObj = new Date(editData.endDate);
        const year = endDateObj.getFullYear();
        const month = String(endDateObj.getMonth() + 1).padStart(2, '0');
        const day = String(endDateObj.getDate()).padStart(2, '0');
        const hours = String(endDateObj.getHours()).padStart(2, '0');
        const minutes = String(endDateObj.getMinutes()).padStart(2, '0');
        endDateLocal = `${year}-${month}-${day}T${hours}:${minutes}`;
      }

      const newFormData = {
        customerTitle: editData.customerName?.includes('Anh') ? 'Anh' : 'Chị',
        customerName: editData.customerName || '',
        handler: editData.handler?.id || '',
        deploymentType: editData.deploymentType?.id || '',
        customer: editData.customer?.id || '',
        title: editData.title || '',
        description: editData.description || '',
        startDate: startDateLocal,
        endDate: endDateLocal,
        status: editData.status || 'RECEIVED',
        notes: editData.notes || '',
        crmReferenceCode: editData.crmReferenceCode || '',
        difficultyLevel: editData.userDifficultyLevel?.toString() || '',
        estimatedTime: editData.userEstimatedTime?.toString() || '',
        impactLevel: editData.userImpactLevel?.toString() || '',
        urgencyLevel: editData.userUrgencyLevel?.toString() || '',
        form: selectedFormOption?.label || defaultFormOption?.label || 'Onsite',
        formScore: editData.userFormScore?.toString() || '2'
      };
      
      console.log('Setting form data:', newFormData);
      console.log('Converted startDate:', startDateLocal);
      console.log('Converted endDate:', endDateLocal);
      setFormData(newFormData);
      
      // Set customer search term
      if (editData.customer) {
        console.log('Setting customer search to:', editData.customer.shortName);
        setCustomerSearch(editData.customer.shortName);
      }
    } else if (!editData && isOpen) {
      // Reset form when creating new case
      console.log('Resetting form for new case');
      setFormData({
        customerTitle: 'Anh',
        customerName: '',
        handler: '',
        deploymentType: '',
        customer: '',
        title: '',
        description: '',
        startDate: '', // Empty - user must select time
        endDate: '',
        status: 'RECEIVED',
        notes: '',
        crmReferenceCode: '',
        difficultyLevel: '',
        estimatedTime: '',
        impactLevel: '',
        urgencyLevel: '',
        form: 'Onsite',
        formScore: '2'
      });
      setCustomerSearch('');
    }
  }, [editData, isOpen, getFieldOptions]);

  const [formData, setFormData] = useState({
    customerTitle: 'Anh', // Default title
    customerName: '',
    handler: '',
    deploymentType: '',
    customer: '',
    title: '',
    description: '',
    startDate: '', // Empty by default - user must select time
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
      startDate: new Date().toISOString().slice(0, 16),
      endDate: '',
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

  // Reset form when modal opens (only for creating new case, not editing)
  useEffect(() => {
    if (isOpen && !editData) {
      resetForm();
    }
  }, [isOpen, editData, resetForm]);

  // Auto-select current employee when both currentEmployee and employees are loaded
  // But only when creating a new case, not editing
  useEffect(() => {
    if (!editData && currentEmployee && employees.length > 0 && formData.handler === '') {
      setFormData(prev => ({
        ...prev,
        handler: currentEmployee.id
      }));
    }
  }, [editData, currentEmployee, employees, formData.handler]);

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

  // Sync preloaded data when props change (optimized)
  useEffect(() => {
    if (preloadedEmployees && preloadedEmployees.length > 0) {
      setEmployees(preloadedEmployees);
    }
  }, [preloadedEmployees]);

  useEffect(() => {
    if (preloadedPartners && preloadedPartners.length > 0) {
      setPartners(preloadedPartners);
    }
  }, [preloadedPartners]);

  useEffect(() => {
    if (preloadedDeploymentTypes && preloadedDeploymentTypes.length > 0) {
      setDeploymentTypes(preloadedDeploymentTypes);
    }
  }, [preloadedDeploymentTypes]);

  // Fetch data when modal opens (only if not preloaded) - optimized
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      // Always fetch current employee
      fetchCurrentEmployee();
      
      // Only fetch if not pre-loaded
      const promises = [];
      if (!preloadedEmployees || employees.length === 0) {
        promises.push(fetchEmployees());
      }
      if (!preloadedPartners || partners.length === 0) {
        promises.push(fetchPartners());
      }
      if (!preloadedDeploymentTypes || deploymentTypes.length === 0) {
        promises.push(fetchDeploymentTypes());
      }
      
      // Always refresh evaluation configs to get latest options
      promises.push(fetchConfigs());

      // Load all in parallel
      await Promise.all(promises);
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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
    
    // Validate startDate is required
    if (!formData.startDate) {
      toast.error('Vui lòng chọn thời gian bắt đầu!', {
        duration: 3000,
        position: 'top-right',
      });
      return;
    }
    
    // Validate end date (only if both dates exist) - allow any past/future dates
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      console.log('=== Date Validation (Deployment Modal) ===');
      console.log('Start Date Input:', formData.startDate);
      console.log('End Date Input:', formData.endDate);
      console.log('Start Date Object:', startDate);
      console.log('End Date Object:', endDate);
      console.log('End <= Start?', endDate <= startDate);
      
      if (endDate <= startDate) {
        toast.error('Thời gian kết thúc phải lớn hơn thời gian bắt đầu!', {
          duration: 3000,
          position: 'top-right',
        });
        return;
      }
    }
    
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

      // Prepare data for API
      const deploymentData = {
        title: formData.title,
        description: formData.description,
        customerName: fullCustomerName,
        reporterId: session?.user?.id, // Current user as reporter
        handlerId: formData.handler, // Use selected handler
        deploymentTypeId: selectedDeploymentType.id,
        customerId: formData.customer || null,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
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
      const url = editData ? `/api/deployment-cases/${editData.id}` : '/api/deployment-cases';
      const method = editData ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deploymentData),
        credentials: 'include', // Ensure cookies are sent for authentication
      });

      if (response.ok) {
        const result = await response.json();
        
        // Show success message
        toast.success(editData ? 'Cập nhật case triển khai thành công!' : 'Tạo case triển khai thành công!', {
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
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto my-8">
        {/* Compact Header */}
        <div className="sticky top-0 z-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-md">
                <Rocket className="h-5 w-5" />
              </div>
              <div>
                 <h2 className="text-lg font-semibold">{editData ? 'Chỉnh sửa Case Triển Khai (Admin)' : 'Tạo Case Triển Khai (Admin)'}</h2>
                 <p className="text-blue-100 text-sm">{editData ? 'Cập nhật thông tin triển khai - Admin' : 'Hệ thống quản lý triển khai - Admin'}</p>
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
                    <span className="w-24">Loại triển khai</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    value={formData.deploymentType}
                    onChange={(e) => handleInputChange('deploymentType', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 flex items-center h-5">
                    <span className="w-24">Khách hàng</span>
                    <span className="ml-1 w-2"></span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.customerTitle}
                      onChange={(e) => handleInputChange('customerTitle', e.target.value)}
                      className="w-20 px-2 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="Anh">Anh</option>
                      <option value="Chị">Chị</option>
                    </select>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => handleInputChange('customerName', e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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

            {/* Section 2: Chi tiết triển khai */}
            <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-1.5 bg-purple-100 rounded-md">
                  <FileText className="h-4 w-4 text-purple-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Chi tiết triển khai</h3>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600 flex items-center">
                      <span className="w-24">Tiêu đề triển khai</span>
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Nhập tiêu đề triển khai"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600 flex items-center">
                      <span className="w-24">Mã CRM</span>
                    </label>
                    <input
                      type="text"
                      value={formData.crmReferenceCode || ''}
                      onChange={(e) => handleInputChange('crmReferenceCode', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Nhập mã CRM (tùy chọn)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Mã tham chiếu từ hệ thống CRM
                    </p>
                  </div>
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
                    placeholder="Mô tả chi tiết triển khai..."
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
                    <span className="w-32">Thời gian hoàn thành</span>
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
              <Rocket className="h-4 w-4 mr-2" />
              {editData ? 'Cập nhật Case Triển Khai' : 'Tạo Case Triển Khai'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
