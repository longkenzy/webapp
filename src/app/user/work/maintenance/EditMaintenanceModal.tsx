'use client';

import { useState, useEffect } from 'react';
import { X, Wrench, AlertCircle, CheckCircle, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

interface Employee {
  id: string;
  fullName: string;
  position: string;
  department: string;
}

interface MaintenanceCase {
  id: string;
  title: string;
  description: string;
  reporter: Employee;
  handler: Employee;
  maintenanceType: string;
  maintenanceCaseType?: {
    id: string;
    name: string;
  };
  customerName?: string;
  customerId?: string;
  customer?: {
    id: string;
    fullCompanyName: string;
    shortName: string;
    contactPerson?: string;
    contactPhone?: string;
  };
  equipment?: {
    id: string;
    name: string;
    model?: string;
    serialNumber?: string;
    location?: string;
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

interface EditMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updatedMaintenance: MaintenanceCase) => void;
  maintenanceData: MaintenanceCase | null;
}

export default function EditMaintenanceModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  maintenanceData 
}: EditMaintenanceModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    endDate: '',
    status: 'RECEIVED',
    crmReferenceCode: '' // Thêm trường Mã CRM
  });

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && maintenanceData) {
      // Format endDate properly for datetime-local input
      let formattedEndDate = '';
      if (maintenanceData.endDate) {
        try {
          const date = new Date(maintenanceData.endDate);
          if (!isNaN(date.getTime())) {
            formattedEndDate = date.toISOString().slice(0, 16);
          }
        } catch (error) {
          console.error('Error formatting endDate:', error);
        }
      }

      setFormData({
        endDate: formattedEndDate,
        status: maintenanceData.status || 'RECEIVED',
        crmReferenceCode: maintenanceData.crmReferenceCode || '' // Khởi tạo Mã CRM
      });
    }
  }, [isOpen, maintenanceData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!maintenanceData) return;

    // Validate end date
    if (formData.endDate) {
      const startDate = new Date(maintenanceData.startDate);
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
        crmReferenceCode: formData.crmReferenceCode || null // Thêm Mã CRM
      };


      // Send to API
      const response = await fetch(`/api/maintenance-cases/${maintenanceData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });


      if (response.ok) {
        const result = await response.json();
        
        // Show success notification
        toast.success('Cập nhật case bảo trì thành công!', {
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
      console.error('Error updating maintenance:', error);
      toast.error('Có lỗi xảy ra khi cập nhật case bảo trì. Vui lòng thử lại.', {
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

  const formatMaintenanceType = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'preventive':
        return 'Bảo trì phòng ngừa';
      case 'corrective':
        return 'Bảo trì sửa chữa';
      case 'emergency':
        return 'Bảo trì khẩn cấp';
      case 'routine':
        return 'Bảo trì định kỳ';
      case 'upgrade':
        return 'Nâng cấp thiết bị';
      case 'inspection':
        return 'Kiểm tra thiết bị';
      default:
        return type || 'Không xác định';
    }
  };

  if (!isOpen || !maintenanceData) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-md">
              <Wrench className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Chỉnh sửa Case Bảo Trì</h2>
              <p className="text-sm text-gray-600">Cập nhật thông tin case bảo trì</p>
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
          {/* Maintenance Info (Read-only) */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Thông tin Case Bảo Trì</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-600">Tiêu đề:</span>
                <p className="text-sm text-gray-900 mt-1">{maintenanceData.title}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Loại bảo trì:</span>
                <p className="text-sm text-gray-900 mt-1">{formatMaintenanceType(maintenanceData.maintenanceType)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Thiết bị:</span>
                <p className="text-sm text-gray-900 mt-1">
                  {maintenanceData.equipment ? maintenanceData.equipment.name : 'Chưa xác định'}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Người xử lý:</span>
                <p className="text-sm text-gray-900 mt-1">
                  {maintenanceData.handler ? maintenanceData.handler.fullName : 'Chưa xác định'}
                </p>
              </div>
              <div className="md:col-span-2">
                <span className="text-sm font-medium text-gray-600">Mô tả:</span>
                <p className="text-sm text-gray-900 mt-1">{maintenanceData.description}</p>
              </div>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            {/* End Date, Status and CRM Code Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <Wrench className="h-4 w-4 mr-2" />
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
