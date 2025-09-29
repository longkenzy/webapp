'use client';

import { useState, useEffect } from 'react';
import { X, Rocket, Calendar, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

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
        endDate: caseData.endDate ? new Date(caseData.endDate).toISOString().slice(0, 16) : '',
        status: caseData.status || 'RECEIVED',
        notes: caseData.notes || '', // Khởi tạo Ghi chú
        crmReferenceCode: caseData.crmReferenceCode || '' // Khởi tạo Mã CRM
      });
    }
  }, [isOpen, caseData]);

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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-white/20 rounded-md">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Chỉnh sửa Case Triển Khai</h2>
              <p className="text-blue-100 text-xs">Cập nhật thông tin case</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-md transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-3 space-y-3">
            {/* Deployment Info (Read-only) */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-2 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                <Calendar className="h-3 w-3 mr-1 text-blue-600" />
                Thông tin Case Triển Khai
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div className="space-y-1.5">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tiêu đề</label>
                    <p className="text-sm text-gray-900 mt-1 font-medium">{caseData.title}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Loại triển khai</label>
                    <p className="text-sm text-gray-900 mt-1">{formatDeploymentType(caseData.deploymentType?.name)}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mã CRM</label>
                    <p className="text-sm text-gray-900 mt-1 font-mono bg-blue-50 px-2 py-1 rounded">
                      {caseData.crmReferenceCode || 'Chưa có'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Người xử lý</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {caseData.handler ? caseData.handler.fullName : 'Chưa xác định'}
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tên công ty</label>
                    <div className="text-sm text-gray-900 mt-1">
                      {caseData.customer?.shortName && caseData.customer?.fullCompanyName ? (
                        <div>
                          <div className="font-medium">{caseData.customer.shortName}</div>
                          <div className="text-gray-600">{caseData.customer.fullCompanyName}</div>
                        </div>
                      ) : caseData.customer?.fullCompanyName ? (
                        <div>{caseData.customer.fullCompanyName}</div>
                      ) : (
                        <div>Chưa có</div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ngày bắt đầu</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {new Date(caseData.startDate).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Liên hệ</label>
                    <p className="text-sm text-gray-900 mt-1 font-medium">
                      {caseData.customerName || 'Chưa có'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mô tả</label>
                <p className="text-sm text-gray-900 mt-1 bg-white p-2 rounded border">{caseData.description}</p>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-3">
              <h3 className="text-base font-semibold text-gray-800 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Cập nhật thông tin
              </h3>
              
              {/* Notes Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="inline-flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  Ghi chú
                </span>
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                placeholder="Nhập ghi chú về case triển khai (tùy chọn)"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                Ghi chú bổ sung về quá trình triển khai
              </p>
            </div>

              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Thời gian hoàn thành
                </label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Chọn thời gian hoàn thành"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Để trống nếu chưa có thời gian hoàn thành
                </p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  Trạng thái
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="RECEIVED">Tiếp nhận</option>
                  <option value="PROCESSING">Đang xử lý</option>
                  <option value="COMPLETED">Hoàn thành</option>
                  <option value="CANCELLED">Hủy</option>
                </select>
              </div>

              {/* CRM Reference Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="inline-flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                    Mã CRM
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.crmReferenceCode || ''}
                  onChange={(e) => handleInputChange('crmReferenceCode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Nhập mã CRM (tùy chọn)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mã tham chiếu từ hệ thống CRM
                </p>
              </div>
            </div>

          </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 border border-transparent rounded-md hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-sm"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang cập nhật...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4 mr-2" />
                    Cập nhật Case
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}