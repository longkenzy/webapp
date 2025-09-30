'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle, FileText, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';

interface InternalCase {
  id: string;
  title: string;
  description: string;
  endDate?: string;
  status: string;
  requester: {
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
  caseType: string;
  form: string;
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

interface EditInternalCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updatedCase: InternalCase) => void;
  caseData: InternalCase | null;
}

export default function EditInternalCaseModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  caseData 
}: EditInternalCaseModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    endDate: '',
    status: 'RECEIVED',
    notes: ''
  });

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && caseData) {
      // Convert datetime to local timezone for datetime-local input
      let endDateLocal = '';
      if (caseData.endDate) {
        const endDateObj = new Date(caseData.endDate);
        // Get local time components
        const year = endDateObj.getFullYear();
        const month = String(endDateObj.getMonth() + 1).padStart(2, '0');
        const day = String(endDateObj.getDate()).padStart(2, '0');
        const hours = String(endDateObj.getHours()).padStart(2, '0');
        const minutes = String(endDateObj.getMinutes()).padStart(2, '0');
        endDateLocal = `${year}-${month}-${day}T${hours}:${minutes}`;
      }

      setFormData({
        endDate: endDateLocal,
        status: caseData.status,
        notes: caseData.notes || ''
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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return 'Tiếp nhận';
      case 'IN_PROGRESS':
        return 'Đang xử lý';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'CANCELLED':
        return 'Hủy';
      default:
        return status;
    }
  };

  const formatCaseType = (caseType: string) => {
    return caseType;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!caseData) return;

    // Validate end date (only if both dates exist)
    if (formData.endDate && caseData.startDate) {
      const startDate = new Date(caseData.startDate);
      const endDate = new Date(formData.endDate);
      
      console.log('=== Date Validation (Edit Modal) ===');
      console.log('Start Date:', caseData.startDate);
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

    try {
      setLoading(true);
      
      // Prepare data for API
      const updateData = {
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        status: formData.status,
        notes: formData.notes || null
      };

      console.log('=== Updating Internal Case ===');
      console.log('Case ID:', caseData.id);
      console.log('Update data:', updateData);

      // Send to API
      const response = await fetch(`/api/internal-cases/${caseData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });


      if (response.ok) {
        const result = await response.json();
        
        // Show success notification
        toast.success('Cập nhật case nội bộ thành công!', {
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
        console.error('Failed to update case:', errorData);
        toast.error('Có lỗi xảy ra khi cập nhật case. Vui lòng thử lại.', {
          duration: 4000,
          position: 'top-right',
        });
      }
    } catch (error) {
      console.error('Error updating case:', error);
      toast.error('Có lỗi xảy ra khi cập nhật case. Vui lòng thử lại.', {
        duration: 4000,
        position: 'top-right',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !caseData) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-blue-100 rounded-md">
              <Wrench className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Chỉnh sửa Case Nội bộ</h2>
              <p className="text-xs text-gray-600">Cập nhật thông tin case</p>
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
          {/* Case Info (Read-only) */}
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Thông tin Case</h3>
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tiêu đề</label>
                  <p className="text-sm text-gray-900 mt-1 font-medium">{caseData.title}</p>
                </div>
              </div>
              <div className="space-y-1">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Loại case</label>
                  <p className="text-sm text-gray-900 mt-1">{formatCaseType(caseData.caseType)}</p>
                </div>
              </div>
              <div className="space-y-1">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Hình thức</label>
                  <p className="text-sm text-gray-900 mt-1">{caseData.form}</p>
                </div>
              </div>
              <div className="space-y-1">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Người xử lý</label>
                  <p className="text-sm text-gray-900 mt-1">{caseData.handler.fullName}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-2">
              <div className="space-y-1">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ngày bắt đầu</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(caseData.startDate).toLocaleString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Người yêu cầu</label>
                  <p className="text-sm text-gray-900 mt-1">{caseData.requester.fullName}</p>
                  <p className="text-xs text-gray-600">{caseData.requester.position}</p>
                </div>
              </div>
              <div className="space-y-1">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phòng ban</label>
                  <p className="text-sm text-gray-900 mt-1">{caseData.requester.department}</p>
                </div>
              </div>
            </div>
            <div className="mt-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mô tả</label>
              <p className="text-sm text-gray-900 mt-1 bg-white p-2 rounded border">{caseData.description}</p>
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
                placeholder="Nhập ghi chú về case (tùy chọn)"
                rows={3}
              />
            </div>

            {/* End Date and Status Row */}
            <div className="grid grid-cols-2 gap-3">
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
                  <option value="IN_PROGRESS">Đang xử lý</option>
                  <option value="COMPLETED">Hoàn thành</option>
                  <option value="CANCELLED">Hủy</option>
                </select>
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
