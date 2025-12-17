'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Save, RefreshCw } from 'lucide-react';
import { convertISOToLocalInput, convertLocalInputToISO } from '@/lib/date-utils';
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
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    incidentType: '',
    customerName: '',
    customerId: '',
    handlerId: '',
    status: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
    notes: '',
    crmReferenceCode: ''
  });

  const [employees, setEmployees] = useState<Employee[]>(preloadedEmployees);
  const [customers, setCustomers] = useState<any[]>(preloadedCustomers);
  const [incidentTypes, setIncidentTypes] = useState<Array<{ id: string, name: string }>>(preloadedIncidentTypes);
  const [saving, setSaving] = useState(false);

  // Sync preloaded data when it changes
  useEffect(() => {
    if (preloadedEmployees.length > 0) setEmployees(preloadedEmployees);
  }, [preloadedEmployees]);

  useEffect(() => {
    if (preloadedCustomers.length > 0) setCustomers(preloadedCustomers);
  }, [preloadedCustomers]);

  useEffect(() => {
    if (preloadedIncidentTypes.length > 0) setIncidentTypes(preloadedIncidentTypes);
  }, [preloadedIncidentTypes]);

  // Load form data only if preloaded data is not available (fallback)
  useEffect(() => {
    if (isOpen && (employees.length === 0 || customers.length === 0 || incidentTypes.length === 0)) {
      loadFormData();
    }
  }, [isOpen]);

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
      console.log('Incident Handler ID:', incidentData.handler?.id);
      console.log('Incident Handler Name:', incidentData.handler?.fullName);

      // Convert ISO string to Date object for DateTimePicker
      const startDate = incidentData.startDate ? new Date(incidentData.startDate) : null;
      const endDate = incidentData.endDate ? new Date(incidentData.endDate) : null;

      setFormData({
        title: incidentData.title || '',
        description: incidentData.description || '',
        incidentType: incidentData.incidentType || '',
        customerName: incidentData.customerName || '',
        customerId: incidentData.customer?.id || '',
        handlerId: incidentData.handler?.id || '',
        status: incidentData.status || '',
        startDate,
        endDate,
        notes: incidentData.notes || '',
        crmReferenceCode: incidentData.crmReferenceCode || ''
      });

      console.log('✅ Form Data Set - Handler:', incidentData.handler?.id);
      console.log('Converted startDate:', startDate);
      console.log('Converted endDate:', endDate);
    }
  }, [isOpen, incidentData, employees]);

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

      if (customers.length === 0) {
        promises.push(
          fetch('/api/partners/list', { headers: { 'Cache-Control': 'max-age=600' } })
            .then(res => res.ok ? res.json() : [])
            .then(data => setCustomers(data.data || data || []))
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
          incidentType: formData.incidentType,
          customerName: formData.customerName,
          customerId: formData.customerId || null,
          handlerId: formData.handlerId,
          status: formData.status,
          startDate: formData.startDate ? formData.startDate.toISOString() : null,
          endDate: formData.endDate ? formData.endDate.toISOString() : null,
          notes: formData.notes,
          crmReferenceCode: formData.crmReferenceCode
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler for DateTimePicker
  const handleDateTimeChange = (field: string, value: Date | string | null) => {
    const dateValue = value && typeof value === 'string' ? new Date(value) : value;
    setFormData(prev => ({ ...prev, [field]: dateValue }));
  };

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
              {/* Group 1: Thông tin chung */}
              <div className="bg-white rounded border border-gray-200">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Thông tin sự cố</h3>
                  <span className="text-red-500 text-sm ml-1">*</span>
                </div>
                <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Tiêu đề <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      placeholder="Nhập tiêu đề sự cố"
                      className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Loại sự cố <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="incidentType"
                      value={formData.incidentType}
                      onChange={handleInputChange}
                      required
                      className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">-- Chọn loại sự cố --</option>
                      {incidentTypes.map((type) => (
                        <option key={type.id} value={type.name}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Mô tả chi tiết <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      placeholder="Mô tả chi tiết về sự cố..."
                      className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-y"
                    />
                  </div>
                </div>
              </div>

              {/* Group 2: Khách hàng & Người xử lý */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Khách hàng */}
                <div className="bg-white rounded border border-gray-200">
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                    <Save className="h-4 w-4 text-blue-600" />
                    {/* Using Save icon temporarily as generic 'Customer/User' icon if User icon is taken, but User icon is better. Reusing icons is fine. */}
                    <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Khách hàng</h3>
                  </div>
                  <div className="p-3 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Chọn từ danh sách
                      </label>
                      <select
                        name="customerId"
                        value={formData.customerId}
                        onChange={handleInputChange}
                        className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="">-- Khách hàng lẻ / Chưa có trong DS --</option>
                        {customers.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.shortName} - {customer.fullCompanyName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Tên khách hàng (nhập tay)
                      </label>
                      <input
                        type="text"
                        name="customerName"
                        value={formData.customerName}
                        onChange={handleInputChange}
                        placeholder="Nhập tên khách hàng nếu không có trong danh sách"
                        className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Người xử lý & Trạng thái */}
                <div className="bg-white rounded border border-gray-200">
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Xử lý</h3>
                    <span className="text-red-500 text-sm ml-1">*</span>
                  </div>
                  <div className="p-3 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Người xử lý <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="handlerId"
                        value={formData.handlerId}
                        onChange={handleInputChange}
                        required
                        className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="">-- Chọn người xử lý --</option>
                        {employees.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.fullName} - {employee.position}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Trạng thái <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        required
                        className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        {getStatusOptions().map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Group 3: Thời gian & Khác */}
              <div className="bg-white rounded border border-gray-200">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Thời gian & Thông tin thêm</h3>
                </div>
                <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Thời gian bắt đầu <span className="text-red-500">*</span>
                    </label>
                    <DateTimePicker
                      value={formData.startDate}
                      onChange={(value) => handleDateTimeChange('startDate', value)}
                      placeholder="DD/MM/YYYY HH:mm"
                      locale="vi"
                      valueFormat="DD/MM/YYYY HH:mm"
                      clearable
                      withSeconds={false}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Thời gian kết thúc
                    </label>
                    <DateTimePicker
                      value={formData.endDate}
                      onChange={(value) => handleDateTimeChange('endDate', value)}
                      placeholder="DD/MM/YYYY HH:mm"
                      locale="vi"
                      valueFormat="DD/MM/YYYY HH:mm"
                      clearable
                      minDate={formData.startDate || undefined}
                      withSeconds={false}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Mã CRM Link
                    </label>
                    <input
                      type="text"
                      name="crmReferenceCode"
                      value={formData.crmReferenceCode}
                      onChange={handleInputChange}
                      placeholder="Nhập mã CRM"
                      className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Ghi chú
                    </label>
                    <input
                      type="text"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Ghi chú thêm..."
                      className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
