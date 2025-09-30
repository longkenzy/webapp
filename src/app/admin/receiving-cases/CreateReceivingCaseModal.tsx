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
  companyEmail: string;
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

interface ReceivingCase {
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
  supplier: {
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

interface CreateReceivingCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCase: any) => void;
  editData?: ReceivingCase | null; // Thêm prop cho edit mode
}

export default function CreateReceivingCaseModal({ isOpen, onClose, onSuccess, editData }: CreateReceivingCaseModalProps) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    supplierId: '',
    productDetails: '',
    deliveryDateTime: '',
    completionDateTime: '',
    status: 'RECEIVED',
    crmReferenceCode: '',
    // User self-assessment fields
    difficultyLevel: '',
    estimatedTime: '',
    impactLevel: '',
    urgencyLevel: '',
    form: 'Onsite',
    formScore: '2'
  });

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      setFormData({
        supplierId: editData.supplier?.id || '',
        productDetails: editData.description || '',
        deliveryDateTime: editData.startDate ? new Date(editData.startDate).toISOString().slice(0, 16) : '',
        completionDateTime: editData.endDate ? new Date(editData.endDate).toISOString().slice(0, 16) : '',
        status: editData.status || 'RECEIVED',
        crmReferenceCode: editData.crmReferenceCode || '',
        difficultyLevel: editData.userDifficultyLevel?.toString() || '',
        estimatedTime: editData.userEstimatedTime?.toString() || '',
        impactLevel: editData.userImpactLevel?.toString() || '',
        urgencyLevel: editData.userUrgencyLevel?.toString() || '',
        form: editData.form || 'Onsite',
        formScore: editData.userFormScore?.toString() || '2'
      });

      // Set selected partner
      if (editData.supplier) {
        setSelectedPartner({
          id: editData.supplier.id,
          fullCompanyName: editData.supplier.fullCompanyName,
          shortName: editData.supplier.shortName,
          address: '',
          contactPerson: null,
          contactPhone: null
        });
        setSearchTerm(editData.supplier.shortName); // Set search term để hiển thị trong input
      }

      // Set products
      if (editData.products && editData.products.length > 0) {
        const productItems: ProductItem[] = editData.products.map(product => ({
          id: product.id,
          name: product.name,
          code: product.code || '',
          quantity: product.quantity.toString(),
          serialNumber: product.serialNumber || ''
        }));
        setProducts(productItems);
      }
    } else if (!editData && isOpen) {
      // Reset form when creating new case
      setFormData({
        supplierId: '',
        productDetails: '',
        deliveryDateTime: '',
        completionDateTime: '',
        status: 'RECEIVED',
        crmReferenceCode: '',
        difficultyLevel: '',
        estimatedTime: '',
        impactLevel: '',
        urgencyLevel: '',
        form: 'Onsite',
        formScore: '2'
      });
      setProducts([]);
      setSelectedPartner(null);
      setSearchTerm(''); // Reset search term
    }
  }, [editData, isOpen]);

  const statusOptions = [
    { value: 'RECEIVED', label: 'Tiếp nhận' },
    { value: 'IN_PROGRESS', label: 'Đang xử lý' },
    { value: 'COMPLETED', label: 'Hoàn thành' },
    { value: 'CANCELLED', label: 'Hủy' }
  ];

  // Fetch partners and current employee when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPartners();
      fetchCurrentEmployee();
    }
  }, [isOpen, session?.user?.email]);

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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchPartners = async () => {
    setLoadingPartners(true);
    try {
      const response = await fetch('/api/partners/list');
      if (response.ok) {
        const data = await response.json();
        setPartners(data);
      } else {
        console.error('Failed to fetch partners');
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setLoadingPartners(false);
    }
  };

  const fetchCurrentEmployee = async () => {
    if (!session?.user?.email) return;
    
    try {
      const response = await fetch('/api/employees/list');
      if (response.ok) {
        const employees = await response.json();
        const employee = employees.find((emp: Employee) => 
          emp.companyEmail === session.user.email
        );
        if (employee) {
          setCurrentEmployee(employee);
        } else {
          console.error('Current user employee not found');
        }
      } else {
        console.error('Failed to fetch employees');
      }
    } catch (error) {
      console.error('Error fetching current employee:', error);
    }
  };

  // Filter partners based on search term
  const filteredPartners = partners.filter(partner =>
    partner.shortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.fullCompanyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePartnerSelect = (partner: Partner) => {
    setSelectedPartner(partner);
    setFormData(prev => ({ ...prev, supplierId: partner.id }));
    setSearchTerm(partner.shortName);
    setIsDropdownOpen(false);
    if (errors.supplierId) {
      setErrors(prev => ({ ...prev, supplierId: '' }));
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setIsDropdownOpen(true);
    if (value !== selectedPartner?.shortName) {
      setSelectedPartner(null);
      setFormData(prev => ({ ...prev, supplierId: '' }));
    }
  };

  const validateForm = () => {
    console.log('🔍 Validating form...');
    console.log('🔍 Current employee:', currentEmployee);
    console.log('🔍 Form data:', formData);
    console.log('🔍 Products:', products);
    
    const newErrors: Record<string, string> = {};

    if (!currentEmployee) {
      newErrors.employee = 'Không tìm thấy thông tin nhân viên';
    }

    if (!formData.supplierId) {
      newErrors.supplierId = 'Nhà cung cấp là bắt buộc';
    }

    if (products.length === 0) {
      newErrors.products = 'Cần ít nhất một sản phẩm';
    } else {
      products.forEach((product, index) => {
        if (!product.name.trim()) {
          newErrors[`product_${index}_name`] = 'Tên sản phẩm là bắt buộc';
        }
        if (!product.quantity.trim()) {
          newErrors[`product_${index}_quantity`] = 'Số lượng là bắt buộc';
        }
        if (product.quantity && isNaN(Number(product.quantity))) {
          newErrors[`product_${index}_quantity`] = 'Số lượng phải là số';
        }
      });
    }

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
    console.log('🔍 Validation result:', Object.keys(newErrors).length === 0 ? 'PASSED' : 'FAILED');
    console.log('🔍 Errors:', newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    console.log('🔍 Current session:', session);
    console.log('🔍 Session user email:', session?.user?.email);

    try {
      if (!currentEmployee) {
        toast.error('Không tìm thấy thông tin nhân viên. Vui lòng thử lại.', {
          duration: 4000,
          position: 'top-right',
        });
        return;
      }

      const caseData = {
        title: `Nhận hàng từ ${selectedPartner?.shortName || 'Nhà cung cấp'}`,
        description: 'Danh sách sản phẩm nhận hàng',
        requesterId: currentEmployee.id,
        handlerId: currentEmployee.id,
        supplierId: formData.supplierId,
        form: formData.form,
        startDate: formData.deliveryDateTime,
        endDate: formData.completionDateTime || null,
        status: ReceivingCaseStatus.RECEIVED,
        notes: null,
        crmReferenceCode: formData.crmReferenceCode || null,
        userDifficultyLevel: formData.difficultyLevel,
        userEstimatedTime: formData.estimatedTime,
        userImpactLevel: formData.impactLevel,
        userUrgencyLevel: formData.urgencyLevel,
        userFormScore: formData.formScore,
        products: products
      };

      console.log('=== Submitting Receiving Case ===');
      console.log('Form data:', formData);
      console.log('Case data to send:', caseData);
      console.log('Current employee:', currentEmployee);
      console.log('Selected partner:', selectedPartner);

      const url = editData ? `/api/receiving-cases/${editData.id}` : '/api/receiving-cases';
      const method = editData ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(caseData),
        credentials: 'include', // Ensure cookies are sent
      });

      console.log('Response status:', response.status);
      console.log('Response statusText:', response.statusText);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const result = await response.json();
        
        toast.success(editData ? 'Cập nhật case nhận hàng thành công!' : 'Tạo case nhận hàng thành công!', {
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#10B981',
            color: '#fff',
          },
        });
        
        window.dispatchEvent(new CustomEvent('case-created'));
        
        onSuccess(result);
        handleClose();
      } else {
        console.log('❌ Request failed with status:', response.status);
        console.log('❌ Status text:', response.statusText);
        
        let errorMessage = 'Unknown error';
        let errorDetails = '';
        
        try {
          // First try to get response text to see what we're dealing with
          const responseText = await response.text();
          console.log('Raw response text:', responseText);
          
          if (!responseText || responseText.trim() === '') {
            errorMessage = `HTTP ${response.status}: ${response.statusText} - Empty response`;
          } else {
            // Try to parse as JSON
            try {
              const errorData = JSON.parse(responseText);
              console.error('Parsed error response:', errorData);
              
              // Handle empty object response
              if (errorData && typeof errorData === 'object' && Object.keys(errorData).length === 0) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
              } else {
                errorMessage = errorData.error || errorData.message || 'Unknown error';
                errorDetails = errorData.details || '';
              }
            } catch (jsonParseError) {
              console.error('Failed to parse JSON:', jsonParseError);
              errorMessage = `HTTP ${response.status}: ${response.statusText} - ${responseText}`;
            }
          }
        } catch (parseError) {
          console.error('Failed to read response:', parseError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        const fullErrorMessage = errorDetails ? `${errorMessage} (${errorDetails})` : errorMessage;
        
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
      console.error('Error creating case:', error);
      
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
    setFormData({
      supplierId: '',
      productDetails: '',
      deliveryDateTime: '',
      completionDateTime: '',
      status: 'RECEIVED',
      crmReferenceCode: '',
      difficultyLevel: '',
      estimatedTime: '',
      impactLevel: '',
      urgencyLevel: '',
      form: 'Onsite',
      formScore: '2'
    });
    setProducts([]);
    setErrors({});
    setSearchTerm('');
    setSelectedPartner(null);
    setIsDropdownOpen(false);
    setCurrentEmployee(null);
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Product management functions
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
                <h2 className="text-lg font-semibold">{editData ? 'Chỉnh sửa Case Nhận Hàng (Admin)' : 'Tạo Case Nhận Hàng (Admin)'}</h2>
                <p className="text-blue-100 text-sm">{editData ? 'Cập nhật thông tin nhận hàng' : 'Hệ thống quản lý nhận hàng'}</p>
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

            {/* Section 2: Nhà cung cấp */}
            <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-1.5 bg-blue-100 rounded-md">
                  <Truck className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Nhà cung cấp</h3>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 flex items-center">
                  <span className="w-24">Nhà cung cấp</span>
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
                        errors.supplierId ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder={loadingPartners ? 'Đang tải...' : 'Tìm kiếm nhà cung cấp...'}
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
                  
                  {isDropdownOpen && !loadingPartners && (
                    <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredPartners.length > 0 ? (
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
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                          Không tìm thấy nhà cung cấp nào
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {errors.supplierId && (
                  <p className="text-xs text-red-600 flex items-center space-x-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.supplierId}</span>
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
                  <p className="text-xs">Nhấn "Thêm sản phẩm" để bắt đầu</p>
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
                                placeholder="Nhập mã sản phẩm"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={product.quantity}
                                onChange={(e) => updateProduct(product.id, 'quantity', e.target.value)}
                                className={`w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                                  errors[`product_${index}_quantity`] ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="Nhập số lượng"
                                min="1"
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
                                placeholder="Nhập S/N"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeProduct(product.id)}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
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
                    value={formData.deliveryDateTime}
                    onChange={(e) => handleInputChange('deliveryDateTime', e.target.value)}
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
                    value={formData.completionDateTime}
                    onChange={(e) => handleInputChange('completionDateTime', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 flex items-center">
                    <span className="w-32">Mã CRM</span>
                  </label>
                  <input
                    type="text"
                    value={formData.crmReferenceCode}
                    onChange={(e) => handleInputChange('crmReferenceCode', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Nhập mã CRM (tùy chọn)"
                  />
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
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
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
                    value={formData.difficultyLevel}
                    onChange={(e) => handleInputChange('difficultyLevel', e.target.value)}
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
                    value={formData.estimatedTime}
                    onChange={(e) => handleInputChange('estimatedTime', e.target.value)}
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
                    value={formData.impactLevel}
                    onChange={(e) => handleInputChange('impactLevel', e.target.value)}
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
                    value={formData.urgencyLevel}
                    onChange={(e) => handleInputChange('urgencyLevel', e.target.value)}
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
          </div>

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
        </form>
      </div>
    </div>
  );
}
