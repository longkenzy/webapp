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
  customerName?: string; // Thêm trường customerName từ database
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
    status: 'RECEIVED',
    notes: '', // Thêm trường Ghi chú
    crmReferenceCode: '' // Thêm trường Mã CRM
  });

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && warrantyData) {
      setFormData({
        endDate: warrantyData.endDate ? new Date(warrantyData.endDate).toISOString().slice(0, 16) : '',
        status: warrantyData.status,
        notes: warrantyData.notes || '', // Khởi tạo Ghi chú
        crmReferenceCode: warrantyData.crmReferenceCode || '' // Khởi tạo Mã CRM
      });
    }
  }, [isOpen, warrantyData]);

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
        status: formData.status,
        notes: formData.notes || null, // Thêm Ghi chú
        crmReferenceCode: formData.crmReferenceCode || null // Thêm Mã CRM
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


      if (response.ok) {
        const result = await response.json();
        
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
    <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-blue-100 rounded-md">
              <Shield className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Chỉnh sửa Case Bảo Hành</h2>
              <p className="text-xs text-gray-600">Cập nhật thông tin case bảo hành</p>
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
          {/* Warranty Info (Read-only) */}
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Thông tin Case Bảo Hành</h3>
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tiêu đề</label>
                  <p className="text-sm text-gray-900 mt-1 font-medium">{warrantyData.title}</p>
                </div>
              </div>
              <div className="space-y-1">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Loại bảo hành</label>
                  <p className="text-sm text-gray-900 mt-1">{formatWarrantyType(warrantyData.warrantyType)}</p>
                </div>
              </div>
              <div className="space-y-1">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mã CRM</label>
                  <p className="text-sm text-gray-900 mt-1 font-mono">
                    {warrantyData.crmReferenceCode || 'Chưa có'}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Người xử lý</label>
                  <p className="text-sm text-gray-900 mt-1">{warrantyData.handler.fullName}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-2">
              <div className="space-y-1">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ngày bắt đầu</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(warrantyData.startDate).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Liên hệ</label>
                  <p className="text-sm text-gray-900 mt-1 font-medium">
                    {(() => {
                      const customerName = warrantyData.customerName;
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
              <div className="space-y-1">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tên công ty</label>
                  <div className="text-sm text-gray-900 mt-1">
                    {warrantyData.customer?.shortName && warrantyData.customer?.fullCompanyName ? (
                      <div>
                        <div className="font-medium">{warrantyData.customer.shortName}</div>
                        <div className="text-gray-600 text-xs">{warrantyData.customer.fullCompanyName}</div>
                      </div>
                    ) : warrantyData.customer?.fullCompanyName ? (
                      <div>{warrantyData.customer.fullCompanyName}</div>
                    ) : (
                      <div>Chưa có</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mô tả</label>
              <p className="text-sm text-gray-900 mt-1 bg-white p-2 rounded border">{warrantyData.description}</p>
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
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập ghi chú về case bảo hành (tùy chọn)"
                rows={3}
              />
            </div>

            {/* End Date, Status and CRM Code Row */}
            <div className="grid grid-cols-3 gap-3">
              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thời gian kết thúc
                </label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Chọn thời gian kết thúc"
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
