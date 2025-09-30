'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Package, Truck, Calendar, User, FileText, AlertCircle, Search, ChevronDown, CheckCircle, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { useEvaluationForm } from '@/hooks/useEvaluation';
import { useEvaluation } from '@/contexts/EvaluationContext';
import { EvaluationType, EvaluationCategory } from '@/contexts/EvaluationContext';
import { useSession } from 'next-auth/react';
import { ReceivingCaseStatus } from '@prisma/client';
import toast from 'react-hot-toast';

interface Employee {
  id: string;
  fullName: string;
  position: string;
  department: string;
}

interface Partner {
  id: string;
  fullCompanyName: string;
  shortName: string;
  address: string;
  contactPerson: string | null;
  contactPhone: string | null;
}

interface ProductItem {
  id: string;
  name: string;
  code: string;
  quantity: string;
  serialNumber: string;
}

interface DeliveryCase {
  id: string;
  title: string;
  description: string;
  form: string;
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
  customer: {
    id: string;
    shortName: string;
    fullCompanyName: string;
  } | null;
  products: {
    id: string;
    name: string;
    code: string | null;
    quantity: number;
    serialNumber: string | null;
  }[];
  handler: {
    id: string;
    fullName: string;
  };
}

interface CreateDeliveryCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCase: any) => void;
  editData?: DeliveryCase | null; // Thêm prop cho edit mode
}

export default function CreateDeliveryCaseModal({ isOpen, onClose, onSuccess, editData }: CreateDeliveryCaseModalProps) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    customerId: '',
    productDetails: '',
    deliveryDateTime: '',
    completionDateTime: '',
    status: 'RECEIVED',
    form: '',
    crmReferenceCode: '', // Thêm trường Mã CRM
    // User self-assessment fields
    difficultyLevel: '',
    estimatedTime: '',
    impactLevel: '',
    urgencyLevel: '',
    formScore: '',
    assessmentNotes: ''
  });

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [customers, setCustomers] = useState<Partner[]>([]);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [loadingEmployee, setLoadingEmployee] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Cache for partners to avoid repeated API calls
  const [partnersCache, setPartnersCache] = useState<Partner[] | null>(null);
  const [partnersCacheTime, setPartnersCacheTime] = useState<number>(0);
  
  // Search and dropdown states
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      console.log('Products:', editData.products);
      
      // Get form options to map the correct label
      const formOptions = getFieldOptions(EvaluationCategory.FORM);
      const defaultFormOption = formOptions.find(option => option.points === 2) || formOptions[0];
      const selectedFormOption = formOptions.find(option => 
        option.label === editData.form || 
        (editData.userFormScore && option.points === editData.userFormScore)
      );
      
      setFormData({
        customerId: editData.customer?.id || '',
        productDetails: editData.description || '',
        deliveryDateTime: editData.startDate ? new Date(editData.startDate).toISOString().slice(0, 16) : '',
        completionDateTime: editData.endDate ? new Date(editData.endDate).toISOString().slice(0, 16) : '',
        status: editData.status || 'RECEIVED',
        form: selectedFormOption?.label || defaultFormOption?.label || 'Onsite',
        crmReferenceCode: editData.crmReferenceCode || '', // ✅ Thêm trường Mã CRM
        difficultyLevel: editData.userDifficultyLevel?.toString() || '',
        estimatedTime: editData.userEstimatedTime?.toString() || '',
        impactLevel: editData.userImpactLevel?.toString() || '',
        urgencyLevel: editData.userUrgencyLevel?.toString() || '',
        formScore: editData.userFormScore?.toString() || '2',
        assessmentNotes: ''
      });
      
      console.log('Form options:', formOptions);
      console.log('Selected form option:', selectedFormOption);
      console.log('Edit data form:', editData.form);
      console.log('Edit data userFormScore:', editData.userFormScore);
      
      console.log('Form data set:', {
        customerId: editData.customer?.id || '',
        productDetails: editData.description || '',
        deliveryDateTime: editData.startDate ? new Date(editData.startDate).toISOString().slice(0, 16) : '',
        completionDateTime: editData.endDate ? new Date(editData.endDate).toISOString().slice(0, 16) : '',
        status: editData.status || 'RECEIVED',
        form: selectedFormOption?.label || defaultFormOption?.label || 'Onsite',
        crmReferenceCode: editData.crmReferenceCode || '',
        difficultyLevel: editData.userDifficultyLevel?.toString() || '',
        estimatedTime: editData.userEstimatedTime?.toString() || '',
        impactLevel: editData.userImpactLevel?.toString() || '',
        urgencyLevel: editData.userUrgencyLevel?.toString() || '',
        formScore: editData.userFormScore?.toString() || '2'
      });

      // Set selected partner
      if (editData.customer) {
        console.log('Setting selected partner:', editData.customer);
        setSelectedPartner({
          id: editData.customer.id,
          fullCompanyName: editData.customer.fullCompanyName,
          shortName: editData.customer.shortName,
          address: '',
          contactPerson: null,
          contactPhone: null
        });
        setSearchTerm(editData.customer.shortName); // Set search term để hiển thị trong input
        console.log('Search term set to:', editData.customer.shortName);
      }

      // Set products
      if (editData.products && editData.products.length > 0) {
        console.log('Setting products:', editData.products);
        const productItems: ProductItem[] = editData.products.map(product => ({
          id: product.id,
          name: product.name,
          code: product.code || '',
          quantity: product.quantity.toString(),
          serialNumber: product.serialNumber || ''
        }));
        setProducts(productItems);
        console.log('Product items set:', productItems);
      }
    } else if (!editData && isOpen) {
      // Reset form when creating new case
      resetForm();
    }
  }, [editData, isOpen]);

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened, loading data...');
      // Only reset form if not in edit mode
      if (!editData) {
        resetForm();
      }
      // Load data in parallel for better performance
      Promise.all([
        loadCustomers(),
        loadCurrentEmployee()
      ]).catch(error => {
        console.error('Error loading modal data:', error);
        setError('Lỗi tải dữ liệu. Vui lòng thử lại.');
      });
    }
  }, [isOpen, editData]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      
      // Lock body scroll
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resetForm = () => {
    setFormData({
      customerId: '',
      productDetails: '',
      deliveryDateTime: '',
      completionDateTime: '',
      status: 'RECEIVED',
      form: '',
      crmReferenceCode: '', // Reset Mã CRM
      difficultyLevel: '',
      estimatedTime: '',
      impactLevel: '',
      urgencyLevel: '',
      formScore: '',
      assessmentNotes: ''
    });
    setProducts([]);
    setSelectedPartner(null);
    setSearchTerm('');
    setError(null);
    setErrors({});
  };

  const loadCustomers = async () => {
    try {
      // Check cache first (cache for 5 minutes)
      const now = Date.now();
      const cacheExpiry = 5 * 60 * 1000; // 5 minutes
      
      if (partnersCache && (now - partnersCacheTime) < cacheExpiry) {
        console.log('Using cached partners data');
        setCustomers(partnersCache);
        return;
      }
      
      setLoadingPartners(true);
      console.log('Loading customers from API...');
      const response = await fetch('/api/partners/list');
      console.log('Partners API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Partners data:', data);
        // API trả về array trực tiếp, không phải trong object partners
        const partnersData = Array.isArray(data) ? data : [];
        setCustomers(partnersData);
        
        // Update cache
        setPartnersCache(partnersData);
        setPartnersCacheTime(now);
      } else {
        console.error('Failed to load partners:', response.status);
        setError('Không thể tải danh sách khách hàng');
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      setError('Lỗi kết nối khi tải danh sách khách hàng');
    } finally {
      setLoadingPartners(false);
    }
  };

  const loadCurrentEmployee = async () => {
    try {
      setLoadingEmployee(true);
      
      // First try to use session data if available
      if (session?.user) {
        // Use employee data from session if available, otherwise use user data
        if (session.user.employee) {
          setCurrentEmployee({
            id: session.user.employee.id,
            fullName: session.user.employee.fullName,
            position: session.user.employee.position,
            department: session.user.employee.department
          });
        } else {
          setCurrentEmployee({
            id: session.user.id,
            fullName: session.user.name || session.user.email || 'Người dùng',
            position: 'Nhân viên',
            department: session.user.department || 'Chưa xác định'
          });
        }
        setLoadingEmployee(false);
        return;
      }
      
      // Fallback to lightweight API call if session data is not sufficient
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
            department: data.employee.department
          });
        } else {
          // Fallback to user data if no employee record
          setCurrentEmployee({
            id: data.id,
            fullName: data.name || data.email,
            position: 'Nhân viên',
            department: data.department || 'Chưa xác định'
          });
        }
      } else {
        console.error('Failed to load user basic info:', response.status);
        setError('Không thể tải thông tin người dùng');
      }
    } catch (error) {
      console.error('Error loading current employee:', error);
      setError('Lỗi kết nối khi tải thông tin người dùng');
    } finally {
      setLoadingEmployee(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setIsDropdownOpen(true);
  };

  const handlePartnerSelect = (partner: Partner) => {
    setSelectedPartner(partner);
    setFormData(prev => ({ ...prev, customerId: partner.id }));
    setSearchTerm(partner.shortName);
    setIsDropdownOpen(false);
    
    // Clear error
    if (errors.customerId) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.customerId;
        return newErrors;
      });
    }
  };

  const filteredPartners = customers.filter(partner =>
    partner.shortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.fullCompanyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate required fields
    if (!formData.customerId) {
      newErrors.customerId = 'Vui lòng chọn khách hàng';
    }


    if (products.length === 0) {
      newErrors.products = 'Vui lòng thêm ít nhất một sản phẩm';
    }

    // Validate products
    products.forEach((product, index) => {
      if (!product.name.trim()) {
        newErrors[`product_${index}_name`] = 'Tên sản phẩm là bắt buộc';
      }
      if (!product.quantity || product.quantity === '0') {
        newErrors[`product_${index}_quantity`] = 'Số lượng phải lớn hơn 0';
      }
      if (product.quantity && isNaN(Number(product.quantity))) {
        newErrors[`product_${index}_quantity`] = 'Số lượng phải là số';
      }
    });

    if (!formData.deliveryDateTime) {
      newErrors.deliveryDateTime = 'Ngày giờ giao là bắt buộc';
    }

    // Validate evaluation fields
    if (!formData.difficultyLevel) {
      newErrors.difficultyLevel = 'Mức độ khó là bắt buộc';
    }

    if (!formData.estimatedTime) {
      newErrors.estimatedTime = 'Thời gian ước tính là bắt buộc';
    }

    if (!formData.impactLevel) {
      newErrors.impactLevel = 'Mức độ ảnh hưởng là bắt buộc';
    }

    if (!formData.urgencyLevel) {
      newErrors.urgencyLevel = 'Mức độ khẩn cấp là bắt buộc';
    }

    if (!formData.form) {
      newErrors.form = 'Hình thức làm việc là bắt buộc';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Check if we have current employee
      if (!currentEmployee) {
        toast.error('Không tìm thấy thông tin nhân viên. Vui lòng thử lại.', {
          duration: 4000,
          position: 'top-right',
        });
        return;
      }

      // Ensure we have the correct employee ID
      let employeeId = currentEmployee.id;
      
      // If currentEmployee.id is user ID (not employee ID), we need to find the employee ID
      if (session?.user?.employee && currentEmployee.id === session.user.id) {
        employeeId = session.user.employee.id;
      } else if (session?.user?.employee) {
        // Use employee ID from session if available
        employeeId = session.user.employee.id;
      } else {
        // If no employee data in session, we need to fetch it
        console.log('No employee data in session, fetching from API...');
        try {
          const response = await fetch('/api/user/basic-info');
          if (response.ok) {
            const data = await response.json();
            if (data.employee) {
              employeeId = data.employee.id;
            } else {
              throw new Error('No employee record found for user');
            }
          } else {
            throw new Error('Failed to fetch employee data');
          }
        } catch (error) {
          console.error('Error fetching employee data:', error);
          setError('Không thể tìm thông tin nhân viên. Vui lòng thử lại.');
          setLoading(false);
          return;
        }
      }

      // Prepare data for API
      const caseData = {
        title: `Giao hàng đến ${selectedPartner?.shortName || 'Khách hàng'}`,
        description: 'Danh sách sản phẩm giao hàng', // Simple description
        requesterId: employeeId,
        handlerId: employeeId,
        customerId: formData.customerId,
        form: formData.form || 'Giao hàng',
        startDate: formData.deliveryDateTime,
        endDate: formData.completionDateTime || null,
        status: formData.status as ReceivingCaseStatus,
        notes: null,
        crmReferenceCode: formData.crmReferenceCode || null, // Thêm Mã CRM
        userDifficultyLevel: formData.difficultyLevel,
        userEstimatedTime: formData.estimatedTime,
        userImpactLevel: formData.impactLevel,
        userUrgencyLevel: formData.urgencyLevel,
        userFormScore: formData.formScore,
        products: products.map(product => ({
          name: product.name,
          code: product.code || null,
          quantity: parseInt(product.quantity) || 1,
          serialNumber: product.serialNumber || null
        }))
      };

      console.log('=== Submitting Delivery Case (Admin) ===');
      console.log('Form data:', formData);
      console.log('Current employee:', currentEmployee);
      console.log('Employee ID to use:', employeeId);
      console.log('Products data:', products);
      console.log('Case data to send:', caseData);

      // Send to API
      const url = editData ? `/api/delivery-cases/${editData.id}` : '/api/delivery-cases';
      const method = editData ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(caseData),
        credentials: 'include', // Ensure cookies are sent for authentication
      });


      if (response.ok) {
        const result = await response.json();
        
        // Show success notification
        toast.success(editData ? 'Cập nhật case giao hàng thành công!' : 'Tạo case giao hàng thành công!', {
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#10B981',
            color: '#fff',
          },
        });
        
        // Trigger case creation event for real-time notifications
        window.dispatchEvent(new CustomEvent('case-created'));
        
        onSuccess(result);
        handleClose();
      } else {
        let errorMessage = 'Unknown error';
        let errorDetails = '';
        
        try {
          const errorData = await response.json();
          console.error('Error response:', errorData);
          errorMessage = errorData.error || errorData.message || 'Unknown error';
          errorDetails = errorData.details || '';
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
      console.error('Error creating delivery case:', error);
      
      // Show error notification
      toast.error('Có lỗi xảy ra khi tạo case. Vui lòng thử lại.', {
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

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const addProduct = () => {
    const newProduct: ProductItem = {
      id: Date.now().toString(),
      name: '',
      code: '',
      quantity: '',
      serialNumber: ''
    };
    setProducts(prev => [...prev, newProduct]);
  };

  const removeProduct = (id: string) => {
    setProducts(prev => prev.filter(product => product.id !== id));
  };

  const updateProduct = (id: string, field: keyof ProductItem, value: string) => {
    setProducts(prev => prev.map(product => 
      product.id === id ? { ...product, [field]: value } : product
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8">
         {/* Header */}
         <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-t-lg z-40">
           <div className="flex items-center justify-between">
             <div className="flex items-center space-x-3">
               <div className="p-2 bg-white/20 rounded-md">
                 <Package className="h-5 w-5" />
               </div>
               <div>
                 <h2 className="text-lg font-semibold">{editData ? 'Chỉnh sửa Case Giao Hàng (Admin)' : 'Tạo Case Giao Hàng (Admin)'}</h2>
                 <p className="text-blue-100 text-sm">{editData ? 'Cập nhật thông tin giao hàng - Admin' : 'Hệ thống quản lý giao hàng - Admin'}</p>
               </div>
             </div>
            <button
              onClick={handleClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-md transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Section 1: Người thực hiện */}
            <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-1.5 bg-blue-100 rounded-md">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Người thực hiện</h3>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">
                  {currentEmployee ? currentEmployee.fullName : 'Đang tải...'}
                </span>
                {currentEmployee && (
                  <div className="text-xs text-gray-500 mt-1">
                    {currentEmployee.position} - {currentEmployee.department}
                  </div>
                )}
                {errors.employee && (
                  <p className="text-xs text-red-600 flex items-center space-x-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.employee}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Section 2: Khách hàng */}
            <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-1.5 bg-blue-100 rounded-md">
                  <Truck className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Khách hàng</h3>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 flex items-center">
                  <span className="w-24">Khách hàng</span>
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative" ref={dropdownRef}>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onFocus={() => setIsDropdownOpen(true)}
                      className={`w-full pl-10 pr-10 py-2 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.customerId ? 'border-red-300' : 'border-gray-300'
                      } ${loadingPartners ? 'bg-gray-50' : ''}`}
                      placeholder={loadingPartners ? 'Đang tải danh sách khách hàng...' : 'Tìm kiếm khách hàng...'}
                      disabled={loadingPartners}
                    />
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      disabled={loadingPartners}
                    >
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  
                   {isDropdownOpen && (
                     <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                       {loadingPartners ? (
                         <div className="px-4 py-3 text-sm text-gray-500 text-center flex items-center justify-center space-x-2">
                           <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                           <span>Đang tải danh sách khách hàng...</span>
                         </div>
                       ) : filteredPartners.length > 0 ? (
                         filteredPartners.map(partner => (
                           <div
                             key={partner.id}
                             onClick={() => handlePartnerSelect(partner)}
                             className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                           >
                             <div className="flex flex-col">
                               <div className="font-medium text-sm text-gray-900">
                                 {partner.shortName}
                               </div>
                               <div className="text-xs text-gray-500">
                                 {partner.fullCompanyName}
                               </div>
                               {partner.contactPerson && (
                                 <div className="text-xs text-gray-400 mt-1">
                                   Liên hệ: {partner.contactPerson}
                                   {partner.contactPhone && ` - ${partner.contactPhone}`}
                                 </div>
                               )}
                             </div>
                           </div>
                         ))
                       ) : customers.length === 0 ? (
                         <div className="px-4 py-3 text-sm text-gray-500 text-center">
                           <div className="flex flex-col items-center space-y-2">
                             <Truck className="h-8 w-8 text-gray-400" />
                             <div>Chưa có khách hàng nào</div>
                             <div className="text-xs text-gray-400">Liên hệ admin để thêm khách hàng</div>
                           </div>
                         </div>
                       ) : (
                         <div className="px-4 py-3 text-sm text-gray-500 text-center">
                           Không tìm thấy khách hàng phù hợp
                         </div>
                       )}
                     </div>
                   )}
                </div>
                {errors.customerId && (
                  <p className="text-xs text-red-600 flex items-center space-x-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.customerId}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Section 3: Chi tiết hàng hóa */}
            <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-blue-100 rounded-md">
                    <Package className="h-4 w-4 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-700">Chi tiết hàng hóa</h3>
                </div>
                <button
                  type="button"
                  onClick={addProduct}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  <span>Thêm sản phẩm</span>
                </button>
              </div>
              
              {products.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Chưa có sản phẩm nào</p>
                  <p className="text-xs">Nhấn &quot;Thêm sản phẩm&quot; để bắt đầu</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-md">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Tên sản phẩm *
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Mã sản phẩm
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Số lượng *
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            S/N
                          </th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Hành động
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {products.map((product, index) => (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={product.name}
                                onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                                className={`w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                                  errors[`product_${index}_name`] ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="Nhập tên sản phẩm"
                              />
                              {errors[`product_${index}_name`] && (
                                <p className="text-xs text-red-600 mt-1">{errors[`product_${index}_name`]}</p>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={product.code}
                                onChange={(e) => updateProduct(product.id, 'code', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Mã sản phẩm"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min="1"
                                value={product.quantity}
                                onChange={(e) => updateProduct(product.id, 'quantity', e.target.value)}
                                className={`w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                                  errors[`product_${index}_quantity`] ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="1"
                              />
                              {errors[`product_${index}_quantity`] && (
                                <p className="text-xs text-red-600 mt-1">{errors[`product_${index}_quantity`]}</p>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={product.serialNumber}
                                onChange={(e) => updateProduct(product.id, 'serialNumber', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Số serial"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeProduct(product.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Xóa sản phẩm"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {errors.products && (
                    <p className="text-xs text-red-600 flex items-center space-x-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors.products}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Section 4: Thời gian & Mã CRM */}
            <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-1.5 bg-blue-100 rounded-md">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Thời gian & Mã CRM</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 flex items-center">
                    <span className="w-32">Ngày giờ giao</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="deliveryDateTime"
                    value={formData.deliveryDateTime}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.deliveryDateTime ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.deliveryDateTime && (
                    <p className="text-xs text-red-600 flex items-center space-x-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors.deliveryDateTime}</span>
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 flex items-center">
                    <span className="w-32">Ngày giờ hoàn thành</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="completionDateTime"
                    value={formData.completionDateTime}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 flex items-center">
                    <span className="w-32">Mã CRM</span>
                  </label>
                  <input
                    type="text"
                    name="crmReferenceCode"
                    value={formData.crmReferenceCode || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Nhập mã CRM (tùy chọn)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Mã tham chiếu từ hệ thống CRM
                  </p>
                </div>
              </div>
            </div>

            {/* Section 5: Trạng thái */}
            <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-1.5 bg-blue-100 rounded-md">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Trạng thái</h3>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">
                  <span className="w-24">Trạng thái</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="RECEIVED">Tiếp nhận</option>
                  <option value="IN_PROGRESS">Đang xử lý</option>
                  <option value="COMPLETED">Hoàn thành</option>
                  <option value="CANCELLED">Hủy</option>
                </select>
              </div>
            </div>

            {/* Section 6: Đánh giá của User */}
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
                    name="difficultyLevel"
                    value={formData.difficultyLevel}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 text-sm border rounded focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${
                      errors.difficultyLevel ? 'border-red-300' : 'border-yellow-200'
                    }`}
                    required
                  >
                    <option value="">Chọn mức độ khó</option>
                    {getFieldOptions(EvaluationCategory.DIFFICULTY).map((option) => (
                      <option key={option.id} value={option.points}>
                        {option.points} - {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.difficultyLevel && (
                    <p className="text-xs text-red-600 flex items-center space-x-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors.difficultyLevel}</span>
                    </p>
                  )}
                </div>

                {/* Thời gian ước tính */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-yellow-600 flex items-center">
                    <span className="w-32">Thời gian ước tính</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    name="estimatedTime"
                    value={formData.estimatedTime}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 text-sm border rounded focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${
                      errors.estimatedTime ? 'border-red-300' : 'border-yellow-200'
                    }`}
                    required
                  >
                    <option value="">Chọn thời gian ước tính</option>
                    {getFieldOptions(EvaluationCategory.TIME).map((option) => (
                      <option key={option.id} value={option.points}>
                        {option.points} - {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.estimatedTime && (
                    <p className="text-xs text-red-600 flex items-center space-x-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors.estimatedTime}</span>
                    </p>
                  )}
                </div>

                {/* Mức độ ảnh hưởng */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-yellow-600 flex items-center">
                    <span className="w-32">Mức độ ảnh hưởng</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    name="impactLevel"
                    value={formData.impactLevel}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 text-sm border rounded focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${
                      errors.impactLevel ? 'border-red-300' : 'border-yellow-200'
                    }`}
                    required
                  >
                    <option value="">Chọn mức độ ảnh hưởng</option>
                    {getFieldOptions(EvaluationCategory.IMPACT).map((option) => (
                      <option key={option.id} value={option.points}>
                        {option.points} - {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.impactLevel && (
                    <p className="text-xs text-red-600 flex items-center space-x-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors.impactLevel}</span>
                    </p>
                  )}
                </div>

                {/* Mức độ khẩn cấp */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-yellow-600 flex items-center">
                    <span className="w-32">Mức độ khẩn cấp</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    name="urgencyLevel"
                    value={formData.urgencyLevel}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 text-sm border rounded focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${
                      errors.urgencyLevel ? 'border-red-300' : 'border-yellow-200'
                    }`}
                    required
                  >
                    <option value="">Chọn mức độ khẩn cấp</option>
                    {getFieldOptions(EvaluationCategory.URGENCY).map((option) => (
                      <option key={option.id} value={option.points}>
                        {option.points} - {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.urgencyLevel && (
                    <p className="text-xs text-red-600 flex items-center space-x-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors.urgencyLevel}</span>
                    </p>
                  )}
                </div>

                {/* Hình thức làm việc */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-yellow-600 flex items-center">
                    <span className="w-32">Hình thức làm việc</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    name="form"
                    value={formData.form}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, form: e.target.value }));
                      // Auto-set form score based on selection
                      const selectedOption = getFieldOptions(EvaluationCategory.FORM).find(
                        option => option.label === e.target.value
                      );
                      if (selectedOption) {
                        setFormData(prev => ({ ...prev, formScore: selectedOption.points.toString() }));
                      }
                    }}
                    className={`w-full px-3 py-2 text-sm border rounded focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${
                      errors.form ? 'border-red-300' : 'border-yellow-200'
                    }`}
                    required
                  >
                    <option value="">Chọn hình thức làm việc</option>
                    {getFieldOptions(EvaluationCategory.FORM).map((option) => (
                      <option key={option.id} value={option.label}>
                        {option.label} ({option.points} điểm)
                      </option>
                    ))}
                  </select>
                  {errors.form && (
                    <p className="text-xs text-red-600 flex items-center space-x-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors.form}</span>
                    </p>
                  )}
                </div>

              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800 text-sm">{error}</span>
                </div>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      loadCustomers();
                      loadCurrentEmployee();
                    }}
                    className="text-xs text-red-600 hover:text-red-800 underline"
                  >
                    Thử lại
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (editData ? 'Đang cập nhật...' : 'Đang tạo...') : (editData ? 'Cập nhật Case' : 'Tạo Case')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}