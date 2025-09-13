'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

interface Warranty {
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
  reporter: {
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
  warrantyType: string | { id: string; name: string; description?: string };
  startDate: string;
  notes?: string;
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

interface EditWarrantyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updatedWarranty: Warranty) => void;
  warrantyData: Warranty | null;
}

export default function EditWarrantyModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  warrantyData 
}: EditWarrantyModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    endDate: '',
    status: 'RECEIVED'
  });

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && warrantyData) {
      setFormData({
        endDate: warrantyData.endDate ? new Date(warrantyData.endDate).toISOString().slice(0, 16) : '',
        status: warrantyData.status
      });
    }
  }, [isOpen, warrantyData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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

  const formatWarrantyType = (warrantyType: string | { id: string; name: string; description?: string }) => {
    // Handle object case
    if (typeof warrantyType === 'object' && warrantyType !== null) {
      const typeName = warrantyType.name;
      switch (typeName) {
        case 'hardware-warranty':
          return 'Bảo hành phần cứng';
        case 'software-warranty':
          return 'Bảo hành phần mềm';
        case 'service-warranty':
          return 'Bảo hành dịch vụ';
        case 'extended-warranty':
          return 'Bảo hành mở rộng';
        case 'replacement-warranty':
          return 'Bảo hành thay thế';
        case 'repair-warranty':
          return 'Bảo hành sửa chữa';
        default:
          return typeName;
      }
    }

    // Handle string case
    switch (warrantyType) {
      case 'hardware-warranty':
        return 'Bảo hành phần cứng';
      case 'software-warranty':
        return 'Bảo hành phần mềm';
      case 'service-warranty':
        return 'Bảo hành dịch vụ';
      case 'extended-warranty':
        return 'Bảo hành mở rộng';
      case 'replacement-warranty':
        return 'Bảo hành thay thế';
      case 'repair-warranty':
        return 'Bảo hành sửa chữa';
      default:
        return warrantyType;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!warrantyData) return;

    // Validate end date
    if (formData.endDate) {
      const startDate = new Date(warrantyData.startDate);
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
        status: formData.status
      };

      console.log('=== Updating Warranty ===');
      console.log('Warranty ID:', warrantyData.id);
      console.log('Update data:', updateData);

      // Send to API
      const response = await fetch(`/api/warranties/${warrantyData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Warranty updated successfully:', result);
        
        // Show success notification
        toast.success('Cập nhật case bảo hành thành công!', {
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
        console.error('Failed to update warranty:', errorData);
        toast.error('Có lỗi xảy ra khi cập nhật case bảo hành. Vui lòng thử lại.', {
          duration: 4000,
          position: 'top-right',
        });
      }
    } catch (error) {
      console.error('Error updating warranty:', error);
      toast.error('Có lỗi xảy ra khi cập nhật case bảo hành. Vui lòng thử lại.', {
        duration: 4000,
        position: 'top-right',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !warrantyData) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-md">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Chỉnh sửa Case Bảo Hành</h2>
              <p className="text-sm text-gray-600">Cập nhật thông tin case bảo hành</p>
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
          {/* Warranty Info (Read-only) */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Thông tin Case Bảo Hành</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-600">Tiêu đề:</span>
                <p className="text-sm text-gray-900 mt-1">{warrantyData.title}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Loại bảo hành:</span>
                <p className="text-sm text-gray-900 mt-1">{formatWarrantyType(warrantyData.warrantyType)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Người báo cáo:</span>
                <p className="text-sm text-gray-900 mt-1">{warrantyData.reporter.fullName}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Người xử lý:</span>
                <p className="text-sm text-gray-900 mt-1">{warrantyData.handler.fullName}</p>
              </div>
              <div className="md:col-span-2">
                <span className="text-sm font-medium text-gray-600">Mô tả:</span>
                <p className="text-sm text-gray-900 mt-1">{warrantyData.description}</p>
              </div>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            {/* End Date and Status Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Thời gian kết thúc
                </label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Chọn thời gian kết thúc"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Để trống nếu chưa có thời gian kết thúc
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="RECEIVED">Tiếp nhận</option>
                  <option value="PROCESSING">Đang xử lý</option>
                  <option value="COMPLETED">Hoàn thành</option>
                  <option value="CANCELLED">Hủy</option>
                </select>
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
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
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
