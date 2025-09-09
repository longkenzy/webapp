'use client';

import { useState, useEffect } from 'react';
import { X, Wrench, AlertCircle, CheckCircle } from 'lucide-react';

interface EditMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (maintenance: any) => void;
  maintenanceData: any;
}

interface Employee {
  id: string;
  fullName: string;
  position: string;
  department: string;
}

interface Equipment {
  id: string;
  name: string;
  model?: string;
  serialNumber?: string;
  location?: string;
}

export default function EditMaintenanceModal({ isOpen, onClose, onSuccess, maintenanceData }: EditMaintenanceModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    maintenanceType: '',
    equipmentId: '',
    startDate: '',
    endDate: '',
    status: '',
    notes: ''
  });
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize form data when modal opens or maintenanceData changes
  useEffect(() => {
    if (isOpen && maintenanceData) {
      setFormData({
        title: maintenanceData.title || '',
        description: maintenanceData.description || '',
        maintenanceType: maintenanceData.maintenanceType || '',
        equipmentId: maintenanceData.equipment?.id || '',
        startDate: maintenanceData.startDate ? new Date(maintenanceData.startDate).toISOString().slice(0, 16) : '',
        endDate: maintenanceData.endDate ? new Date(maintenanceData.endDate).toISOString().slice(0, 16) : '',
        status: maintenanceData.status || '',
        notes: maintenanceData.notes || ''
      });
    }
  }, [isOpen, maintenanceData]);

  // Fetch employees and equipment
  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
      fetchEquipment();
    }
  }, [isOpen]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees/list');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchEquipment = async () => {
    try {
      const response = await fetch('/api/equipment/list');
      if (response.ok) {
        const data = await response.json();
        setEquipment(data || []);
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/maintenance-cases/${maintenanceData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedMaintenance = await response.json();
        onSuccess(updatedMaintenance.data || updatedMaintenance);
        handleClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Có lỗi xảy ra khi cập nhật case bảo trì');
      }
    } catch (error) {
      console.error('Error updating maintenance case:', error);
      setError('Có lỗi xảy ra khi cập nhật case bảo trì');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatMaintenanceType = (type: string) => {
    switch (type) {
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
        return type;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'Đã lên lịch';
      case 'IN_PROGRESS':
        return 'Đang thực hiện';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'CANCELLED':
        return 'Hủy';
      case 'PENDING':
        return 'Chờ xử lý';
      default:
        return status;
    }
  };

  if (!isOpen || !maintenanceData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Wrench className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Chỉnh sửa Case Bảo Trì</h2>
              <p className="text-sm text-gray-600">Cập nhật thông tin case bảo trì</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiêu đề case bảo trì *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Nhập tiêu đề case bảo trì"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả chi tiết *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Mô tả chi tiết về công việc bảo trì cần thực hiện"
            />
          </div>

          {/* Maintenance Type and Equipment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Maintenance Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại bảo trì *
              </label>
              <select
                name="maintenanceType"
                value={formData.maintenanceType}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Chọn loại bảo trì</option>
                <option value="preventive">Bảo trì phòng ngừa</option>
                <option value="corrective">Bảo trì sửa chữa</option>
                <option value="emergency">Bảo trì khẩn cấp</option>
                <option value="routine">Bảo trì định kỳ</option>
                <option value="upgrade">Nâng cấp thiết bị</option>
                <option value="inspection">Kiểm tra thiết bị</option>
              </select>
            </div>

            {/* Equipment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thiết bị cần bảo trì *
              </label>
              <select
                name="equipmentId"
                value={formData.equipmentId}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Chọn thiết bị</option>
                {equipment.map(eq => (
                  <option key={eq.id} value={eq.id}>
                    {eq.name} {eq.model && `(${eq.model})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái *
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">Chọn trạng thái</option>
              <option value="PENDING">Chờ xử lý</option>
              <option value="SCHEDULED">Đã lên lịch</option>
              <option value="IN_PROGRESS">Đang thực hiện</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="CANCELLED">Hủy</option>
            </select>
          </div>

          {/* Start Date and End Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày bắt đầu *
              </label>
              <input
                type="datetime-local"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày kết thúc
              </label>
              <input
                type="datetime-local"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú bổ sung
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Thêm ghi chú hoặc yêu cầu đặc biệt (tùy chọn)"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Đang cập nhật...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Cập nhật Case Bảo Trì</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
