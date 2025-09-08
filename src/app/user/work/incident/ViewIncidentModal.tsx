'use client';

import { X, Calendar, User, AlertTriangle, FileText, CheckCircle, Clock, BarChart3 } from 'lucide-react';

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
  incidentType: string;
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

interface ViewIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidentData: Incident | null;
}

export default function ViewIncidentModal({ 
  isOpen, 
  onClose, 
  incidentData 
}: ViewIncidentModalProps) {

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REPORTED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'INVESTIGATING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'ESCALATED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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
    switch (incidentType) {
      case 'security-breach':
        return 'Vi phạm bảo mật';
      case 'system-failure':
        return 'Lỗi hệ thống';
      case 'data-loss':
        return 'Mất dữ liệu';
      case 'network-issue':
        return 'Sự cố mạng';
      case 'hardware-failure':
        return 'Lỗi phần cứng';
      case 'software-bug':
        return 'Lỗi phần mềm';
      default:
        return incidentType;
    }
  };

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

  const getAssessmentLabel = (value: number | undefined, category: string) => {
    if (value === undefined) return 'Chưa đánh giá';
    
    switch (category) {
      case 'difficulty':
        return `${value} - ${value <= 2 ? 'Dễ' : value <= 4 ? 'Trung bình' : 'Khó'}`;
      case 'time':
        return `${value} - ${value <= 2 ? 'Nhanh' : value <= 4 ? 'Trung bình' : 'Lâu'}`;
      case 'impact':
        return `${value} - ${value <= 2 ? 'Thấp' : value <= 4 ? 'Trung bình' : 'Cao'}`;
      case 'urgency':
        return `${value} - ${value <= 2 ? 'Thấp' : value <= 4 ? 'Trung bình' : 'Cao'}`;
      default:
        return value.toString();
    }
  };

  if (!isOpen || !incidentData) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-md">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Chi tiết Sự cố</h2>
              <p className="text-sm text-gray-600">Thông tin đầy đủ về sự cố</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-1.5 bg-red-100 rounded-md">
                <FileText className="h-4 w-4 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700">Thông tin cơ bản</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-600">Tiêu đề:</span>
                <p className="text-sm text-gray-900 mt-1 font-medium">{incidentData.title}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Loại sự cố:</span>
                <p className="text-sm text-gray-900 mt-1">{formatIncidentType(incidentData.incidentType)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Khách hàng:</span>
                <div className="mt-1">
                  {incidentData.customer ? (
                    <div className="text-sm text-gray-900">
                      <div className="font-medium">{incidentData.customer.fullCompanyName}</div>
                      <div className="text-xs text-gray-500">({incidentData.customer.shortName})</div>
                      {incidentData.customer.contactPerson && (
                        <div className="text-xs text-gray-500">Liên hệ: {incidentData.customer.contactPerson}</div>
                      )}
                      {incidentData.customer.contactPhone && (
                        <div className="text-xs text-gray-500">Điện thoại: {incidentData.customer.contactPhone}</div>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Trạng thái:</span>
                <div className="mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(incidentData.status)}`}>
                    {getStatusText(incidentData.status)}
                  </span>
                </div>
              </div>
              <div className="md:col-span-2">
                <span className="text-sm font-medium text-gray-600">Mô tả:</span>
                <p className="text-sm text-gray-900 mt-1 leading-relaxed">{incidentData.description}</p>
              </div>
            </div>
          </div>

          {/* People Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-1.5 bg-blue-100 rounded-md">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700">Thông tin người liên quan</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-600">Người báo cáo:</span>
                <div className="mt-1">
                  <p className="text-sm text-gray-900 font-medium">{incidentData.reporter.fullName}</p>
                  <p className="text-xs text-gray-500">{incidentData.reporter.position} - {incidentData.reporter.department}</p>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Người xử lý:</span>
                <div className="mt-1">
                  <p className="text-sm text-gray-900 font-medium">{incidentData.handler.fullName}</p>
                  <p className="text-xs text-gray-500">{incidentData.handler.position} - {incidentData.handler.department}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-1.5 bg-orange-100 rounded-md">
                <Calendar className="h-4 w-4 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700">Thời gian</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-600">Thời gian xảy ra:</span>
                <p className="text-sm text-gray-900 mt-1">{formatDate(incidentData.startDate)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Thời gian giải quyết:</span>
                <p className="text-sm text-gray-900 mt-1">
                  {incidentData.endDate ? formatDate(incidentData.endDate) : 'Chưa có'}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Thời gian tạo:</span>
                <p className="text-sm text-gray-900 mt-1">{formatDate(incidentData.createdAt)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Cập nhật lần cuối:</span>
                <p className="text-sm text-gray-900 mt-1">{formatDate(incidentData.updatedAt)}</p>
              </div>
            </div>
          </div>

          {/* User Assessment */}
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-1.5 bg-yellow-100 rounded-md">
                <BarChart3 className="h-4 w-4 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-yellow-700">Đánh giá của User</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-yellow-600">Mức độ khó:</span>
                <p className="text-sm text-gray-900 mt-1">{getAssessmentLabel(incidentData.userDifficultyLevel, 'difficulty')}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-yellow-600">Thời gian ước tính:</span>
                <p className="text-sm text-gray-900 mt-1">{getAssessmentLabel(incidentData.userEstimatedTime, 'time')}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-yellow-600">Mức độ ảnh hưởng:</span>
                <p className="text-sm text-gray-900 mt-1">{getAssessmentLabel(incidentData.userImpactLevel, 'impact')}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-yellow-600">Mức độ khẩn cấp:</span>
                <p className="text-sm text-gray-900 mt-1">{getAssessmentLabel(incidentData.userUrgencyLevel, 'urgency')}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-yellow-600">Điểm hình thức:</span>
                <p className="text-sm text-gray-900 mt-1">{incidentData.userFormScore || 'Chưa đánh giá'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-yellow-600">Ngày đánh giá:</span>
                <p className="text-sm text-gray-900 mt-1">
                  {incidentData.userAssessmentDate ? formatDate(incidentData.userAssessmentDate) : 'Chưa đánh giá'}
                </p>
              </div>
            </div>
          </div>

          {/* Admin Assessment */}
          {(incidentData.adminDifficultyLevel || incidentData.adminEstimatedTime || incidentData.adminImpactLevel || incidentData.adminUrgencyLevel) && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-1.5 bg-blue-100 rounded-md">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-blue-700">Đánh giá của Admin</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-blue-600">Mức độ khó:</span>
                  <p className="text-sm text-gray-900 mt-1">{getAssessmentLabel(incidentData.adminDifficultyLevel, 'difficulty')}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-blue-600">Thời gian ước tính:</span>
                  <p className="text-sm text-gray-900 mt-1">{getAssessmentLabel(incidentData.adminEstimatedTime, 'time')}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-blue-600">Mức độ ảnh hưởng:</span>
                  <p className="text-sm text-gray-900 mt-1">{getAssessmentLabel(incidentData.adminImpactLevel, 'impact')}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-blue-600">Mức độ khẩn cấp:</span>
                  <p className="text-sm text-gray-900 mt-1">{getAssessmentLabel(incidentData.adminUrgencyLevel, 'urgency')}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-blue-600">Ngày đánh giá:</span>
                  <p className="text-sm text-gray-900 mt-1">
                    {incidentData.adminAssessmentDate ? formatDate(incidentData.adminAssessmentDate) : 'Chưa đánh giá'}
                  </p>
                </div>
                {incidentData.adminAssessmentNotes && (
                  <div className="md:col-span-2">
                    <span className="text-sm font-medium text-blue-600">Ghi chú đánh giá:</span>
                    <p className="text-sm text-gray-900 mt-1">{incidentData.adminAssessmentNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {incidentData.notes && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-1.5 bg-gray-100 rounded-md">
                  <FileText className="h-4 w-4 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700">Ghi chú</h3>
              </div>
              <p className="text-sm text-gray-900 leading-relaxed">{incidentData.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
