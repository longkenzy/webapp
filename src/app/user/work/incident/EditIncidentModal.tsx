'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Incident {
  id: string;
  title: string;
  description: string;
  endDate?: string;
  status: string;
  customer?: {
    id: string;
    fullCompanyName: string;
    shortName: string;
    contactPerson?: string;
    contactPhone?: string;
  };
  reporter?: {
    id: string;
    fullName: string;
    position: string;
    department: string;
  };
  handler: {
    id: string;
    fullName: string;
    position: string;
    department: string;
  };
  incidentType: string;
  startDate: string;
  notes?: string;
  crmReferenceCode?: string; // Thêm trường Mã CRM
  userDifficultyLevel?: number;
  userEstimatedTime?: number;
  userImpactLevel?: number;
  userUrgencyLevel?: number;
  userFormScore?: number;
  userAssessmentDate?: string;
  adminDifficultyLevel?: number;
  adminEstimatedTime?: number;
  adminImpactLevel?: number;
  adminUrgencyLevel?: number;
  adminAssessmentDate?: string;
  adminAssessmentNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface EditIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updatedIncident: Incident) => void;
  incidentData: Incident | null;
}

export default function EditIncidentModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  incidentData 
}: EditIncidentModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    endDate: '',
    status: 'RECEIVED',
    notes: '', // Thêm trường Ghi chú
    crmReferenceCode: '' // Thêm trường Mã CRM
  });

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && incidentData) {
      setFormData({
        endDate: incidentData.endDate ? new Date(incidentData.endDate).toISOString().slice(0, 16) : '',
        status: incidentData.status,
        notes: incidentData.notes || '', // Khởi tạo Ghi chú
        crmReferenceCode: incidentData.crmReferenceCode || '' // Khởi tạo Mã CRM
      });
    }
  }, [isOpen, incidentData]);


  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'REPORTED':
        return 'Báo cáo';
      case 'INVESTIGATING':
        return 'Đang điều tra';
      case 'RESOLVED':
        return 'Đã giải quyết';
      case 'CLOSED':
        return 'Đóng';
      case 'ESCALATED':
        return 'Nâng cấp';
      default:
        return status;
    }
  };


  const formatIncidentType = (incidentType: string) => {
    // Return the incident type as is since it's now managed by admin config
    return incidentType;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!incidentData) return;

    // Validate end date
    if (formData.endDate) {
      const startDate = new Date(incidentData.startDate);
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

      console.log('=== Updating Incident ===');
      console.log('Incident ID:', incidentData.id);
      console.log('Update data:', updateData);

      // Send to API
      const response = await fetch(`/api/incidents/${incidentData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });


      if (response.ok) {
        const result = await response.json();
        
        // Show success notification
        toast.success('Cập nhật sự cố thành công!', {
          duration: 3000,
          position: 'top-right',
        });
        
        // Close modal and pass updated data
        onClose();
        if (onSuccess && result.data) {
          onSuccess(result.data);
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to update incident:', errorData);
        toast.error('Có lỗi xảy ra khi cập nhật sự cố. Vui lòng thử lại.', {
          duration: 4000,
          position: 'top-right',
        });
      }
    } catch (error) {
      console.error('Error updating incident:', error);
      toast.error('Có lỗi xảy ra khi cập nhật sự cố. Vui lòng thử lại.', {
        duration: 4000,
        position: 'top-right',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !incidentData) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-md">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Chỉnh sửa Sự cố</h2>
              <p className="text-sm text-gray-600">Cập nhật thông tin sự cố</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Incident Info (Read-only) */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Thông tin Sự cố</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-600">Tiêu đề:</span>
                <p className="text-sm text-gray-900 mt-1">{incidentData.title}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Loại sự cố:</span>
                <p className="text-sm text-gray-900 mt-1">{formatIncidentType(incidentData.incidentType)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Người báo cáo:</span>
                <p className="text-sm text-gray-900 mt-1">
                  {incidentData.reporter ? incidentData.reporter.fullName : 'Chưa xác định'}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Người xử lý:</span>
                <p className="text-sm text-gray-900 mt-1">{incidentData.handler.fullName}</p>
              </div>
              <div className="md:col-span-2">
                <span className="text-sm font-medium text-gray-600">Mô tả:</span>
                <p className="text-sm text-gray-900 mt-1">{incidentData.description}</p>
              </div>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Nhập ghi chú về sự cố (tùy chọn)"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                Ghi chú bổ sung về quá trình xử lý sự cố
              </p>
            </div>

            {/* End Date, Status and CRM Code Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Thời gian giải quyết
                </label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Chọn thời gian giải quyết"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Để trống nếu chưa có thời gian giải quyết
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Nhập mã CRM (tùy chọn)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mã tham chiếu từ hệ thống CRM
                </p>
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
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
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Cập nhật
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
