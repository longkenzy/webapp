'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle } from 'lucide-react';
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
    status: 'RECEIVED'
  });

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && caseData) {
      setFormData({
        endDate: caseData.endDate ? new Date(caseData.endDate).toISOString().slice(0, 16) : '',
        status: caseData.status
      });
    }
  }, [isOpen, caseData]);

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
        status: formData.status
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

      console.log('Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Case updated successfully:', result);
        
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
    <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Chỉnh sửa Case</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Case Info (Read-only) */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Thông tin Case</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-600">Tiêu đề:</span>
                <p className="text-sm text-gray-900">{caseData.title}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Mô tả:</span>
                <p className="text-sm text-gray-900">{caseData.description}</p>
              </div>
            </div>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Ngày kết thúc
            </label>
            <input
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Chọn ngày kết thúc"
            />
            <p className="text-xs text-gray-500 mt-1">
              Để trống nếu chưa có ngày kết thúc
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
              <option value="IN_PROGRESS">Đang xử lý</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="CANCELLED">Hủy</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
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
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Đang cập nhật...' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
