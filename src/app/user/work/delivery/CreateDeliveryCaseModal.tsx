'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Package, Truck, Calendar, User, FileText, AlertCircle, Search, ChevronDown, RefreshCw, Plus, Trash2, Save, Star } from 'lucide-react';
import { useEvaluationForm } from '@/hooks/useEvaluation';
import { useEvaluation } from '@/contexts/EvaluationContext';
import { EvaluationType, EvaluationCategory } from '@/contexts/EvaluationContext';
import { useSession } from 'next-auth/react';
import { ReceivingCaseStatus } from '@prisma/client';
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

interface CreateDeliveryCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCase: any) => void;
}

export default function CreateDeliveryCaseModal({ isOpen, onClose, onSuccess }: CreateDeliveryCaseModalProps) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    customerId: '',
    deliveryDateTime: null as Date | null,
    completionDateTime: null as Date | null,
    status: 'RECEIVED',
    form: 'Onsite',
    crmReferenceCode: '',
    notes: '',
    // User self-assessment fields
    difficultyLevel: '',
    estimatedTime: '',
    impactLevel: '',
    urgencyLevel: '',
    formScore: '2'
  });

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [customers, setCustomers] = useState<Partner[]>([]);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
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

  const statusOptions = [
    { value: 'RECEIVED', label: 'Tiếp nhận' },
    { value: 'IN_PROGRESS', label: 'Đang xử lý' },
    { value: 'COMPLETED', label: 'Hoàn thành' },
    { value: 'CANCELLED', label: 'Hủy' }
  ];

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
      fetchCurrentEmployee();
    }
  }, [isOpen, session?.user?.email]);

  // Lock body scroll when modal is open
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

  const fetchCustomers = async () => {
    setLoadingPartners(true);
    try {
      const response = await fetch('/api/partners/list');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoadingPartners(false);
    }
  };

  const fetchCurrentEmployee = async () => {
    if (!session?.user?.email) return;
    
    try {
      const response = await fetch('/api/employees/list');
      if (response.ok) {
        const employeesResult = await response.json();
        const employees = employeesResult.data || employeesResult;
        const employee = employees.find((emp: Employee) => 
          emp.companyEmail === session.user.email
        );
        if (employee) {
          setCurrentEmployee(employee);
        }
      }
    } catch (error) {
      console.error('Error fetching employee:', error);
    }
  };

  const filteredPartners = customers.filter(partner =>
    partner.shortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.fullCompanyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePartnerSelect = (partner: Partner) => {
    setSelectedPartner(partner);
    setFormData(prev => ({ ...prev, customerId: partner.id }));
    setSearchTerm(partner.shortName);
    setIsDropdownOpen(false);
    if (errors.customerId) {
      setErrors(prev => ({ ...prev, customerId: '' }));
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setIsDropdownOpen(true);
    if (value !== selectedPartner?.shortName) {
      setSelectedPartner(null);
      setFormData(prev => ({ ...prev, customerId: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!currentEmployee) {
      newErrors.employee = 'Không tìm thấy thông tin nhân viên';
    }

    if (!formData.customerId) {
      newErrors.customerId = 'Khách hàng là bắt buộc';
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

    // Validate date relationships
    if (formData.deliveryDateTime && formData.completionDateTime) {
      if (formData.completionDateTime <= formData.deliveryDateTime) {
        newErrors.completionDateTime = 'Ngày hoàn thành phải lớn hơn ngày giao';
      }
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
      toast.error('Vui lòng kiểm tra lại các trường bắt buộc', {
        duration: 3000,
        position: 'top-right',
      });
      return;
    }

    setLoading(true);

    try {
      if (!currentEmployee) {
        toast.error('Không tìm thấy thông tin nhân viên. Vui lòng thử lại.', {
          duration: 4000,
          position: 'top-right',
        });
        setLoading(false);
        return;
      }

      // Validate and convert Date objects
      let startDateISO: string | null = null;
      let endDateISO: string | null = null;

      if (formData.deliveryDateTime) {
        try {
          const deliveryDate = formData.deliveryDateTime instanceof Date 
            ? formData.deliveryDateTime 
            : new Date(formData.deliveryDateTime);
          
          if (isNaN(deliveryDate.getTime())) {
            throw new Error('Invalid date');
          }
          startDateISO = deliveryDate.toISOString();
        } catch (error) {
          toast.error('Ngày giờ giao không hợp lệ', {
            duration: 3000,
            position: 'top-right',
          });
          setLoading(false);
          return;
        }
      } else {
        toast.error('Vui lòng chọn ngày giờ giao', {
          duration: 3000,
          position: 'top-right',
        });
        setLoading(false);
        return;
      }

      if (formData.completionDateTime) {
        try {
          const completionDate = formData.completionDateTime instanceof Date 
            ? formData.completionDateTime 
            : new Date(formData.completionDateTime);
          
          if (isNaN(completionDate.getTime())) {
            throw new Error('Invalid date');
          }
          endDateISO = completionDate.toISOString();
        } catch (error) {
          toast.error('Ngày giờ hoàn thành không hợp lệ', {
            duration: 3000,
            position: 'top-right',
          });
          setLoading(false);
          return;
        }
      }

      // Convert products quantity from string to number
      const convertedProducts = products.map(product => ({
        name: product.name,
        code: product.code || null,
        quantity: parseInt(product.quantity) || 1,
        serialNumber: product.serialNumber || null
      }));

      const caseData: any = {
        title: `Giao hàng đến ${selectedPartner?.shortName || 'Khách hàng'}`,
        description: 'Danh sách sản phẩm giao hàng',
        requesterId: currentEmployee.id,
        handlerId: currentEmployee.id,
        customerId: formData.customerId,
        form: formData.form,
        startDate: startDateISO,
        endDate: endDateISO,
        status: ReceivingCaseStatus.RECEIVED,
        products: convertedProducts
      };

      // Add optional fields only if they have values
      if (formData.notes) caseData.notes = formData.notes;
      if (formData.crmReferenceCode) caseData.crmReferenceCode = formData.crmReferenceCode;
      if (formData.difficultyLevel) caseData.userDifficultyLevel = formData.difficultyLevel;
      if (formData.estimatedTime) caseData.userEstimatedTime = formData.estimatedTime;
      if (formData.impactLevel) caseData.userImpactLevel = formData.impactLevel;
      if (formData.urgencyLevel) caseData.userUrgencyLevel = formData.urgencyLevel;
      if (formData.formScore) caseData.userFormScore = formData.formScore;

      console.log('Sending case data:', caseData);

      const response = await fetch('/api/delivery-cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(caseData),
      });

      if (response.ok) {
        const result = await response.json();
        
        toast.success('Tạo case giao hàng thành công!', {
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
        let errorMessage = 'Unknown error';
        let errorDetails = '';
        
        try {
          const errorData = await response.json();
          console.error('API Error Response:', errorData);
          errorMessage = errorData.error || errorData.message || 'Unknown error';
          errorDetails = errorData.details || '';
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
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
      console.error('Error creating delivery case:', error);
      
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
      customerId: '',
      deliveryDateTime: null,
      completionDateTime: null,
      status: 'RECEIVED',
      form: 'Onsite',
      crmReferenceCode: '',
      notes: '',
      difficultyLevel: '',
      estimatedTime: '',
      impactLevel: '',
      urgencyLevel: '',
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

  const handleInputChange = (field: string, value: string | Date | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
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
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Tạo Case Giao Hàng</h2>
                <p className="text-emerald-50 text-xs mt-0.5">Quản lý giao hàng đến khách hàng</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 text-white/90 hover:text-white hover:bg-white/20 rounded transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-5 space-y-4">
              {/* Row 1: Người thực hiện + Khách hàng */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Section 1: Người thực hiện */}
                <div className="bg-white rounded border border-gray-200">
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-emerald-600" />
                      <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Người thực hiện</h3>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">Auto</span>
                  </div>
                  
                  <div className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-semibold shadow">
                        {currentEmployee ? currentEmployee.fullName.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm">
                          {currentEmployee ? currentEmployee.fullName : 'Đang tải...'}
                        </div>
                        {currentEmployee && (
                          <div className="text-xs text-gray-600 mt-0.5 truncate">
                            {currentEmployee.position} • {currentEmployee.department}
                          </div>
                        )}
                      </div>
                    </div>
                    {errors.employee && (
                      <div className="mt-2 p-2 bg-red-50 border-l-2 border-red-500 text-xs text-red-700 flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{errors.employee}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 2: Khách hàng */}
                <div className="bg-white rounded border border-gray-200">
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                    <Truck className="h-4 w-4 text-emerald-600" />
                    <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Khách hàng</h3>
                    <span className="text-red-500 text-sm ml-1">*</span>
                  </div>
                  
                  <div className="p-3">
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
                          className={`w-full pl-9 pr-9 py-2 text-sm border rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${
                            errors.customerId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder={loadingPartners ? 'Đang tải...' : 'Tìm kiếm khách hàng...'}
                          disabled={loadingPartners}
                        />
                        <button
                          type="button"
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          className="absolute inset-y-0 right-0 pr-2.5 flex items-center"
                          disabled={loadingPartners}
                        >
                          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                      
                      {isDropdownOpen && !loadingPartners && (
                        <div className="absolute z-[9999] w-full mt-1.5 bg-white border border-gray-200 rounded shadow-lg max-h-56 overflow-auto">
                          {filteredPartners.length > 0 ? (
                            filteredPartners.map(partner => (
                              <div
                                key={partner.id}
                                onClick={() => handlePartnerSelect(partner)}
                                className="px-3 py-2.5 hover:bg-emerald-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                              >
                                <div className="font-medium text-sm text-gray-900">{partner.shortName}</div>
                                <div className="text-xs text-gray-600 mt-0.5">{partner.fullCompanyName}</div>
                                {partner.contactPerson && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {partner.contactPerson}{partner.contactPhone && ` • ${partner.contactPhone}`}
                                  </div>
                                )}
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
                    {errors.customerId && (
                      <div className="mt-2 p-2 bg-red-50 border-l-2 border-red-500 text-xs text-red-700 flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{errors.customerId}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: Chi tiết hàng hóa */}
              <div className="bg-white rounded border border-gray-200">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-emerald-600" />
                    <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Chi tiết hàng hóa</h3>
                    <span className="text-red-500 text-sm ml-1">*</span>
                  </div>
                  <button
                    type="button"
                    onClick={addProduct}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors font-medium cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Thêm sản phẩm</span>
                  </button>
                </div>
                
                <div className="p-3">
                  {products.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">Chưa có sản phẩm nào</p>
                      <p className="text-xs text-gray-400 mt-1">Nhấn &quot;Thêm sản phẩm&quot; để bắt đầu</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Desktop Table View */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full border border-gray-200 rounded">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Tên sản phẩm *
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Mã sản phẩm
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Số lượng *
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                S/N
                              </th>
                              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Thao tác
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {products.map((product, index) => (
                              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-3 py-2">
                                  <input
                                    type="text"
                                    value={product.name}
                                    onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                                    className={`w-full px-2.5 py-1.5 text-sm border rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                                      errors[`product_${index}_name`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
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
                                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="Mã SP"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    value={product.quantity}
                                    onChange={(e) => updateProduct(product.id, 'quantity', e.target.value)}
                                    className={`w-full px-2.5 py-1.5 text-sm border rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                                      errors[`product_${index}_quantity`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                    }`}
                                    placeholder="SL"
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
                                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="S/N"
                                  />
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => removeProduct(product.id)}
                                    className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
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

                      {/* Mobile Card View */}
                      <div className="md:hidden space-y-2">
                        {products.map((product, index) => (
                          <div key={product.id} className="bg-gray-50 border border-gray-200 rounded p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-gray-700">Sản phẩm #{index + 1}</span>
                              <button
                                type="button"
                                onClick={() => removeProduct(product.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            
                            <div className="space-y-2">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Tên sản phẩm <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={product.name}
                                  onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                                  className={`w-full px-2.5 py-1.5 text-sm border rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                                    errors[`product_${index}_name`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                  }`}
                                  placeholder="Nhập tên sản phẩm"
                                />
                                {errors[`product_${index}_name`] && (
                                  <p className="text-xs text-red-600 mt-1">{errors[`product_${index}_name`]}</p>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Mã SP</label>
                                  <input
                                    type="text"
                                    value={product.code}
                                    onChange={(e) => updateProduct(product.id, 'code', e.target.value)}
                                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="Mã"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Số lượng <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="number"
                                    value={product.quantity}
                                    onChange={(e) => updateProduct(product.id, 'quantity', e.target.value)}
                                    className={`w-full px-2.5 py-1.5 text-sm border rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                                      errors[`product_${index}_quantity`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                    }`}
                                    placeholder="SL"
                                    min="1"
                                  />
                                  {errors[`product_${index}_quantity`] && (
                                    <p className="text-xs text-red-600 mt-1">{errors[`product_${index}_quantity`]}</p>
                                  )}
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">S/N</label>
                                <input
                                  type="text"
                                  value={product.serialNumber}
                                  onChange={(e) => updateProduct(product.id, 'serialNumber', e.target.value)}
                                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                  placeholder="Serial Number"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {errors.products && (
                        <p className="text-xs text-red-600 flex items-center gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>{errors.products}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 4: Thời gian */}
              <div className="bg-white rounded border border-gray-200">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Thời gian</h3>
                </div>
                
                <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Ngày giờ giao <span className="text-red-500">*</span>
                    </label>
                    <DateTimePicker
                      value={formData.deliveryDateTime}
                      onChange={(value) => handleInputChange('deliveryDateTime', value)}
                      placeholder="Chọn ngày giờ giao"
                      locale="vi"
                      valueFormat="DD/MM/YYYY HH:mm"
                      clearable
                      withSeconds={false}
                      styles={{
                        input: {
                          fontSize: '0.875rem',
                          padding: '0.375rem 0.625rem',
                          borderColor: errors.deliveryDateTime ? '#fca5a5' : '#d1d5db',
                          backgroundColor: errors.deliveryDateTime ? '#fef2f2' : 'white',
                          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                          borderRadius: '0.25rem',
                        }
                      }}
                    />
                    {errors.deliveryDateTime && (
                      <p className="text-xs text-red-600 flex items-center gap-1.5 mt-1.5">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>{errors.deliveryDateTime}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Ngày giờ hoàn thành
                    </label>
                    <DateTimePicker
                      value={formData.completionDateTime}
                      onChange={(value) => handleInputChange('completionDateTime', value)}
                      placeholder="Chọn ngày giờ hoàn thành"
                      locale="vi"
                      valueFormat="DD/MM/YYYY HH:mm"
                      clearable
                      minDate={formData.deliveryDateTime || undefined}
                      withSeconds={false}
                      styles={{
                        input: {
                          fontSize: '0.875rem',
                          padding: '0.375rem 0.625rem',
                          borderColor: errors.completionDateTime ? '#fca5a5' : '#d1d5db',
                          backgroundColor: errors.completionDateTime ? '#fef2f2' : 'white',
                          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                          borderRadius: '0.25rem',
                        }
                      }}
                    />
                    {errors.completionDateTime && (
                      <p className="text-xs text-red-600 flex items-center gap-1.5 mt-1.5">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>{errors.completionDateTime}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 5: Trạng thái & Mã CRM */}
              <div className="bg-white rounded border border-gray-200">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Trạng thái & Mã CRM</h3>
                </div>
                
                <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Trạng thái case</label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    >
                      {statusOptions.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Mã CRM</label>
                    <input
                      type="text"
                      value={formData.crmReferenceCode}
                      onChange={(e) => handleInputChange('crmReferenceCode', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Nhập mã CRM"
                    />
                  </div>
                </div>
              </div>

              {/* Section 6: Ghi chú */}
              <div className="bg-white rounded border border-gray-200">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Ghi chú</h3>
                </div>
                
                <div className="p-3">
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                    placeholder="Nhập ghi chú cho case giao hàng..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Section 7: Đánh giá của User */}
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
                        className={`w-full px-2.5 py-1.5 text-sm border rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
                          errors.difficultyLevel ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        required
                      >
                        <option value="">Chọn mức độ khó</option>
                        {getFieldOptions(EvaluationCategory.DIFFICULTY).map((option) => (
                          <option key={option.id} value={option.points}>
                            {option.points} điểm - {option.label}
                          </option>
                        ))}
                      </select>
                      {errors.difficultyLevel && (
                        <p className="text-xs text-red-600 flex items-center gap-1.5 mt-1.5">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>{errors.difficultyLevel}</span>
                        </p>
                      )}
                    </div>

                    {/* Thời gian ước tính */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Thời gian ước tính <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.estimatedTime}
                        onChange={(e) => handleInputChange('estimatedTime', e.target.value)}
                        className={`w-full px-2.5 py-1.5 text-sm border rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
                          errors.estimatedTime ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        required
                      >
                        <option value="">Chọn thời gian ước tính</option>
                        {getFieldOptions(EvaluationCategory.TIME).map((option) => (
                          <option key={option.id} value={option.points}>
                            {option.points} điểm - {option.label}
                          </option>
                        ))}
                      </select>
                      {errors.estimatedTime && (
                        <p className="text-xs text-red-600 flex items-center gap-1.5 mt-1.5">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>{errors.estimatedTime}</span>
                        </p>
                      )}
                    </div>

                    {/* Mức độ ảnh hưởng */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Mức độ ảnh hưởng <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.impactLevel}
                        onChange={(e) => handleInputChange('impactLevel', e.target.value)}
                        className={`w-full px-2.5 py-1.5 text-sm border rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
                          errors.impactLevel ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        required
                      >
                        <option value="">Chọn mức độ ảnh hưởng</option>
                        {getFieldOptions(EvaluationCategory.IMPACT).map((option) => (
                          <option key={option.id} value={option.points}>
                            {option.points} điểm - {option.label}
                          </option>
                        ))}
                      </select>
                      {errors.impactLevel && (
                        <p className="text-xs text-red-600 flex items-center gap-1.5 mt-1.5">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>{errors.impactLevel}</span>
                        </p>
                      )}
                    </div>

                    {/* Mức độ khẩn cấp */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Mức độ khẩn cấp <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.urgencyLevel}
                        onChange={(e) => handleInputChange('urgencyLevel', e.target.value)}
                        className={`w-full px-2.5 py-1.5 text-sm border rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
                          errors.urgencyLevel ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        required
                      >
                        <option value="">Chọn mức độ khẩn cấp</option>
                        {getFieldOptions(EvaluationCategory.URGENCY).map((option) => (
                          <option key={option.id} value={option.points}>
                            {option.points} điểm - {option.label}
                          </option>
                        ))}
                      </select>
                      {errors.urgencyLevel && (
                        <p className="text-xs text-red-600 flex items-center gap-1.5 mt-1.5">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>{errors.urgencyLevel}</span>
                        </p>
                      )}
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
                        className={`w-full px-2.5 py-1.5 text-sm border rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
                          errors.form ? 'border-red-300 bg-red-50' : 'border-gray-300'
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
                        <p className="text-xs text-red-600 flex items-center gap-1.5 mt-1.5">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>{errors.form}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          {/* Actions */}
          <div className="sticky bottom-0 bg-white border-t border-gray-300 px-5 py-3 flex items-center justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={handleClose}
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
                  <Save className="h-4 w-4" />
                  <span>Tạo Case Giao Hàng</span>
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
