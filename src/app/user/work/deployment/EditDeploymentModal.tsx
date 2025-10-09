'use client';

import { useState, useEffect } from 'react';
import { X, Rocket, Calendar, CheckCircle, FileText, User, Building2, Clock, StickyNote } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCurrentVietnamDateTime, convertISOToLocalInput, convertLocalInputToISO } from '@/lib/date-utils';

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
    endDate: '',
    status: 'RECEIVED',
    notes: '', // Thêm trường Ghi chú
    crmReferenceCode: '' // Thêm trường Mã CRM
  });

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && caseData) {
      setFormData({
        endDate: caseData.endDate ? convertISOToLocalInput(caseData.endDate) : '',
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // Auto-fill endDate when status is set to COMPLETED
      if (field === 'status' && value === 'COMPLETED' && !prev.endDate) {
        newData.endDate = getCurrentVietnamDateTime();
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
      const endDate = new Date(formData.endDate);
      
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
      
      // Prepare data for API
      const updateData = {
        endDate: formData.endDate || null,
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

  if (!isOpen || !caseData) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-end md:items-center justify-center z-[9999] md:p-4">
      {/* iOS Safari text color fix */}
      <style dangerouslySetInnerHTML={{ __html: `
        input, select, textarea {
          -webkit-text-fill-color: #111827 !important;
          opacity: 1 !important;
          color: #111827 !important;
        }
        input::placeholder, textarea::placeholder {
          -webkit-text-fill-color: #9ca3af !important;
          opacity: 0.6 !important;
          color: #9ca3af !important;
        }
      `}} />

      <div className="bg-white rounded-t-2xl md:rounded-lg shadow-xl w-full max-w-4xl h-[95vh] md:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-3 md:px-4 py-2.5 md:py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl md:rounded-t-lg">
          <div className="flex items-center gap-2">
            <div className="p-1 md:p-1.5 bg-blue-100 rounded-md">
              <Rocket className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-semibold text-gray-900">Chỉnh sửa Case Triển Khai</h2>
              <p className="text-xs text-gray-600 hidden md:block">Cập nhật thông tin case triển khai</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 md:p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="h-4 w-4 md:h-5 md:w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-3 md:px-4 py-2.5 md:py-3 space-y-3 pb-20 md:pb-3">
          {/* Section 1: Thông tin cơ bản (Read-only) */}
          <div className="bg-gray-50 rounded-md p-3 md:p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1 md:p-1.5 bg-blue-100 rounded-md">
                <FileText className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600" />
              </div>
              <h3 className="text-xs md:text-sm font-semibold text-gray-700">Thông tin cơ bản</h3>
            </div>
            
            <div className="space-y-2">
              {/* Tiêu đề */}
              <div className="bg-white p-2 md:p-2.5 rounded border border-gray-200">
                <label className="text-xs font-medium text-gray-500">Tiêu đề</label>
                <p className="text-sm md:text-base text-gray-900 font-medium mt-0.5">{caseData.title}</p>
              </div>

              {/* Grid 2 columns trên mobile, 4 trên desktop */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="bg-white p-2 md:p-2.5 rounded border border-gray-200">
                  <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <Rocket className="h-3 w-3" />
                    Loại triển khai
                  </label>
                  <p className="text-sm text-gray-900 font-medium mt-0.5">{formatDeploymentType(caseData.deploymentType?.name)}</p>
                </div>

                <div className="bg-white p-2 md:p-2.5 rounded border border-gray-200">
                  <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Người xử lý
                  </label>
                  <p className="text-sm text-gray-900 font-medium mt-0.5">
                    {caseData.handler ? caseData.handler.fullName : 'Chưa xác định'}
                  </p>
                </div>

                <div className="bg-white p-2 md:p-2.5 rounded border border-gray-200">
                  <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Ngày bắt đầu
                  </label>
                  <p className="text-sm text-gray-900 font-medium mt-0.5">
                    {new Date(caseData.startDate).toLocaleDateString('vi-VN', { 
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      timeZone: 'Asia/Ho_Chi_Minh' 
                    })}
                  </p>
                </div>

                <div className="bg-white p-2 md:p-2.5 rounded border border-gray-200">
                  <label className="text-xs font-medium text-gray-500">Mã CRM</label>
                  <p className="text-sm text-gray-900 font-medium font-mono mt-0.5">
                    {caseData.crmReferenceCode || <span className="text-gray-400 font-sans">Chưa có</span>}
                  </p>
                </div>
              </div>

              {/* Mô tả */}
              <div className="bg-white p-2 md:p-2.5 rounded border border-gray-200">
                <label className="text-xs font-medium text-gray-500">Mô tả</label>
                <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap">{caseData.description}</p>
              </div>
            </div>
          </div>

          {/* Section 2: Thông tin khách hàng (Read-only) */}
          <div className="bg-gray-50 rounded-md p-3 md:p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1 md:p-1.5 bg-purple-100 rounded-md">
                <Building2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-purple-600" />
              </div>
              <h3 className="text-xs md:text-sm font-semibold text-gray-700">Thông tin khách hàng</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="bg-white p-2 md:p-2.5 rounded border border-gray-200">
                <label className="text-xs font-medium text-gray-500">Liên hệ</label>
                <p className="text-sm text-gray-900 font-medium mt-0.5">
                  {caseData.customerName || caseData.customer?.contactPerson || 'Chưa có'}
                </p>
              </div>

              <div className="bg-white p-2 md:p-2.5 rounded border border-gray-200">
                <label className="text-xs font-medium text-gray-500">Tên công ty</label>
                <div className="text-sm text-gray-900 mt-0.5">
                  {caseData.customer?.shortName && caseData.customer?.fullCompanyName ? (
                    <div>
                      <div className="font-semibold">{caseData.customer.shortName}</div>
                      <div className="text-gray-600 text-xs mt-0.5">{caseData.customer.fullCompanyName}</div>
                    </div>
                  ) : caseData.customer?.fullCompanyName ? (
                    <div className="font-medium">{caseData.customer.fullCompanyName}</div>
                  ) : (
                    <div className="text-gray-400">Chưa có</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Cập nhật thông tin (Editable) */}
          <div className="bg-gray-50 rounded-md p-3 md:p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1 md:p-1.5 bg-green-100 rounded-md">
                <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-600" />
              </div>
              <h3 className="text-xs md:text-sm font-semibold text-gray-700">Cập nhật thông tin</h3>
            </div>

            <div className="space-y-2 md:space-y-3">
              {/* Grid for time, status, CRM */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
                {/* End Date */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Thời gian hoàn thành
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className="w-full px-2.5 md:px-3 py-1.5 md:py-2 text-xs md:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    style={{ minWidth: 0, maxWidth: '100%', WebkitAppearance: 'none' }}
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-2.5 md:px-3 py-1.5 md:py-2 text-xs md:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="RECEIVED">Tiếp nhận</option>
                    <option value="PROCESSING">Đang xử lý</option>
                    <option value="COMPLETED">Hoàn thành</option>
                    <option value="CANCELLED">Hủy</option>
                  </select>
                </div>

                {/* CRM Reference Code */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Mã CRM
                  </label>
                  <input
                    type="text"
                    value={formData.crmReferenceCode || ''}
                    onChange={(e) => handleInputChange('crmReferenceCode', e.target.value)}
                    className="w-full px-2.5 md:px-3 py-1.5 md:py-2 text-xs md:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Nhập mã CRM"
                  />
                </div>
              </div>

              {/* Notes Field */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <StickyNote className="h-3 w-3" />
                  Ghi chú
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="w-full px-2.5 md:px-3 py-1.5 md:py-2 text-xs md:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Nhập ghi chú về case triển khai (tùy chọn)"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="fixed md:static bottom-0 left-0 right-0 flex gap-2 md:gap-3 px-3 py-3 md:pt-3 bg-white md:bg-transparent border-t border-gray-200 z-10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span className="hidden md:inline">Đang cập nhật...</span>
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4" />
                  <span>Cập nhật</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}