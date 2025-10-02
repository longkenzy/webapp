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
    notes: '', // Thêm trường Ghi chú
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
        notes: maintenanceData.notes || '', // Khởi tạo Ghi chú
        crmReferenceCode: maintenanceData.crmReferenceCode || '' // Khởi tạo Mã CRM
      });
    }
  }, [isOpen, maintenanceData]);

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
        notes: formData.notes || null, // Thêm Ghi chú
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
    <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-orange-100 rounded-md">
              <Wrench className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Chỉnh sửa Case Bảo Trì</h2>
              <p className="text-xs text-gray-600">Cập nhật thông tin case bảo trì</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-4 py-3 space-y-4">
          {/* Maintenance Info (Read-only) */}
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Thông tin Case Bảo Trì</h3>
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tiêu đề</label>
                  <p className="text-sm text-gray-900 mt-1 font-medium">{maintenanceData.title}</p>
                </div>
              </div>
              <div className="space-y-1">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Loại bảo trì</label>
                  <p className="text-sm text-gray-900 mt-1">{formatMaintenanceType(maintenanceData.maintenanceType)}</p>
                </div>
              </div>
              <div className="space-y-1">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mã CRM</label>
                  <p className="text-sm text-gray-900 mt-1 font-mono">
                    {maintenanceData.crmReferenceCode || 'Chưa có'}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Người xử lý</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {maintenanceData.handler ? maintenanceData.handler.fullName : 'Chưa xác định'}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="space-y-1">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ngày bắt đầu</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(maintenanceData.startDate).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Liên hệ</label>
                  <p className="text-sm text-gray-900 mt-1 font-medium">
                    {(() => {
                      const customerName = maintenanceData.customerName;
                      if (!customerName) return 'Chưa có';
                      
                      // Nếu đã có "Anh" hoặc "Chị" thì giữ nguyên
                      if (customerName.toLowerCase().includes('anh') || customerName.toLowerCase().includes('chị')) {
                        return customerName;
                      }
                      
                      // Nếu chưa có thì thêm "Anh/Chị"
                      return `Anh/Chị ${customerName}`;
                    })()}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 mt-2">
              <div className="space-y-1">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tên công ty</label>
                  <div className="text-sm text-gray-900 mt-1">
                    {maintenanceData.customer?.shortName && maintenanceData.customer?.fullCompanyName ? (
                      <div>
                        <div className="font-medium">{maintenanceData.customer.shortName}</div>
                        <div className="text-gray-600 text-xs">{maintenanceData.customer.fullCompanyName}</div>
                      </div>
                    ) : maintenanceData.customer?.fullCompanyName ? (
                      <div>{maintenanceData.customer.fullCompanyName}</div>
                    ) : (
                      <div>Chưa có</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mô tả</label>
              <p className="text-sm text-gray-900 mt-1 bg-white p-2 rounded border">{maintenanceData.description}</p>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-3">
            {/* Notes Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ghi chú
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Nhập ghi chú về case bảo trì (tùy chọn)"
                rows={3}
              />
            </div>

            {/* End Date, Status and CRM Code Row */}
            <div className="grid grid-cols-3 gap-3">
              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thời gian hoàn thành
                </label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Chọn thời gian hoàn thành"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="RECEIVED">Tiếp nhận</option>
                  <option value="PROCESSING">Đang xử lý</option>
                  <option value="COMPLETED">Hoàn thành</option>
                  <option value="CANCELLED">Hủy</option>
                </select>
              </div>

              {/* CRM Reference Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã CRM
                </label>
                <input
                  type="text"
                  value={formData.crmReferenceCode || ''}
                  onChange={(e) => handleInputChange('crmReferenceCode', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Nhập mã CRM (tùy chọn)"
                />
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-3 border-t border-gray-200">
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
