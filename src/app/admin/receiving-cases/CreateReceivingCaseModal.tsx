'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Package, Truck, Calendar, User, FileText, AlertCircle, Search, ChevronDown, CheckCircle, RefreshCw, Plus, Trash2, Building2, Clock, Star, Zap, TrendingUp, Target, Briefcase, Save } from 'lucide-react';
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

interface ReceivingCase {
  id: string;
  startDate: string;
  endDate: string | null;
  status: string;
  crmReferenceCode: string | null;
  notes: string | null;
  description: string;
  userDifficultyLevel: number | null;
  userEstimatedTime: number | null;
  userImpactLevel: number | null;
  userUrgencyLevel: number | null;
  userFormScore: number | null;
  form: string;
  supplier: {
    id: string;
    shortName: string;
    fullCompanyName: string;
    contactPerson: string | null;
    contactPhone: string | null;
  } | null;
  handler: {
    id: string;
    fullName: string;
    position: string;
    department: string;
    companyEmail: string;
  };
  requester: {
    id: string;
    fullName: string;
    position: string;
    department: string;
    companyEmail: string;
  };
  products: Array<{
    id: string;
    name: string;
    code: string | null;
    quantity: number;
    serialNumber: string | null;
  }>;
  _count: {
    comments: number;
    worklogs: number;
    products: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface CreateReceivingCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCase: any) => void;
  editData?: ReceivingCase | null;
}

export default function CreateReceivingCaseModal({ isOpen, onClose, onSuccess, editData }: CreateReceivingCaseModalProps) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    supplierId: '',
    handler: '',
    productDetails: '',
    deliveryDateTime: null as Date | null,
    completionDateTime: null as Date | null,
    status: 'RECEIVED',
    crmReferenceCode: '',
    notes: '',
    // User self-assessment fields
    difficultyLevel: '',
    estimatedTime: '',
    impactLevel: '',
    urgencyLevel: '',
    form: 'Onsite',
    formScore: '2'
  });

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
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

  const statusOptions = [
    { value: 'RECEIVED', label: 'Tiếp nhận' },
    { value: 'IN_PROGRESS', label: 'Đang xử lý' },
    { value: 'COMPLETED', label: 'Hoàn thành' },
    { value: 'CANCELLED', label: 'Hủy' }
  ];

  // Populate form data when in edit mode
  useEffect(() => {
    if (editData && isOpen) {
      // Convert ISO string to Date object for DateTimePicker
      const deliveryDateTime = editData.startDate ? new Date(editData.startDate) : null;
      const completionDateTime = editData.endDate ? new Date(editData.endDate) : null;

      setFormData({
        supplierId: editData.supplier?.id || '',
        handler: editData.handler?.id || '',
        productDetails: editData.description || '',
        deliveryDateTime,
        completionDateTime,
        status: editData.status || 'RECEIVED',
        crmReferenceCode: editData.crmReferenceCode || '',
        notes: editData.notes || '',
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
        setSearchTerm(editData.supplier.shortName);
      }

      // Set products
      if (editData.products && editData.products.length > 0) {
        const productItems = editData.products.map(product => ({
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
        handler: '',
        productDetails: '',
        deliveryDateTime: null,
        completionDateTime: null,
        status: 'RECEIVED',
        crmReferenceCode: '',
        notes: '',
        difficultyLevel: '',
        estimatedTime: '',
        impactLevel: '',
        urgencyLevel: '',
        form: 'Onsite',
        formScore: '2'
      });
      setProducts([]);
      setSelectedPartner(null);
      setSearchTerm('');
    }
  }, [editData, isOpen]);

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPartners();
      fetchEmployees();
      fetchCurrentEmployee();
      fetchConfigs();
    }
  }, [isOpen]);

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
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setLoadingPartners(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees/list');
      if (response.ok) {
        const result = await response.json();
        setEmployees(result.data || result);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
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
    const newErrors: Record<string, string> = {};

    if (!formData.handler) {
      newErrors.handler = 'Người nhận hàng là bắt buộc';
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
      const handlerId = formData.handler;
      const reporterId = editData ? editData.requester.id : (currentEmployee?.id || handlerId);

      // Validate and convert Date objects
      let startDateISO: string | null = null;
      let endDateISO: string | null = null;

      if (formData.deliveryDateTime) {
        const deliveryDate = formData.deliveryDateTime instanceof Date 
          ? formData.deliveryDateTime 
          : new Date(formData.deliveryDateTime);
        
        if (isNaN(deliveryDate.getTime())) {
          toast.error('Ngày giờ giao không hợp lệ');
          setLoading(false);
          return;
        }
        startDateISO = deliveryDate.toISOString();
      }

      if (formData.completionDateTime) {
        const completionDate = formData.completionDateTime instanceof Date 
          ? formData.completionDateTime 
          : new Date(formData.completionDateTime);
        
        if (isNaN(completionDate.getTime())) {
          toast.error('Ngày giờ hoàn thành không hợp lệ');
          setLoading(false);
          return;
        }
        endDateISO = completionDate.toISOString();
      }

      const caseData = {
        title: `Nhận hàng từ ${selectedPartner?.shortName || 'Nhà cung cấp'}`,
        description: 'Danh sách sản phẩm nhận hàng',
        requesterId: reporterId,
        handlerId: handlerId,
        supplierId: formData.supplierId,
        form: formData.form,
        startDate: startDateISO,
        endDate: endDateISO,
        status: formData.status || ReceivingCaseStatus.RECEIVED,
        notes: formData.notes || null,
        crmReferenceCode: formData.crmReferenceCode || null,
        userDifficultyLevel: formData.difficultyLevel,
        userEstimatedTime: formData.estimatedTime,
        userImpactLevel: formData.impactLevel,
        userUrgencyLevel: formData.urgencyLevel,
        userFormScore: formData.formScore,
        products: products
      };

      const url = editData ? `/api/receiving-cases/${editData.id}` : '/api/receiving-cases';
      const method = editData ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(caseData),
        credentials: 'include',
      });

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
        const errorData = await response.json();
        toast.error(`Lỗi: ${errorData.error || 'Không thể lưu case'}`, {
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#EF4444',
            color: '#fff',
          },
        });
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.', {
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
      handler: '',
      productDetails: '',
      deliveryDateTime: null,
      completionDateTime: null,
      status: 'RECEIVED',
      crmReferenceCode: '',
      notes: '',
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
    onClose();
  };

  const handleInputChange = (field: string, value: string | Date | null) => {
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
         {/* Header - Màu xanh dương cho Admin */}
         <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
                  {editData ? 'Chỉnh sửa Case Nhận Hàng (Admin)' : 'Tạo Case Nhận Hàng (Admin)'}
                </h2>
                <p className="text-blue-100 text-xs mt-0.5">
                  {editData ? 'Cập nhật thông tin nhận hàng' : 'Quản lý nhận hàng từ nhà cung cấp'}
                </p>
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
            {/* Row 1: Người nhận hàng + Nhà cung cấp */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Section 1: Người nhận hàng (Admin has dropdown) */}
              <div className="bg-white rounded border border-gray-200">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Người nhận hàng</h3>
                  <span className="text-red-500 text-sm ml-1">*</span>
                </div>
                
                <div className="p-3">
                  <select
                    value={formData.handler}
                    onChange={(e) => handleInputChange('handler', e.target.value)}
                    className={`w-full px-2.5 py-2 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.handler ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">-- Chọn người nhận hàng --</option>
                    {employees.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.fullName} - {employee.position} ({employee.department})
                      </option>
                    ))}
                  </select>
                  {errors.handler && (
                    <div className="mt-2 p-2 bg-red-50 border-l-2 border-red-500 text-xs text-red-700 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{errors.handler}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Nhà cung cấp */}
              <div className="bg-white rounded border border-gray-200">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                  <Truck className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Nhà cung cấp</h3>
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
                        className={`w-full pl-9 pr-9 py-2 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          errors.supplierId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder={loadingPartners ? 'Đang tải...' : 'Tìm kiếm nhà cung cấp...'}
                        disabled={loadingPartners}
                      />
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center cursor-pointer"
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
                              className="px-3 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
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
                            Không tìm thấy nhà cung cấp
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {errors.supplierId && (
                    <div className="mt-2 p-2 bg-red-50 border-l-2 border-red-500 text-xs text-red-700 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{errors.supplierId}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Chi tiết hàng hóa */}
            <div className="bg-white rounded border border-gray-200">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Chi tiết hàng hóa</h3>
                  <span className="text-red-500 text-sm ml-1">*</span>
                </div>
                <button
                  type="button"
                  onClick={addProduct}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium cursor-pointer"
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
                                  className={`w-full px-2.5 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
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
                                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Mã SP"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  value={product.quantity}
                                  onChange={(e) => updateProduct(product.id, 'quantity', e.target.value)}
                                  className={`w-full px-2.5 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
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
                                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                            {/* Tên sản phẩm */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Tên sản phẩm <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={product.name}
                                onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                                className={`w-full px-2.5 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                  errors[`product_${index}_name`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                                placeholder="Nhập tên sản phẩm"
                              />
                              {errors[`product_${index}_name`] && (
                                <p className="text-xs text-red-600 mt-1">{errors[`product_${index}_name`]}</p>
                              )}
                            </div>

                            {/* 2 columns: Code & Quantity */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Mã SP</label>
                                <input
                                  type="text"
                                  value={product.code}
                                  onChange={(e) => updateProduct(product.id, 'code', e.target.value)}
                                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                  className={`w-full px-2.5 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
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

                            {/* Serial Number */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">S/N</label>
                              <input
                                type="text"
                                value={product.serialNumber}
                                onChange={(e) => updateProduct(product.id, 'serialNumber', e.target.value)}
                                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <Calendar className="h-4 w-4 text-blue-600" />
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
                <FileText className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Trạng thái & Mã CRM</h3>
              </div>
              
              <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Trạng thái case</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nhập mã CRM"
                  />
                </div>
              </div>
            </div>

            {/* Section 6: Ghi chú */}
            <div className="bg-white rounded border border-gray-200">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Ghi chú</h3>
              </div>
              
              <div className="p-3">
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Nhập ghi chú cho case nhận hàng..."
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
              className="px-5 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-sm flex items-center gap-2 cursor-pointer"
              style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Đang {editData ? 'cập nhật' : 'tạo'}...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{editData ? 'Cập nhật' : 'Tạo'} Case Nhận Hàng</span>
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
