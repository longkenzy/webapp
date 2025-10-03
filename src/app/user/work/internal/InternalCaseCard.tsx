'use client';

import { memo, useState } from 'react';
import { Edit, Check, Calendar, User, FileText, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface Employee {
  id: string;
  fullName: string;
  position: string;
  department: string;
}

interface InternalCase {
  id: string;
  title: string;
  description: string;
  requester: Employee;
  handler: Employee;
  caseType: string;
  form: string;
  status: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  userDifficultyLevel?: number;
  userEstimatedTime?: number;
  userImpactLevel?: number;
  userUrgencyLevel?: number;
  userFormScore?: number;
  userAssessmentDate?: string;
}

interface InternalCaseCardProps {
  case_: InternalCase;
  index: number;
  onEdit: (caseData: InternalCase) => void;
  onClose: (caseId: string) => Promise<void>;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  formatDate: (dateString: string) => string;
  formatCaseType: (caseType: string) => string;
}

const InternalCaseCard = memo(function InternalCaseCard({
  case_,
  index,
  onEdit,
  onClose,
  getStatusColor,
  getStatusText,
  formatDate,
  formatCaseType,
}: InternalCaseCardProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleCloseCase = async () => {
    if (case_.status === 'COMPLETED') {
      toast.error('Case này đã được đóng rồi!', {
        duration: 3000,
        position: 'top-right',
      });
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn đóng case "${case_.title}"?`)) {
      return;
    }

    try {
      setIsClosing(true);
      await onClose(case_.id);
      toast.success('Case đã được đóng thành công!', {
        duration: 3000,
        position: 'top-right',
      });
    } catch (error) {
      console.error('Error closing case:', error);
      toast.error('Có lỗi xảy ra khi đóng case. Vui lòng thử lại!', {
        duration: 4000,
        position: 'top-right',
      });
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200/50 p-4 mb-3">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium text-slate-600">#{index}</span>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(case_.status)}`}>
              {getStatusText(case_.status)}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1 line-clamp-2">
            {case_.title}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2">
            {case_.description}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2 mb-3">
        {/* Người yêu cầu */}
        <div className="flex items-center space-x-2">
          <User className="h-3 w-3 text-slate-400" />
          <span className="text-xs text-slate-600">Yêu cầu:</span>
          <span className="text-xs font-medium text-slate-900">{case_.requester.fullName}</span>
        </div>

        {/* Người xử lý */}
        <div className="flex items-center space-x-2">
          <User className="h-3 w-3 text-slate-400" />
          <span className="text-xs text-slate-600">Xử lý:</span>
          <span className="text-xs font-medium text-slate-900">{case_.handler.fullName}</span>
        </div>

        {/* Loại case */}
        <div className="flex items-center space-x-2">
          <FileText className="h-3 w-3 text-slate-400" />
          <span className="text-xs text-slate-600">Loại:</span>
          <span className="text-xs font-medium text-slate-900">{formatCaseType(case_.caseType)}</span>
        </div>

        {/* Thời gian */}
        <div className="flex items-start space-x-2">
          <Clock className="h-3 w-3 text-slate-400 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center space-x-1">
              <span className="text-xs text-green-600 font-medium">Bắt đầu:</span>
              <span className="text-xs text-green-600">{formatDate(case_.startDate)}</span>
            </div>
            {case_.endDate && (
              <div className="flex items-center space-x-1">
                <span className="text-xs text-red-600 font-medium">Kết thúc:</span>
                <span className="text-xs text-red-600">{formatDate(case_.endDate)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Ghi chú */}
        {case_.notes && (
          <div className="flex items-start space-x-2">
            <FileText className="h-3 w-3 text-slate-400 mt-0.5" />
            <div className="flex-1">
              <span className="text-xs text-slate-600">Ghi chú:</span>
              <p className="text-xs text-slate-700 mt-0.5 line-clamp-2">
                {case_.notes}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer - Date */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 mb-2">
        <div className="text-xs text-slate-500">
          Tạo: {formatDate(case_.createdAt)}
        </div>
      </div>

      {/* Actions */}
      {case_.status !== 'COMPLETED' && (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onEdit(case_)}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
          >
            <Edit className="h-3.5 w-3.5" />
            Sửa
          </button>
          <button
            onClick={handleCloseCase}
            disabled={isClosing}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors disabled:opacity-50"
          >
            {isClosing ? (
              <>
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                Hoàn thành
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
});

export default InternalCaseCard;
