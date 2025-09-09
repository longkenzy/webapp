'use client';

import { X, Wrench, Calendar, User, MapPin, Clock, FileText } from 'lucide-react';

interface ViewMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  maintenanceData: any;
}

export default function ViewMaintenanceModal({ isOpen, onClose, maintenanceData }: ViewMaintenanceModalProps) {
  if (!isOpen || !maintenanceData) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
      case 'Đã lên lịch':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IN_PROGRESS':
      case 'Đang thực hiện':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'COMPLETED':
      case 'Hoàn thành':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
      case 'Hủy':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'PENDING':
      case 'Chờ xử lý':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Wrench className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Chi tiết Case Bảo Trì</h2>
              <p className="text-sm text-gray-600">Thông tin chi tiết về case bảo trì</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Title and Status */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{maintenanceData.title}</h3>
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(maintenanceData.status)}`}>
                    {getStatusText(maintenanceData.status)}
                  </span>
                  <span className="text-sm text-gray-500">
                    ID: {maintenanceData.id}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Mô tả chi tiết
                </h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                  {maintenanceData.description}
                </p>
              </div>

              {/* Equipment Information */}
              {maintenanceData.equipment && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Wrench className="h-4 w-4 mr-2" />
                    Thông tin thiết bị
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-md space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tên thiết bị:</span>
                      <span className="text-sm font-medium text-gray-900">{maintenanceData.equipment.name}</span>
                    </div>
                    {maintenanceData.equipment.model && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Model:</span>
                        <span className="text-sm text-gray-900">{maintenanceData.equipment.model}</span>
                      </div>
                    )}
                    {maintenanceData.equipment.serialNumber && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Số serial:</span>
                        <span className="text-sm text-gray-900">{maintenanceData.equipment.serialNumber}</span>
                      </div>
                    )}
                    {maintenanceData.equipment.location && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Vị trí:</span>
                        <span className="text-sm text-gray-900 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {maintenanceData.equipment.location}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Maintenance Type */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Loại bảo trì</h4>
                <div className="bg-orange-50 border border-orange-200 p-3 rounded-md">
                  <span className="text-sm font-medium text-orange-800">
                    {formatMaintenanceType(maintenanceData.maintenanceType)}
                  </span>
                </div>
              </div>

              {/* People Involved */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Người liên quan
                </h4>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="text-xs text-gray-500 mb-1">Người báo cáo</div>
                    <div className="text-sm font-medium text-gray-900">{maintenanceData.reporter.fullName}</div>
                    <div className="text-xs text-gray-600">{maintenanceData.reporter.position} - {maintenanceData.reporter.department}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="text-xs text-gray-500 mb-1">Người xử lý</div>
                    <div className="text-sm font-medium text-gray-900">{maintenanceData.handler.fullName}</div>
                    <div className="text-xs text-gray-600">{maintenanceData.handler.position} - {maintenanceData.handler.department}</div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Thời gian
                </h4>
                <div className="bg-gray-50 p-3 rounded-md space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Ngày tạo:</span>
                    <span className="text-sm text-gray-900">{formatDate(maintenanceData.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Bắt đầu:</span>
                    <span className="text-sm text-gray-900">{formatDate(maintenanceData.startDate)}</span>
                  </div>
                  {maintenanceData.endDate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Kết thúc:</span>
                      <span className="text-sm text-gray-900">{formatDate(maintenanceData.endDate)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Cập nhật cuối:</span>
                    <span className="text-sm text-gray-900">{formatDate(maintenanceData.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {maintenanceData.notes && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Ghi chú bổ sung</h4>
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                <p className="text-sm text-yellow-800">{maintenanceData.notes}</p>
              </div>
            </div>
          )}

          {/* Assessment Information */}
          {(maintenanceData.userDifficultyLevel || maintenanceData.adminDifficultyLevel) && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Thông tin đánh giá</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* User Assessment */}
                {maintenanceData.userDifficultyLevel && (
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
                    <h5 className="text-sm font-medium text-blue-800 mb-2">Đánh giá của User</h5>
                    <div className="space-y-1 text-xs">
                      <div>Mức độ khó: {maintenanceData.userDifficultyLevel}/5</div>
                      <div>Thời gian ước tính: {maintenanceData.userEstimatedTime}/5</div>
                      <div>Mức độ ảnh hưởng: {maintenanceData.userImpactLevel}/5</div>
                      <div>Mức độ khẩn cấp: {maintenanceData.userUrgencyLevel}/5</div>
                      {maintenanceData.userAssessmentDate && (
                        <div>Ngày đánh giá: {formatDate(maintenanceData.userAssessmentDate)}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Admin Assessment */}
                {maintenanceData.adminDifficultyLevel && (
                  <div className="bg-green-50 border border-green-200 p-3 rounded-md">
                    <h5 className="text-sm font-medium text-green-800 mb-2">Đánh giá của Admin</h5>
                    <div className="space-y-1 text-xs">
                      <div>Mức độ khó: {maintenanceData.adminDifficultyLevel}/5</div>
                      <div>Thời gian ước tính: {maintenanceData.adminEstimatedTime}/5</div>
                      <div>Mức độ ảnh hưởng: {maintenanceData.adminImpactLevel}/5</div>
                      <div>Mức độ khẩn cấp: {maintenanceData.adminUrgencyLevel}/5</div>
                      {maintenanceData.adminAssessmentDate && (
                        <div>Ngày đánh giá: {formatDate(maintenanceData.adminAssessmentDate)}</div>
                      )}
                      {maintenanceData.adminAssessmentNotes && (
                        <div className="mt-2">
                          <div className="text-xs text-gray-600">Ghi chú:</div>
                          <div className="text-xs text-gray-800">{maintenanceData.adminAssessmentNotes}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
