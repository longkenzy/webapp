'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Save, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

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
  incidentTypes?: Array<{id: string, name: string}>;
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
    startDate: '',
    endDate: '',
    notes: '',
    crmReferenceCode: ''
  });

  const [employees, setEmployees] = useState<Employee[]>(preloadedEmployees);
  const [customers, setCustomers] = useState<any[]>(preloadedCustomers);
  const [incidentTypes, setIncidentTypes] = useState<Array<{id: string, name: string}>>(preloadedIncidentTypes);
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
      
      // Convert datetime to local timezone for datetime-local input
      let startDateLocal = '';
      if (incidentData.startDate) {
        const startDateObj = new Date(incidentData.startDate);
        const year = startDateObj.getFullYear();
        const month = String(startDateObj.getMonth() + 1).padStart(2, '0');
        const day = String(startDateObj.getDate()).padStart(2, '0');
        const hours = String(startDateObj.getHours()).padStart(2, '0');
        const minutes = String(startDateObj.getMinutes()).padStart(2, '0');
        startDateLocal = `${year}-${month}-${day}T${hours}:${minutes}`;
      }

      let endDateLocal = '';
      if (incidentData.endDate) {
        const endDateObj = new Date(incidentData.endDate);
        const year = endDateObj.getFullYear();
        const month = String(endDateObj.getMonth() + 1).padStart(2, '0');
        const day = String(endDateObj.getDate()).padStart(2, '0');
        const hours = String(endDateObj.getHours()).padStart(2, '0');
        const minutes = String(endDateObj.getMinutes()).padStart(2, '0');
        endDateLocal = `${year}-${month}-${day}T${hours}:${minutes}`;
      }

      setFormData({
        title: incidentData.title || '',
        description: incidentData.description || '',
        incidentType: incidentData.incidentType || '',
        customerName: incidentData.customerName || '',
        customerId: incidentData.customer?.id || '',
        handlerId: incidentData.handler?.id || '',
        status: incidentData.status || '',
        startDate: startDateLocal,
        endDate: endDateLocal,
        notes: incidentData.notes || '',
        crmReferenceCode: incidentData.crmReferenceCode || ''
      });
      
      console.log('✅ Form Data Set - Handler:', incidentData.handler?.id);
      console.log('Converted startDate:', startDateLocal);
      console.log('Converted endDate:', endDateLocal);
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
            .then(data => setEmployees(data || []))
        );
      }

      if (customers.length === 0) {
        promises.push(
          fetch('/api/partners/list', { headers: { 'Cache-Control': 'max-age=600' } })
            .then(res => res.ok ? res.json() : [])
            .then(data => setCustomers(data || []))
        );
      }

      if (incidentTypes.length === 0) {
        promises.push(
          fetch('/api/incident-types', { headers: { 'Cache-Control': 'max-age=600' } })
            .then(res => res.ok ? res.json() : { data: [] })
            .then(data => setIncidentTypes(data.data || []))
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
      // Convert datetime-local to ISO string
      const startDateObj = formData.startDate ? new Date(formData.startDate) : null;
      const endDateObj = formData.endDate ? new Date(formData.endDate) : null;

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
          startDate: startDateObj ? startDateObj.toISOString() : null,
          endDate: endDateObj ? endDateObj.toISOString() : null,
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

  const getStatusOptions = () => [
    { value: 'RECEIVED', label: 'Tiếp nhận' },
    { value: 'PROCESSING', label: 'Đang xử lý' },
    { value: 'COMPLETED', label: 'Hoàn thành' },
    { value: 'CANCELLED', label: 'Hủy' }
  ];

  if (!isOpen || !incidentData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Chỉnh sửa sự cố</h3>
                <p className="text-sm text-gray-600">Cập nhật thông tin sự cố</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tiêu đề sự cố *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Nhập tiêu đề sự cố"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại sự cố *
                  </label>
                  <select
                    name="incidentType"
                    value={formData.incidentType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Chọn loại sự cố</option>
                    {incidentTypes.map((type) => (
                      <option key={type.id} value={type.name}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả chi tiết *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Mô tả chi tiết về sự cố"
                />
              </div>

              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên khách hàng
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Nhập tên khách hàng"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Khách hàng (từ danh sách)
                  </label>
                  <select
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Chọn khách hàng</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.shortName} - {customer.fullCompanyName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Handler and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Người xử lý *
                  </label>
                  <select
                    name="handlerId"
                    value={formData.handlerId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Chọn người xử lý</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.fullName} - {employee.position}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trạng thái *
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Chọn trạng thái</option>
                    {getStatusOptions().map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thời gian bắt đầu *
                  </label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thời gian kết thúc
                  </label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              {/* CRM Reference Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mã CRM
                </label>
                <input
                  type="text"
                  name="crmReferenceCode"
                  value={formData.crmReferenceCode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Nhập mã CRM (nếu có)"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Ghi chú thêm về sự cố"
                />
              </div>
            </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Cập nhật sự cố</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
