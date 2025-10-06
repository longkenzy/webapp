'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { X, User, Shield, FileText, Calendar, Settings, CheckCircle, RefreshCw } from 'lucide-react';
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

interface CreateWarrantyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newWarranty: unknown) => void;
  editingWarranty?: any; // Warranty data for editing
  // Pre-loaded data to avoid re-fetching
  employees?: Employee[];
  customers?: any[];
  warrantyTypes?: Array<{ id: string; name: string; description?: string }>;
}

export default function CreateWarrantyModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  editingWarranty,
  employees: preloadedEmployees = [],
  customers: preloadedCustomers = [],
  warrantyTypes: preloadedWarrantyTypes = []
}: CreateWarrantyModalProps) {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<Employee[]>(preloadedEmployees);
  const [partners, setPartners] = useState<any[]>(preloadedCustomers);
  const [warrantyTypes, setWarrantyTypes] = useState<Array<{ id: string; name: string; description?: string }>>(preloadedWarrantyTypes);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState({
    employees: true,
    partners: true,
    warrantyTypes: true,
    configs: true
  });

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
    warrantyType: '',
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

  const fetchEmployees = useCallback(async (forceRefresh = false) => {
    // Check cache first
    const cacheKey = 'warranty-modal-employees';
    const cachedData = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(`${cacheKey}-time`);
    const now = Date.now();
    const isCacheValid = cacheTime && (now - parseInt(cacheTime)) < 5 * 60 * 1000; // 5 minutes

    if (!forceRefresh && cachedData && isCacheValid) {
      try {
        const data = JSON.parse(cachedData);
        setEmployees(data);
        setDataLoading(prev => ({ ...prev, employees: false }));
        return;
      } catch (error) {
        console.error('Error parsing cached employees:', error);
      }
    }

    try {
      setDataLoading(prev => ({ ...prev, employees: true }));
      const response = await fetch('/api/employees/list', {
        method: 'GET',
        headers: {
          'Cache-Control': 'max-age=300',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
        // Cache the data
        localStorage.setItem(cacheKey, JSON.stringify(data));
        localStorage.setItem(`${cacheKey}-time`, now.toString());
      } else {
        console.error('Failed to fetch employees:', response.status, response.statusText);
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    } finally {
      setDataLoading(prev => ({ ...prev, employees: false }));
    }
  }, []);

  const fetchPartners = useCallback(async () => {
    try {
      setDataLoading(prev => ({ ...prev, partners: true }));
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
    } finally {
      setDataLoading(prev => ({ ...prev, partners: false }));
    }
  }, []);

  const fetchWarrantyTypes = useCallback(async (forceRefresh = false) => {
    // Check cache first
    const cacheKey = 'warranty-modal-types';
    const cachedData = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(`${cacheKey}-time`);
    const now = Date.now();
    const isCacheValid = cacheTime && (now - parseInt(cacheTime)) < 2 * 60 * 1000; // 2 minutes for warranty types

    if (!forceRefresh && cachedData && isCacheValid) {
      try {
        const data = JSON.parse(cachedData);
        setWarrantyTypes(data);
        setDataLoading(prev => ({ ...prev, warrantyTypes: false }));
        return;
      } catch (error) {
        console.error('Error parsing cached warranty types:', error);
      }
    }

    try {
      setDataLoading(prev => ({ ...prev, warrantyTypes: true }));
      const response = await fetch('/api/warranty-types', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Warranty types API response:', data);
        // Keep the full objects with id, name, and description
        const types = data.data || [];
        setWarrantyTypes(types);
        // Cache the data
        localStorage.setItem(cacheKey, JSON.stringify(types));
        localStorage.setItem(`${cacheKey}-time`, now.toString());
      } else {
        console.error('Failed to fetch warranty types:', response.status, response.statusText);
        setWarrantyTypes([]);
      }
    } catch (error) {
      console.error('Error fetching warranty types:', error);
      setWarrantyTypes([]);
    } finally {
      setDataLoading(prev => ({ ...prev, warrantyTypes: false }));
    }
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      customerTitle: 'Anh',
      customerName: '',
      handler: '',
      warrantyType: '',
      customer: '',
      title: '',
      description: '',
      startDate: getCurrentVietnamDateTime(),
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
  }, []);

  // Reset form when modal opens or populate when editing
  useEffect(() => {
    if (isOpen) {
      if (editingWarranty) {
        // Populate form with editing warranty data immediately
        const customerName = editingWarranty.customerName || '';
        const title = customerName.split(' ').slice(1).join(' '); // Remove title prefix
        const customerTitle = customerName.startsWith('Chị') ? 'Chị' : 'Anh';
        
        // Handle warranty type - it could be a string or object
        let warrantyTypeId = '';
        if (editingWarranty.warrantyType) {
          if (typeof editingWarranty.warrantyType === 'string') {
            warrantyTypeId = editingWarranty.warrantyType;
          } else if (editingWarranty.warrantyType.id) {
            warrantyTypeId = editingWarranty.warrantyType.id;
          }
        }

        // Convert datetime to local timezone for datetime-local input
        let startDateLocal = '';
        if (editingWarranty.startDate) {
          const startDateObj = new Date(editingWarranty.startDate);
          const year = startDateObj.getFullYear();
          const month = String(startDateObj.getMonth() + 1).padStart(2, '0');
          const day = String(startDateObj.getDate()).padStart(2, '0');
          const hours = String(startDateObj.getHours()).padStart(2, '0');
          const minutes = String(startDateObj.getMinutes()).padStart(2, '0');
          startDateLocal = `${year}-${month}-${day}T${hours}:${minutes}`;
        }

        let endDateLocal = '';
        if (editingWarranty.endDate) {
          const endDateObj = new Date(editingWarranty.endDate);
          const year = endDateObj.getFullYear();
          const month = String(endDateObj.getMonth() + 1).padStart(2, '0');
          const day = String(endDateObj.getDate()).padStart(2, '0');
          const hours = String(endDateObj.getHours()).padStart(2, '0');
          const minutes = String(endDateObj.getMinutes()).padStart(2, '0');
          endDateLocal = `${year}-${month}-${day}T${hours}:${minutes}`;
        }

        // Set form data immediately for instant display
        setFormData({
          customerTitle,
          customerName: title,
          handler: editingWarranty.handler?.id || '',
          warrantyType: warrantyTypeId,
          customer: editingWarranty.customer?.id || '',
          title: editingWarranty.title || '',
          description: editingWarranty.description || '',
          startDate: startDateLocal,
          endDate: endDateLocal,
          status: editingWarranty.status || 'RECEIVED',
          notes: editingWarranty.notes || '',
          crmReferenceCode: editingWarranty.crmReferenceCode || '',
          difficultyLevel: editingWarranty.userDifficultyLevel?.toString() || '',
          estimatedTime: editingWarranty.userEstimatedTime?.toString() || '',
          impactLevel: editingWarranty.userImpactLevel?.toString() || '',
          urgencyLevel: editingWarranty.userUrgencyLevel?.toString() || '',
          form: 'Onsite', // Default
          formScore: editingWarranty.userFormScore?.toString() || '2'
        });
        
        console.log('Converted startDate:', startDateLocal);
        console.log('Converted endDate:', endDateLocal);
        
        // Set customer search if customer exists
        if (editingWarranty.customer) {
          setCustomerSearch(`${editingWarranty.customer.fullCompanyName} (${editingWarranty.customer.shortName})`);
        }
      } else {
        resetForm();
      }
    }
  }, [isOpen, editingWarranty, resetForm]);

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

  // Preload data when component mounts for faster modal opening
  // Sync preloaded data
  useEffect(() => {
    if (preloadedEmployees.length > 0) setEmployees(preloadedEmployees);
  }, [preloadedEmployees]);

  useEffect(() => {
    if (preloadedCustomers.length > 0) setPartners(preloadedCustomers);
  }, [preloadedCustomers]);

  useEffect(() => {
    if (preloadedWarrantyTypes.length > 0) setWarrantyTypes(preloadedWarrantyTypes);
  }, [preloadedWarrantyTypes]);

  // Only fetch if data not preloaded (fallback)
  useEffect(() => {
    fetchConfigs();
    
    // Only fetch if not already provided
    if (employees.length === 0) fetchEmployees();
    if (partners.length === 0) fetchPartners();
    if (warrantyTypes.length === 0) fetchWarrantyTypes();
  }, [fetchConfigs]);

  // Refresh data when modal opens to ensure latest data
  useEffect(() => {
    if (isOpen) {
      // Only refresh if data is stale (older than 5 minutes)
      const now = Date.now();
      const lastFetch = localStorage.getItem('warranty-modal-last-fetch');
      const shouldRefresh = !lastFetch || (now - parseInt(lastFetch)) > 5 * 60 * 1000;
      
      if (shouldRefresh) {
        fetchEmployees(true); // Force refresh
        fetchPartners();
        fetchWarrantyTypes(true); // Force refresh
        fetchConfigs();
        localStorage.setItem('warranty-modal-last-fetch', now.toString());
      }
    }
  }, [isOpen, fetchEmployees, fetchPartners, fetchWarrantyTypes, fetchConfigs]);

  // Listen for warranty types updates
  useEffect(() => {
    const handleWarrantyTypesUpdate = () => {
      console.log('Warranty types updated, refreshing...');
      fetchWarrantyTypes(true); // Force refresh when types are updated
    };

    window.addEventListener('warranty-types-updated', handleWarrantyTypesUpdate);
    
    return () => {
      window.removeEventListener('warranty-types-updated', handleWarrantyTypesUpdate);
    };
  }, [fetchWarrantyTypes]);

  // Auto-fill handler with current user when employees are loaded
  // Auto-fill handler with current user when employees are loaded (ONLY for CREATE mode)
  useEffect(() => {
    // CRITICAL: Only auto-select when creating NEW case, NOT when editing
    if (employees.length > 0 && session?.user?.email && !editingWarranty && isOpen) {
      // Find current user in employees list
      const currentUser = employees.find(emp => emp.companyEmail === session.user.email);
      if (currentUser) {
        console.log('Auto-selecting current user as handler (CREATE mode only):', currentUser);
        setFormData(prev => ({
          ...prev,
          handler: currentUser.id
        }));
      }
    }
  }, [employees, session?.user?.email, editingWarranty, isOpen]);

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
      customer: partnerId
      // Don't auto-fill customerName - let user input manually
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
    
    // Validate required fields
    if (!formData.customerName.trim()) {
      toast.error('Vui lòng nhập tên khách hàng!');
      return;
    }

    if (!formData.handler) {
      toast.error('Vui lòng chọn người xử lý!');
      return;
    }

    if (!formData.warrantyType) {
      toast.error('Vui lòng chọn loại bảo hành!');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề bảo hành!');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Vui lòng nhập mô tả bảo hành!');
      return;
    }
    
    // Validate end date (only if both dates exist) - allow any past/future dates
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      console.log('=== Date Validation (Warranty Modal) ===');
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
      // Prepare data for API
      const fullCustomerName = `${formData.customerTitle} ${formData.customerName}`.trim();
      const isEditing = !!editingWarranty;
      
      const warrantyData: any = {
        title: formData.title,
        description: formData.description,
        customerName: fullCustomerName,
        handlerId: formData.handler,
        warrantyTypeId: formData.warrantyType,
        customerId: formData.customer || null,
        startDate: convertLocalInputToISO(formData.startDate),
        endDate: formData.endDate ? convertLocalInputToISO(formData.endDate) : null,
        status: formData.status,
        notes: formData.notes,
        crmReferenceCode: formData.crmReferenceCode || null,
        // User assessment fields
        userDifficultyLevel: formData.difficultyLevel ? parseInt(formData.difficultyLevel) : null,
        userEstimatedTime: formData.estimatedTime ? parseInt(formData.estimatedTime) : null,
        userImpactLevel: formData.impactLevel ? parseInt(formData.impactLevel) : null,
        userUrgencyLevel: formData.urgencyLevel ? parseInt(formData.urgencyLevel) : null,
        userFormScore: formData.formScore ? parseInt(formData.formScore) : null,
        userAssessmentDate: new Date().toISOString()
      };

      // Only send reporterId when CREATING, not when EDITING
      if (!isEditing) {
        warrantyData.reporterId = session?.user?.id;
      }

       console.log('=== Submitting Warranty ===');
       console.log('Is Editing?', isEditing);
       console.log('Form data:', formData);
       console.log('Warranty data to send:', warrantyData);

       // Send to API
       const url = isEditing ? `/api/warranties/${editingWarranty.id}` : '/api/warranties';
       const method = isEditing ? 'PUT' : 'POST';
       
       const response = await fetch(url, {
         method,
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify(warrantyData),
       });


       if (response.ok) {
         const result = await response.json();
         
         // Trigger case creation event for real-time notifications
         window.dispatchEvent(new CustomEvent('case-created'));
         
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

  // Check if any critical data is still loading
  const isDataLoading = dataLoading.employees || dataLoading.warrantyTypes;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto my-8 relative">
        {/* Loading overlay for initial data load */}
        {isDataLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="flex flex-col items-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-600">Đang tải dữ liệu...</p>
            </div>
          </div>
        )}
        {/* Compact Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-t-lg z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-md">
                <Shield className="h-5 w-5" />
              </div>
               <div>
                 <h2 className="text-lg font-semibold">
                   {editingWarranty ? 'Chỉnh sửa Case Bảo Hành' : 'Tạo Case Bảo Hành'}
                 </h2>
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
              
              <div className="space-y-4">
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
                      disabled={dataLoading.employees}
                    >
                      <option value="">
                        {dataLoading.employees ? 'Đang tải...' : 'Chọn nhân viên'}
                      </option>
                      {employees.length > 0 ? (
                        employees.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.fullName}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          {dataLoading.employees ? 'Đang tải...' : 'Không có nhân viên nào'}
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
                      disabled={dataLoading.warrantyTypes}
                    >
                      <option value="">
                        {dataLoading.warrantyTypes ? 'Đang tải...' : 'Chọn loại bảo hành'}
                      </option>
                      {warrantyTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                      {warrantyTypes.length === 0 && !dataLoading.warrantyTypes && (
                        <option value="" disabled>
                          Chưa có loại bảo hành nào được cấu hình
                        </option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div className="absolute z-[70] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600 flex items-center">
                      <span className="w-24">Tiêu đề bảo hành</span>
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Nhập tiêu đề bảo hành"
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
                    placeholder="Mô tả chi tiết công việc bảo hành cần thực hiện..."
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors min-h-[38px]"
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors min-h-[38px]"
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

            {/* Section 5: Trạng thái */}
            <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-1.5 bg-orange-100 rounded-md">
                  <CheckCircle className="h-4 w-4 text-orange-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Trạng thái</h3>
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors"
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
                    placeholder="Ghi chú thêm (nếu có)..."
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
              className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-md hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
            >
               {loading ? (
                 <>
                   <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                   {editingWarranty ? 'Đang cập nhật...' : 'Đang tạo...'}
                 </>
               ) : (
                 <>
                   <Shield className="h-4 w-4 mr-2" />
                   {editingWarranty ? 'Cập nhật Case' : 'Tạo Case'}
                 </>
               )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
