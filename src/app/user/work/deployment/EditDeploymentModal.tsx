'use client';

import { useState, useEffect } from 'react';
import { X, Rocket, Calendar, CheckCircle, FileText, User, Building2, Clock, StickyNote, AlertCircle, RefreshCw, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCurrentVietnamDateTime, convertISOToLocalInput, convertLocalInputToISO, formatVietnamDateTime } from '@/lib/date-utils';
import { DateTimePicker } from '@mantine/dates';
import 'dayjs/locale/vi';

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
  reporter: Employee;
  handler: Employee;
  deploymentType: {
    id: string;
    name: string;
  };
  customerName: string;
  customer?: {
    id: string;
    shortName: string;
    fullCompanyName: string;
    contactPerson?: string;
  };
  status: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  crmReferenceCode?: string; // Thêm trường Mã CRM
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

interface EditDeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedCase: DeploymentCase) => void;
  caseData: DeploymentCase | null;
}

export default function EditDeploymentModal({
  isOpen,
  onClose,
  onSuccess,
  caseData
}: EditDeploymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    endDate: null as Date | null,
    status: 'RECEIVED',
    notes: '', // Thêm trường Ghi chú
    crmReferenceCode: '' // Thêm trường Mã CRM
  });

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && caseData) {
      setFormData({
        endDate: caseData.endDate ? new Date(caseData.endDate) : null,
        status: caseData.status || 'RECEIVED',
        notes: caseData.notes || '', // Khởi tạo Ghi chú
        crmReferenceCode: caseData.crmReferenceCode || '' // Khởi tạo Mã CRM
      });
    }
  }, [isOpen, caseData]);

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

  const handleInputChange = (field: string, value: string | Date | null) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // Auto-fill endDate when status is set to COMPLETED
      if (field === 'status' && value === 'COMPLETED' && !prev.endDate) {
        newData.endDate = new Date();
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!caseData) return;

    // Validate end date
    if (formData.endDate) {
      const startDate = new Date(caseData.startDate);
      const endDate = formData.endDate instanceof Date 
        ? formData.endDate 
        : new Date(formData.endDate);
      
      if (endDate <= startDate) {
        toast.error('Ngày kết thúc phải lớn hơn ngày bắt đầu!', {
          duration: 3000,
          position: 'top-right',
        });
        return;
      }
    }

    try {
      setLoading(true);
      
      // Helper function to convert to ISO string
      const toISOString = (dateValue: Date | string | null): string | null => {
        if (!dateValue) return null;
        
        try {
          if (dateValue instanceof Date) {
            return !isNaN(dateValue.getTime()) ? dateValue.toISOString() : null;
          }
          // If it's a string, try to parse it
          if (typeof dateValue === 'string') {
            const parsed = new Date(dateValue);
            return !isNaN(parsed.getTime()) ? parsed.toISOString() : null;
          }
        } catch (error) {
          console.error('Error converting date:', error);
        }
        return null;
      };

      // Prepare data for API
      const updateData = {
        endDate: toISOString(formData.endDate),
        status: formData.status,
        notes: formData.notes || null, // Thêm Ghi chú
        crmReferenceCode: formData.crmReferenceCode || null // Thêm Mã CRM
      };

      // Send to API
      const response = await fetch(`/api/deployment-cases/${caseData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Show success notification
        toast.success('Cập nhật case triển khai thành công!', {
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#10B981',
            color: '#fff',
          },
        });
        
        // Close modal and pass updated data
        onClose();
        if (onSuccess && result.data) {
          onSuccess(result.data);
        }
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
        toast.error(`Lỗi cập nhật case: ${fullErrorMessage}`, {
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#EF4444',
            color: '#fff',
          },
        });
      }
    } catch (error) {
      console.error('Error updating deployment:', error);
      toast.error('Có lỗi xảy ra khi cập nhật case triển khai. Vui lòng thử lại.', {
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

  const formatDeploymentType = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'software':
        return 'Triển khai phần mềm';
      case 'hardware':
        return 'Triển khai phần cứng';
      case 'network':
        return 'Triển khai mạng';
      case 'system':
        return 'Triển khai hệ thống';
      case 'upgrade':
        return 'Nâng cấp hệ thống';
      case 'migration':
        return 'Di chuyển dữ liệu';
      default:
        return type || 'Không xác định';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return 'Tiếp nhận';
      case 'PROCESSING':
        return 'Đang xử lý';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'CANCELLED':
        return 'Hủy';
      default:
        return status;
    }
  };

  if (!isOpen || !caseData) return null;

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
         {/* Header - Màu xanh lá cây để phân biệt với Admin */}
         <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded">
                <Rocket className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Chỉnh sửa Case Triển Khai</h2>
                <p className="text-emerald-50 text-xs mt-0.5">Cập nhật thông tin case triển khai</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/90 hover:text-white hover:bg-white/20 rounded transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-5 space-y-4">
              {/* Section 1: Thông tin Case */}
              <div className="bg-white rounded border border-gray-200">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Thông tin Case</h3>
                </div>
                
                <div className="p-3 space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-600 min-w-[120px]">Tiêu đề:</span>
                    <span className="text-gray-900 flex-1">{caseData.title}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-600 min-w-[120px]">Loại triển khai:</span>
                    <span className="text-gray-900 flex-1">{formatDeploymentType(caseData.deploymentType?.name)}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-600 min-w-[120px]">Người xử lý:</span>
                    <span className="text-gray-900 flex-1">{caseData.handler ? caseData.handler.fullName : 'Chưa xác định'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-600 min-w-[120px]">Ngày bắt đầu:</span>
                    <span className="text-gray-900 flex-1">{formatVietnamDateTime(caseData.startDate)}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-600 min-w-[120px]">Khách hàng:</span>
                    <span className="text-gray-900 flex-1">{caseData.customerName || 'Chưa có'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-600 min-w-[120px]">Công ty:</span>
                    <span className="text-gray-900 flex-1">
                      {caseData.customer?.shortName && caseData.customer?.fullCompanyName ? (
                        <div>
                          <div className="font-semibold">{caseData.customer.shortName}</div>
                          <div className="text-gray-600 text-xs mt-0.5">{caseData.customer.fullCompanyName}</div>
                        </div>
                      ) : caseData.customer?.fullCompanyName ? (
                        <div className="font-medium">{caseData.customer.fullCompanyName}</div>
                      ) : (
                        <span className="text-gray-400">Chưa có</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Thời gian & Trạng thái */}
              <div className="bg-white rounded border border-gray-200">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Thời gian & Trạng thái</h3>
                </div>
                
                <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Ngày kết thúc
                    </label>
                    <DateTimePicker
                      value={formData.endDate}
                      onChange={(value) => handleInputChange('endDate', value)}
                      placeholder="Chọn ngày kết thúc"
                      locale="vi"
                      valueFormat="DD/MM/YYYY HH:mm"
                      clearable
                      minDate={new Date(caseData.startDate)}
                      withSeconds={false}
                      styles={{
                        input: {
                          fontSize: '0.875rem',
                          padding: '0.375rem 0.625rem',
                          borderColor: '#d1d5db',
                          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                          borderRadius: '0.25rem',
                        }
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Trạng thái</label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    >
                      <option value="RECEIVED">Tiếp nhận</option>
                      <option value="PROCESSING">Đang xử lý</option>
                      <option value="COMPLETED">Hoàn thành</option>
                      <option value="CANCELLED">Hủy</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Ghi chú & Mã CRM */}
              <div className="bg-white rounded border border-gray-200">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Ghi chú & Mã CRM</h3>
                </div>
                
                <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Mã CRM</label>
                    <input
                      type="text"
                      value={formData.crmReferenceCode || ''}
                      onChange={(e) => handleInputChange('crmReferenceCode', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      placeholder="Nhập mã CRM"
                    />
                  </div>
                </div>

                <div className="p-3 pt-0">
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Ghi chú</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                    placeholder="Nhập ghi chú cho case triển khai..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="sticky bottom-0 bg-white border-t border-gray-300 px-5 py-3 flex items-center justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
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
                    <span>Đang cập nhật...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Cập nhật Case Triển Khai</span>
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