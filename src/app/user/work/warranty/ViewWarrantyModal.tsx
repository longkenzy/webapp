'use client';

import { X, Calendar, User, Shield, FileText, CheckCircle, Clock, BarChart3 } from 'lucide-react';

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
  customerName?: string;
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

interface ViewWarrantyModalProps {
  isOpen: boolean;
  onClose: () => void;
  warrantyData: Warranty | null;
}

export default function ViewWarrantyModal({ 
  isOpen, 
  onClose, 
  warrantyData 
}: ViewWarrantyModalProps) {

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

  if (!isOpen || !warrantyData) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-md">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Chi tiết Case Bảo Hành</h2>
              <p className="text-sm text-gray-600">Thông tin đầy đủ về case bảo hành</p>
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
              <div className="p-1.5 bg-blue-100 rounded-md">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700">Thông tin cơ bản</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-600">Tiêu đề:</span>
                <p className="text-sm text-gray-900 mt-1 font-medium">{warrantyData.title}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Loại bảo hành:</span>
                <p className="text-sm text-gray-900 mt-1">{formatWarrantyType(warrantyData.warrantyType)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Khách hàng:</span>
                <div className="mt-1">
                  {warrantyData.customer ? (
                    <div className="text-sm text-gray-900">
                      <div className="font-medium">{warrantyData.customer.fullCompanyName}</div>
                      <div className="text-xs text-gray-500">({warrantyData.customer.shortName})</div>
                      {warrantyData.customer.contactPerson && (
                        <div className="text-xs text-gray-500">Liên hệ: {warrantyData.customer.contactPerson}</div>
                      )}
                      {warrantyData.customer.contactPhone && (
                        <div className="text-xs text-gray-500">Điện thoại: {warrantyData.customer.contactPhone}</div>
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
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(warrantyData.status)}`}>
                    {getStatusText(warrantyData.status)}
                  </span>
                </div>
              </div>
              <div className="md:col-span-2">
                <span className="text-sm font-medium text-gray-600">Mô tả:</span>
                <p className="text-sm text-gray-900 mt-1 leading-relaxed">{warrantyData.description}</p>
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
                  <p className="text-sm text-gray-900 font-medium">{warrantyData.reporter.fullName}</p>
                  <p className="text-xs text-gray-500">{warrantyData.reporter.position} - {warrantyData.reporter.department}</p>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Người xử lý:</span>
                <div className="mt-1">
                  <p className="text-sm text-gray-900 font-medium">{warrantyData.handler.fullName}</p>
                  <p className="text-xs text-gray-500">{warrantyData.handler.position} - {warrantyData.handler.department}</p>
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
                <span className="text-sm font-medium text-gray-600">Thời gian bắt đầu:</span>
                <p className="text-sm text-gray-900 mt-1">{formatDate(warrantyData.startDate)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Thời gian kết thúc:</span>
                <p className="text-sm text-gray-900 mt-1">
                  {warrantyData.endDate ? formatDate(warrantyData.endDate) : 'Chưa có'}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Thời gian tạo:</span>
                <p className="text-sm text-gray-900 mt-1">{formatDate(warrantyData.createdAt)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Cập nhật lần cuối:</span>
                <p className="text-sm text-gray-900 mt-1">{formatDate(warrantyData.updatedAt)}</p>
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
                <p className="text-sm text-gray-900 mt-1">{getAssessmentLabel(warrantyData.userDifficultyLevel, 'difficulty')}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-yellow-600">Thời gian ước tính:</span>
                <p className="text-sm text-gray-900 mt-1">{getAssessmentLabel(warrantyData.userEstimatedTime, 'time')}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-yellow-600">Mức độ ảnh hưởng:</span>
                <p className="text-sm text-gray-900 mt-1">{getAssessmentLabel(warrantyData.userImpactLevel, 'impact')}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-yellow-600">Mức độ khẩn cấp:</span>
                <p className="text-sm text-gray-900 mt-1">{getAssessmentLabel(warrantyData.userUrgencyLevel, 'urgency')}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-yellow-600">Điểm hình thức:</span>
                <p className="text-sm text-gray-900 mt-1">{warrantyData.userFormScore || 'Chưa đánh giá'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-yellow-600">Ngày đánh giá:</span>
                <p className="text-sm text-gray-900 mt-1">
                  {warrantyData.userAssessmentDate ? formatDate(warrantyData.userAssessmentDate) : 'Chưa đánh giá'}
                </p>
              </div>
            </div>
          </div>

          {/* Admin Assessment */}
          {(warrantyData.adminDifficultyLevel || warrantyData.adminEstimatedTime || warrantyData.adminImpactLevel || warrantyData.adminUrgencyLevel) && (
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
                  <p className="text-sm text-gray-900 mt-1">{getAssessmentLabel(warrantyData.adminDifficultyLevel, 'difficulty')}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-blue-600">Thời gian ước tính:</span>
                  <p className="text-sm text-gray-900 mt-1">{getAssessmentLabel(warrantyData.adminEstimatedTime, 'time')}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-blue-600">Mức độ ảnh hưởng:</span>
                  <p className="text-sm text-gray-900 mt-1">{getAssessmentLabel(warrantyData.adminImpactLevel, 'impact')}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-blue-600">Mức độ khẩn cấp:</span>
                  <p className="text-sm text-gray-900 mt-1">{getAssessmentLabel(warrantyData.adminUrgencyLevel, 'urgency')}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-blue-600">Ngày đánh giá:</span>
                  <p className="text-sm text-gray-900 mt-1">
                    {warrantyData.adminAssessmentDate ? formatDate(warrantyData.adminAssessmentDate) : 'Chưa đánh giá'}
                  </p>
                </div>
                {warrantyData.adminAssessmentNotes && (
                  <div className="md:col-span-2">
                    <span className="text-sm font-medium text-blue-600">Ghi chú đánh giá:</span>
                    <p className="text-sm text-gray-900 mt-1">{warrantyData.adminAssessmentNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {warrantyData.notes && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-1.5 bg-gray-100 rounded-md">
                  <FileText className="h-4 w-4 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700">Ghi chú</h3>
              </div>
              <p className="text-sm text-gray-900 leading-relaxed">{warrantyData.notes}</p>
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
