'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Save, RefreshCw, User, FileText, Calendar, Settings, CheckCircle, Building2, Star, Target, Search, ChevronDown } from 'lucide-react';
import { useEvaluationForm } from '@/hooks/useEvaluation';
import { useEvaluation } from '@/contexts/EvaluationContext';
import { EvaluationType, EvaluationCategory } from '@/contexts/EvaluationContext';
import { convertISOToLocalInput, convertLocalInputToISO } from '@/lib/date-utils';
import toast from 'react-hot-toast';
import { DateTimePicker } from '@mantine/dates';
import 'dayjs/locale/vi';
import { useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface Employee {
  id: string;
  fullName: string;
  position: string;
  department: string;
  companyEmail: string;
}

interface Incident {
  id: string;
  title: string;
  description: string;
  customerName: string;
  handler: Employee;
  incidentType: string;
  customer?: {
    id: string;
    fullCompanyName: string;
    shortName: string;
    contactPerson?: string;
    contactPhone?: string;
  };
  status: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  crmReferenceCode?: string;
  // User assessment fields
  userDifficultyLevel?: number;
  userEstimatedTime?: number;
  userImpactLevel?: number;
  userUrgencyLevel?: number;
  userFormScore?: number;
  userAssessmentDate?: string;
  // Admin assessment fields
  adminDifficultyLevel?: number;
  adminEstimatedTime?: number;
  adminImpactLevel?: number;
  adminUrgencyLevel?: number;
  adminAssessmentDate?: string;
  adminAssessmentNotes?: string;
}

interface EditIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedIncident: Incident) => void;
  incidentData: Incident | null;
  // Pre-loaded data to avoid re-fetching
  employees?: Employee[];
  customers?: any[];
  incidentTypes?: Array<{ id: string, name: string }>;
}

export default function EditIncidentModal({
  isOpen,
  onClose,
  onSuccess,
  incidentData,
  employees: preloadedEmployees = [],
  customers: preloadedCustomers = [],
  incidentTypes: preloadedIncidentTypes = []
}: EditIncidentModalProps) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    incidentType: '',
    customerTitle: 'Anh',
    customerName: '',
    customerId: '',
    handlerId: '',
    status: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
    notes: '',
    crmReferenceCode: '',
    // User assessment fields
    difficultyLevel: '',
    estimatedTime: '',
    impactLevel: '',
    urgencyLevel: '',
    form: 'Onsite',
    formScore: '2',
    // Admin assessment fields
    adminDifficultyLevel: '',
    adminEstimatedTime: '',
    adminImpactLevel: '',
    adminUrgencyLevel: '',
    adminAssessmentNotes: ''
  });

  const [employees, setEmployees] = useState<Employee[]>(preloadedEmployees);
  const [partners, setPartners] = useState<any[]>(preloadedCustomers);
  const [incidentTypes, setIncidentTypes] = useState<Array<{ id: string, name: string }>>(preloadedIncidentTypes);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Evaluation categories
  const userCategories = [
    EvaluationCategory.DIFFICULTY,
    EvaluationCategory.TIME,
    EvaluationCategory.IMPACT,
    EvaluationCategory.URGENCY,
    EvaluationCategory.FORM,
  ];

  const adminCategories = [
    EvaluationCategory.DIFFICULTY,
    EvaluationCategory.TIME,
    EvaluationCategory.IMPACT,
    EvaluationCategory.URGENCY,
  ];

  const { getFieldOptions: getUserFieldOptions } = useEvaluationForm(EvaluationType.USER, userCategories);
  const { getFieldOptions: getAdminFieldOptions } = useEvaluationForm(EvaluationType.ADMIN, adminCategories);
  const { fetchConfigs } = useEvaluation();

  // Sync preloaded data when it changes
  useEffect(() => {
    if (preloadedEmployees.length > 0) setEmployees(preloadedEmployees);
  }, [preloadedEmployees]);

  useEffect(() => {
    if (preloadedCustomers.length > 0) setPartners(preloadedCustomers);
  }, [preloadedCustomers]);

  useEffect(() => {
    if (preloadedIncidentTypes.length > 0) setIncidentTypes(preloadedIncidentTypes);
  }, [preloadedIncidentTypes]);

  // Load form data only if preloaded data is not available (fallback)
  useEffect(() => {
    if (isOpen) {
      fetchConfigs();
      if (employees.length === 0 || partners.length === 0 || incidentTypes.length === 0) {
        loadFormData();
      }
    }
  }, [isOpen]);

  // Handle outside click for customer dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setShowCustomerDropdown(false);
      }
    };

    if (showCustomerDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCustomerDropdown]);

  // Body scroll lock when modal is open
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

  // Initialize form data AFTER employees are loaded
  useEffect(() => {
    if (isOpen && incidentData && employees.length > 0) {
      console.log('=== Initializing Incident Form Data ===');

      const startDate = incidentData.startDate ? new Date(incidentData.startDate) : null;
      const endDate = incidentData.endDate ? new Date(incidentData.endDate) : null;

      let incidentTypeName = '';
      if (typeof incidentData.incidentType === 'string') {
        const foundType = incidentTypes.find(t => t.name === incidentData.incidentType);
        incidentTypeName = foundType ? foundType.id : incidentData.incidentType;
      } else if (incidentData.incidentType && (incidentData.incidentType as any).id) {
        incidentTypeName = (incidentData.incidentType as any).id;
      }

      // Customer name parsing
      const rawCustomerName = incidentData.customerName || '';
      let customerTitle = 'Anh';
      let displayCustomerName = rawCustomerName;

      if (rawCustomerName.startsWith('Anh ')) {
        customerTitle = 'Anh';
        displayCustomerName = rawCustomerName.substring(4);
      } else if (rawCustomerName.startsWith('Chị ')) {
        customerTitle = 'Chị';
        displayCustomerName = rawCustomerName.substring(4);
      }

      // Sync customer search and partner select
      if (incidentData.customer) {
        setCustomerSearch(`${incidentData.customer.fullCompanyName} (${incidentData.customer.shortName})`);
      } else {
        setCustomerSearch('');
      }

      // Form label sync
      const formOptions = getUserFieldOptions(EvaluationCategory.FORM);
      const matchedForm = formOptions.find(opt => opt.points.toString() === incidentData.userFormScore?.toString());
      const formLabel = matchedForm ? matchedForm.label : (incidentData.userFormScore === 2 || !incidentData.userFormScore ? 'Onsite' : '');

      setFormData({
        title: incidentData.title || '',
        description: incidentData.description || '',
        incidentType: incidentTypeName,
        customerTitle,
        customerName: displayCustomerName,
        customerId: incidentData.customer?.id || '',
        handlerId: incidentData.handler?.id || '',
        status: incidentData.status || '',
        startDate,
        endDate,
        notes: incidentData.notes || '',
        crmReferenceCode: incidentData.crmReferenceCode || '',
        // User assessment
        difficultyLevel: incidentData.userDifficultyLevel?.toString() || '',
        estimatedTime: incidentData.userEstimatedTime?.toString() || '',
        impactLevel: incidentData.userImpactLevel?.toString() || '',
        urgencyLevel: incidentData.userUrgencyLevel?.toString() || '',
        form: formLabel,
        formScore: incidentData.userFormScore?.toString() || '2',
        // Admin assessment
        adminDifficultyLevel: incidentData.adminDifficultyLevel?.toString() || '',
        adminEstimatedTime: incidentData.adminEstimatedTime?.toString() || '',
        adminImpactLevel: incidentData.adminImpactLevel?.toString() || '',
        adminUrgencyLevel: incidentData.adminUrgencyLevel?.toString() || '',
        adminAssessmentNotes: incidentData.adminAssessmentNotes || ''
      });
    }
  }, [isOpen, incidentData, employees, incidentTypes]);

  // Second effect to re-sync form label once config is loaded
  useEffect(() => {
    if (isOpen && incidentData) {
      const formOptions = getUserFieldOptions(EvaluationCategory.FORM);
      if (formOptions.length > 0) {
        const matchedForm = formOptions.find(opt => opt.points.toString() === incidentData.userFormScore?.toString());
        if (matchedForm) {
          setFormData(prev => ({
            ...prev,
            form: matchedForm.label
          }));
        }
      }
    }
  }, [isOpen, incidentData?.userFormScore, getUserFieldOptions]);

  // Load form data only as fallback (if preloaded data is not available)
  const loadFormData = async () => {
    try {
      // Only fetch if not already provided via props
      const promises = [];

      if (employees.length === 0) {
        promises.push(
          fetch('/api/employees/list', { headers: { 'Cache-Control': 'max-age=600' } })
            .then(res => res.ok ? res.json() : [])
            .then(data => setEmployees(data.data || data || []))
        );
      }

      if (partners.length === 0) {
        promises.push(
          fetch('/api/partners/list', { headers: { 'Cache-Control': 'max-age=600' } })
            .then(res => res.ok ? res.json() : [])
            .then(data => setPartners(data.data || data || []))
        );
      }

      if (incidentTypes.length === 0) {
        promises.push(
          fetch('/api/incident-types', { headers: { 'Cache-Control': 'max-age=600' } })
            .then(res => res.ok ? res.json() : { data: [] })
            .then(data => setIncidentTypes(data.data || data || []))
        );
      }

      // Load all in parallel
      if (promises.length > 0) {
        await Promise.all(promises);
      }
    } catch (error) {
      console.error('Error loading form data:', error);
      toast.error('Lỗi khi tải dữ liệu form');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!incidentData) return;

    // Validate end date (only if both dates exist) - allow any past/future dates
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);

      console.log('=== Date Validation (Admin Edit Incident) ===');
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

    setSaving(true);
    try {
      const response = await fetch(`/api/incidents/${incidentData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          incidentType: incidentTypes.find(t => t.id === formData.incidentType)?.name || formData.incidentType,
          customerName: `${formData.customerTitle} ${formData.customerName}`.trim(),
          customerId: formData.customerId || null,
          handlerId: formData.handlerId,
          status: formData.status,
          startDate: formData.startDate ? formData.startDate.toISOString() : null,
          endDate: formData.endDate ? formData.endDate.toISOString() : null,
          notes: formData.notes,
          crmReferenceCode: formData.crmReferenceCode,
          // User assessment
          userDifficultyLevel: formData.difficultyLevel ? parseInt(formData.difficultyLevel) : null,
          userEstimatedTime: formData.estimatedTime ? parseInt(formData.estimatedTime) : null,
          userImpactLevel: formData.impactLevel ? parseInt(formData.impactLevel) : null,
          userUrgencyLevel: formData.urgencyLevel ? parseInt(formData.urgencyLevel) : null,
          userFormScore: formData.formScore ? parseInt(formData.formScore) : null,
          // Admin assessment
          adminDifficultyLevel: formData.adminDifficultyLevel ? parseInt(formData.adminDifficultyLevel) : null,
          adminEstimatedTime: formData.adminEstimatedTime ? parseInt(formData.adminEstimatedTime) : null,
          adminImpactLevel: formData.adminImpactLevel ? parseInt(formData.adminImpactLevel) : null,
          adminUrgencyLevel: formData.adminUrgencyLevel ? parseInt(formData.adminUrgencyLevel) : null,
          adminAssessmentNotes: formData.adminAssessmentNotes || null
        }),
      });

      if (response.ok) {
        const updatedIncident = await response.json();
        toast.success('Cập nhật sự cố thành công!');
        onSuccess(updatedIncident.data);
        onClose();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Có lỗi xảy ra khi cập nhật sự cố');
      }
    } catch (error) {
      console.error('Error updating incident:', error);
      toast.error('Có lỗi xảy ra khi cập nhật sự cố');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomerSelect = (partnerId: string) => {
    const selectedPartner = partners.find(p => p.id === partnerId);
    handleInputChange('customerId', partnerId);
    setCustomerSearch(selectedPartner ? `${selectedPartner.fullCompanyName} (${selectedPartner.shortName})` : '');
    setShowCustomerDropdown(false);
  };

  const filteredPartners = partners.filter(partner =>
    partner.fullCompanyName.toLowerCase().includes(customerSearch.toLowerCase()) ||
    partner.shortName.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const getStatusOptions = () => [
    { value: 'RECEIVED', label: 'Tiếp nhận' },
    { value: 'PROCESSING', label: 'Đang xử lý' },
    { value: 'COMPLETED', label: 'Hoàn thành' },
    { value: 'CANCELLED', label: 'Hủy' }
  ];

  if (!isOpen || !incidentData) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
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
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
                  Chỉnh sửa sự cố (Admin)
                </h2>
                <p className="text-blue-100 text-xs mt-0.5">Cập nhật thông tin và xử lý sự cố</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-white/90 hover:text-white hover:bg-white/20 rounded transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-5 space-y-4">
              {/* Row 1: Người xử lý + Loại sự cố */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Section 1: Người xử lý */}
                <div className="bg-white rounded border border-gray-200 shadow-sm">
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Người xử lý</h3>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded">Admin</span>
                  </div>

                  <div className="p-3">
                    <select
                      value={formData.handlerId}
                      onChange={(e) => handleInputChange('handlerId', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                      disabled={saving}
                    >
                      <option value="">Chọn nhân viên</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Section 2: Loại sự cố */}
                <div className="bg-white rounded border border-gray-200 shadow-sm">
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-blue-600" />
                      <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Loại sự cố</h3>
                    </div>
                    <span className="text-red-500 text-sm">*</span>
                  </div>

                  <div className="p-3">
                    <select
                      value={formData.incidentType}
                      onChange={(e) => handleInputChange('incidentType', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    >
                      <option value="">Chọn loại sự cố</option>
                      {incidentTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Thông tin khách hàng */}
              <div className="bg-white rounded border border-gray-200 shadow-sm">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Thông tin khách hàng</h3>
                </div>

                <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Khách hàng <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={formData.customerTitle}
                        onChange={(e) => handleInputChange('customerTitle', e.target.value)}
                        className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="Anh">Anh</option>
                        <option value="Chị">Chị</option>
                      </select>
                      <input
                        type="text"
                        value={formData.customerName}
                        onChange={(e) => handleInputChange('customerName', e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Nhập tên khách hàng..."
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Tên công ty</label>
                    <div className="relative" ref={dropdownRef}>
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value);
                          setShowCustomerDropdown(true);
                          if (!e.target.value) handleInputChange('customerId', '');
                        }}
                        onFocus={() => setShowCustomerDropdown(true)}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Tìm kiếm khách hàng..."
                      />
                      {showCustomerDropdown && (
                        <div className="absolute z-[9999] w-full mt-1.5 bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-y-auto">
                          {filteredPartners.length > 0 ? (
                            filteredPartners.map((partner) => (
                              <div
                                key={partner.id}
                                onClick={() => handleCustomerSelect(partner.id)}
                                className="px-3 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
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

              {/* Section 4: Chi tiết sự cố */}
              <div className="bg-white rounded border border-gray-200 shadow-sm">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Chi tiết sự cố</h3>
                </div>

                <div className="p-3 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Tiêu đề sự cố <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Nhập tiêu đề sự cố..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Mã CRM</label>
                      <input
                        type="text"
                        value={formData.crmReferenceCode}
                        onChange={(e) => handleInputChange('crmReferenceCode', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Nhập mã CRM (tùy chọn)"
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
                      className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
                      placeholder="Mô tả chi tiết về sự cố..."
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Thời gian */}
              <div className="bg-white rounded border border-gray-200 shadow-sm">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Thời gian</h3>
                </div>

                <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Thời gian bắt đầu</label>
                    <DateTimePicker
                      value={formData.startDate}
                      onChange={(value) => handleInputChange('startDate', value)}
                      placeholder="Chọn ngày bắt đầu"
                      locale="vi"
                      valueFormat="DD/MM/YYYY HH:mm"
                      clearable
                      withSeconds={false}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Thời gian kết thúc</label>
                    <DateTimePicker
                      value={formData.endDate}
                      onChange={(value) => handleInputChange('endDate', value)}
                      placeholder="Chọn ngày kết thúc"
                      locale="vi"
                      valueFormat="DD/MM/YYYY HH:mm"
                      clearable
                      minDate={formData.startDate || undefined}
                      withSeconds={false}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Section 6: Trạng thái & Ghi chú */}
              <div className="bg-white rounded border border-gray-200 shadow-sm">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Trạng thái & Ghi chú</h3>
                </div>

                <div className="p-3 space-y-3">
                  <div className="w-full md:w-1/2">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Trạng thái</label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="RECEIVED">Tiếp nhận</option>
                      <option value="PROCESSING">Đang xử lý</option>
                      <option value="COMPLETED">Hoàn thành</option>
                      <option value="CANCELLED">Hủy</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Ghi chú</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={3}
                      placeholder="Ghi chú thêm..."
                      className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-y"
                    />
                  </div>
                </div>
              </div>

              {/* Section 7: Đánh giá (User Assessment) */}
              <div className="bg-white rounded border border-amber-200 shadow-sm">
                <div className="bg-amber-50 px-3 py-2 border-b border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-600" />
                    <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Đánh giá của User</h3>
                  </div>
                  <button
                    type="button"
                    onClick={fetchConfigs}
                    className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-amber-700 hover:text-amber-800 hover:bg-amber-100 rounded transition-colors font-bold uppercase"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Làm mới</span>
                  </button>
                </div>

                <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Mức độ khó</label>
                    <select
                      value={formData.difficultyLevel}
                      onChange={(e) => handleInputChange('difficultyLevel', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                    >
                      <option value="">Chọn mức độ</option>
                      {getUserFieldOptions(EvaluationCategory.DIFFICULTY).map((opt) => (
                        <option key={opt.id} value={opt.points}>{opt.points} - {opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Thời gian ước tính</label>
                    <select
                      value={formData.estimatedTime}
                      onChange={(e) => handleInputChange('estimatedTime', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                    >
                      <option value="">Chọn thời gian</option>
                      {getUserFieldOptions(EvaluationCategory.TIME).map((opt) => (
                        <option key={opt.id} value={opt.points}>{opt.points} - {opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Ảnh hưởng</label>
                    <select
                      value={formData.impactLevel}
                      onChange={(e) => handleInputChange('impactLevel', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                    >
                      <option value="">Chọn mức độ</option>
                      {getUserFieldOptions(EvaluationCategory.IMPACT).map((opt) => (
                        <option key={opt.id} value={opt.points}>{opt.points} - {opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Khẩn cấp</label>
                    <select
                      value={formData.urgencyLevel}
                      onChange={(e) => handleInputChange('urgencyLevel', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                    >
                      <option value="">Chọn mức độ</option>
                      {getUserFieldOptions(EvaluationCategory.URGENCY).map((opt) => (
                        <option key={opt.id} value={opt.points}>{opt.points} - {opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Hình thức làm việc</label>
                    <select
                      value={formData.form}
                      onChange={(e) => {
                        handleInputChange('form', e.target.value);
                        const matched = getUserFieldOptions(EvaluationCategory.FORM).find(o => o.label === e.target.value);
                        if (matched) handleInputChange('formScore', matched.points.toString());
                      }}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                    >
                      <option value="">Chọn hình thức</option>
                      {getUserFieldOptions(EvaluationCategory.FORM).map((opt) => (
                        <option key={opt.id} value={opt.label}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 8: Admin Assessment */}
              <div className="bg-white rounded border border-green-200 shadow-sm">
                <div className="bg-green-50 px-3 py-2 border-b border-green-200 flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-600" />
                  <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Đánh giá của Admin</h3>
                </div>

                <div className="p-3 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Mức độ khó</label>
                      <select
                        value={formData.adminDifficultyLevel}
                        onChange={(e) => handleInputChange('adminDifficultyLevel', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      >
                        <option value="">Chọn mức độ</option>
                        {getAdminFieldOptions(EvaluationCategory.DIFFICULTY).map((opt) => (
                          <option key={opt.id} value={opt.points}>{opt.points} - {opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Thời gian nhận</label>
                      <select
                        value={formData.adminEstimatedTime}
                        onChange={(e) => handleInputChange('adminEstimatedTime', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      >
                        <option value="">Chọn thời gian</option>
                        {getAdminFieldOptions(EvaluationCategory.TIME).map((opt) => (
                          <option key={opt.id} value={opt.points}>{opt.points} - {opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Ảnh hưởng</label>
                      <select
                        value={formData.adminImpactLevel}
                        onChange={(e) => handleInputChange('adminImpactLevel', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      >
                        <option value="">Chọn mức độ</option>
                        {getAdminFieldOptions(EvaluationCategory.IMPACT).map((opt) => (
                          <option key={opt.id} value={opt.points}>{opt.points} - {opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Khẩn cấp</label>
                      <select
                        value={formData.adminUrgencyLevel}
                        onChange={(e) => handleInputChange('adminUrgencyLevel', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      >
                        <option value="">Chọn mức độ</option>
                        {getAdminFieldOptions(EvaluationCategory.URGENCY).map((opt) => (
                          <option key={opt.id} value={opt.points}>{opt.points} - {opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Ghi chú của Admin</label>
                    <textarea
                      value={formData.adminAssessmentNotes}
                      onChange={(e) => handleInputChange('adminAssessmentNotes', e.target.value)}
                      rows={2}
                      className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none transition-colors"
                      placeholder="Ghi chú đánh giá của admin..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>


          {/* Footer */}
          <div className="px-5 py-4 border-t border-gray-200 bg-white flex justify-end gap-3 flex-shrink-0">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm min-w-[120px]"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  <span>Lưu thay đổi</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
